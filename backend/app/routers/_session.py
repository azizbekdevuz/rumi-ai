"""
Shared session-resolution helpers used by both the streaming and
non-streaming chat endpoints.

Kept intentionally small — just two pure functions.
"""
from __future__ import annotations

import logging
import uuid
from typing import Optional, Tuple
from uuid import UUID

from sqlalchemy.orm import Session

from app.models import User, ChatSession
from app.services.guest_user_service import get_or_create_guest_user

logger = logging.getLogger(__name__)


def resolve_user_id(current_user: Optional[User], db: Session) -> UUID:
    """Return a guaranteed non-None user UUID (authenticated or guest).

    The result is always a plain ``uuid.UUID`` so it survives ORM
    session operations (commit / expire) without becoming ``None``.
    """
    if current_user is not None and current_user.id is not None:
        return UUID(str(current_user.id))
    guest = get_or_create_guest_user(db)
    uid = guest.id
    if uid is None:
        raise RuntimeError("Guest user has no id – possible database issue")
    return UUID(str(uid))


def resolve_or_create_session(
    db: Session,
    user_id: UUID,
    session_id: Optional[UUID],
) -> Tuple[ChatSession, bool]:
    """Reuse an existing ``ChatSession`` or create a new one.

    Returns ``(session, is_new)``.  A *new* session is ``add``-ed and
    ``flush``-ed but **not** committed — callers decide their own
    commit strategy (immediate for streaming, deferred for non-stream).
    """
    if session_id:
        existing = (
            db.query(ChatSession)
            .filter(
                ChatSession.id == session_id,
                ChatSession.user_id == user_id,
            )
            .first()
        )
        if existing:
            return existing, False
        logger.warning(
            "session_id=%s not found for user=%s — creating new",
            session_id,
            user_id,
        )

    session = ChatSession(
        id=uuid.uuid4(),
        user_id=user_id,
        source_mode="chat",
    )
    db.add(session)
    db.flush()
    return session, True
