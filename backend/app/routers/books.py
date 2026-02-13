"""
Books API - GET /api/books/:id/pages/:n
Returns the content of a specific book page for PDF viewing, including highlighted verses.
"""
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from app.database import get_db
from app.models import Book, Verse, Citation
from app.schemas import BookPageResponse, BookPageVerse, BookListResponse, BookResponse
from app.middleware.auth import get_optional_user

router = APIRouter(prefix="/api/books", tags=["books"])


@router.get("", response_model=BookListResponse)
async def list_books(
    current_user = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    List all available books.
    Returns books with id, title, title_en, pdf_url, type.
    """
    books = db.query(Book).all()
    return BookListResponse(
        books=[BookResponse(
            id=book.id,
            title=book.title,
            title_en=book.title_en,
            pdf_url=book.pdf_url,
            type=book.type
        ) for book in books],
        total=len(books)
    )


@router.get("/{book_id}/pages/{page_number}", response_model=BookPageResponse)
async def get_book_page(
    book_id: UUID = Path(..., description="Book ID"),
    page_number: int = Path(..., ge=1, description="Page number"),
    current_user = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific page from a book.
    Returns book_id, page, verses[], highlighted[], and pdf_url.
    """
    # Verify book exists
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Get citations for this page
    citations = db.query(Citation).filter(
        Citation.book_id == book_id,
        Citation.page_number == page_number
    ).all()
    
    # Get verses referenced by these citations
    verse_ids = [citation.verse_id for citation in citations]
    verses_data = []
    highlighted_indices = []
    
    if verse_ids:
        verses = db.query(Verse).filter(Verse.id.in_(verse_ids)).all()
        
        for idx, verse in enumerate(verses):
            # Get translation (using English as translation)
            translation = verse.text_en if verse.text_en else verse.text_fa
            
            verses_data.append(BookPageVerse(
                line=verse.line_number,
                translation=translation
            ))
            
            # Mark as highlighted if it has a citation with highlight_box
            citation = next((c for c in citations if c.verse_id == verse.id), None)
            if citation and citation.highlight_box:
                highlighted_indices.append(idx)
    
    return BookPageResponse(
        book_id=book_id,
        page=page_number,
        verses=verses_data,
        highlighted=highlighted_indices,
        pdf_url=book.pdf_url
    )
