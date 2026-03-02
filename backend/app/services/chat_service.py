"""
Chat Service — core chat processing orchestrator.

Responsibilities (in order):
  1. Retrieve context (verses, citations) via MultilingualGenerationService
  2. Build prompts via prompt_builder
  3. Call LLM via LLMGenerationService
  4. Parse the structured response (interpretation + advice)
  5. Enrich verse / citation data for the API response
  6. Return a result dict the router can map directly to ChatResponse
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.models import Book, Citation, Verse
from app.services import prompt_builder
from app.services.llm_generation import LLMGenerationService
from app.services.multilingual_generation import MultilingualGenerationService

logger = logging.getLogger(__name__)


class ChatService:
    """Orchestrates the chat RAG pipeline."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self.multilingual_service = MultilingualGenerationService(db)
        self.llm_service = LLMGenerationService()

    async def process_chat(
        self,
        session_id: UUID,
        user_message: str,
        language: str = "FA",
        verse_id: Optional[UUID] = None,
        citation_ids: Optional[List[UUID]] = None,
        source_scope: str = "books",
        history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """
        Full chat pipeline:  retrieve → prompt → generate → parse → enrich.

        Returns
        -------
        dict with keys consumed by the chat router and the streaming endpoint:
            response_text     – raw LLM text (for Message storage)
            interpretation    – parsed interpretation section
            advice            – parsed advice section
            verse_data        – {"fa": …, "en": …, "kr": …}
            verse_id          – UUID | None  (for Message.verse_id)
            citations_summary – list of CitationSummary-compatible dicts
            citation_ids      – list[UUID]   (for Message.citation_ids)
            retrieved_candidates – list of RetrievedCandidate-compatible dicts
            grounded          – True when retrieval yielded real corpus data
        """
        # ── Diagnostic log: pipeline start ──
        logger.info(
            "[chat:%s] pipeline start | user_msg=%.60s | lang=%s | scope=%s",
            session_id, user_message, language, source_scope,
        )

        # ── 1. Retrieve context (verses + citations from DB) ──
        context = await self.multilingual_service.prepare_context(
            user_message=user_message,
            language=language,
            verse_id=verse_id,
            citation_ids=citation_ids,
        )
        verses_ctx: List[Dict[str, Any]] = context.get("verses", [])
        citations_ctx: List[Dict[str, Any]] = context.get("citations", [])

        # ── 1b. Fallback to FAISS RAG when DB retrieval yields nothing ──
        rag_sourced = False
        if not verses_ctx and not citations_ctx:
            try:
                from app.services.rag_service import get_rag_service
                rag = get_rag_service()
                if rag.is_ready:
                    rag_docs = await rag.retrieve(user_message, top_k=5)
                    if rag_docs:
                        verses_ctx = [
                            {
                                "id": str(uuid4()),
                                "text_fa": doc["text"],
                                "text_en": None,
                                "text_kr": None,
                                "relevance_score": doc.get("score", 0.0),
                                "_rag_page": doc.get("page"),
                                "_rag_source": doc.get("source_file", ""),
                            }
                            for doc in rag_docs
                        ]
                        rag_sourced = True
                        logger.info(
                            "[chat:%s] RAG fallback | docs=%d | top_score=%.4f",
                            session_id,
                            len(rag_docs),
                            rag_docs[0].get("score", 0.0),
                        )
                else:
                    logger.debug("[chat:%s] RAG index not ready yet", session_id)
            except Exception as exc:
                logger.warning(
                    "[chat:%s] RAG retrieval failed: %s", session_id, exc,
                )

        grounded = bool(verses_ctx or citations_ctx)
        top_ids = [v.get("id", "?") for v in verses_ctx[:3]]

        logger.info(
            "[chat:%s] retrieval | verses=%d | citations=%d | "
            "top_verse_ids=%s | grounded=%s | rag_sourced=%s",
            session_id, len(verses_ctx), len(citations_ctx),
            top_ids, grounded, rag_sourced,
        )

        # ── 2. Build prompts ──
        system_prompt = prompt_builder.build_system_prompt(
            language, grounded=grounded,
        )
        user_prompt = prompt_builder.build_user_prompt(
            user_message=user_message,
            language=language,
            verses=verses_ctx,
            citations=citations_ctx,
            history=history,
        )

        # ── 3. Call LLM ──
        raw_text = await self.llm_service.generate(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            language=language,
        )

        # ── 4. Parse response into interpretation / advice ──
        parsed = prompt_builder.parse_llm_response(raw_text, language)

        logger.info(
            "[chat:%s] parsed | interp_len=%d | advice_len=%d",
            session_id, len(parsed["interpretation"]), len(parsed["advice"]),
        )

        # ── 5. Extract IDs from retrieved context ──
        primary_verse_id: Optional[UUID] = None
        resolved_citation_ids: List[UUID] = []

        if not rag_sourced and verses_ctx:
            try:
                primary_verse_id = UUID(verses_ctx[0]["id"])
            except (ValueError, KeyError):
                pass
        if citations_ctx:
            resolved_citation_ids = [UUID(c["id"]) for c in citations_ctx]

        # ── 6. Enrich for the API response ──
        if rag_sourced:
            # RAG results: text comes directly from FAISS, no DB references
            verse_data = {
                "fa": verses_ctx[0].get("text_fa", "") if verses_ctx else "",
                "en": "",
                "kr": "",
            }
            citations_summary: List[Dict[str, Any]] = []
            retrieved_candidates = self._build_rag_candidates(verses_ctx)
        else:
            verse_data = self._enrich_verse(primary_verse_id)
            citations_summary = self._enrich_citations(resolved_citation_ids, language)
            retrieved_candidates = self._build_candidates(verses_ctx, language)

        # ── Safe fallback: ensure consistent empty-grounding state ──
        if not verse_data.get("fa"):
            verse_data = {"fa": "", "en": "", "kr": ""}
        if not citations_summary:
            citations_summary = []
        if not retrieved_candidates:
            retrieved_candidates = []

        # Ensure advice is never empty / None for schema stability
        interpretation = parsed["interpretation"] or raw_text.strip()
        advice = parsed["advice"] or ""

        logger.info(
            "[chat:%s] result | verse_present=%s | citation_count=%d | "
            "candidate_count=%d | grounded=%s",
            session_id, bool(verse_data.get("fa")),
            len(citations_summary), len(retrieved_candidates),
            grounded,
        )

        return {
            "response_text": raw_text,
            "interpretation": interpretation,
            "advice": advice,
            "verse_data": verse_data,
            "verse_id": primary_verse_id,
            "citations_summary": citations_summary,
            "citation_ids": resolved_citation_ids,
            "retrieved_candidates": retrieved_candidates,
            "grounded": grounded,
        }

    # ── Private enrichment helpers ──────────────────────────────

    @staticmethod
    def _build_rag_candidates(
        rag_verses: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Convert RAG-retrieved verses into RetrievedCandidate-compatible dicts."""
        candidates: List[Dict[str, Any]] = []
        for v in rag_verses:
            page = v.get("_rag_page")
            candidates.append({
                "id": uuid4(),
                "book": f"Rumi (page {page})" if page else "Rumi",
                "page_number": page,
                "snippet": (v.get("text_fa") or "")[:120],
                "score": v.get("relevance_score"),
            })
        return candidates

    def _enrich_verse(
        self, verse_id: Optional[UUID],
    ) -> Dict[str, str]:
        """Look up verse and return a VerseMultilingual-compatible dict."""
        empty = {"fa": "", "en": "", "kr": ""}
        if not verse_id:
            return empty
        verse = self.db.query(Verse).filter(Verse.id == verse_id).first()
        if not verse:
            return empty
        return {
            "fa": verse.text_fa or "",
            "en": verse.text_en or "",
            "kr": verse.text_kr or "",
        }

    def _enrich_citations(
        self,
        citation_ids: List[UUID],
        language: str,
    ) -> List[Dict[str, Any]]:
        """Build CitationSummary-compatible dicts for each citation."""
        if not citation_ids:
            return []
        result: List[Dict[str, Any]] = []
        for cid in citation_ids:
            citation = self.db.query(Citation).filter(Citation.id == cid).first()
            if not citation:
                continue
            book = self.db.query(Book).filter(Book.id == citation.book_id).first()
            verse = self.db.query(Verse).filter(Verse.id == citation.verse_id).first()
            snippet = _verse_text_for_lang(verse, language) if verse else None
            result.append({
                "id": citation.id,
                "book": book.title if book else None,
                "page_number": citation.page_number,
                "snippet": snippet,
            })
        return result

    def _build_candidates(
        self,
        verses_ctx: List[Dict[str, Any]],
        language: str,
    ) -> List[Dict[str, Any]]:
        """Convert context verses into RetrievedCandidate-compatible dicts."""
        candidates: List[Dict[str, Any]] = []
        for v in verses_ctx:
            vid = v.get("id")
            if not vid:
                continue
            verse = self.db.query(Verse).filter(Verse.id == UUID(vid)).first()
            if not verse:
                continue
            # Find one citation for this verse to get book/page info
            citation = (
                self.db.query(Citation)
                .filter(Citation.verse_id == verse.id)
                .first()
            )
            book_title = None
            page_number = None
            if citation:
                book = self.db.query(Book).filter(Book.id == citation.book_id).first()
                book_title = book.title if book else None
                page_number = citation.page_number

            candidates.append({
                "id": verse.id,
                "book": book_title,
                "page_number": page_number,
                "snippet": _verse_text_for_lang(verse, language),
                "score": v.get("relevance_score"),
            })
        return candidates


# ── Module-level utility ────────────────────────────────────────────


def _verse_text_for_lang(verse: Verse, language: str) -> Optional[str]:
    """Return the verse text column matching *language*."""
    return {
        "FA": verse.text_fa,
        "EN": verse.text_en,
        "KR": verse.text_kr,
    }.get(language, verse.text_fa)
