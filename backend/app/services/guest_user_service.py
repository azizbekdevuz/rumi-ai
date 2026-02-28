"""
Guest User Service - Manages the dedicated guest user for anonymous chat sessions.
"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models import User
import bcrypt
import uuid
import logging

logger = logging.getLogger(__name__)
GUEST_USER_EMAIL = "guest@rumi.ai"


def get_or_create_guest_user(db: Session) -> User:
    guest_user = db.query(User).filter(
        User.email == GUEST_USER_EMAIL,
        User.is_guest == True,
        User.is_deleted == False,
    ).first()
    if guest_user:
        logger.debug("Found existing guest user: %s", guest_user.id)
        return guest_user

    logger.info("Creating new guest user (%s)", GUEST_USER_EMAIL)
    dummy_password = str(uuid.uuid4())
    password_hash = bcrypt.hashpw(
        dummy_password.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")

    guest_user = User(
        id=str(uuid.uuid4()),
        email=GUEST_USER_EMAIL,
        password_hash=password_hash,
        is_guest=True,
    )
    db.add(guest_user)
    try:
        db.commit()
        db.refresh(guest_user)
        logger.info("Created new guest user: %s", guest_user.id)
        return guest_user
    except IntegrityError:
        db.rollback()
        guest_user = db.query(User).filter(
            User.email == GUEST_USER_EMAIL,
            User.is_guest == True,
            User.is_deleted == False,
        ).first()
        if not guest_user:
            raise RuntimeError("Failed to create or retrieve guest user")
        return guest_user
    except Exception as e:
        db.rollback()
        logger.error("Error creating guest user: %s", e)
        raise RuntimeError(f"Failed to create guest user: {e}")
