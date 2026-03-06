# Rumi AI Agent — Backend

FastAPI backend for the Rumi AI Agent: a multilingual RAG-powered chat system that provides spiritual guidance grounded in Rumi's poetry.

## Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | FastAPI | ≥0.100 |
| ORM | SQLAlchemy | ≥1.4, <2.0 |
| Database | PostgreSQL | 13 (Docker) |
| Migrations | Alembic | ≥1.7 |
| Auth | python-jose (JWT) + bcrypt | 3.3.0 / ≥4.0 |
| Validation | Pydantic v2 + pydantic-settings | ≥2.0 |
| HTTP Client | httpx (async) | ≥0.23 |
| ASGI Server | Uvicorn | ≥0.20 |
| LLM | OpenAI-compatible / Ollama | configurable |

## Project Structure

```
backend/
├── main.py                        # FastAPI app (CORS, middleware, routers)
├── app/
│   ├── config.py                  # Centralised settings (pydantic-settings)
│   ├── database.py                # Engine + SessionLocal + Base
│   ├── models.py                  # SQLAlchemy ORM models
│   ├── schemas.py                 # Pydantic request/response schemas
│   ├── routers/                   # API route handlers (thin controllers)
│   │   ├── _session.py            #   Shared: resolve_user_id, resolve_or_create_session
│   │   ├── auth.py                #   POST /api/auth/login, /api/auth/signup, /api/auth/kakao
│   │   ├── chat.py                #   POST /api/chat (non-streaming)
│   │   ├── chat_stream.py         #   POST /api/chat/stream (SSE)
│   │   ├── search.py              #   GET  /api/search
│   │   ├── books.py               #   GET  /api/books/:id/pages/:n
│   │   ├── citation.py            #   GET  /api/citation/:id
│   │   ├── feedback.py            #   POST /api/feedback
│   │   └── user.py                #   GET  /api/user/me, PATCH /api/user/settings
│   ├── services/                  # Business logic (no HTTP concerns)
│   │   ├── chat_service.py        #   RAG pipeline orchestrator
│   │   ├── prompt_builder.py      #   System & user prompt construction
│   │   ├── llm_generation.py      #   LLM API integration (Ollama / OpenAI)
│   │   ├── multilingual_generation.py  # Context/verse retrieval prep
│   │   ├── search_service.py      #   Verse keyword search
│   │   ├── citation_service.py    #   Citation lookup
│   │   └── guest_user_service.py  #   Anonymous user creation/lookup
│   └── middleware/                 # API gateway layer
│       ├── auth.py                #   JWT token verification
│       ├── rate_limit.py          #   Rate limiting
│       └── request_validator.py   #   Request validation
├── alembic/                       # Database migration scripts
│   ├── env.py
│   └── versions/
├── alembic.ini
├── docker-compose.yml             # PostgreSQL + API + Nginx + Adminer
├── Dockerfile
├── requirements.txt
├── nginx.conf
├── init-scripts/01-init.sql       # DB initialisation script
├── API_ENDPOINTS.md               # Detailed endpoint documentation
├── ARCHITECTURE.md                # Architecture documentation
├── DEPLOYMENT_CHECKLIST.md        # Production deployment guide
└── database_schema.sql            # Full schema DDL
```

## Quick Start

### Prerequisites

- Python 3.9+
- Docker and Docker Compose (for PostgreSQL)

### 1. Start PostgreSQL

```bash
docker-compose up db -d
```

This starts PostgreSQL on port 5432 with:
- Database: `rumi_ai`
- User: `rumi_user`
- Password: `rumi_password`

Database admin UI (Adminer) is available at http://localhost:8080.

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://rumi_user:rumi_password@localhost:5432/rumi_ai` |
| `SECRET_KEY` | JWT signing key | (change in production) |
| `LLM_API_KEY` | LLM API key | — |
| `LLM_API_URL` | LLM endpoint | `https://api.openai.com/v1/chat/completions` |
| `LLM_MODEL` | Model name | `gpt-4` |
| `USE_MOCK` | Mock LLM responses | `false` |
| `DEBUG` | Debug logging | `false` |
| `ALLOWED_HOSTS` | CORS origins (comma-separated) | `localhost,127.0.0.1` |
| `KAKAO_REST_API_KEY` | Kakao OAuth REST API key | — |
| `KAKAO_CLIENT_SECRET` | Kakao OAuth client secret (optional) | — |
| `KAKAO_REDIRECT_URI` | Kakao OAuth redirect URI | `http://localhost:3000/api/auth/kakao/callback` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | — |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | — |
| `GOOGLE_REDIRECT_URI` | Google OAuth redirect URI | `http://localhost:3000/api/auth/google/callback` |
| `REDIS_URL` | Redis URL (optional) | `redis://localhost:6379/0` |
| `JWT_ALGORITHM` | JWT algorithm | `HS256` |
| `JWT_EXPIRATION_HOURS` | Token TTL | `24` |

### 4. Run Migrations

```bash
alembic upgrade head
```

### 5. Start the Server

