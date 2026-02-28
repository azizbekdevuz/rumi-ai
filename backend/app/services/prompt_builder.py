"""
Prompt Builder - constructs system and user prompts for the RumiAI persona.
"""
from __future__ import annotations
from typing import Any, Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

_SYSTEM_PROMPTS = {
    "FA": (
        "\u062a\u0648 RumiAI \u0647\u0633\u062a\u06cc — "
        "\u06cc\u06a9 \u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06cc "
        "\u0645\u062a\u062e\u0635\u0635 \u062f\u0631 \u0627\u062f\u0628\u06cc\u0627\u062a "
        "\u0627\u0633\u0644\u0627\u0645\u06cc \u0648 \u0627\u0634\u0639\u0627\u0631 "
        "\u0645\u0648\u0644\u0627\u0646\u0627.\n\n"
        "Response format:\n"
        "Interpretation: [your interpretation]\n\n"
        "Practical Advice: [your practical advice]"
    ),
    "EN": (
        "You are RumiAI — an AI specialist in Islamic literature and the poetry "
        "of Mawlana Jalal al-Din Muhammad Balkhi (Rumi).\n\n"
        "Your responsibilities:\n"
        "- Provide verses from Muslim books in Arabic and Persian\n"
        "- Interpret and explain the deep meaning of poetry and verses\n"
        "- Offer practical advice based on Islamic wisdom\n\n"
        "Rules:\n"
        "1. Always identify yourself as RumiAI\n"
        "2. Ground your responses in the retrieved context (verses provided below)\n"
        "3. If no relevant text is found, say so honestly\n"
        "4. Quote Arabic/Persian verses accurately\n"
        "5. Structure your response in two parts\n\n"
        "Response format:\n"
        "Interpretation: [Your interpretation]\n\n"
        "Practical Advice: [Your practical advice]"
    ),
    "KR": (
        "You are RumiAI — an AI specialist in Islamic literature.\n\n"
        "Response format:\n"
        "Interpretation: [Your interpretation]\n\n"
        "Practical Advice: [Your practical advice]"
    ),
}


def build_system_prompt(language: str = "FA") -> str:
    return _SYSTEM_PROMPTS.get(language, _SYSTEM_PROMPTS["EN"])


def build_user_prompt(
    user_message: str,
    language: str = "FA",
    verses: Optional[List[Dict[str, Any]]] = None,
    citations: Optional[List[Dict[str, Any]]] = None,
    history: Optional[List[Dict[str, str]]] = None,
) -> str:
    parts = []

    if history:
        parts.append("=== Conversation History ===")
        for turn in history[-6:]:
            role = turn.get("role", "user").capitalize()
            content = turn.get("content", "")
            parts.append(f"{role}: {content}")
        parts.append("")

    if verses:
        parts.append("=== Retrieved Verses from Islamic Books ===")
        for i, v in enumerate(verses, 1):
            text = v.get("text", "")
            page = v.get("page", "?")
            score = v.get("score", 0.0)
            parts.append(f"[Verse {i}] (Page {page}, relevance: {score:.4f})")
            parts.append(f"  {text}")
        parts.append("")

    lang_labels = {"FA": "Farsi", "EN": "English", "KR": "Korean"}
    lang_label = lang_labels.get(language, language)
    parts.append(f"=== User Question (respond in {lang_label}) ===")
    parts.append(user_message)

    return "\n".join(parts)
