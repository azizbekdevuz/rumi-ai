#!/usr/bin/env python3
"""Write all modified backend files for the RAG system."""
import pathlib

BASE = pathlib.Path(__file__).parent


def write(rel_path, content):
    p = BASE / rel_path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")
    print(f"  Wrote {rel_path} ({p.stat().st_size} bytes)")


# ── 1. rag_service.py ──────────────────────────────────────────
write("app/services/rag_service.py", '''\
"""
RAG Service - FAISS vector store + Ollama embeddings for verse retrieval.
"""
from __future__ import annotations
import json, os, logging
from pathlib import Path
from typing import List, Dict, Any, Optional
import numpy as np
import httpx

logger = logging.getLogger(__name__)
_rag_instance = None


def get_rag_service():
    global _rag_instance
    if _rag_instance is None:
        _rag_instance = RAGService()
    return _rag_instance


class RAGService:
    OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
    EMBED_MODEL = os.getenv('EMBED_MODEL', 'nomic-embed-text:latest')
    BOOK_VERSE_DIR = os.getenv(
        'BOOK_VERSE_DIR',
        str(Path(__file__).resolve().parents[3] / 'book_verse'),
    )

    def __init__(self):
        import faiss  # noqa: F811
        self.documents = []
        self.index = None
        self.dimension = 0
        self._load_documents()
        self._build_index()

    def _load_documents(self):
        verse_dir = Path(self.BOOK_VERSE_DIR)
        if not verse_dir.exists():
            logger.warning('book_verse dir not found at %s', verse_dir)
            return
        json_files = sorted(verse_dir.glob('page_*.json'))
        logger.info('Found %d book_verse files in %s', len(json_files), verse_dir)
        for jf in json_files:
            try:
                with open(jf, encoding='utf-8') as fh:
                    data = json.load(fh)
                page_num = data.get('page', 0)
                for line in data.get('lines', []):
                    text = line.get('text', '').strip()
                    if len(text) < 5:
                        continue
                    self.documents.append({
                        'text': text, 'page': page_num,
                        'lang': line.get('lang', 'fas'),
                        'bbox': line.get('bbox'),
                        'source_file': jf.name,
                    })
            except Exception as exc:
                logger.error('Failed to read %s: %s', jf, exc)
        logger.info('Loaded %d text chunks from book_verse', len(self.documents))

    def _embed_texts(self, texts):
        url = f'{self.OLLAMA_BASE_URL}/api/embed'
        payload = {'model': self.EMBED_MODEL, 'input': texts}
        with httpx.Client(timeout=120.0) as client:
            resp = client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
        embeddings = data.get('embeddings')
        if not embeddings:
            raise RuntimeError(f'No embeddings in response: {list(data.keys())}')
        return np.array(embeddings, dtype=np.float32)

    async def _embed_texts_async(self, texts):
        url = f'{self.OLLAMA_BASE_URL}/api/embed'
        payload = {'model': self.EMBED_MODEL, 'input': texts}
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
        embeddings = data.get('embeddings')
        if not embeddings:
            raise RuntimeError('No embeddings in response')
        return np.array(embeddings, dtype=np.float32)

    def _build_index(self):
        import faiss  # noqa: F811
        if not self.documents:
            logger.warning('No documents to index')
            return
        logger.info('Building FAISS index for %d documents', len(self.documents))
        batch_size = 32
        all_embeddings = []
        texts = [doc['text'] for doc in self.documents]
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            logger.info(
                'Embedding batch %d/%d',
                i // batch_size + 1,
                (len(texts) + batch_size - 1) // batch_size,
            )
            emb = self._embed_texts(batch)
            all_embeddings.append(emb)
        embeddings = np.vstack(all_embeddings)
        self.dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(self.dimension)
        self.index.add(embeddings)
        logger.info('FAISS index built: %d vectors, dim=%d', self.index.ntotal, self.dimension)

    async def retrieve(self, query, top_k=5):
        if self.index is None or self.index.ntotal == 0:
            return []
        query_emb = await self._embed_texts_async([query])
        distances, indices = self.index.search(query_emb, top_k)
        results = []
        for rank, (dist, idx) in enumerate(zip(distances[0], indices[0])):
            if idx < 0 or idx >= len(self.documents):
                continue
            doc = self.documents[idx]
            results.append({
                'text': doc['text'], 'page': doc['page'],
                'lang': doc.get('lang', 'fas'),
                'score': float(dist),
                'source_file': doc.get('source_file', ''),
                'rank': rank + 1,
            })
        logger.info('RAG retrieve: query=%r -> %d results', query[:60], len(results))
        return results
''')