```bash
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

## Database Schema

PostgreSQL with 7 tables:

```
Users
├── id (UUID, PK)
├── email (unique)
├── password_hash (nullable for OAuth users)
├── provider (email/kakao/guest, default: email)
├── provider_user_id (nullable, OAuth provider's user ID)
├── avatar_url (nullable, profile image URL from OAuth)
├── preferred_lang (fa/en/kr)
├── theme (light/dark)
├── is_guest
├── is_deleted
├── created_at
└── last_login

Chat_Sessions
├── id (UUID, PK)
├── user_id (FK → Users)
├── source_mode
└── created_at

Messages
├── id (UUID, PK)
├── session_id (FK → Chat_Sessions)
├── role (user/assistant)
├── message_text
├── language
├── verse_id (FK → Verses, nullable)
├── citation_ids (UUID[], nullable)
└── feedback

Books
├── id (UUID, PK)
├── title, title_en
├── pdf_url
└── type (poetry/prose)

Verses
├── id (UUID, PK)
├── book_id (FK → Books)
├── line_number
├── text_fa, text_en, text_kr
└── (embedding — planned, pgvector)

Citations
├── id (UUID, PK)
├── verse_id (FK → Verses)
├── book_id (FK → Books)
├── page_number
├── line_range
└── highlight_box (JSON)

Feedback_Reports
├── id (UUID, PK)
├── message_id (FK → Messages, optional)
├── user_id (FK → Users)
├── session_id (optional)
├── issue_type
├── comment
└── created_at
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/signup` | — | Register new user |
| `POST` | `/api/auth/login` | — | Login, receive JWT |
| `POST` | `/api/auth/kakao` | — | Kakao OAuth login (exchanges code for JWT) |
| `POST` | `/api/chat` | Optional | Submit question, receive structured JSON |
| `POST` | `/api/chat/stream` | Optional | SSE streaming chat |
| `GET` | `/api/search?query=…&lang=fa` | — | Search verses |
| `GET` | `/api/citation/:id` | — | Citation detail (book, page, bbox) |
| `GET` | `/api/books/:id/pages/:n` | — | Book page with verses |
| `GET` | `/api/user/me` | Required | Current user profile |
| `PATCH` | `/api/user/settings` | Required | Update language/theme |
| `POST` | `/api/feedback` | Optional | Submit feedback/report |
| `GET` | `/health` | — | Health check |
| `GET` | `/` | — | Service info |

### Chat Request / Response

**POST `/api/chat`**

Request:
```json
{
  "question": "How do I deal with loss?",
  "language": "en",
  "source_scope": "books",
  "session_id": "uuid-or-null",
  "history": [
    {"role": "user", "content": "previous question"},
    {"role": "assistant", "content": "previous answer"}
  ]
}
```

Response:
```json
{
  "session_id": "uuid",
  "verse": { "fa": "...", "en": "...", "kr": "..." },
  "interpretation": "...",
  "advice": "...",
  "citations": [
    { "id": "uuid", "book": "Masnavi", "page_number": 42, "snippet": "..." }
  ],
  "retrieved_candidates": [...],
  "grounded": true
}
```

**POST `/api/chat/stream`**

Same request body. SSE events:

```
data: {"type": "chunk", "text": "partial text..."}

data: {"type": "chunk", "text": "more text..."}

data: {"type": "done", "session_id": "uuid", "verse": {...}, "interpretation": "...", "advice": "...", "citations": [...], "grounded": true}
```

## Architecture

### Layer Separation

```
Routers (thin)  →  Services (logic)  →  Models/DB
     ↓                    ↓
  schemas.py         prompt_builder.py
                     llm_generation.py
                     multilingual_generation.py
```

- **Routers**: HTTP concerns only — auth resolution, session management, request/response mapping
- **Services**: Business logic — RAG pipeline, prompt construction, LLM calls, enrichment
- **Models**: Database schema — SQLAlchemy ORM
- **Schemas**: Validation — Pydantic v2 models for all request/response contracts
- **Middleware**: Cross-cutting — JWT verification, rate limiting, request validation

### Chat Pipeline (RAG)

1. **Resolve user** — authenticated or guest
2. **Resolve session** — reuse existing or create new
3. **Retrieve context** — verses + citations from DB (via MultilingualGenerationService)
4. **Detect grounding** — `grounded = True` if retrieval returned data
5. **Build prompts** — grounded or ungrounded system prompt + user prompt with history
6. **Call LLM** — Ollama or OpenAI-compatible API
7. **Parse response** — split into interpretation + advice sections
8. **Enrich** — resolve verse text, citation details, candidate data
9. **Persist** — save user + assistant messages to DB
10. **Return** — structured JSON with `session_id`, `grounded` flag

### Honest Mode

When retrieval yields 0 verses and 0 citations:
- System prompt switches to "ungrounded" variant
- LLM is explicitly instructed: **"Do NOT fabricate, invent, or quote any Rumi verses"**
- Response `grounded` flag is `false`
- `verse` field returns empty strings
- `citations` returns empty array

### Multi-Turn History

- Frontend sends bounded history (max 6 turns) in `ChatRequest.history`
- Backend injects history into the user prompt under "Previous conversation" section
- Each turn is truncated to 300 chars to prevent token explosion
- History is language-aware (same language as current request)

### Session Management

- First message creates a new `ChatSession` row
- Backend returns `session_id` in the response
- Subsequent messages include `session_id` → backend reuses the same session
- Messages are persisted under the session in both streaming and non-streaming paths
- Shared helpers in `routers/_session.py` prevent code duplication

## Development

### Create Migration

```bash
alembic revision --autogenerate -m "description"
```

### Apply / Rollback

```bash
alembic upgrade head
alembic downgrade -1
```

### Docker (Full Stack)

```bash
docker-compose up -d        # All services
docker-compose up db -d     # Database only
docker-compose exec api alembic upgrade head
```

Services:
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Database Admin: http://localhost:8080
- Nginx: http://localhost:80

## Known Limitations (MVP)

- **No vector search** — retrieval uses naive text matching, not embeddings (pgvector planned)
- **No real `source_scope` filtering** — parameter is accepted but not used in retrieval
- **No chat history reload** — session ID persists but no `GET /api/chat/history/:id` endpoint yet
- **No Elasticsearch** — full-text search uses SQL `LIKE`
- **No Redis caching** — rate limiting is in-memory
- **No PDF/OCR pipeline** — book ingestion not implemented

## License

MIT
