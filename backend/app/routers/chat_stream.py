"""
Chat Streaming Endpoint - POST /api/chat/stream
"""
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
import json, asyncio, logging, uuid as uuid_mod
from app.database import get_db
from app.models import User, Message
from app.schemas import ChatRequest
from app.middleware.auth import get_optional_user
from app.services.chat_service import ChatService
from app.routers._session import resolve_user_id, resolve_or_create_session

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["chat"])
_LANG_MAP = {"fa": "FA", "en": "EN", "kr": "KR"}
_LLM_TIMEOUT_SECONDS = 120


def _sse_event(payload: dict) -> str:
    return f"data: {json.dumps(payload, default=str)}\n\n"


async def stream_chat_response(
    user_message, language, source_scope, chat_service, session_id, db, history=None,
):
    try:
        result = await asyncio.wait_for(
            chat_service.process_chat(
                session_id=session_id, user_message=user_message,
                language=language, source_scope=source_scope, history=history,
            ),
            timeout=_LLM_TIMEOUT_SECONDS,
        )
        response_text = result.get("response_text", "")
        chunk_size = 20
        for i in range(0, len(response_text), chunk_size):
            chunk = response_text[i:i + chunk_size]
            yield _sse_event({"type": "chunk", "text": chunk})
            await asyncio.sleep(0.05)
        try:
            db.add(Message(id=str(uuid_mod.uuid4()), session_id=str(session_id),
                           role="user", message_text=user_message, language=language))
            db.add(Message(id=str(uuid_mod.uuid4()), session_id=str(session_id),
                           role="assistant", message_text=response_text, language=language))
            db.commit()
        except Exception as e:
            logger.error("Failed to persist stream messages: %s", e)
            db.rollback()
        yield _sse_event({
            "type": "done", "session_id": str(session_id),
            "verse": result.get("verse_data", {}),
            "interpretation": result.get("interpretation", ""),
            "advice": result.get("advice", ""),
            "citations": result.get("citations_summary", []),
            "retrieved_candidates": result.get("retrieved_candidates", []),
            "grounded": result.get("grounded", True),
        })
    except asyncio.TimeoutError:
        yield _sse_event({"type": "error", "message": "Response timed out."})
    except Exception as exc:
        logger.error("Stream error: %s", exc, exc_info=True)
        yield _sse_event({"type": "error", "message": str(exc)})


@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    try:
        language = _LANG_MAP.get(request.language.lower(), "FA")
        source_scope = request.source_scope or "books"
        user_id = resolve_user_id(current_user, db)
        session, is_new = resolve_or_create_session(db, user_id, request.session_id)
        if is_new:
            db.commit()
        canonical_id = str(session.id)
        history_dicts = None
        if request.history:
            history_dicts = [{"role": h.role, "content": h.content} for h in request.history[-6:]]
        chat_service = ChatService(db)
        return StreamingResponse(
            stream_chat_response(request.question, language, source_scope,
                                 chat_service, canonical_id, db, history_dicts),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
        )
    except Exception as exc:
        logger.error("Stream endpoint error: %s", exc, exc_info=True)
        async def error_stream():
            yield _sse_event({"type": "error", "message": str(exc)})
        return StreamingResponse(error_stream(), media_type="text/event-stream", status_code=500)
