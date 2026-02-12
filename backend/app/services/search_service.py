"""
Search Service - Handles verse search with multilingual support.
"""
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional, List, Literal
from uuid import UUID
from app.models import Verse, Book, Citation


class SearchService:
    """Service for searching verses."""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def search_verses(
        self,
        query: str,
        language: Literal["FA", "EN", "KR"] = "FA",
        book_id: Optional[UUID] = None,
        limit: int = 10
    ) -> List[dict]:
        """
        Search for verses with multilingual support.
        
        Args:
            query: Search query
            language: Language code (FA, EN, KR)
            book_id: Optional book ID to filter by
            limit: Maximum number of results
        
        Returns:
            List of verse dictionaries
        """
        # Build query
        verse_query = self.db.query(Verse)
        
        # Filter by book if provided
        if book_id:
            verse_query = verse_query.filter(Verse.book_id == book_id)
        
        # Search in appropriate language field
        text_field = {
            "FA": Verse.text_fa,
            "EN": Verse.text_en,
            "KR": Verse.text_kr
        }.get(language, Verse.text_fa)
        
        # Simple text search (in production, use full-text search or vector similarity)
        search_pattern = f"%{query}%"
        verse_query = verse_query.filter(
            func.lower(text_field).like(func.lower(search_pattern))
        )
        
        # Get results
        verses = verse_query.limit(limit).all()
        
        # Format results
        results = []
        for verse in verses:
            book = self.db.query(Book).filter(Book.id == verse.book_id).first()
            results.append({
                "id": str(verse.id),
                "book_id": str(verse.book_id),
                "book_title": book.title if book else None,
                "line_number": verse.line_number,
                "text_fa": verse.text_fa,
                "text_en": verse.text_en,
                "text_kr": verse.text_kr
            })
        
        return results
    
    async def search_with_reranking(
        self,
        query: str,
        language: Literal["FA", "EN", "KR"] = "FA",
        limit: int = 10
    ) -> List[dict]:
        """
        Search verses with multilingual reranking.
        This would use vector similarity in production.
        """
        # Get initial results
        results = await self.search_verses(query, language, limit=limit * 2)
        
        # Simple reranking (in production, use proper ML-based reranking)
        # For now, just return top results
        return results[:limit]
