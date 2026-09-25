"""
RUMI AI Agent Backend - Main FastAPI application.
Architecture based on microservices design with API Gateway.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
import uvicorn
from dotenv import load_dotenv
import os
import logging

# ------------------------------------------------------------------
# 1. Load .env before application imports.
#    Development lets .env override stale shell variables.
#    Production lets the orchestrator environment win.
# ------------------------------------------------------------------
# Development: a project .env wins over stale shell variables.
# Production: the orchestrator environment wins over any stray .env in the image.
_app_env = os.environ.get("APP_ENV", "development").strip().lower()
load_dotenv(override=_app_env not in {"production", "prod"})

# ------------------------------------------------------------------
# 2. Now import the rest of the application (settings, DB, routers)
# ------------------------------------------------------------------
from app.config import settings
from app.database import engine, Base

# Import routers
from app.routers import auth, chat, search, books, feedback, citation, user
from app.routers import chat_stream

# Import middleware
from app.middleware.rate_limit import rate_limit_middleware
from app.middleware.request_validator import request_validator_middleware

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Log key config at startup (never log secrets)
logger.info("Starting %s v%s", settings.APP_NAME, settings.APP_VERSION)
logger.info(
    "APP_ENV=%s DEBUG=%s USE_MOCK=%s LLM_MODEL=%s",
    settings.APP_ENV,
    settings.DEBUG,
    settings.USE_MOCK,
    settings.LLM_MODEL,
)
logger.info("LLM_API_URL=%s, API_KEY present=%s", settings.LLM_API_URL, bool(settings.LLM_API_KEY))
logger.info(
    "OLLAMA_BASE_URL=%s EMBED_MODEL=%s BOOK_VERSE_DIR=%s",
    settings.OLLAMA_BASE_URL,
    settings.EMBED_MODEL,
    settings.BOOK_VERSE_DIR or "(default)",
)
if settings.is_production and (
    "localhost" in settings.OLLAMA_BASE_URL or "127.0.0.1" in settings.OLLAMA_BASE_URL
):
    logger.warning(
        "OLLAMA_BASE_URL points at loopback. Inside a container that address is not the host Ollama service. "
        "Use http://host.docker.internal:11434 and set OLLAMA_HOST=0.0.0.0:11434 on the host."
    )

# Note: Database tables are managed by Alembic migrations, not here


# ── Application lifespan (RAG index background build) ────────────
@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Start RAG FAISS index build in a background thread on startup."""
    try:
        from app.services.rag_service import get_rag_service
        rag = get_rag_service()
        rag.build_index_background()
        logger.info(
            "RAG background indexing started (%d documents loaded)",
            len(rag.documents),
        )
    except Exception as exc:
        logger.error("Failed to initialise RAG service: %s", exc, exc_info=True)
        logger.warning("Chat will fall back to DB-only retrieval (no RAG)")
    yield


# Create FastAPI app. Interactive docs stay on for local development only.
_expose_docs = not settings.is_production
app = FastAPI(
    title="RUMI AI Agent Backend",
    version=settings.APP_VERSION,
    description="Backend API for RUMI AI Agent - Multilingual chat and verse search",
    docs_url="/docs" if _expose_docs else None,
    redoc_url="/redoc" if _expose_docs else None,
    openapi_url="/openapi.json" if _expose_docs else None,
    lifespan=lifespan,
)

# CORS middleware — use proper origin URLs
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Gateway middleware (order matters!)
app.middleware("http")(request_validator_middleware)
app.middleware("http")(rate_limit_middleware)

# Include routers
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(chat_stream.router)
app.include_router(search.router)
app.include_router(books.router)
app.include_router(feedback.router)
app.include_router(citation.router)
app.include_router(user.router)


def _rag_status():
    """RAG status for health payloads. Never raises."""
    try:
        from app.services.rag_service import get_rag_status
        return get_rag_status()
    except Exception:
        return {"ready": False, "documents": 0, "faiss_available": False, "index_error": None}


@app.get("/health")
def health_check():
    """Liveness: the process is up. Does not check dependencies."""
    return {
        "status": "healthy",
        "service": "RUMI AI Agent Backend",
        "version": settings.APP_VERSION,
        "rag": _rag_status(),
    }


@app.get("/health/ready")
def readiness_check():
    """Readiness: Postgres accepts queries. RAG may still be indexing."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception as exc:
        logger.error("Readiness database check failed: %s", type(exc).__name__)
        return JSONResponse(
            status_code=503,
            content={
                "status": "not_ready",
                "database": "unavailable",
                "rag": _rag_status(),
            },
        )
    return {
        "status": "ready",
        "database": "ok",
        "rag": _rag_status(),
    }


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "service": "RUMI AI Agent Backend",
        "version": settings.APP_VERSION,
        "docs": "/docs" if _expose_docs else None,
        "health": "/health",
        "ready": "/health/ready",
        "endpoints": {
            "auth": "/api/auth",
            "chat": "/api/chat",
            "search": "/api/search",
            "books": "/api/books",
            "feedback": "/api/feedback"
        }
    }


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.detail.split(":")[0] if isinstance(exc.detail, str) and ":" in exc.detail else "HTTP_ERROR",
                "message": exc.detail if isinstance(exc.detail, str) else str(exc.detail),
                "details": {}
            }
        }
    )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
