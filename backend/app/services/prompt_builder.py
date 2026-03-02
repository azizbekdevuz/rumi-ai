"""
Prompt Builder — constructs system & user prompts for the Rumi AI LLM,
and parses the structured response back into interpretation + advice.

Separated from the generation service so that prompt logic is:
  • testable in isolation
  • reusable across chat / streaming endpoints
  • clearly traceable (what the LLM actually sees)
"""
from __future__ import annotations

import re
from typing import Any, Dict, List, Sequence


# ── Language-specific section labels ────────────────────────────────

_SECTION_LABELS: Dict[str, Dict[str, str]] = {
    "FA": {
        "verse": "بیت",
        "interpretation": "تفسیر",
        "advice": "توصیه عملی",
        "question": "سوال",
    },
    "EN": {
        "verse": "Verse",
        "interpretation": "Interpretation",
        "advice": "Practical Advice",
        "question": "Question",
    },
    "KR": {
        "verse": "시구",
        "interpretation": "해석",
        "advice": "실용적 조언",
        "question": "질문",
    },
}


# ── System prompts per language ─────────────────────────────────────
# Two variants: *grounded* (corpus available) and *ungrounded* (no corpus).

_SYSTEM_PROMPTS_GROUNDED: Dict[str, str] = {
    "FA": (
        "شما «رومی AI» هستید — یک راهنمای معنوی متخصص در اشعار مولانا جلال‌الدین رومی.\n"
        "پاسخ خود را بر اساس ابیات و منابع ارائه‌شده بنویسید.\n"
        "پاسخ شامل دو بخش مشخص باشد:\n"
        "تفسیر: توضیح بیت یا متن مرتبط\n"
        "توصیه عملی: راهنمایی کاربردی برای زندگی روزمره\n"
    ),
    "EN": (
        "You are Rumi AI — a spiritual guide grounded in the poetry of Jalāl al-Dīn Rūmī.\n"
        "Always base your answer on the verses and sources provided.\n"
        "Structure your response in two clearly labelled sections:\n"
        "Interpretation: explain the relevant verse or text\n"
        "Practical Advice: actionable guidance for everyday life\n"
    ),
    "KR": (
        "당신은 루미 AI입니다 — 잘랄 앗딘 루미의 시에 기반한 영적 안내자입니다.\n"
        "항상 제공된 시구와 출처를 바탕으로 답변하세요.\n"
        "응답은 두 부분으로 명확히 구분하세요:\n"
        "해석: 관련 시구 또는 텍스트 설명\n"
        "실용적 조언: 일상 생활에 적용 가능한 안내\n"
    ),
}

_SYSTEM_PROMPTS_UNGROUNDED: Dict[str, str] = {
    "FA": (
        "شما «رومی AI» هستید — یک راهنمای معنوی الهام‌گرفته از فلسفه مولانا جلال‌الدین رومی.\n"
        "هیچ بیت یا منبع تأیید‌شده‌ای در دسترس نیست.\n"
        "مهم: هیچ بیت یا نقل‌قولی از مولانا جعل نکنید.\n"
        "پاسخ خود را به‌صورت راهنمایی کلی معنوی ارائه دهید.\n"
        "پاسخ شامل دو بخش مشخص باشد:\n"
        "تفسیر: بینش معنوی مرتبط (بدون نقل‌قول ساختگی)\n"
        "توصیه عملی: راهنمایی کاربردی برای زندگی روزمره\n"
    ),
    "EN": (
        "You are Rumi AI — a spiritual guide inspired by the philosophy of Jalāl al-Dīn Rūmī.\n"
        "No verified verses or sources are available for this query.\n"
        "IMPORTANT: Do NOT fabricate, invent, or quote any Rumi verses.\n"
        "Provide general spiritual guidance in two clearly labelled sections:\n"
        "Interpretation: spiritual insight relevant to the question (without fabricated quotes)\n"
        "Practical Advice: actionable guidance for everyday life\n"
    ),
    "KR": (
        "당신은 루미 AI입니다 — 잘랄 앗딘 루미의 철학에서 영감을 받은 영적 안내자입니다.\n"
        "이 질문에 대해 확인된 시구나 출처가 없습니다.\n"
        "중요: 루미의 시구를 지어내거나 인용하지 마세요.\n"
        "일반적인 영적 안내를 두 부분으로 명확히 구분하세요:\n"
        "해석: 질문과 관련된 영적 통찰 (지어낸 인용 없이)\n"
        "실용적 조언: 일상 생활에 적용 가능한 안내\n"
    ),
}


# ── Public helpers ──────────────────────────────────────────────────


def build_system_prompt(language: str, *, grounded: bool = True) -> str:
    """Return the system-role prompt for *language* (FA / EN / KR).

    When *grounded* is False the prompt instructs the LLM **not** to
    fabricate any Rumi verses, since no corpus data was retrieved.
    """
    prompts = _SYSTEM_PROMPTS_GROUNDED if grounded else _SYSTEM_PROMPTS_UNGROUNDED
    return prompts.get(language, prompts["EN"])


