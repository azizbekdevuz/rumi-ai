"""
Feedback router - POST /api/feedback
Reports issues related to AI responses, OCR accuracy, or incorrect translations.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
import uuid

from app.database import get_db
from app.models import User, FeedbackReport, ChatSession, Message
from app.schemas import FeedbackRequest, FeedbackResponse
from app.middleware.auth import get_optional_user
from app.services.guest_user_service import get_or_create_guest_user
from typing import Optional

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackResponse, status_code=201)
async def create_feedback(
    feedback_data: FeedbackRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Report issues related to AI responses, OCR accuracy, or incorrect translations.
    Input: session_id (optional), message_id (optional), issue_type, comment
    Output: status, ticket_id
    """
    # Use guest user if not authenticated
    if current_user:
        user_for_feedback = current_user
    else:
        user_for_feedback = get_or_create_guest_user(db)
    
    # Defensive check: ensure user has valid ID
    if not user_for_feedback or not user_for_feedback.id:
        raise HTTPException(
            status_code=500,
            detail="Failed to get user for feedback - user has no ID"
        )
    
    # Get message - prefer message_id, fallback to latest in session
    message = None
    if feedback_data.message_id:
        message = db.query(Message).filter(Message.id == feedback_data.message_id).first()
    elif feedback_data.session_id:
        session = db.query(ChatSession).filter(ChatSession.id == feedback_data.session_id).first()
        if session:
            message = db.query(Message).filter(
                Message.session_id == feedback_data.session_id
            ).order_by(Message.id.desc()).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Generate ticket ID
    ticket_id = uuid.uuid4()
    
    # Create feedback report
    feedback = FeedbackReport(
        id=ticket_id,
        message_id=message.id,
        user_id=user_for_feedback.id,
        issue_type=feedback_data.issue_type,
        comment=feedback_data.comment
    )
    db.add(feedback)
    db.commit()
    
    return FeedbackResponse(
        status="Feedback received",
        ticket_id=ticket_id
    )
