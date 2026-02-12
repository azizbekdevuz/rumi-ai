"""
Chat Service - POST /api/chat
Allows user to submit a question and receive advice based on Rumi's poetry using RAG and LLM.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
import uuid

from app.database import get_db
from app.models import User, ChatSession, Message, Verse, Citation, Book
from app.schemas import (
    ChatRequest, ChatResponse, VerseMultilingual, CitationSummary
)
from app.middleware.auth import get_optional_user
from app.services.chat_service import ChatService

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Submit a question and receive advice based on Rumi's poetry.
    Uses RAG (Retrieval-Augmented Generation) and LLM.
    
    Input: question (str), language (fa/en/kr)
    Output: verse (multilingual), interpretation, advice, citations[]
    """
    try:
        # Normalize language code
        lang_map = {"fa": "FA", "en": "EN", "kr": "KR"}
        language = lang_map.get(request.language.lower(), "FA")
        
        # Create or get chat session
        session_id = None
        if current_user:
            # Create new session for authenticated user
            session = ChatSession(
                user_id=current_user.id,
                source_mode="chat"
            )
            db.add(session)
            db.commit()
            db.refresh(session)
            session_id = session.id
        else:
            # For anonymous users, create a temporary session
            session = ChatSession(
                user_id=None,  # Anonymous
                source_mode="chat"
            )
            db.add(session)
            db.commit()
            db.refresh(session)
            session_id = session.id
        
        # Process chat through Chat Service
        chat_service = ChatService(db)
        response_data = await chat_service.process_chat(
            session_id=session_id,
            user_message=request.question,
            language=language,
            verse_id=None,
            citation_ids=None
        )
        
        # Get verse data
        verse_id = response_data.get("verse_id")
        citation_ids = response_data.get("citation_ids", [])
        
        verse_data = None
        if verse_id:
            verse = db.query(Verse).filter(Verse.id == verse_id).first()
            if verse:
                verse_data = VerseMultilingual(
                    fa=verse.text_fa,
                    en=verse.text_en,
                    kr=verse.text_kr
                )
        
        # If no verse found, create a default one
        if not verse_data:
            verse_data = VerseMultilingual(
                fa="",
                en="",
                kr=""
            )
        
        # Get citations
        citations = []
        if citation_ids:
            for citation_id in citation_ids:
                citation = db.query(Citation).filter(Citation.id == citation_id).first()
                if citation:
                    book = db.query(Book).filter(Book.id == citation.book_id).first()
                    # Get snippet from verse
                    verse = db.query(Verse).filter(Verse.id == citation.verse_id).first()
                    snippet = None
                    if verse:
                        lang_field = {
                            "FA": verse.text_fa,
                            "EN": verse.text_en,
                            "KR": verse.text_kr
                        }.get(language, verse.text_fa)
                        snippet = lang_field
                    
                    citations.append(CitationSummary(
                        id=citation.id,
                        book=book.title if book else None,
                        page_number=citation.page_number,
                        snippet=snippet
                    ))
        
        # Extract interpretation and advice from response text
        response_text = response_data.get("response_text", "")
        # Simple parsing - in production, use better extraction
        interpretation = response_text
        advice = response_text
        
        # Create user message
        user_message = Message(
            session_id=session_id,
            role="user",
            message_text=request.question,
            language=language
        )
        db.add(user_message)
        
        # Create assistant message
        assistant_message = Message(
            session_id=session_id,
            role="assistant",
            message_text=response_text,
            language=language,
            verse_id=verse_id,
            citation_ids=citation_ids
        )
        db.add(assistant_message)
        db.commit()
        
        return ChatResponse(
            verse=verse_data,
            interpretation=interpretation,
            advice=advice,
            citations=citations
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")
