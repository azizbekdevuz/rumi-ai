"""
Chat Streaming Endpoint - POST /api/chat/stream
Returns server-sent events for progressive response streaming.
"""
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
import json
import uuid
import asyncio
import logging

from app.database import get_db
from app.models import User, ChatSession
from app.schemas import ChatRequest
from app.middleware.auth import get_optional_user
from app.services.chat_service import ChatService
from app.services.guest_user_service import get_or_create_guest_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _resolve_user_id(current_user: Optional[User], db: Session) -> UUID:
    """
    Return a guaranteed non-None user UUID.
    """
    if current_user is not None and current_user.id is not None:
        return current_user.id

    guest = get_or_create_guest_user(db)
    uid = guest.id
    if uid is None:
        raise Exception("Guest user has no id – possible database issue")
    return UUID(str(uid))


async def stream_chat_response(
    user_message: str,
    language: str,
    source_scope: str,
    chat_service: ChatService,
    session_id
):
    """Stream chat response as SSE events."""
    try:
        # Process chat (this may take time)
        response_data = await chat_service.process_chat(
            session_id=session_id,
            user_message=user_message,
            language=language,
            verse_id=None,
            citation_ids=None,
            source_scope=source_scope
        )
        
        response_text = response_data.get("response_text", "")
        
        # Stream response text in chunks
        chunk_size = 20  # Characters per chunk
        for i in range(0, len(response_text), chunk_size):
            chunk = response_text[i:i + chunk_size]
            yield f"data: {json.dumps({'type': 'chunk', 'text': chunk})}\n\n"
            await asyncio.sleep(0.05)  # Small delay for streaming effect
        
        # Send final data
        yield f"data: {json.dumps({'type': 'done', 'verse_id': str(response_data.get('verse_id', '')), 'citation_ids': [str(cid) for cid in response_data.get('citation_ids', [])]})}\n\n"
        
    except Exception as e:
        logger.error("Stream chat error: %s", e, exc_info=True)
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"


@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Stream chat response as server-sent events.
    """
    try:
        # Normalize language
        lang_map = {"fa": "FA", "en": "EN", "kr": "KR"}
        language = lang_map.get(request.language.lower(), "FA")
        source_scope = request.source_scope if hasattr(request, 'source_scope') and request.source_scope else 'books'
        
        # Resolve user id (guest or authenticated) — plain UUID, never None
        user_id: UUID = _resolve_user_id(current_user, db)
        
        session = ChatSession(
            id=uuid.uuid4(),
            user_id=user_id,
            source_mode="chat"
        )
        db.add(session)
        db.flush()
        session_id = session.id
        
        # Create chat service
        chat_service = ChatService(db)
        
        return StreamingResponse(
            stream_chat_response(
                user_message=request.question,
                language=language,
                source_scope=source_scope,
                chat_service=chat_service,
                session_id=session_id
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
    except Exception as e:
        logger.error("Stream endpoint error: %s", e, exc_info=True)
        async def error_stream():
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        return StreamingResponse(
            error_stream(),
            media_type="text/event-stream",
            status_code=500
        )
