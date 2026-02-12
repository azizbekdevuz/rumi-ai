"""
LLM Generation Service - Handles LLM API integration (GPT-4, etc.).
"""
from typing import Dict, Any, Optional, List
from uuid import UUID
import os
import httpx
from app.config import settings


class LLMGenerationService:
    """Service for generating responses using LLM APIs."""
    
    def __init__(self):
        # LLM API configuration
        self.api_key = os.getenv("LLM_API_KEY", "")
        self.api_url = os.getenv("LLM_API_URL", "https://api.openai.com/v1/chat/completions")
        self.model = os.getenv("LLM_MODEL", "gpt-4")
        self.timeout = 30.0
    
    async def generate_response(
        self,
        user_message: str,
        context: Dict[str, Any],
        language: str = "FA"
    ) -> Dict[str, Any]:
        """
        Generate response using LLM.
        
        Args:
            user_message: User's message
            context: Context dictionary with verses, citations, etc.
            language: Language code (FA, EN, KR)
        
        Returns:
            Dictionary with text, verse_id, citation_ids
        """
        # Format prompt using template from context
        prompt_template = context.get("prompt_template", "{context}\n\n{question}")
        
        # Build prompt
        context_text = ""
        if context.get("verses"):
            for verse in context["verses"]:
                lang_key = f"text_{language.lower()}"
                text = verse.get(lang_key, verse.get("text_fa", ""))
                if text:
                    context_text += f"\n{text}\n"
        
        formatted_prompt = prompt_template.format(
            context=context_text,
            question=user_message
        )
        
        # Call LLM API
        try:
            response_text = await self._call_llm_api(formatted_prompt, language)
        except Exception as e:
            # Fallback response if LLM fails
            response_text = f"I apologize, but I'm having trouble processing your request. ({str(e)})"
        
        # Extract verse_id and citation_ids from context
        verse_id = None
        citation_ids = []
        
        if context.get("verses"):
            verse_id = UUID(context["verses"][0]["id"]) if context["verses"] else None
        
        if context.get("citations"):
            citation_ids = [UUID(c["id"]) for c in context["citations"]]
        
        return {
            "text": response_text,
            "verse_id": verse_id,
            "citation_ids": citation_ids
        }
    
    async def _call_llm_api(self, prompt: str, language: str) -> str:
        """Call LLM API to generate response."""
        if not self.api_key:
            # Mock response for development
            return f"[Mock LLM Response in {language}] Based on the provided context, here is a response to your question."
        
        # Prepare messages for chat completion
        messages = [
            {
                "role": "system",
                "content": f"You are a helpful assistant that responds in {language}. Provide accurate and helpful responses based on the given context."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
        
        # Make API call
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                self.api_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 1000
                }
            )
            response.raise_for_status()
            data = response.json()
            
            # Extract response text
            if "choices" in data and len(data["choices"]) > 0:
                return data["choices"][0]["message"]["content"]
            else:
                raise Exception("Invalid response from LLM API")
