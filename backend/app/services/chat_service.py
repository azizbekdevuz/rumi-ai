"""
Chat Service - Core chat processing logic.
"""
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from uuid import UUID
from app.services.multilingual_generation import MultilingualGenerationService
from app.services.llm_generation import LLMGenerationService


class ChatService:
    """Service for handling chat interactions."""
    
    def __init__(self, db: Session):
        self.db = db
        self.multilingual_service = MultilingualGenerationService(db)
        self.llm_service = LLMGenerationService()
    
    async def process_chat(
        self,
        session_id: UUID,
        user_message: str,
        language: str = "FA",
        verse_id: Optional[UUID] = None,
        citation_ids: Optional[List[UUID]] = None,
        source_scope: str = "books"
    ) -> Dict[str, Any]:
        """
        Process a chat message and generate response.
        
        Args:
            session_id: Chat session ID
            user_message: User's message text
            language: Language code (FA, EN, KR)
            verse_id: Optional primary verse ID
            citation_ids: Optional list of citation IDs
        
        Returns:
            Dictionary with response_text, verse_id, citation_ids
        """
        # Get context from multilingual generation service
        context = await self.multilingual_service.prepare_context(
            user_message=user_message,
            language=language,
            verse_id=verse_id,
            citation_ids=citation_ids
        )
        
        # Generate response using LLM
        response = await self.llm_service.generate_response(
            user_message=user_message,
            context=context,
            language=language
        )
        
        return {
            "response_text": response.get("text"),
            "verse_id": response.get("verse_id"),
            "citation_ids": response.get("citation_ids", []),
            "retrieved_candidates": response.get("retrieved_candidates", [])
        }