# ── 2. chat_service.py ──────────────────────────────────────────
write("app/services/chat_service.py", '''\
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
        paragraphs = text.split('\\n\\n')
        if len(paragraphs) >= 2:
            mid = len(paragraphs) // 2
            return '\\n\\n'.join(paragraphs[:mid]).strip(), '\\n\\n'.join(paragraphs[mid:]).strip()
        return text, text
''')

# ── 3. prompt_builder.py ──────────────────────────────────────
write("app/services/prompt_builder.py", '''\
"""
Prompt Builder - constructs system and user prompts for the RumiAI persona.
"""
from __future__ import annotations
from typing import Any, Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

_SYSTEM_PROMPTS = {
    "FA": (
        "\\u062a\\u0648 RumiAI \\u0647\\u0633\\u062a\\u06cc — "
        "\\u06cc\\u06a9 \\u0647\\u0648\\u0634 \\u0645\\u0635\\u0646\\u0648\\u0639\\u06cc "
        "\\u0645\\u062a\\u062e\\u0635\\u0635 \\u062f\\u0631 \\u0627\\u062f\\u0628\\u06cc\\u0627\\u062a "
        "\\u0627\\u0633\\u0644\\u0627\\u0645\\u06cc \\u0648 \\u0627\\u0634\\u0639\\u0627\\u0631 "
        "\\u0645\\u0648\\u0644\\u0627\\u0646\\u0627.\\n\\n"
        "Response format:\\n"
        "Interpretation: [your interpretation]\\n\\n"
        "Practical Advice: [your practical advice]"
    ),
    "EN": (
        "You are RumiAI — an AI specialist in Islamic literature and the poetry "
        "of Mawlana Jalal al-Din Muhammad Balkhi (Rumi).\\n\\n"
        "Your responsibilities:\\n"
        "- Provide verses from Muslim books in Arabic and Persian\\n"
        "- Interpret and explain the deep meaning of poetry and verses\\n"
        "- Offer practical advice based on Islamic wisdom\\n\\n"
        "Rules:\\n"
        "1. Always identify yourself as RumiAI\\n"
        "2. Ground your responses in the retrieved context (verses provided below)\\n"
        "3. If no relevant text is found, say so honestly\\n"
        "4. Quote Arabic/Persian verses accurately\\n"
        "5. Structure your response in two parts\\n\\n"
        "Response format:\\n"
        "Interpretation: [Your interpretation]\\n\\n"
        "Practical Advice: [Your practical advice]"
    ),
    "KR": (
        "You are RumiAI — an AI specialist in Islamic literature.\\n\\n"
        "Response format:\\n"
        "Interpretation: [Your interpretation]\\n\\n"
        "Practical Advice: [Your practical advice]"
    ),
}


def build_system_prompt(language: str = "FA") -> str:
    return _SYSTEM_PROMPTS.get(language, _SYSTEM_PROMPTS["EN"])


def build_user_prompt(
    user_message: str,
    language: str = "FA",
    verses: Optional[List[Dict[str, Any]]] = None,
    citations: Optional[List[Dict[str, Any]]] = None,
    history: Optional[List[Dict[str, str]]] = None,
) -> str:
    parts = []

    if history:
        parts.append("=== Conversation History ===")
        for turn in history[-6:]:
            role = turn.get("role", "user").capitalize()
            content = turn.get("content", "")
            parts.append(f"{role}: {content}")
        parts.append("")

    if verses:
        parts.append("=== Retrieved Verses from Islamic Books ===")
        for i, v in enumerate(verses, 1):
            text = v.get("text", "")
            page = v.get("page", "?")
            score = v.get("score", 0.0)
            parts.append(f"[Verse {i}] (Page {page}, relevance: {score:.4f})")
            parts.append(f"  {text}")
        parts.append("")

    lang_labels = {"FA": "Farsi", "EN": "English", "KR": "Korean"}
    lang_label = lang_labels.get(language, language)
    parts.append(f"=== User Question (respond in {lang_label}) ===")
    parts.append(user_message)

    return "\\n".join(parts)
''')

