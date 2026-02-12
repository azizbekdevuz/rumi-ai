"""
Multilingual Generation Service - Handles multilingual reranking and prompt templates.
"""
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any, Literal
from uuid import UUID
from app.models import Verse, Citation, Book


class MultilingualGenerationService:
    """Service for multilingual text generation and reranking."""
    
    # Prompt templates for different languages
    PROMPT_TEMPLATES = {
        "FA": "بر اساس متن زیر، پاسخ مناسب را ارائه دهید:\n\n{context}\n\nسوال: {question}\n\nپاسخ:",
        "EN": "Based on the following text, provide an appropriate response:\n\n{context}\n\nQuestion: {question}\n\nResponse:",
        "KR": "다음 텍스트를 기반으로 적절한 응답을 제공하세요:\n\n{context}\n\n질문: {question}\n\n응답:"
    }
    
    def __init__(self, db: Session):
        self.db = db
    
    async def prepare_context(
        self,
        user_message: str,
        language: Literal["FA", "EN", "KR"] = "FA",
        verse_id: Optional[UUID] = None,
        citation_ids: Optional[List[UUID]] = None
    ) -> Dict[str, Any]:
        """
        Prepare context for LLM generation.
        Handles internal vs hybrid sources and multilingual reranking.
        """
        context = {
            "user_message": user_message,
            "language": language,
            "verses": [],
            "citations": [],
            "prompt_template": self.PROMPT_TEMPLATES.get(language, self.PROMPT_TEMPLATES["FA"])
        }
        
        # Get primary verse if provided
        if verse_id:
            verse = self.db.query(Verse).filter(Verse.id == verse_id).first()
            if verse:
                context["verses"].append({
                    "id": str(verse.id),
                    "text_fa": verse.text_fa,
                    "text_en": verse.text_en,
                    "text_kr": verse.text_kr,
                    "line_number": verse.line_number
                })
        
        # Get citations if provided
        if citation_ids:
            citations = self.db.query(Citation).filter(
                Citation.id.in_(citation_ids)
            ).all()
            
            for citation in citations:
                verse = self.db.query(Verse).filter(Verse.id == citation.verse_id).first()
                if verse:
                    context["citations"].append({
                        "id": str(citation.id),
                        "verse_id": str(citation.verse_id),
                        "page_number": citation.page_number,
                        "line_range": citation.line_range,
                        "highlight_box": citation.highlight_box,
                        "verse_text": {
                            "fa": verse.text_fa,
                            "en": verse.text_en,
                            "kr": verse.text_kr
                        }
                    })
        
        # Perform multilingual reranking if needed
        if not verse_id and not citation_ids:
            # Search for relevant verses
            context["verses"] = await self._rerank_verses(user_message, language)
        
        return context
    
    async def _rerank_verses(
        self,
        query: str,
        language: Literal["FA", "EN", "KR"] = "FA"
    ) -> List[Dict[str, Any]]:
        """
        Rerank verses based on multilingual query.
        This is a simplified version - in production, use vector similarity search.
        """
        # Simple text matching (replace with vector search in production)
        verses = self.db.query(Verse).limit(10).all()
        
        # Filter by language text field
        text_field = {
            "FA": "text_fa",
            "EN": "text_en",
            "KR": "text_kr"
        }.get(language, "text_fa")
        
        results = []
        for verse in verses:
            verse_text = getattr(verse, text_field, "")
            if verse_text and query.lower() in verse_text.lower():
                results.append({
                    "id": str(verse.id),
                    "text_fa": verse.text_fa,
                    "text_en": verse.text_en,
                    "text_kr": verse.text_kr,
                    "line_number": verse.line_number,
                    "relevance_score": 0.8  # Simplified score
                })
        
        # Sort by relevance (in production, use proper ranking)
        results.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
        return results[:5]  # Return top 5
    
    def format_prompt(
        self,
        template: str,
        context: Dict[str, Any],
        question: str
    ) -> str:
        """Format prompt using template and context."""
        context_text = ""
        
        # Add verses to context
        if context.get("verses"):
            for verse in context["verses"]:
                lang_text = verse.get(f"text_{context['language'].lower()}", "")
                if lang_text:
                    context_text += f"\n{lang_text}\n"
        
        # Add citations to context
        if context.get("citations"):
            for citation in context["citations"]:
                verse_text = citation.get("verse_text", {})
                lang_text = verse_text.get(context['language'].lower(), "")
                if lang_text:
                    context_text += f"\n[Citation from page {citation.get('page_number', '?')}]: {lang_text}\n"
        
        return template.format(context=context_text, question=question)
