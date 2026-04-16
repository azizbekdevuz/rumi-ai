"""
LLM Generation Service — low-level LLM API integration (Ollama / OpenAI-compatible).

Responsibilities:
  • Accept pre-built system + user prompts (from prompt_builder)
  • Send them to the configured LLM endpoint with proper message roles
  • Return the raw response text

Uses centralised settings from app.config — never reads os.getenv() directly.
"""
from __future__ import annotations

from typing import Any, Dict
from uuid import UUID
import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class LLMGenerationService:
    """Low-level service for calling LLM APIs."""

    def __init__(self) -> None:
        self.api_key: str = settings.LLM_API_KEY
        self.api_url: str = settings.LLM_API_URL
        self.model: str = settings.LLM_MODEL
        self.use_mock: bool = settings.USE_MOCK
        self.timeout: float = 120.0

        api_url_lower = self.api_url.lower()
        self.is_ollama = (
            "ollama" in api_url_lower
            or "localhost:11434" in api_url_lower
            or "127.0.0.1:11434" in api_url_lower
            or ":11434" in api_url_lower
        )

        # Normalise Ollama URL to point at /api/chat
        if self.is_ollama and not self.api_url.endswith("/api/chat"):
            if self.api_url.endswith("/api"):
                self.api_url = f"{self.api_url}/chat"
            elif not self.api_url.endswith("/chat"):
                self.api_url = f"{self.api_url.rstrip('/')}/api/chat"

        logger.info(
            "LLMGenerationService initialised: model=%s, url=%s, "
            "is_ollama=%s, use_mock=%s, api_key_present=%s",
            self.model, self.api_url, self.is_ollama,
            self.use_mock, bool(self.api_key),
        )

    # ── Primary API ──────────────────────────────────────────────

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        language: str = "EN",
    ) -> str:
        """
        Send *system_prompt* + *user_prompt* to the LLM and return the raw
        assistant text.

        Raises RuntimeError on network / API errors so callers can map to
        appropriate HTTP status codes.
        """
        if self.use_mock:
            logger.warning("Returning MOCK response (USE_MOCK=true)")
            return (
                f"Interpretation: [Mock interpretation in {language}]\n\n"
                f"Practical Advice: [Mock advice in {language}]"
            )

        if not self.is_ollama and not self.api_key:
            raise RuntimeError(
                "LLM_API_KEY not configured and not using Ollama. "
                "Set USE_MOCK=true for development or configure LLM_API_KEY."
            )

        return await self._call_api(system_prompt, user_prompt)

    # ── Backward-compatible wrapper (used by chat_stream) ────────

    async def generate_response(
        self,
        user_message: str,
        context: Dict[str, Any],
        language: str = "FA",
    ) -> Dict[str, Any]:
        """
        Legacy wrapper for callers that still pass a context dict.
        Builds prompts via prompt_builder, then delegates to generate().
        """
        from app.services.prompt_builder import (
            build_system_prompt,
            build_user_prompt,
            classify_query_response_mode,
            unclear_user_message,
        )

        mode = classify_query_response_mode(user_message)
        if mode == "unclear":
            msg = unclear_user_message(language)
            return {
                "text": msg,
                "verse_id": None,
                "citation_ids": [],
            }

        verses = context.get("verses", []) or []
        citations = context.get("citations", []) or []
        grounded = bool(verses or citations)

        system_prompt = build_system_prompt(
            language,
            grounded=grounded,
            response_mode=mode,
            context_caution=False,
        )
        user_prompt = build_user_prompt(
            user_message=user_message,
            language=language,
            verses=verses,
            citations=citations,
        )

        raw_text = await self.generate(system_prompt, user_prompt, language)

        # Extract IDs from the context that was passed in
        verse_id = None
        citation_ids: list[UUID] = []
        if verses:
            verse_id = UUID(verses[0]["id"])
        if citations:
            citation_ids = [UUID(c["id"]) for c in citations]

        return {
            "text": raw_text,
            "verse_id": verse_id,
            "citation_ids": citation_ids,
        }

    # ── Private ──────────────────────────────────────────────────

    async def _call_api(self, system_prompt: str, user_prompt: str) -> str:
        """Build the provider-specific payload and execute the HTTP call."""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        if self.is_ollama:
            payload: Dict[str, Any] = {
                "model": self.model,
                "messages": messages,
                "stream": False,
            }
            headers = {"Content-Type": "application/json"}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"
        else:
            # OpenAI-compatible format
            payload = {
                "model": self.model,
                "messages": messages,
                "temperature": 0.5, # lower for strict mode (less creative, more accurate) and higher for creative mode (more creative, less accurate)
                "max_tokens": 1000, # max number of tokens in the response
            }
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }

        logger.info("LLM request → %s (model=%s)", self.api_url, self.model)
        logger.debug(
            "Prompt sizes: system=%d chars, user=%d chars",
            len(system_prompt), len(user_prompt),
        )

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(
                    self.api_url, headers=headers, json=payload,
                )
                logger.info("LLM response status: %s", resp.status_code)
                resp.raise_for_status()
                return self._extract_text(resp.json())
        except httpx.TimeoutException as exc:
            raise RuntimeError(f"LLM API timeout: {exc}") from exc
        except httpx.HTTPStatusError as exc:
            raise RuntimeError(
                f"LLM API HTTP {exc.response.status_code}: {exc}"
            ) from exc
        except httpx.RequestError as exc:
            raise RuntimeError(f"LLM API connection error: {exc}") from exc

    def _extract_text(self, data: Dict[str, Any]) -> str:
        """Pull the assistant's text out of the provider-specific JSON."""
        if self.is_ollama:
            msg = data.get("message")
            if isinstance(msg, dict) and "content" in msg:
                return msg["content"]
            if "response" in data:
                return data["response"]
            raise RuntimeError(
                f"Unexpected Ollama response keys: {list(data.keys())}"
            )

        choices = data.get("choices", [])
        if not choices:
            raise RuntimeError("No choices in OpenAI-compatible response")
        first = choices[0]
        if not isinstance(first, dict):
            raise RuntimeError(
                f"Unexpected choices[0] type: {type(first).__name__}"
            )
        msg = first.get("message")
        if not isinstance(msg, dict):
            raise RuntimeError(
                f"Unexpected choices[0].message: {type(msg).__name__ if msg is not None else 'missing'}"
            )
        content = msg.get("content")
        if content is None:
            raise RuntimeError("No content in OpenAI-compatible response message")
        return str(content)
