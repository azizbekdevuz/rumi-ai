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
from collections import Counter
from typing import Any, Dict, List, Literal, Sequence

# Query routing for prompts (chat_service) — default is literary / meaning-first.
ResponseMode = Literal["unclear", "explanation", "full"]


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

# One-section prompts: interpretation / literary explanation only unless the
# user explicitly asked for personal guidance (handled by *response_mode*).
_SYSTEM_PROMPTS_GROUNDED_EXPLAIN: Dict[str, str] = {
    "FA": (
        "شما «رومی AI» هستید — یک راهنمای معنوی متخصص در اشعار مولانا جلال‌الدین رومی.\n"
        "پاسخ را بر اساس ابیات و منابع ارائه‌شده بنویسید.\n"
        "فقط یک بخش با عنوان «تفسیر» بنویسید (شرح معنا و پیوند ادبی با متن).\n"
        "مگر اینکه کاربر صریحاً از «راهنمایی عملی برای زندگی شخصی» یا «توصیهٔ عملی» "
        "خواسته باشد، بخش جداگانهٔ «توصیه عملی» ننویسید و به کاربر توصیهٔ مستقیم ندهید.\n"
    ),
    "EN": (
        "You are Rumi AI — a spiritual guide grounded in the poetry of Jalāl al-Dīn Rūmī.\n"
        "Base your answer on the verses and sources provided.\n"
        "Write a single labelled section only: Interpretation: (literary and spiritual "
        "meaning, tied to the supplied text).\n"
        "Unless the user explicitly asks for personal guidance, life application, or "
        "practical advice, do NOT add a separate “Practical Advice” section and do not "
        "give direct prescriptive counselling.\n"
    ),
    "KR": (
        "당신은 루미 AI입니다 — 잘랄 앗딘 루미의 시에 기반한 영적 안내자입니다.\n"
        "제공된 시구와 출처를 바탕으로 답하세요.\n"
        "‘해석’이라는 제목의 한 섹션만 작성하세요 (제공된 텍스트와 연결된 문학·영적 의미).\n"
        "사용자가 개인적 지도, 삶에의 적용, 실천 조언을 분명히 요청하지 않는 한 "
        "‘실용적 조언’ 섹션을 추가하지 마세요.\n"
    ),
}

_SYSTEM_PROMPTS_UNGROUNDED_EXPLAIN: Dict[str, str] = {
    "FA": (
        "شما «رومی AI» هستید — یک راهنمای معنوی الهام‌گرفته از فلسفه مولانا جلال‌الدین رومی.\n"
        "هیچ بیت یا منبع تأیید‌شده‌ای در دسترس نیست؛ هیچ بیت یا نقل‌قولی از مولانا جعل نکنید.\n"
        "فقط یک بخش با عنوان «تفسیر» بنویسید (بینش کلی معنوی بدون نقل‌قول ساختگی).\n"
        "مگر کاربر صریحاً راهنمایی عملی برای زندگی شخصی نخواسته باشد، بخش «توصیه عملی» ننویسید.\n"
    ),
    "EN": (
        "You are Rumi AI — a spiritual guide inspired by the philosophy of Jalāl al-Dīn Rūmī.\n"
        "No verified verses or sources are available; do NOT invent or quote Rumi verses.\n"
        "Write a single labelled section only: Interpretation: (general spiritual insight, "
        "without fabricated quotes).\n"
        "Unless the user explicitly asks for personal guidance or practical life advice, "
        "do NOT add a separate “Practical Advice” section.\n"
    ),
    "KR": (
        "당신은 루미 AI입니다 — 루미의 철학에서 영감을 받은 영적 안내자입니다.\n"
        "확인된 시구나 출처가 없습니다. 루미의 시를 지어내거나 인용하지 마세요.\n"
        "‘해석’ 섹션 하나만 작성하세요 (지어낸 인용 없이 일반적인 영적 통찰).\n"
        "사용자가 개인적 지도나 실천 조언을 분명히 요청하지 않는 한 별도의 실용 조언 섹션을 두지 마세요.\n"
    ),
}

