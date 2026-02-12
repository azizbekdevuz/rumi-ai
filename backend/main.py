"""
RUMI AI Agent Backend - Main FastAPI application.
Architecture based on microservices design with API Gateway.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from app.config import settings
from app.database import engine, Base

# Import routers
from app.routers import auth, chat, search, books, feedback, citation, user

# Import middleware
from app.middleware.rate_limit import rate_limit_middleware
from app.middleware.request_validator import request_validator_middleware

# Note: Database tables are managed by Alembic migrations, not here
# Alembic will create/update tables based on migration files

# Create FastAPI app
app = FastAPI(
    title="RUMI AI Agent Backend",
    version=settings.APP_VERSION,
    description="Backend API for RUMI AI Agent - Multilingual chat and verse search",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
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
app.include_router(search.router)
app.include_router(books.router)
app.include_router(feedback.router)
app.include_router(citation.router)
app.include_router(user.router)


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "RUMI AI Agent Backend",
        "version": settings.APP_VERSION
    }


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "service": "RUMI AI Agent Backend",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health",
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
                "code": exc.detail.split(":")[0] if ":" in exc.detail else "HTTP_ERROR",
                "message": exc.detail,
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