# ── 4. guest_user_service.py ──────────────────────────────────
write("app/services/guest_user_service.py", '''\
"""
Guest User Service - Manages the dedicated guest user for anonymous chat sessions.
"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models import User
import bcrypt
import uuid
import logging

logger = logging.getLogger(__name__)
GUEST_USER_EMAIL = "guest@rumi.ai"


def get_or_create_guest_user(db: Session) -> User:
    guest_user = db.query(User).filter(
        User.email == GUEST_USER_EMAIL,
        User.is_guest == True,
        User.is_deleted == False,
    ).first()
    if guest_user:
        logger.debug("Found existing guest user: %s", guest_user.id)
        return guest_user

    logger.info("Creating new guest user (%s)", GUEST_USER_EMAIL)
    dummy_password = str(uuid.uuid4())
    password_hash = bcrypt.hashpw(
        dummy_password.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")

    guest_user = User(
        id=str(uuid.uuid4()),
        email=GUEST_USER_EMAIL,
        password_hash=password_hash,
        is_guest=True,
    )
    db.add(guest_user)
    try:
        db.commit()
        db.refresh(guest_user)
        logger.info("Created new guest user: %s", guest_user.id)
        return guest_user
    except IntegrityError:
        db.rollback()
        guest_user = db.query(User).filter(
            User.email == GUEST_USER_EMAIL,
            User.is_guest == True,
            User.is_deleted == False,
        ).first()
        if not guest_user:
            raise RuntimeError("Failed to create or retrieve guest user")
        return guest_user
    except Exception as e:
        db.rollback()
        logger.error("Error creating guest user: %s", e)
        raise RuntimeError(f"Failed to create guest user: {e}")
''')

# ── 5. _session.py ────────────────────────────────────────────
write("app/routers/_session.py", '''\
"""
Shared session-resolution helpers used by chat endpoints.
"""
from __future__ import annotations
import logging, uuid as uuid_mod
from typing import Optional, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from app.models import User, ChatSession
from app.services.guest_user_service import get_or_create_guest_user

logger = logging.getLogger(__name__)


def resolve_user_id(current_user: Optional[User], db: Session) -> UUID:
    if current_user is not None and current_user.id is not None:
        return UUID(str(current_user.id))
    guest = get_or_create_guest_user(db)
    uid = guest.id
    if uid is None:
        raise RuntimeError("Guest user has no id")
    return UUID(str(uid))


def resolve_or_create_session(
    db: Session,
    user_id: UUID,
    session_id: Optional[UUID],
) -> Tuple[ChatSession, bool]:
    if session_id:
        existing = (
            db.query(ChatSession)
            .filter(
                ChatSession.id == str(session_id),
                ChatSession.user_id == str(user_id),
            )
            .first()
        )
        if existing:
            return existing, False
        logger.warning("session_id=%s not found — creating new", session_id)

    new_id = str(uuid_mod.uuid4())
    session = ChatSession(
        id=new_id,
        user_id=str(user_id),
        source_mode="chat",
    )
    db.add(session)
    db.flush()
    return session, True
''')