_CONTEXT_CAUTION: Dict[str, str] = {
    "FA": (
        "\nتوجه: قطعات بازیابی‌شده ممکن است با پرسش شما فقط ارتباط ضعیفی داشته باشند. "
        "اگر متن روشن نیست، کوتاه بگویید که شواهد کافی نیست و از نسبت دادن اجباری بیت‌ها به پرسش خودداری کنید.\n"
    ),
    "EN": (
        "\nNote: retrieved excerpts may be only loosely related to the question. "
        "If they do not clearly apply, say briefly that the evidence is insufficient "
        "and avoid forcing connections.\n"
    ),
    "KR": (
        "\n참고: 검색된 발췌문이 질문과 느슨하게만 관련될 수 있습니다. "
        "명확히 맞지 않으면 근거가 부족하다고 짧게 말하고 억지 연결을 피하세요.\n"
    ),
}

_UNCLEAR_USER: Dict[str, str] = {
    "EN": (
        "I did not understand your message. Please ask a clear question about Rumi’s "
        "poetry, a specific verse, or spirituality."
    ),
    "FA": (
        "پیام شما برایم روشن نیست. لطفاً دربارهٔ اشعار مولانا، یک بیت مشخص، "
        "یا یک پرسش معنوی روشن بپرسید."
    ),
    "KR": (
        "메시지를 이해하지 못했습니다. 루미의 시, 특정 시구, 또는 영성에 관한 "
        "구체적인 질문을 해 주세요."
    ),
}

_DEGRADED_PARSE: Dict[str, str] = {
    "EN": (
        "The model reply could not be structured reliably. Please try rephrasing "
        "your question or ask again."
    ),
    "FA": (
        "پاسخ مدل به‌صورت مطمئن قابل‌تحلیل نبود. لطفاً سوال را دوباره مطرح کنید "
        "یا واضح‌تر بپرسید."
    ),
    "KR": (
        "모델 응답을 안정적으로 해석할 수 없습니다. 질문을 다시 쓰거나 한 번 더 요청해 주세요."
    ),
}


# ── Public helpers ──────────────────────────────────────────────────


def classify_query_response_mode(text: str) -> ResponseMode:
    """
    Route the user message for prompting.

    • unclear — junk / punctuation-only / too short to interpret meaningfully
    • full — user explicitly wants guidance, application, or practical advice
    • explanation — default for literary / meaning questions (no forced advice)
    """
    if not text:
        return "unclear"
    stripped = text.strip()
    if len(stripped) < 2:
        return "unclear"

    # Collapse whitespace for heuristics
    compact = re.sub(r"\s+", "", stripped)
    if not compact:
        return "unclear"

    # Punctuation / symbol-only (e.g. "?", "???", "…")
    if re.fullmatch(r"[\W_]+", stripped, flags=re.UNICODE):
        return "unclear"

    lower = stripped.lower()

    # Explicit advice / application intent (any script handled via Latin + FA keywords)
    advice_markers_en = (
        "practical advice",
        "life advice",
        "what should i do",
        "what should we do",
        "how should i act",
        "how should i live",
        "counsel me",
        "personal guidance",
        "actionable steps",
        "apply this to my",
        "apply it to my",
        "give me advice",
        "guidance for my life",
    )
    advice_markers_fa = (
        "توصیه عملی", "راهنمایی عملی", "در زندگی‌ام", "در زندگیم",
        "به من بگو چه کنم", "چه کنم", "کمک کن", "عملی به من",
    )
    if any(m in lower for m in advice_markers_en) or any(m in stripped for m in advice_markers_fa):
        return "full"

    return "explanation"


def unclear_user_message(language: str) -> str:
    """Short, language-matched reply when the query is not interpretable."""
    return _UNCLEAR_USER.get(language, _UNCLEAR_USER["EN"])


def degraded_parse_message(language: str) -> str:
    """User-visible text when structured parsing failed and raw text is not safe."""
    return _DEGRADED_PARSE.get(language, _DEGRADED_PARSE["EN"])


def sanitize_history_for_prompt(
    history: Sequence[Dict[str, str]] | None,
    *,
    max_turns: int = 4,
) -> List[Dict[str, str]]:
    """
    Keep a short tail of turns for the prompt.

    Assistant turns are capped more aggressively than user turns to limit
    corruption from prior bad model outputs.
    """
    if not history:
        return []
    tail = list(history)[-max_turns:]
    out: List[Dict[str, str]] = []
    for turn in tail:
        role = (turn.get("role") or "user").strip().lower()
        content = (turn.get("content") or "").strip()
        if not content:
            continue
        cap = 360 if role == "user" else 120
        if len(content) > cap:
            content = content[: cap - 1].rstrip() + "…"
        out.append({"role": role, "content": content})
    return out


