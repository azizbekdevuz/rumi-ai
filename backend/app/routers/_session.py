"""
Shared session-resolution helpers used by chat endpoints.
"""
from __future__ import annotations
import logging, uuid as uuid_mod
from typing import Optional, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from app.models import User, ChatSession
from app.services.guest_user_service import get_or_create_guest_user

logger = logging.getLogger(__name__)


def resolve_user_id(current_user: Optional[User], db: Session) -> UUID:
    if current_user is not None and current_user.id is not None:
        return UUID(str(current_user.id))
    guest = get_or_create_guest_user(db)
    uid = guest.id
    if uid is None:
        raise RuntimeError("Guest user has no id")
    return UUID(str(uid))


def resolve_or_create_session(
    db: Session,
    user_id: UUID,
    session_id: Optional[UUID],
) -> Tuple[ChatSession, bool]:
    if session_id:
        existing = (
            db.query(ChatSession)
            .filter(
                ChatSession.id == str(session_id),
                ChatSession.user_id == str(user_id),
            )
            .first()
        )
        if existing:
            return existing, False
        logger.warning("session_id=%s not found — creating new", session_id)

    new_id = str(uuid_mod.uuid4())
    session = ChatSession(
        id=new_id,
        user_id=str(user_id),
        source_mode="chat",
    )
    db.add(session)
    db.flush()
    return session, True
