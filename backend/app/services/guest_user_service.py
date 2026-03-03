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

# Constant email for guest user
GUEST_USER_EMAIL = "guest@rumi.ai"


def get_or_create_guest_user(db: Session) -> User:
    """
    Get or create the dedicated guest user for anonymous sessions.
    This function NEVER returns None — it raises on failure.
    
    IMPORTANT: This function may call db.commit() when creating
    the guest user for the first time.  Callers that need
    transactional control should use db.flush() / db.begin_nested()
    around their own work.
    """
    # Try to find existing guest user
    guest_user = db.query(User).filter(
        User.email == GUEST_USER_EMAIL,
        User.is_guest == True,
        User.is_deleted == False
    ).first()
    
    if guest_user:
        if not guest_user.id:
            raise RuntimeError("Guest user found but has no ID — database corruption")
        
        # Fix existing guest user if provider is incorrect (migration from 'email' to 'guest')
        if guest_user.provider != 'guest':
            logger.info("Fixing existing guest user provider from '%s' to 'guest'", guest_user.provider)
            guest_user.provider = 'guest'
            guest_user.provider_user_id = None
            db.commit()
            db.refresh(guest_user)
        
        logger.debug("Found existing guest user: %s", guest_user.id)
        return guest_user

    # Create new guest user
    logger.info("Creating new guest user (%s)", GUEST_USER_EMAIL)
    dummy_password = str(uuid.uuid4())
    password_hash = bcrypt.hashpw(
        dummy_password.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")
    
    guest_user = User(
        id=uuid.uuid4(),             # explicit id — not relying on server default
        email=GUEST_USER_EMAIL,
        password_hash=password_hash,
        provider='guest',            # Guest users have their own provider type
        provider_user_id=None,
        is_guest=True,
    )

    db.add(guest_user)
    try:
        db.commit()
        db.refresh(guest_user)
        if not guest_user.id:
            raise RuntimeError("Guest user created but has no ID — database issue")
        logger.info("Created new guest user: %s", guest_user.id)
        return guest_user
    except IntegrityError:
        # Race condition: another process created the guest user
        db.rollback()
        guest_user = db.query(User).filter(
            User.email == GUEST_USER_EMAIL,
            User.is_guest == True,
            User.is_deleted == False
        ).first()
        
        if not guest_user:
            raise RuntimeError(
                "Failed to create or retrieve guest user after IntegrityError"
            )
        if not guest_user.id:
            raise RuntimeError(
                "Guest user retrieved but has no ID — database corruption"
            )
        
        # Fix existing guest user if provider is incorrect (migration from 'email' to 'guest')
        if guest_user.provider != 'guest':
            logger.info("Fixing existing guest user provider from '%s' to 'guest'", guest_user.provider)
            guest_user.provider = 'guest'
            guest_user.provider_user_id = None
            db.commit()
            db.refresh(guest_user)
        
        logger.info(
            "Retrieved existing guest user after race condition: %s",
            guest_user.id,
        )
        return guest_user
    except Exception as e:
        db.rollback()
        logger.error("Unexpected error creating guest user: %s", e)
        raise RuntimeError(f"Failed to create guest user: {str(e)}")
