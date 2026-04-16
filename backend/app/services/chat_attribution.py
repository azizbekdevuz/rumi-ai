"""
Chat prompt source attribution — logs which corpus rows were embedded in the
LLM user prompt (before the model runs).

Output is one multiline INFO log per turn: sectioned, plain labels, easy to
scan in a terminal. Grep for: chat_prompt_attribution
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models import Book, Citation, Verse

logger = logging.getLogger(__name__)

_GREP_TOKEN = "chat_prompt_attribution"
_TEXT_PREVIEW_CHARS = 260


def _preview(text: Optional[str], limit: int = _TEXT_PREVIEW_CHARS) -> str:
    if not text:
        return ""
    t = text.strip()
    if len(t) <= limit:
        return t
    return t[: limit - 1] + "…"


def _fmt_value(value: Any) -> str:
    if value is None or value == "":
        return "—"
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False, default=str)
    return str(value)


def _kv(label: str, value: Any, indent: str = "    ") -> str:
    return f"{indent}{label:<22} {_fmt_value(value)}"


def collect_verse_book_titles(
    db: Session,
    verses_ctx: List[Dict[str, Any]],
) -> Dict[str, str]:
    """Map verse UUID string -> book title for DB-backed context rows."""
    ids: List[UUID] = []
    for v in verses_ctx:
        raw = v.get("id")
        if not raw or not isinstance(raw, str):
            continue
        try:
            ids.append(UUID(raw))
        except ValueError:
            continue
    if not ids:
        return {}
    rows = (
        db.query(Verse.id, Book.title)
        .join(Book, Book.id == Verse.book_id)
        .filter(Verse.id.in_(ids))
        .all()
    )
    return {str(row.id): (row.title or "").strip() for row in rows}


def collect_citation_book_titles(
    db: Session,
    citations_ctx: List[Dict[str, Any]],
) -> Dict[str, str]:
    """Map citation UUID string -> book title."""
    ids: List[UUID] = []
    for c in citations_ctx:
        raw = c.get("id")
        if not raw or not isinstance(raw, str):
            continue
        try:
            ids.append(UUID(raw))
        except ValueError:
            continue
    if not ids:
        return {}
    rows = (
        db.query(Citation.id, Book.title)
        .join(Book, Book.id == Citation.book_id)
        .filter(Citation.id.in_(ids))
        .all()
    )
    return {str(row.id): (row.title or "").strip() for row in rows}


def _lines_for_verse(
    index: int,
    v: Dict[str, Any],
    lang_key: str,
    book_title: Optional[str],
) -> List[str]:
    text = v.get(f"text_{lang_key}") or v.get("text_fa") or ""
    is_rag = v.get("_rag_page") is not None or bool(v.get("_rag_source"))

    lines: List[str] = [
        f"  ── Verse [{index}] ─────────────────────────────────────────────",
    ]
    if is_rag:
        lines.append(_kv("Source", "RAG (book_verse JSON → FAISS chunk)"))
        lines.append(_kv("JSON file", v.get("_rag_source") or v.get("source_file")))
        lines.append(_kv("Page (in JSON)", v.get("_rag_page")))
        lines.append(_kv("Chapter", v.get("_rag_chapter")))
        lines.append(_kv("Verse number", v.get("_rag_verse_num")))
        lines.append(_kv("Book index (JSON)", v.get("_rag_book_index")))
        lines.append(_kv("Hit rank", v.get("_rag_rank")))
        lines.append(_kv("L2 distance (lower=closer)", v.get("_rag_score")))
        lines.append(_kv("Synthetic verse ID", v.get("id")))
    else:
        lines.append(_kv("Source", "Database (verses table)"))
        lines.append(_kv("Verse ID", v.get("id")))
        if book_title:
            lines.append(_kv("Book title", book_title))
        lines.append(_kv("Line number (DB)", v.get("line_number")))
        lines.append(_kv("Relevance score", v.get("relevance_score")))
    lines.append(_kv("Text preview (in prompt)", repr(_preview(text))))
    lines.append(_kv("Full text length", f"{len(text)} chars"))
    return lines


def _lines_for_citation(
    index: int,
    c: Dict[str, Any],
    lang_key: str,
    book_title: Optional[str],
) -> List[str]:
    verse_text = c.get("verse_text") or {}
    text = verse_text.get(lang_key) or verse_text.get("fa") or ""
    bbox = c.get("highlight_box")

    lines: List[str] = [
        f"  ── Citation [{index}] ──────────────────────────────────────────",
    ]
    lines.append(_kv("Source", "Database (citations + verse text)"))
    lines.append(_kv("Citation ID", c.get("id")))
    lines.append(_kv("Linked verse ID", c.get("verse_id")))
    if book_title:
        lines.append(_kv("Book title", book_title))
    lines.append(_kv("Page number", c.get("page_number")))
    lines.append(_kv("Line range (PDF)", c.get("line_range")))
    lines.append(_kv("BBox (highlight_box)", bbox))
    lines.append(_kv("Verse text preview (in prompt)", repr(_preview(text))))
    lines.append(_kv("Verse text length", f"{len(text)} chars"))
    return lines


def emit_chat_prompt_attribution(
    *,
    session_id: Any,
    user_message: str,
    language: str,
    source_scope: str,
    verses_ctx: List[Dict[str, Any]],
    citations_ctx: List[Dict[str, Any]],
    rag_sourced: bool,
    db: Session,
    history_turn_count: int = 0,
) -> None:
    """
    Log which structured context rows inform ``build_user_prompt``.

    RAG chunks merge multiple JSON ``lines`` entries; we log the ``page_*.json``
    file plus chapter/verse metadata from the indexed document (not a raw
    array index — that is not kept after grouping).
    """
    lang_key = (language or "FA").lower()
    book_by_verse = (
        collect_verse_book_titles(db, verses_ctx) if not rag_sourced else {}
    )
    book_by_citation = collect_citation_book_titles(db, citations_ctx)

    width = 72
    sep = "─" * width
    out: List[str] = [
        _GREP_TOKEN,
        sep,
        "LLM USER PROMPT — SOURCE ATTRIBUTION",
        "(These verses/citations are what was passed into the prompt before the LLM call.)",
        sep,
        "REQUEST",
        _kv("Session ID", str(session_id)),
        _kv("Language", language),
        _kv("Source scope", source_scope),
        _kv("Context mode", "RAG JSON corpus" if rag_sourced else "Database retrieval"),
        _kv("User message preview", repr(_preview(user_message, 220))),
        _kv("History turns in prompt", history_turn_count),
        sep,
        "COUNTS",
        _kv("Verses in prompt", len(verses_ctx)),
        _kv("Citations in prompt", len(citations_ctx)),
        sep,
        "VERSES",
    ]

    if not verses_ctx:
        out.append("    (none)")
    else:
        for i, v in enumerate(verses_ctx, start=1):
            vid = v.get("id")
            title = None
            if isinstance(vid, str) and vid in book_by_verse:
                title = book_by_verse[vid] or None
            out.extend(_lines_for_verse(i, v, lang_key, title))

    out.append(sep)
    out.append("CITATIONS")

    if not citations_ctx:
        out.append("    (none)")
    else:
        for i, c in enumerate(citations_ctx, start=1):
            cid = c.get("id")
            c_book = None
            if isinstance(cid, str):
                c_book = book_by_citation.get(cid) or None
            out.extend(_lines_for_citation(i, c, lang_key, c_book))

    out.append(sep)
    out.append(f"END {_GREP_TOKEN}")

    logger.info("\n".join(out))
