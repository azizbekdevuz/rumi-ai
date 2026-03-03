"""
Chat Router — POST /api/chat + session history endpoints

Thin controller: resolves auth, creates a DB session, delegates
to ChatService for the full RAG pipeline, persists messages, and
maps the result to the ChatResponse schema.

Also provides GET /api/chat/sessions and
GET /api/chat/sessions/{session_id}/messages for the profile page.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func as sql_func
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from uuid import UUID
import logging
import json

from app.database import get_db
from app.models import User, ChatSession, Message
from app.schemas import (
    ChatRequest,
    ChatResponse,
    ChatSessionResponse,
    ChatSessionWithPreview,
    CitationSummary,
    MessageResponse,
    RetrievedCandidate,
    VerseMultilingual,
)
from app.middleware.auth import get_optional_user, get_current_user
from app.services.chat_service import ChatService
from app.services.guest_user_service import get_or_create_guest_user
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

        # Normalize advice to a list of strings for API + storage consistency
        raw_advice = result.get("advice", [])
        if isinstance(raw_advice, list):
            advice_list = [str(x) for x in raw_advice]
        elif isinstance(raw_advice, str):
            advice_list = [raw_advice] if raw_advice.strip() else []
        else:
            advice_list = []

        # ── Persist messages ──
        # Compute next turn_index for this session in a transaction to avoid races
        for attempt in range(2):
            try:
                # Lock the session row to serialize turn assignment for this session
                db.query(ChatSession).filter(ChatSession.id == session.id).with_for_update().one()

                last_turn = (
                    db.query(sql_func.coalesce(sql_func.max(Message.turn_index), 0))
                    .filter(Message.session_id == session.id)
                    .scalar()
                )
                user_turn = last_turn + 1
                assistant_turn = user_turn + 1

                db.add(Message(
                    session_id=session.id,
                    role="user",
                    message_text=request.question,
                    language=language,
                    turn_index=user_turn,
                ))

                # Serialize structured data for assistant message
                advice_json = json.dumps(advice_list) if advice_list else None

                verse_data = result.get("verse_data", {})
                verse_json = json.dumps(verse_data) if verse_data else None

                citations_data = result.get("citations_summary", [])
                citations_json = json.dumps(citations_data) if citations_data else None

                db.add(Message(
                    session_id=session.id,
                    role="assistant",
                    message_text=result["response_text"],
                    language=language,
                    verse_id=result["verse_id"],
                    citation_ids=result["citation_ids"],
                    turn_index=assistant_turn,
                    interpretation_text=result.get("interpretation"),
                    advice_json=advice_json,
                    verse_json=verse_json,
                    citations_json=citations_json,
                ))
                db.commit()
                break
            except IntegrityError:
                db.rollback()
                if attempt == 1:
                    raise

        # ── Map to response schema ──
        candidates = result["retrieved_candidates"]
        return ChatResponse(
            session_id=session.id,
            verse=VerseMultilingual(**result["verse_data"]),
            interpretation=result["interpretation"],
            advice=advice_list,
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
            status_code=500, detail="An internal error occurred while processing your request.",
        )


# ── Session / History Endpoints ──────────────────────────────────


@router.get("/sessions", response_model=List[ChatSessionWithPreview])
def list_sessions(
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List chat sessions for the current authenticated user (newest first).

    Each session includes ``message_count`` and ``preview`` (the first
    user message) so the frontend never needs N+1 queries.
    
    Requires authentication. Returns empty list if user has no sessions.
    """
    user_id = current_user.id

    # Sub-query: message count per session
    count_sq = (
        db.query(
            Message.session_id,
            sql_func.count(Message.id).label("message_count"),
        )
        .group_by(Message.session_id)
        .subquery()
    )

    # Correlated scalar sub-query: first user message text per session.
    # Uses LIMIT 1 instead of min(uuid) which PostgreSQL doesn't support.
    preview_sq = (
        db.query(Message.message_text)
        .filter(
            Message.session_id == ChatSession.id,
            Message.role == "user",
        )
        .limit(1)
        .correlate(ChatSession)
        .scalar_subquery()
    )

    rows = (
        db.query(
            ChatSession,
            sql_func.coalesce(count_sq.c.message_count, 0).label("message_count"),
            preview_sq.label("preview"),
        )
        .outerjoin(count_sq, ChatSession.id == count_sq.c.session_id)
        .filter(ChatSession.user_id == user_id)
        .order_by(ChatSession.created_at.desc())
        .limit(limit)
        .all()
    )

    result: List[ChatSessionWithPreview] = []
    for session, msg_count, preview_text in rows:
        result.append(
            ChatSessionWithPreview(
                id=session.id,
                user_id=session.user_id,
                created_at=session.created_at,
                source_mode=session.source_mode,
                message_count=msg_count,
                preview=(preview_text or "")[:120],
            )
        )
    return result


@router.get("/sessions/{session_id}/messages", response_model=List[MessageResponse])
def get_session_messages(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve all messages for a given session (chronological order).
    
    Requires authentication. Only returns messages for sessions owned by the authenticated user.
    """
    # Verify session belongs to this user
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = (
        db.query(Message)
        .filter(Message.session_id == session_id)
        .order_by(Message.turn_index.asc())
        .all()
    )
    # Convert to MessageResponse with structured data parsing
    return [MessageResponse.from_orm_with_structured(msg) for msg in messages]
