"""
Chat Streaming Endpoint — POST /api/chat/stream
Returns server-sent events for progressive response streaming.
"""
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
from uuid import UUID
import json
import asyncio
import logging

from app.database import get_db
from app.models import User, Message
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
            db.add(Message(
                session_id=session_id,
                role="user",
                message_text=user_message,
                language=language,
            ))
            db.add(Message(
                session_id=session_id,
                role="assistant",
                message_text=response_text,
                language=language,
                verse_id=result.get("verse_id"),
                citation_ids=result.get("citation_ids", []),
            ))
            db.commit()
        except Exception as persist_err:
            logger.error("Failed to persist stream messages: %s", persist_err)
            db.rollback()

        # ── Final event with full structured response ──
        yield _sse_event({
            "type": "done",
            "session_id": str(session_id),
            "verse": result.get("verse_data", {}),
            "interpretation": result.get("interpretation", ""),
            "advice": result.get("advice", ""),
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
        yield _sse_event({
            "type": "error",
            "message": "Response timed out. Please try again.",
        })

    except Exception as exc:
        logger.error("Stream chat error: %s", exc, exc_info=True)
        yield _sse_event({"type": "error", "message": str(exc)})


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
                for h in request.history[-6:]
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
            yield _sse_event({"type": "error", "message": str(exc)})

        return StreamingResponse(
            error_stream(),
            media_type="text/event-stream",
            status_code=500,
        )
