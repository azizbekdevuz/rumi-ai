"""
Feedback router - POST /api/feedback

Supports two modes:
 1. **Message-specific** – session_id / message_id is provided → links to a
    Message row (for "Report Issue" in chat).
 2. **General** – no session / message reference → stored with message_id = NULL
    (for the navbar "Feedback" form).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from app.database import get_db
from app.models import User, FeedbackReport, ChatSession, Message
from app.schemas import FeedbackRequest, FeedbackResponse
from app.middleware.auth import get_optional_user
from app.services.guest_user_service import get_or_create_guest_user

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackResponse, status_code=201)
async def create_feedback(
    feedback_data: FeedbackRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """
    Report issues or submit general feedback.

    When ``session_id`` / ``message_id`` are provided the feedback is linked
    to the relevant Message row.  When omitted, the report is stored as
    general feedback (message_id is NULL in the DB).
    """
    # Resolve user (authenticated or guest)
    if current_user and current_user.id:
        user_for_feedback = current_user
    else:
        user_for_feedback = get_or_create_guest_user(db)

    if not user_for_feedback or not user_for_feedback.id:
        raise HTTPException(
            status_code=500,
            detail="Failed to resolve user for feedback",
        )

    # ── Try to find the referenced message (optional) ──────────────
    message: Optional[Message] = None

    if feedback_data.message_id:
        message = (
            db.query(Message)
            .filter(Message.id == feedback_data.message_id)
            .first()
        )
    elif feedback_data.session_id:
        session = (
            db.query(ChatSession)
            .filter(ChatSession.id == feedback_data.session_id)
            .first()
        )
        if session:
            message = (
                db.query(Message)
                .filter(Message.session_id == feedback_data.session_id)
                .order_by(Message.id.desc())
                .first()
            )

    # message may legitimately be None for general feedback — that's OK.

    ticket_id = uuid.uuid4()

    feedback = FeedbackReport(
        id=ticket_id,
        message_id=message.id if message else None,
        user_id=user_for_feedback.id,
        issue_type=feedback_data.issue_type,
        comment=feedback_data.comment,
    )
    db.add(feedback)
    db.commit()

    return FeedbackResponse(status="Feedback received", ticket_id=ticket_id)
