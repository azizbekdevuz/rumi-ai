"""
Citation Service - GET /api/citation/:id
Returns detailed citation information including text snippets and PDF bounding box coordinates.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Dict, Any

from app.database import get_db
from app.models import Citation, Verse, Book
from app.schemas import CitationDetail
from app.middleware.auth import get_optional_user

router = APIRouter(prefix="/api/citation", tags=["citation"])


@router.get("/{citation_id}", response_model=CitationDetail)
async def get_citation(
    citation_id: UUID,
    current_user = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed citation information.
    Returns book, page_number, snippet, translation, and bbox (bounding box).
    """
    citation = db.query(Citation).filter(Citation.id == citation_id).first()
    if not citation:
        raise HTTPException(status_code=404, detail="Citation not found")
    
    # Get book information
    book = db.query(Book).filter(Book.id == citation.book_id).first()
    book_name = book.title if book else None
    
    # Get verse for snippet and translation
    verse = db.query(Verse).filter(Verse.id == citation.verse_id).first()
    snippet = verse.text_fa if verse else None
    translation = verse.text_en if verse else None
    
    # Extract bounding box from highlight_box JSON
    bbox = None
    if citation.highlight_box:
        if isinstance(citation.highlight_box, dict):
            bbox = {
                "x": citation.highlight_box.get("x", 0.0),
                "y": citation.highlight_box.get("y", 0.0),
                "width": citation.highlight_box.get("width", 0.0),
                "height": citation.highlight_box.get("height", 0.0)
            }
    
    return CitationDetail(
        book=book_name,
        page_number=citation.page_number,
        snippet=snippet,
        translation=translation,
        bbox=bbox
    )
