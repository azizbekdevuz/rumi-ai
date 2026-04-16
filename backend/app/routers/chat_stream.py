"""
Chat Streaming Endpoint — POST /api/chat/stream
Returns server-sent events for progressive response streaming.
"""
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Dict, List, Optional
from uuid import UUID
import json
import asyncio
import logging

from app.database import get_db
from app.models import User, Message, ChatSession
from app.schemas import ChatRequest
from app.middleware.auth import get_optional_user
from app.services.chat_service import ChatService
from app.routers._session import resolve_user_id, resolve_or_create_session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])

_LANG_MAP = {"fa": "FA", "en": "EN", "kr": "KR"}

# Seconds before we give up waiting for the LLM.
_LLM_TIMEOUT_SECONDS = 90


def _sse_event(payload: dict) -> str:
    """Serialise *payload* to an SSE `data:` line, converting UUIDs."""
    return f"data: {json.dumps(payload, default=str)}\n\n"


# Client-visible SSE errors must never include exception text, tracebacks, or paths.
_SSE_INTERNAL_ERROR_CLIENT_MESSAGE = "An internal error occurred. Please try again."


def _sse_error_event(client_safe_message: str) -> str:
    """Build one SSE `data:` line for type=error with a non-sensitive *client_safe_message*."""
    return _sse_event({"type": "error", "message": client_safe_message})


async def stream_chat_response(
    user_message: str,
    language: str,
    source_scope: str,
    chat_service: ChatService,
    session_id: UUID,
    db: Session,
    history: Optional[List[Dict[str, str]]] = None,
):
    """Stream chat response as SSE events.

    Events emitted:
      • {"type": "chunk", "text": "…"}  — progressive text fragments
      • {"type": "done", …}             — full structured response data
      • {"type": "error", "message": …} — on failure

    Also persists user + assistant messages to DB (same as non-streaming path).
    """
    try:
        result = await asyncio.wait_for(
            chat_service.process_chat(
                session_id=session_id,
                user_message=user_message,
                language=language,
                source_scope=source_scope,
                history=history,
            ),
            timeout=_LLM_TIMEOUT_SECONDS,
        )

        response_text = result.get("response_text", "")

        # ── Stream text in small chunks ──
        chunk_size = 20
        for i in range(0, len(response_text), chunk_size):
            chunk = response_text[i:i + chunk_size]
            yield _sse_event({"type": "chunk", "text": chunk})
            await asyncio.sleep(0.05)

        # ── Persist messages (same contract as non-streaming) ──
        try:
            # Normalize advice to a list of strings for API + storage consistency
            raw_advice = result.get("advice", [])
            if isinstance(raw_advice, list):
                advice_list = [str(x) for x in raw_advice]
            elif isinstance(raw_advice, str):
                advice_list = [raw_advice] if raw_advice.strip() else []
            else:
                advice_list = []

            # Compute next turn_index for this session in a transaction to avoid races
            for attempt in range(2):
                try:
                    # Lock the session row to serialize turn assignment for this session
                    db.query(ChatSession).filter(ChatSession.id == session_id).with_for_update().one()

                    last_turn = (
                        db.query(func.coalesce(func.max(Message.turn_index), 0))
                        .filter(Message.session_id == session_id)
                        .scalar()
                    )
                    user_turn = last_turn + 1
                    assistant_turn = user_turn + 1

                    db.add(Message(
                        session_id=session_id,
                        role="user",
                        message_text=user_message,
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
                        session_id=session_id,
                        role="assistant",
                        message_text=response_text,
                        language=language,
                        verse_id=result.get("verse_id"),
                        citation_ids=result.get("citation_ids", []),
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
        except Exception as persist_err:
            logger.error("Failed to persist stream messages: %s", persist_err)
            db.rollback()

        # ── Final event with full structured response ──
        # Reuse normalized advice_list where available, otherwise fall back
        if 'advice_list' in locals():
            final_advice = advice_list
        else:
            raw_advice = result.get("advice", [])
            if isinstance(raw_advice, list):
                final_advice = [str(x) for x in raw_advice]
            elif isinstance(raw_advice, str):
                final_advice = [raw_advice] if raw_advice.strip() else []
            else:
                final_advice = []

        yield _sse_event({
            "type": "done",
            "session_id": str(session_id),
            "verse": result.get("verse_data", {}),
            "interpretation": result.get("interpretation", ""),
            "advice": final_advice,
            "citations": result.get("citations_summary", []),
            "retrieved_candidates": result.get("retrieved_candidates", []),
            "verse_id": result.get("verse_id"),
            "citation_ids": result.get("citation_ids", []),
            "grounded": result.get("grounded", True),
        })

    except asyncio.TimeoutError:
        logger.error(
            "LLM timed out after %ds for session %s",
            _LLM_TIMEOUT_SECONDS,
            session_id,
        )
        yield _sse_error_event("Response timed out. Please try again.")

    except Exception as exc:
        logger.error("Stream chat error: %s", exc, exc_info=True)
        yield _sse_error_event(_SSE_INTERNAL_ERROR_CLIENT_MESSAGE)


@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Stream chat response as server-sent events."""
    try:
        language = _LANG_MAP.get(request.language.lower(), "FA")
        source_scope = request.source_scope or "books"

        user_id = resolve_user_id(current_user, db)

        session, is_new = resolve_or_create_session(
            db, user_id, request.session_id,
        )

        # ── Commit the session row NOW so it is durable before the
        #    streaming generator runs.  FastAPI may clean up the DB
        #    dependency (rolling back uncommitted work) before the
        #    generator executes — committing here prevents the FK
        #    violation on Message inserts.  ──
        if is_new:
            db.commit()

        # Materialise to a plain UUID — survives ORM session expiry.
        canonical_id = UUID(str(session.id))

        # ── Build history dicts from request ──
        history_dicts: Optional[List[Dict[str, str]]] = None
        if request.history:
            history_dicts = [
                {"role": h.role, "content": h.content}
                for h in request.history[-4:]
            ]

        chat_service = ChatService(db)

        return StreamingResponse(
            stream_chat_response(
                user_message=request.question,
                language=language,
                source_scope=source_scope,
                chat_service=chat_service,
                session_id=canonical_id,
                db=db,
                history=history_dicts,
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        )
    except Exception as exc:
        logger.error("Stream endpoint error: %s", exc, exc_info=True)

        async def error_stream():
            # Fixed message only — do not close over *exc* or leak internal details to the client.
            yield _sse_error_event(_SSE_INTERNAL_ERROR_CLIENT_MESSAGE)

        return StreamingResponse(
            error_stream(),
            media_type="text/event-stream",
            status_code=500,
        )
