"""
Chat Service - orchestrates the RAG pipeline using FAISS + Ollama.
"""
from __future__ import annotations
import logging, uuid
from typing import Any, Dict, List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.services.rag_service import get_rag_service
from app.services.llm_generation import LLMGenerationService
from app.services.prompt_builder import build_system_prompt, build_user_prompt

logger = logging.getLogger(__name__)


class ChatService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.llm = LLMGenerationService()

    async def process_chat(
        self,
        session_id,
        user_message: str,
        language: str = "FA",
        source_scope: str = "books",
        history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        logger.info('Processing chat: session=%s, msg=%r, lang=%s',
                     session_id, user_message[:60], language)

        # Step 1: RAG Retrieval from FAISS
        rag = get_rag_service()
        retrieved_docs = await rag.retrieve(user_message, top_k=5)
        logger.info('RAG retrieved %d documents', len(retrieved_docs))

        # Step 2: Build verse context
        verses_context = []
        for doc in retrieved_docs:
            verses_context.append({
                'id': str(uuid.uuid4()),
                'text': doc['text'],
                'page': doc['page'],
                'lang': doc.get('lang', 'fas'),
                'score': doc.get('score', 0.0),
                'source_file': doc.get('source_file', ''),
            })

        verse_data = {'fa': '', 'en': None, 'kr': None}
        if verses_context:
            verse_data['fa'] = verses_context[0]['text']

        # Step 3: Build prompts
        system_prompt = build_system_prompt(language)
        user_prompt = build_user_prompt(
            user_message=user_message,
            language=language,
            verses=verses_context,
            citations=[],
            history=history,
        )

        # Step 4: Generate via Ollama
        raw_text = await self.llm.generate(system_prompt, user_prompt, language)

        # Step 5: Parse response
        interpretation, advice = self._parse_response(raw_text)

        # Build candidates for frontend
        retrieved_candidates = []
        for v in verses_context:
            retrieved_candidates.append({
                'id': v['id'],
                'book': f'Nardaban Asman (Page {v["page"]})',
                'page_number': v['page'],
                'snippet': v['text'][:120],
                'score': v.get('score', 0.0),
            })

        return {
            'response_text': raw_text,
            'verse_id': None,
            'citation_ids': [],
            'verse_data': verse_data,
            'interpretation': interpretation,
            'advice': advice,
            'citations_summary': [],
            'retrieved_candidates': retrieved_candidates,
            'grounded': len(retrieved_docs) > 0,
        }

    def _parse_response(self, raw_text: str):
        text = raw_text.strip()
        for sep in ['Practical Advice:', 'Advice:', 'النصيحة:', 'نصیحت:']:
            if sep in text:
                parts = text.split(sep, 1)
                interp = parts[0].replace('Interpretation:', '').strip()
                adv = parts[1].strip()
                return interp, adv
        paragraphs = text.split('\n\n')
        if len(paragraphs) >= 2:
            mid = len(paragraphs) // 2
            return '\n\n'.join(paragraphs[:mid]).strip(), '\n\n'.join(paragraphs[mid:]).strip()
        return text, text
