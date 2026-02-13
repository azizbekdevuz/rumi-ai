"""
LLM Generation Service - Handles LLM API integration (GPT-4, Ollama, etc.).
Uses centralised settings from app.config — never reads os.getenv() directly.
"""
from typing import Dict, Any
from uuid import UUID
import logging
import httpx
from app.config import settings

logger = logging.getLogger(__name__)


class LLMGenerationService:
    """Service for generating responses using LLM APIs."""
    
    def __init__(self):
        # Read all config from the single Settings object (loaded from .env)
        self.api_key: str = settings.LLM_API_KEY
        self.api_url: str = settings.LLM_API_URL
        self.model: str = settings.LLM_MODEL
        self.use_mock: bool = settings.USE_MOCK
        self.timeout: float = 30.0
        
        # Detect Ollama (localhost:11434 or ollama.com)
        api_url_lower = self.api_url.lower()
        self.is_ollama = (
            "ollama" in api_url_lower or
            "localhost:11434" in api_url_lower or
            "127.0.0.1:11434" in api_url_lower or
            ":11434" in api_url_lower
        )
        
        # Normalise Ollama URL to point at /api/chat
        if self.is_ollama and not self.api_url.endswith("/api/chat"):
            if self.api_url.endswith("/api"):
                self.api_url = f"{self.api_url}/chat"
            elif not self.api_url.endswith("/chat"):
                self.api_url = f"{self.api_url.rstrip('/')}/api/chat"
        
        logger.info(
            "LLMGenerationService initialised: model=%s, url=%s, is_ollama=%s, use_mock=%s, api_key_present=%s",
            self.model, self.api_url, self.is_ollama, self.use_mock, bool(self.api_key),
        )
    
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
        response_text = await self._call_llm_api(formatted_prompt, language)
        
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
        
        logger.debug(
            "_call_llm_api: use_mock=%s, api_url=%s, model=%s, is_ollama=%s, api_key_present=%s",
            self.use_mock, self.api_url, self.model, self.is_ollama, bool(self.api_key),
        )
        
        # Only return mock if explicitly enabled via USE_MOCK=true in .env
        if self.use_mock:
            logger.warning("Returning MOCK response (USE_MOCK=true in .env)")
            return f"[Mock LLM Response in {language}] Based on the provided context, here is a response to your question."
        
        # For Ollama, API key is optional (local instances don't require auth)
        if not self.is_ollama and not self.api_key:
            raise Exception(
                "LLM_API_KEY not configured and not using Ollama. "
                "Set USE_MOCK=true for development or configure LLM_API_KEY."
            )
        
        # Prepare request based on API type
        if self.is_ollama:
            payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "user",
                        "content": (
                            f"You are a helpful assistant that responds in {language}. "
                            f"Provide accurate and helpful responses based on the given context.\n\n{prompt}"
                        ),
                    }
                ],
                "stream": False,
            }
            headers = {"Content-Type": "application/json"}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"
        else:
            # OpenAI-compatible format
            payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            f"You are a helpful assistant that responds in {language}. "
                            "Provide accurate and helpful responses based on the given context."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.7,
                "max_tokens": 1000,
            }
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }
        
        # Make API call
        try:
            logger.info("Making LLM request to %s (model=%s)", self.api_url, self.model)
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    self.api_url,
                    headers=headers,
                    json=payload,
                )
                logger.info("LLM response status: %s", response.status_code)
                response.raise_for_status()
                data = response.json()
                
                # Extract response text based on API format
                if self.is_ollama:
                    if "message" in data and isinstance(data["message"], dict):
                        if "content" in data["message"]:
                            return data["message"]["content"]
                    if "response" in data:
                        return data["response"]
                    raise Exception(
                        f"Invalid Ollama response format. "
                        f"Expected 'message.content' or 'response'. Got keys: {list(data.keys())}"
                    )
                else:
                    if "choices" in data and len(data["choices"]) > 0:
                        return data["choices"][0]["message"]["content"]
                    else:
                        raise Exception("Invalid response from LLM API")
        except httpx.TimeoutException as e:
            raise Exception(f"LLM API request timeout: {str(e)}")
        except httpx.HTTPStatusError as e:
            raise Exception(f"LLM API HTTP error {e.response.status_code}: {str(e)}")
        except httpx.RequestError as e:
            raise Exception(f"LLM API connection error: {str(e)}")
