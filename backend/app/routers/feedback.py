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
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackResponse, status_code=201)
async def create_feedback(
    feedback_data: FeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Report issues related to AI responses, OCR accuracy, or incorrect translations.
    Input: session_id, issue_type, comment
    Output: status, ticket_id
    """
    # Verify session exists
    session = db.query(ChatSession).filter(ChatSession.id == feedback_data.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    # Verify user owns the session
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get a message from the session to attach feedback to
    message = db.query(Message).filter(
        Message.session_id == feedback_data.session_id
    ).order_by(Message.id.desc()).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="No messages found in session")
    
    # Generate ticket ID
    ticket_id = uuid.uuid4()
    
    # Create feedback report
    feedback = FeedbackReport(
        id=ticket_id,
        message_id=message.id,
        user_id=current_user.id,
        issue_type=feedback_data.issue_type,
        comment=feedback_data.comment
    )
    db.add(feedback)
    db.commit()
    
    return FeedbackResponse(
        status="Feedback received",
        ticket_id=ticket_id
    )
