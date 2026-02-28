"""
Chat Router - POST /api/chat
Delegates to ChatService for the full RAG pipeline (FAISS + Ollama).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
import logging, uuid

from app.database import get_db
from app.models import User, Message
from app.schemas import (
    ChatRequest, ChatResponse, CitationSummary,
    RetrievedCandidate, VerseMultilingual,
)
from app.middleware.auth import get_optional_user
from app.services.chat_service import ChatService
from app.routers._session import resolve_user_id, resolve_or_create_session

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["chat"])
_LANG_MAP = {"fa": "FA", "en": "EN", "kr": "KR"}


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    logger.info("Chat request: question=%s, language=%s",
                request.question[:50], request.language)
    try:
        language = _LANG_MAP.get(request.language.lower(), "FA")
        source_scope = request.source_scope or "books"
        user_id = resolve_user_id(current_user, db)
        session, _ = resolve_or_create_session(db, user_id, request.session_id)

        history_dicts = None
        if request.history:
            history_dicts = [
                {"role": h.role, "content": h.content}
                for h in request.history[-6:]
            ]

        result = await ChatService(db).process_chat(
            session_id=session.id,
            user_message=request.question,
            language=language,
            source_scope=source_scope,
            history=history_dicts,
        )

        db.add(Message(
            id=str(uuid.uuid4()),
            session_id=str(session.id),
            role="user",
            message_text=request.question,
            language=language,
        ))
        db.add(Message(
            id=str(uuid.uuid4()),
            session_id=str(session.id),
            role="assistant",
            message_text=result["response_text"],
            language=language,
        ))
        db.commit()

        candidates = result.get("retrieved_candidates", [])
        return ChatResponse(
            session_id=session.id,
            verse=VerseMultilingual(**result["verse_data"]),
            interpretation=result["interpretation"],
            advice=result["advice"],
            citations=[CitationSummary(**c) for c in result.get("citations_summary", [])],
            retrieved_candidates=[RetrievedCandidate(**c) for c in candidates] if candidates else None,
            grounded=result.get("grounded", True),
        )
    except HTTPException:
        db.rollback()
        raise
    except RuntimeError as exc:
        db.rollback()
        logger.error("Chat processing error: %s", exc, exc_info=True)
        raise HTTPException(status_code=502, detail=f"LLM error: {exc}")
    except Exception as exc:
        db.rollback()
        logger.error("Unexpected chat error: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error: {exc}")