def build_user_prompt(
    user_message: str,
    language: str,
    verses: List[Dict[str, Any]],
    citations: List[Dict[str, Any]],
    *,
    history: Sequence[Dict[str, str]] | None = None,
) -> str:
    """
    Assemble the user-role prompt containing:
      1. Conversation history (bounded, recent turns only)
      2. Retrieved verse context (in the target language + original Persian)
      3. Citation references (book + page)
      4. The user's current question
    """
    labels = _SECTION_LABELS.get(language, _SECTION_LABELS["EN"])
    lang_key = language.lower()  # "fa" | "en" | "kr"
    parts: List[str] = []

    # ── Prior conversation context (max 6 turns kept by caller) ──
    if history:
        parts.append("--- Previous conversation ---")
        for turn in history:
            role = turn.get("role", "user").capitalize()
            text = (turn.get("content") or "").strip()
            if text:
                parts.append(f"{role}: {text[:300]}")
        parts.append("")

    # ── Verse context ──
    if verses:
        parts.append(f"--- {labels['verse']} ---")
        for idx, v in enumerate(verses, 1):
            text = v.get(f"text_{lang_key}") or v.get("text_fa") or ""
            if not text:
                continue
            line = f"[{idx}] {text}"
            # Show original Persian alongside when the target language differs
            fa_text = v.get("text_fa", "")
            if lang_key != "fa" and fa_text and fa_text != text:
                line += f"\n     (فارسی: {fa_text})"
            # Include page reference for RAG-sourced verses
            rag_page = v.get("_rag_page")
            if rag_page is not None:
                line += f"  [page {rag_page}]"
            parts.append(line)
        parts.append("")  # blank separator

    # ── Citation context ──
    if citations:
        parts.append("--- Citations ---")
        for c in citations:
            verse_text = c.get("verse_text", {})
            text = verse_text.get(lang_key) or verse_text.get("fa", "")
            page = c.get("page_number", "?")
            if text:
                parts.append(f"• [page {page}] {text}")
        parts.append("")

    # ── User question (bounded to reduce prompt injection surface) ──
    safe_message = user_message[:2000] if user_message else ""
    parts.append(f"{labels['question']}: {safe_message}")

    return "\n".join(parts)


def parse_llm_response(raw_text: str, language: str) -> Dict[str, str]:
    """
    Best-effort split of LLM output into *interpretation* and *advice*.

    The LLM is prompted to produce two labelled sections.  When labels
    are absent we fall back gracefully:
      • full text → interpretation
      • last paragraph → advice (if multiple paragraphs exist)
    """
    # Try with the target language labels first
    parsed = _try_split_sections(raw_text, language)

    # Fall back to English labels when the LLM ignores the target language
    if not parsed["found"] and language != "EN":
        parsed = _try_split_sections(raw_text, "EN")

    if parsed["found"]:
        return {
            "interpretation": parsed["interpretation"],
            "advice": parsed["advice"],
        }

    # Last resort: heuristic split on paragraphs
    return _fallback_split(raw_text)


# ── Internal helpers ────────────────────────────────────────────────


def _section_regex(label: str) -> re.Pattern[str]:
    """
    Match common LLM section header formats:
      "1) Interpretation:", "## Interpretation —", "Interpretation:", etc.
    """
    escaped = re.escape(label)
    return re.compile(
        rf"(?:^|\n)\s*(?:\d+[).]\s*)?(?:#{{0,3}}\s*)?{escaped}\s*[:\-—]?\s*",
        re.IGNORECASE,
    )


def _try_split_sections(raw_text: str, language: str) -> Dict[str, Any]:
    """Attempt to split *raw_text* using the section labels for *language*."""
    labels = _SECTION_LABELS.get(language, _SECTION_LABELS["EN"])
    interp_match = _section_regex(labels["interpretation"]).search(raw_text)
    advice_match = _section_regex(labels["advice"]).search(raw_text)

    if not interp_match and not advice_match:
        return {"found": False, "interpretation": "", "advice": ""}

    interpretation = ""
    advice = ""

    if interp_match and advice_match:
        if interp_match.start() < advice_match.start():
            interpretation = raw_text[interp_match.end():advice_match.start()].strip()
            advice = raw_text[advice_match.end():].strip()
        else:
            advice = raw_text[advice_match.end():interp_match.start()].strip()
            interpretation = raw_text[interp_match.end():].strip()
    elif interp_match:
        interpretation = raw_text[interp_match.end():].strip()
    elif advice_match:
        interpretation = raw_text[:advice_match.start()].strip()
        advice = raw_text[advice_match.end():].strip()

    return {
        "found": True,
        "interpretation": interpretation or raw_text.strip(),
        "advice": advice,
    }


def _fallback_split(raw_text: str) -> Dict[str, str]:
    """
    When no section labels are found, split on double-newlines:
    everything except the last paragraph → interpretation,
    last paragraph → advice.
    """
    text = raw_text.strip()
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]

    if len(paragraphs) > 1:
        return {
            "interpretation": "\n\n".join(paragraphs[:-1]),
            "advice": paragraphs[-1],
        }
    return {"interpretation": text, "advice": ""}
