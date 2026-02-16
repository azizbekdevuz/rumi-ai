"""
Chat Router — POST /api/chat

Thin controller: resolves auth, creates a DB session, delegates
to ChatService for the full RAG pipeline, persists messages, and
maps the result to the ChatResponse schema.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
import logging

from app.database import get_db
from app.models import User, Message
from app.schemas import (
    ChatRequest,
    ChatResponse,
    CitationSummary,
    RetrievedCandidate,
    VerseMultilingual,
)
from app.middleware.auth import get_optional_user
from app.services.chat_service import ChatService
from app.routers._session import resolve_user_id, resolve_or_create_session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])

# ── Language code normalisation ──────────────────────────────────

_LANG_MAP = {"fa": "FA", "en": "EN", "kr": "KR"}


# ── Endpoint ─────────────────────────────────────────────────────


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """
    Submit a question and receive advice based on Rumi's poetry.
    Uses RAG (Retrieval-Augmented Generation) and LLM.
    """
    logger.info(
        "Chat request: question=%s, language=%s",
        request.question[:50], request.language,
    )

    try:
        language = _LANG_MAP.get(request.language.lower(), "FA")
        source_scope = request.source_scope or "books"

        # ── Auth ──
        user_id = resolve_user_id(current_user, db)
        logger.debug(
            "Resolved user_id=%s (authenticated=%s)",
            user_id, current_user is not None,
        )

        # ── Session (reuse existing or create new) ──
        session, _ = resolve_or_create_session(db, user_id, request.session_id)

        # ── Build history dicts from request ──
        history_dicts = None
        if request.history:
            history_dicts = [
                {"role": h.role, "content": h.content}
                for h in request.history[-6:]   # bounded window
            ]

        # ── Delegate to ChatService ──
        result = await ChatService(db).process_chat(
            session_id=session.id,
            user_message=request.question,
            language=language,
            source_scope=source_scope,
            history=history_dicts,
        )

        # ── Persist messages ──
        db.add(Message(
            session_id=session.id,
            role="user",
            message_text=request.question,
            language=language,
        ))
        db.add(Message(
            session_id=session.id,
            role="assistant",
            message_text=result["response_text"],
            language=language,
            verse_id=result["verse_id"],
            citation_ids=result["citation_ids"],
        ))
        db.commit()

        # ── Map to response schema ──
        candidates = result["retrieved_candidates"]
        return ChatResponse(
            session_id=session.id,
            verse=VerseMultilingual(**result["verse_data"]),
            interpretation=result["interpretation"],
            advice=result["advice"],
            citations=[
                CitationSummary(**c) for c in result["citations_summary"]
            ],
            retrieved_candidates=[
                RetrievedCandidate(**c) for c in candidates
            ] if candidates else None,
            grounded=result.get("grounded", True),
        )

    except HTTPException:
        db.rollback()
        raise
    except RuntimeError as exc:
        db.rollback()
        error_msg = str(exc)
        logger.error("Chat processing error: %s", error_msg, exc_info=True)
        raise HTTPException(status_code=502, detail=f"LLM error: {error_msg}")
    except Exception as exc:
        db.rollback()
        logger.error("Unexpected chat error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Error processing chat: {exc}",
        )
