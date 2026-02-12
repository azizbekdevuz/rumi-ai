"""
Citation Service - Handles citation data management.
"""
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from uuid import UUID
from app.models import Citation, Verse, Book


class CitationService:
    """Service for managing citation data."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_citation_data(
        self,
        citation_id: UUID
    ) -> Optional[Dict[str, Any]]:
        """Get citation data including book, page, and verse information."""
        citation = self.db.query(Citation).filter(Citation.id == citation_id).first()
        if not citation:
            return None
        
        verse = self.db.query(Verse).filter(Verse.id == citation.verse_id).first()
        book = self.db.query(Book).filter(Book.id == citation.book_id).first()
        
        return {
            "id": str(citation.id),
            "book_id": str(citation.book_id),
            "book_title": book.title if book else None,
            "book_title_en": book.title_en if book else None,
            "verse_id": str(citation.verse_id),
            "page_number": citation.page_number,
            "line_range": citation.line_range,
            "highlight_box": citation.highlight_box,
            "verse": {
                "id": str(verse.id) if verse else None,
                "text_fa": verse.text_fa if verse else None,
                "text_en": verse.text_en if verse else None,
                "text_kr": verse.text_kr if verse else None,
                "line_number": verse.line_number if verse else None
            } if verse else None,
            "pdf_url": book.pdf_url if book else None
        }
    
    def get_citations_for_verse(
        self,
        verse_id: UUID
    ) -> List[Dict[str, Any]]:
        """Get all citations for a specific verse."""
        citations = self.db.query(Citation).filter(
            Citation.verse_id == verse_id
        ).all()
        
        results = []
        for citation in citations:
            book = self.db.query(Book).filter(Book.id == citation.book_id).first()
            results.append({
                "id": str(citation.id),
                "book_id": str(citation.book_id),
                "book_title": book.title if book else None,
                "page_number": citation.page_number,
                "line_range": citation.line_range,
                "highlight_box": citation.highlight_box
            })
        
        return results
    
    def get_citations_for_page(
        self,
        book_id: UUID,
        page_number: int
    ) -> List[Dict[str, Any]]:
        """Get all citations for a specific page in a book."""
        citations = self.db.query(Citation).filter(
            Citation.book_id == book_id,
            Citation.page_number == page_number
        ).all()
        
        results = []
        for citation in citations:
            verse = self.db.query(Verse).filter(Verse.id == citation.verse_id).first()
            book = self.db.query(Book).filter(Book.id == citation.book_id).first()
            results.append({
                "id": str(citation.id),
                "verse_id": str(citation.verse_id),
                "verse_text_fa": verse.text_fa if verse else None,
                "verse_text_en": verse.text_en if verse else None,
                "verse_text_kr": verse.text_kr if verse else None,
                "line_range": citation.line_range,
                "highlight_box": citation.highlight_box,
                "pdf_url": book.pdf_url if book else None
            })
        
        return results
