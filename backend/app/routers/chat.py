"""
Chat Service - POST /api/chat
Allows user to submit a question and receive advice based on Rumi's poetry using RAG and LLM.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
import uuid
import logging

from app.database import get_db
from app.models import User, ChatSession, Message, Verse, Citation, Book
from app.schemas import (
    ChatRequest, ChatResponse, VerseMultilingual, CitationSummary, RetrievedCandidate
)
from app.middleware.auth import get_optional_user
from app.services.chat_service import ChatService
from app.services.guest_user_service import get_or_create_guest_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _resolve_user_id(current_user: Optional[User], db: Session) -> UUID:
    """
    Return a guaranteed non-None user UUID.
    - If the caller is authenticated, use their id.
    - Otherwise create / fetch the shared guest user.
    Raises HTTPException(500) if a valid id cannot be obtained.
    """
    if current_user is not None and current_user.id is not None:
        return current_user.id

    # Guest path
    guest = get_or_create_guest_user(db)
    uid = guest.id
    if uid is None:
        raise HTTPException(
            status_code=500,
            detail="Guest user has no id – possible database issue",
        )
    # Materialise to a plain Python UUID so that later SQLAlchemy
    # session operations (commit / expire) cannot turn it into None.
    return UUID(str(uid))


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
    logger.info("Chat request: question=%s, language=%s", request.question[:50], request.language)
    
    try:
        # Normalize language code
        lang_map = {"fa": "FA", "en": "EN", "kr": "KR"}
        language = lang_map.get(request.language.lower(), "FA")
        
        # ---- Resolve user id (guest or authenticated) ----
        user_id: UUID = _resolve_user_id(current_user, db)
        logger.debug("Resolved user_id=%s (authenticated=%s)", user_id, current_user is not None)
        
        # ---- Create chat session ----
        session = ChatSession(
            id=uuid.uuid4(),
            user_id=user_id,
            source_mode="chat"
        )
        db.add(session)
        db.flush()                       # flush (not commit) to get session.id
        session_id = session.id
        
        # Log source scope
        source_scope = getattr(request, 'source_scope', 'books') or 'books'
        
        # Process chat through Chat Service
        chat_service = ChatService(db)
        response_data = await chat_service.process_chat(
            session_id=session_id,
            user_message=request.question,
            language=language,
            verse_id=None,
            citation_ids=None,
            source_scope=source_scope
        )
        
        # Get verse data
        verse_id = response_data.get("verse_id")
        citation_ids = response_data.get("citation_ids", [])
        retrieved_candidates_data = response_data.get("retrieved_candidates", [])
        
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
            verse_data = VerseMultilingual(fa="", en="", kr="")
        
        # Get citations
        citations = []
        if citation_ids:
            for citation_id in citation_ids:
                citation = db.query(Citation).filter(Citation.id == citation_id).first()
                if citation:
                    book = db.query(Book).filter(Book.id == citation.book_id).first()
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
        
        # Build retrieved candidates (for "Show reasoning")
        retrieved_candidates = []
        if retrieved_candidates_data:
            for candidate_data in retrieved_candidates_data:
                if isinstance(candidate_data, dict):
                    candidate_id = candidate_data.get("id") or candidate_data.get("citation_id")
                    if candidate_id:
                        citation = db.query(Citation).filter(Citation.id == candidate_id).first()
                        if citation:
                            book = db.query(Book).filter(Book.id == citation.book_id).first()
                            verse = db.query(Verse).filter(Verse.id == citation.verse_id).first()
                            snippet = None
                            if verse:
                                lang_field = {
                                    "FA": verse.text_fa,
                                    "EN": verse.text_en,
                                    "KR": verse.text_kr
                                }.get(language, verse.text_fa)
                                snippet = lang_field
                            
                            retrieved_candidates.append(RetrievedCandidate(
                                id=citation.id,
                                book=book.title if book else None,
                                page_number=citation.page_number,
                                snippet=snippet,
                                score=candidate_data.get("score")
                            ))
        
        # Extract interpretation and advice from response text
        response_text = response_data.get("response_text", "")
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
        
        # Single commit for the entire request (session + messages)
        db.commit()
        
        return ChatResponse(
            verse=verse_data,
            interpretation=interpretation,
            advice=advice,
            citations=citations,
            retrieved_candidates=retrieved_candidates if retrieved_candidates else None
        )
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        logger.error("Chat processing error: %s", error_msg, exc_info=True)
        if "LLM_API_KEY not configured" in error_msg or "not using Ollama" in error_msg:
            raise HTTPException(status_code=502, detail=f"LLM service not configured: {error_msg}")
        elif "Invalid" in error_msg and "response" in error_msg:
            raise HTTPException(status_code=502, detail=f"LLM API returned invalid response: {error_msg}")
        elif "timeout" in error_msg.lower() or "connection error" in error_msg.lower() or "HTTP error" in error_msg:
            raise HTTPException(status_code=502, detail=f"LLM API request failed: {error_msg}")
        else:
            raise HTTPException(status_code=500, detail=f"Error processing chat: {error_msg}")