def build_system_prompt(
    language: str,
    *,
    grounded: bool = True,
    response_mode: ResponseMode = "full",
    context_caution: bool = False,
) -> str:
    """Return the system-role prompt for *language* (FA / EN / KR).

    When *grounded* is False the prompt instructs the LLM **not** to
    fabricate any Rumi verses, since no corpus data was retrieved.

    *response_mode*:
      • full — interpretation + practical advice (legacy behaviour)
      • explanation — interpretation-focused; no separate advice section
      • unclear — must not be passed here (handled before the LLM call)
    """
    mode: ResponseMode = (
        "explanation" if response_mode == "unclear" else response_mode
    )
    if mode == "explanation":
        prompts = _SYSTEM_PROMPTS_GROUNDED_EXPLAIN if grounded else _SYSTEM_PROMPTS_UNGROUNDED_EXPLAIN
    else:
        prompts = _SYSTEM_PROMPTS_GROUNDED if grounded else _SYSTEM_PROMPTS_UNGROUNDED
    base = prompts.get(language, prompts["EN"])
    if context_caution:
        base += _CONTEXT_CAUTION.get(language, _CONTEXT_CAUTION["EN"])
    return base


def build_user_prompt(
    user_message: str,
    language: str,
    verses: List[Dict[str, Any]],
    citations: List[Dict[str, Any]],
    *,
    history: Sequence[Dict[str, str]] | None = None,
    max_history_turns: int = 4,
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

    # ── Prior conversation (short tail; assistant text heavily truncated) ──
    hist_rows = sanitize_history_for_prompt(history, max_turns=max_history_turns)
    if hist_rows:
        parts.append("--- Previous conversation ---")
        for turn in hist_rows:
            role = turn.get("role", "user").capitalize()
            text = (turn.get("content") or "").strip()
            if text:
                parts.append(f"{role}: {text}")
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
    # Use delimiters to mitigate prompt injection
    safe_message = user_message[:2000] if user_message else ""
    safe_message = safe_message.replace('"""', '"')  # Escape triple quotes
    parts.append(f"{labels['question']}: \"\"\"{safe_message}\"\"\"")

    return "\n".join(parts)


def parse_llm_response(
    raw_text: str,
    language: str,
    *,
    expect_advice: bool = True,
) -> Dict[str, Any]:
    """
    Split LLM output into *interpretation* and *advice* when section labels exist.

    When labels are missing we **do not** assign the last paragraph to advice
    (that produced fabricated “advice”). If the body looks like a single
    coherent answer, it is returned as interpretation only; otherwise fields
    may be empty and *structured_ok* is False.
    """
    # Try with the target language labels first
    parsed = _try_split_sections(raw_text, language)

    # Fall back to English labels when the LLM ignores the target language
    if not parsed["found"] and language != "EN":
        parsed = _try_split_sections(raw_text, "EN")

    if parsed["found"]:
        interp = (parsed["interpretation"] or "").strip()
        adv = (parsed["advice"] or "").strip()
        if not expect_advice:
            adv = ""
        return {
            "interpretation": interp,
            "advice": adv,
            "structured_ok": True,
        }

    stripped = (raw_text or "").strip()
    if stripped and _unstructured_body_is_safe_for_display(stripped):
        return {
            "interpretation": stripped,
            "advice": "",
            "structured_ok": False,
        }

    return {
        "interpretation": "",
        "advice": "",
        "structured_ok": False,
    }


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
        "interpretation": interpretation.strip(),
        "advice": advice.strip(),
    }


def _unstructured_body_is_safe_for_display(text: str) -> bool:
    """True when unlabeled model text is plausibly a single answer (not junk)."""
    if len(text) < 25 or len(text) > 8000:
        return False
    words = text.split()
    if len(words) < 4:
        return False
    if _is_repetitive_junk(text):
        return False
    return True


def _is_repetitive_junk(text: str) -> bool:
    """Detect inputs like repeated '?' or single-character spam."""
    if not text:
        return True
    n = len(text)
    if n <= 2:
        return True
    counts = Counter(text)
    most_common = counts.most_common(1)[0][1]
    if most_common / n > 0.38:
        return True
    return False
