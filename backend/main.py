"""
RUMI AI Agent Backend - Main FastAPI application.
RAG pipeline using FAISS + Ollama (nomic-embed-text + qwen2.5:3b).
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from dotenv import load_dotenv
import logging

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


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start FAISS index build in a background thread so the server
    can accept requests immediately (health, docs, etc.)."""
    logger.info("Initializing RAG service with FAISS (background)...")
    try:
        from app.services.rag_service import get_rag_service
        rag = get_rag_service()
        rag.build_index_background()
        logger.info("RAG background indexing started for %d documents", len(rag.documents))
    except Exception as exc:
        logger.error("Failed to initialize RAG service: %s", exc, exc_info=True)
        logger.warning("Chat will not have RAG capabilities")
    yield


app = FastAPI(
    title="RUMI AI Agent Backend",
    version=settings.APP_VERSION,
    description="Backend API for RUMI AI Agent - RAG with FAISS + Ollama",
    docs_url="/docs", redoc_url="/redoc",
    lifespan=lifespan,
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


@app.get("/health")
def health_check():
    from app.services.rag_service import _rag_instance
    ready = _rag_instance is not None and _rag_instance.is_ready
    return {
        "status": "healthy",
        "service": "RUMI AI Agent Backend",
        "version": settings.APP_VERSION,
        "rag_ready": ready,
        "rag_documents": (
            _rag_instance.index.ntotal
            if ready and _rag_instance.index
            else 0
        ),
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
