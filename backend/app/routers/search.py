"""
Search Service - GET /api/search
Retrieves relevant Rumi verses by keyword from the corpus.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from app.database import get_db
from app.models import Verse, Book, Citation
from app.schemas import SearchResponse, VerseSummary
from app.middleware.auth import get_optional_user
from app.services.search_service import SearchService

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("", response_model=SearchResponse)
async def search(
    query: str = Query(..., description="Search keyword"),
    lang: str = Query("fa", description="Language code: fa, en, or kr"),
    current_user = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Search for relevant Rumi verses by keyword.
    Returns VerseSummary objects with id, text, book, page, score.
    """
    try:
        # Normalize language code
        lang_map = {"fa": "FA", "en": "EN", "kr": "KR"}
        language = lang_map.get(lang.lower(), "FA")
        
        search_service = SearchService(db)
        results = await search_service.search_verses(
            query=query,
            language=language,
            book_id=None,
            limit=20
        )
        
        # Format results as VerseSummary
        verse_summaries = []
        for result in results:
            # Get book name
            book_id = UUID(result["book_id"])
            book = db.query(Book).filter(Book.id == book_id).first()
            book_name = book.title if book else None
            
            # Get page number from citations
            verse_id = UUID(result["id"])
            citation = db.query(Citation).filter(Citation.verse_id == verse_id).first()
            page_number = citation.page_number if citation else None
            
            # Get text in requested language
            text_field = {
                "FA": result.get("text_fa", ""),
                "EN": result.get("text_en", ""),
                "KR": result.get("text_kr", "")
            }.get(language, result.get("text_fa", ""))
            
            # Calculate relevance score (simplified - use proper ranking in production)
            score = 0.8  # Placeholder score
            
            verse_summaries.append(VerseSummary(
                id=verse_id,
                text=text_field,
                book=book_name,
                page=page_number,
                score=score
            ))
        
        return SearchResponse(results=verse_summaries)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching verses: {str(e)}")