# ── 6. chat.py router ─────────────────────────────────────────
write("app/routers/chat.py", '''\
"""
Chat Router - POST /api/chat
Delegates to ChatService for the full RAG pipeline (FAISS + Ollama).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
import logging, uuid

from app.database import get_db
from app.models import User, Message
from app.schemas import (
    ChatRequest, ChatResponse, CitationSummary,
    RetrievedCandidate, VerseMultilingual,
)
from app.middleware.auth import get_optional_user
from app.services.chat_service import ChatService
from app.routers._session import resolve_user_id, resolve_or_create_session

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["chat"])
_LANG_MAP = {"fa": "FA", "en": "EN", "kr": "KR"}


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    logger.info("Chat request: question=%s, language=%s",
                request.question[:50], request.language)
    try:
        language = _LANG_MAP.get(request.language.lower(), "FA")
        source_scope = request.source_scope or "books"
        user_id = resolve_user_id(current_user, db)
        session, _ = resolve_or_create_session(db, user_id, request.session_id)

        history_dicts = None
        if request.history:
            history_dicts = [
                {"role": h.role, "content": h.content}
                for h in request.history[-6:]
            ]

        result = await ChatService(db).process_chat(
            session_id=session.id,
            user_message=request.question,
            language=language,
            source_scope=source_scope,
            history=history_dicts,
        )

        db.add(Message(
            id=str(uuid.uuid4()),
            session_id=str(session.id),
            role="user",
            message_text=request.question,
            language=language,
        ))
        db.add(Message(
            id=str(uuid.uuid4()),
            session_id=str(session.id),
            role="assistant",
            message_text=result["response_text"],
            language=language,
        ))
        db.commit()

        candidates = result.get("retrieved_candidates", [])
        return ChatResponse(
            session_id=session.id,
            verse=VerseMultilingual(**result["verse_data"]),
            interpretation=result["interpretation"],
            advice=result["advice"],
            citations=[CitationSummary(**c) for c in result.get("citations_summary", [])],
            retrieved_candidates=[RetrievedCandidate(**c) for c in candidates] if candidates else None,
            grounded=result.get("grounded", True),
        )
    except HTTPException:
        db.rollback()
        raise
    except RuntimeError as exc:
        db.rollback()
        logger.error("Chat processing error: %s", exc, exc_info=True)
        raise HTTPException(status_code=502, detail=f"LLM error: {exc}")
    except Exception as exc:
        db.rollback()
        logger.error("Unexpected chat error: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error: {exc}")
''')

# ── 7. chat_stream.py router ──────────────────────────────────
write("app/routers/chat_stream.py", '''\
"""
Chat Streaming Endpoint - POST /api/chat/stream
"""
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
import json, asyncio, logging, uuid as uuid_mod
from app.database import get_db
from app.models import User, Message
from app.schemas import ChatRequest
from app.middleware.auth import get_optional_user
from app.services.chat_service import ChatService
from app.routers._session import resolve_user_id, resolve_or_create_session

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["chat"])
_LANG_MAP = {"fa": "FA", "en": "EN", "kr": "KR"}
_LLM_TIMEOUT_SECONDS = 120


def _sse_event(payload: dict) -> str:
    return f"data: {json.dumps(payload, default=str)}\\n\\n"


async def stream_chat_response(
    user_message, language, source_scope, chat_service, session_id, db, history=None,
):
    try:
        result = await asyncio.wait_for(
            chat_service.process_chat(
                session_id=session_id, user_message=user_message,
                language=language, source_scope=source_scope, history=history,
            ),
            timeout=_LLM_TIMEOUT_SECONDS,
        )
        response_text = result.get("response_text", "")
        chunk_size = 20
        for i in range(0, len(response_text), chunk_size):
            chunk = response_text[i:i + chunk_size]
            yield _sse_event({"type": "chunk", "text": chunk})
            await asyncio.sleep(0.05)
        try:
            db.add(Message(id=str(uuid_mod.uuid4()), session_id=str(session_id),
                           role="user", message_text=user_message, language=language))
            db.add(Message(id=str(uuid_mod.uuid4()), session_id=str(session_id),
                           role="assistant", message_text=response_text, language=language))
            db.commit()
        except Exception as e:
            logger.error("Failed to persist stream messages: %s", e)
            db.rollback()
        yield _sse_event({
            "type": "done", "session_id": str(session_id),
            "verse": result.get("verse_data", {}),
            "interpretation": result.get("interpretation", ""),
            "advice": result.get("advice", ""),
            "citations": result.get("citations_summary", []),
            "retrieved_candidates": result.get("retrieved_candidates", []),
            "grounded": result.get("grounded", True),
        })
    except asyncio.TimeoutError:
        yield _sse_event({"type": "error", "message": "Response timed out."})
    except Exception as exc:
        logger.error("Stream error: %s", exc, exc_info=True)
        yield _sse_event({"type": "error", "message": str(exc)})


@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    try:
        language = _LANG_MAP.get(request.language.lower(), "FA")
        source_scope = request.source_scope or "books"
        user_id = resolve_user_id(current_user, db)
        session, is_new = resolve_or_create_session(db, user_id, request.session_id)
        if is_new:
            db.commit()
        canonical_id = str(session.id)
        history_dicts = None
        if request.history:
            history_dicts = [{"role": h.role, "content": h.content} for h in request.history[-6:]]
        chat_service = ChatService(db)
        return StreamingResponse(
            stream_chat_response(request.question, language, source_scope,
                                 chat_service, canonical_id, db, history_dicts),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
        )
    except Exception as exc:
        logger.error("Stream endpoint error: %s", exc, exc_info=True)
        async def error_stream():
            yield _sse_event({"type": "error", "message": str(exc)})
        return StreamingResponse(error_stream(), media_type="text/event-stream", status_code=500)
''')

