# RUMI AI Agent Backend Architecture

This document describes the backend architecture based on the microservices design diagram.

## Architecture Overview

The backend follows a microservices architecture with an API Gateway pattern, supporting multilingual chat, verse search, and book management.

## Components

### 1. API Gateway Layer

**Location:** `app/middleware/`

The API Gateway provides:

- **Authentication/JWT** (`auth.py`): JWT token-based authentication
  - User registration and login
  - Token generation and validation
  - Protected route access

- **Rate Limiting** (`rate_limit.py`): Request rate limiting
  - 100 requests/minute (default)
  - 30 requests/minute (chat endpoints)
  - 60 requests/minute (search endpoints)
  - Sliding window algorithm

- **Request Validator** (`request_validator.py`): Request validation
  - Content-type validation
  - Request size limits (10MB max)
  - Error handling

### 2. Chat Service

**Location:** `app/routers/chat.py`

**Endpoints:**
- `POST /api/chat` - Send chat message (supports FA/EN/KR)
- `POST /api/chat/sessions` - Create chat session
- `GET /api/chat/sessions` - List chat sessions
- `GET /api/chat/sessions/{session_id}/messages` - Get messages

**Features:**
- Multilingual support (Farsi, English, Korean)
- Session management
- Message history
- Integration with LLM generation

### 3. Search Service

**Location:** `app/routers/search.py`

**Endpoints:**
- `GET /api/search/verses` - Search verses
- `GET /api/search/verses/{verse_id}` - Get specific verse
- `GET /api/search/verses/{verse_id}/citations` - Get verse citations

**Features:**
- Multilingual verse search
- Book filtering
- Citation retrieval

### 4. Books API

**Location:** `app/routers/books.py`

**Endpoints:**
- `GET /api/books` - List books
- `GET /api/books/{book_id}` - Get book details
- `GET /api/books/{book_id}/verses` - Get book verses
- `GET /api/books/{book_id}/pages/{page_number}` - Get book page

**Features:**
- Book metadata management
- Verse retrieval by book
- Page-level access with citations

### 5. Authentication Service

**Location:** `app/routers/auth.py`

**Endpoints:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login (returns JWT token)

**Features:**
- Password hashing (bcrypt)
- JWT token generation
- User session management

### 6. Feedback Service

**Location:** `app/routers/feedback.py`

**Endpoints:**
- `POST /api/feedback` - Submit feedback on message
- `GET /api/feedback` - List user feedback

**Features:**
- Message feedback collection
- Issue tracking
- User feedback history

## Core Services

### Multilingual Generation Service

**Location:** `app/services/multilingual_generation.py`

**Responsibilities:**
- Multilingual prompt template management
- Context preparation for LLM
- Verse reranking (multilingual)
- Internal vs hybrid source handling

**Prompt Templates:**
- FA (Farsi): Persian prompt template
- EN (English): English prompt template
- KR (Korean): Korean prompt template

### LLM Generation Service

**Location:** `app/services/llm_generation.py`

**Responsibilities:**
- LLM API integration (GPT-4, etc.)
- Response generation
- Context formatting
- Error handling and fallbacks

**Configuration:**
- Configurable via environment variables
- Supports multiple LLM providers
- Mock mode for development

### Chat Service

**Location:** `app/services/chat_service.py`

**Responsibilities:**
- Chat message processing
- Orchestration between services
- Response generation workflow

### Search Service

**Location:** `app/services/search_service.py`

**Responsibilities:**
- Verse search implementation
- Multilingual search support
- Result ranking and filtering

### Citation Service

**Location:** `app/services/citation_service.py`

**Responsibilities:**
- Citation data management
- Book-page-verse relationships
- Highlight box handling

## Database Schema

The database follows the ERD with 7 main entities:

1. **Users** - User accounts and authentication
2. **Chat_Sessions** - Chat session management
3. **Messages** - Individual chat messages
4. **Feedback_Reports** - User feedback on messages
5. **Books** - Book metadata
6. **Verses** - Verse content (multilingual)
7. **Citations** - Citation data with page references

## Configuration

**Location:** `app/config.py`

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT secret key
- `REDIS_URL` - Redis connection (for caching)
- `LLM_API_KEY` - LLM API key
- `LLM_API_URL` - LLM API endpoint
- `LLM_MODEL` - LLM model name
- `ELASTICSEARCH_URL` - ElasticSearch connection
- `VECTOR_DB_URL` - Vector database connection

## API Endpoints Summary

### Public Endpoints
- `GET /health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Protected Endpoints (Require JWT)
- `POST /api/chat` - Send chat message
- `GET /api/chat/sessions` - List sessions
- `POST /api/feedback` - Submit feedback
- `GET /api/feedback` - List feedback

### Optional Authentication
- `GET /api/search/*` - Search endpoints
- `GET /api/books/*` - Book endpoints

## Middleware Stack

1. **CORS Middleware** - Cross-origin resource sharing
2. **Request Validator** - Request validation
3. **Rate Limiter** - Rate limiting
4. **Authentication** - JWT verification (on protected routes)

## Future Enhancements

Based on the architecture diagram, future enhancements include:

1. **Redis Integration** - For distributed caching and rate limiting
2. **Vector Database** - For semantic search and embeddings
3. **ElasticSearch** - For full-text search (BM25)
4. **Graph Database** - For complex relationships
5. **Microservices Deployment** - Docker and Kubernetes orchestration

## Development

### Running the Application

```bash
# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start server
uvicorn main:app --reload
```

### Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=app
```

## API Documentation

Interactive API documentation available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