# ── 8. main.py ─────────────────────────────────────────────────
write("main.py", '''\
"""
RUMI AI Agent Backend - Main FastAPI application.
RAG pipeline using FAISS + Ollama (nomic-embed-text + qwen2.5:3b).
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from dotenv import load_dotenv
import os, logging

load_dotenv(override=True)

from app.config import settings
from app.database import engine, Base
from app.routers import auth, chat, search, books, feedback, citation, user
from app.routers import chat_stream
from app.middleware.rate_limit import rate_limit_middleware
from app.middleware.request_validator import request_validator_middleware

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)
logger.info("Starting %s v%s", settings.APP_NAME, settings.APP_VERSION)
logger.info("DEBUG=%s, USE_MOCK=%s, LLM_MODEL=%s", settings.DEBUG, settings.USE_MOCK, settings.LLM_MODEL)
logger.info("LLM_API_URL=%s", settings.LLM_API_URL)

logger.info("Creating database tables...")
Base.metadata.create_all(bind=engine)
logger.info("Database tables created")

app = FastAPI(
    title="RUMI AI Agent Backend",
    version=settings.APP_VERSION,
    description="Backend API for RUMI AI Agent - RAG with FAISS + Ollama",
    docs_url="/docs", redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

app.middleware("http")(request_validator_middleware)
app.middleware("http")(rate_limit_middleware)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(chat_stream.router)
app.include_router(search.router)
app.include_router(books.router)
app.include_router(feedback.router)
app.include_router(citation.router)
app.include_router(user.router)


@app.on_event("startup")
async def startup_event():
    logger.info("Initializing RAG service with FAISS...")
    try:
        from app.services.rag_service import get_rag_service
        rag = get_rag_service()
        logger.info("RAG service initialized: %d documents indexed", len(rag.documents))
    except Exception as exc:
        logger.error("Failed to initialize RAG service: %s", exc, exc_info=True)
        logger.warning("Chat will not have RAG capabilities")


@app.get("/health")
def health_check():
    from app.services.rag_service import _rag_instance
    return {
        "status": "healthy",
        "service": "RUMI AI Agent Backend",
        "version": settings.APP_VERSION,
        "rag_ready": _rag_instance is not None and _rag_instance.index is not None,
        "rag_documents": _rag_instance.index.ntotal if _rag_instance and _rag_instance.index else 0,
    }


@app.get("/")
def root():
    return {
        "service": "RUMI AI Agent Backend",
        "version": settings.APP_VERSION,
        "docs": "/docs", "health": "/health",
        "rag": "FAISS + Ollama (nomic-embed-text + qwen2.5:3b)",
    }


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {
            "code": exc.detail.split(":")[0] if isinstance(exc.detail, str) and ":" in exc.detail else "HTTP_ERROR",
            "message": exc.detail if isinstance(exc.detail, str) else str(exc.detail),
            "details": {},
        }},
    )


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
''')

print("\\nAll files written successfully!")
