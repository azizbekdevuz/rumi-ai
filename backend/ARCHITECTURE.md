# Rumi AI Agent — Backend Architecture

Detailed backend architecture documentation for the Rumi AI Agent FastAPI service.

---

## Architecture Overview

The backend follows a **layered architecture** with an API Gateway pattern:

```
┌─────────────────────────────────────────────────────┐
│                     main.py                          │
│  FastAPI app · CORS · Middleware · Router includes   │
└───────────────────────┬─────────────────────────────┘
                        │
           ┌────────────┼────────────┐
           ▼            ▼            ▼
┌──────────────┐ ┌───────────┐ ┌──────────────┐
│  Middleware   │ │  Routers  │ │   Schemas    │
│  ──────────  │ │  ───────  │ │  ─────────   │
│  auth.py     │ │  auth     │ │  Pydantic v2 │
│  rate_limit  │ │  chat     │ │  Request +   │
│  validator   │ │  stream   │ │  Response    │
└──────────────┘ │  search   │ │  models      │
                 │  books    │ └──────────────┘
                 │  citation │
                 │  feedback │
                 │  user     │
                 │  _session │
                 └─────┬─────┘
                       │
           ┌───────────┼───────────┐
           ▼           ▼           ▼
┌──────────────┐ ┌───────────┐ ┌──────────────┐
│   Services   │ │  Models   │ │   Database   │
│  ──────────  │ │  ───────  │ │  ─────────   │
│  ChatService │ │  User     │ │  SQLAlchemy  │
│  PromptBuild │ │  Session  │ │  SessionLocal│
│  LLMGenerate │ │  Message  │ │  PostgreSQL  │
│  Multilingual│ │  Book     │ └──────────────┘
│  Search      │ │  Verse    │
│  Citation    │ │  Citation │
│  GuestUser   │ │  Feedback │
└──────────────┘ └───────────┘
```

### Design Principles

- **Thin routers**: HTTP concerns only — auth resolution, session management, request/response mapping
- **Fat services**: Business logic — RAG pipeline, prompt construction, LLM calls, enrichment
- **Centralised config**: All settings via pydantic-settings (`app/config.py`), never `os.getenv()`
- **Shared helpers**: Common session/user resolution in `routers/_session.py`
- **Consistent schemas**: Pydantic v2 models for all request/response contracts

---

## Components

### 1. API Gateway Layer

**Location:** `app/middleware/`

| Middleware | File | Purpose |
|-----------|------|---------|
| **JWT Authentication** | `auth.py` | Token verification, `get_current_user` / `get_optional_user` dependencies |
| **Rate Limiting** | `rate_limit.py` | In-memory sliding window (100 req/min general, 30 req/min chat) |
| **Request Validator** | `request_validator.py` | Content-type checks, size limit (10MB) |

Middleware execution order (outer → inner):

```
CORS → Request Validator → Rate Limiter → Router (with auth dependency)
```

### 2. Routers

| File | Prefix | Endpoints |
|------|--------|-----------|
| `auth.py` | `/api/auth` | `POST /login`, `POST /signup`, `POST /kakao`, `POST /google` |
| `chat.py` | `/api/chat` | `POST /` — non-streaming chat |
| `chat_stream.py` | `/api/chat` | `POST /stream` — SSE streaming chat |
| `search.py` | `/api/search` | `GET /` — verse search |
| `books.py` | `/api/books` | `GET /:id/pages/:n` — book page |
| `citation.py` | `/api/citation` | `GET /:id` — citation detail |
| `feedback.py` | `/api/feedback` | `POST /` — submit feedback |
| `user.py` | `/api/user` | `GET /me`, `PATCH /settings` |
| `_session.py` | — | Shared helpers (not a router) |

### 3. Services

| Service | File | Responsibility |
|---------|------|---------------|
| **ChatService** | `chat_service.py` | RAG pipeline orchestrator — calls retrieval, prompt builder, LLM, enrichment |
| **PromptBuilder** | `prompt_builder.py` | Builds system/user prompts, parses LLM response into interpretation + advice |
| **LLMGenerationService** | `llm_generation.py` | HTTP calls to OpenAI/Ollama, auto-detects provider, mock mode |
| **MultilingualGenerationService** | `multilingual_generation.py` | Context preparation — verse/citation retrieval for the prompt |
| **SearchService** | `search_service.py` | Verse keyword search |
| **CitationService** | `citation_service.py` | Citation lookup by ID |
| **GuestUserService** | `guest_user_service.py` | Creates/retrieves shared anonymous user |

### 4. Authentication & OAuth

**Location:** `app/routers/auth.py`

Authentication endpoints:
- **`POST /api/auth/login`** — Email/password login. Rejects OAuth users (users with `password_hash=NULL`).
- **`POST /api/auth/signup`** — Creates new user with `provider='email'` and hashed password.
- **`POST /api/auth/kakao`** — Kakao OAuth login:
  1. Exchanges authorization code for access token (uses server-configured `KAKAO_REDIRECT_URI`)
  2. Fetches user info from Kakao API
  3. Creates or updates user with `provider='kakao'`, `provider_user_id`, `avatar_url`, `display_name`
  4. Returns JWT token
- **`POST /api/auth/google`** — Google OAuth login:
  1. Exchanges authorization code for access token (uses server-configured `GOOGLE_REDIRECT_URI`)
  2. Fetches user info from Google API
  3. Creates or updates user with `provider='google'`, `provider_user_id`, `avatar_url`, `display_name`
  4. Returns JWT token

**User Model OAuth Fields:**
- `provider` — `'email'`, `'google'`, `'kakao'`, or `'guest'` (default: `'email'`)
- `provider_user_id` — OAuth provider's user ID (nullable, unique with provider)
- `avatar_url` — Profile image URL from OAuth provider (nullable)
- `display_name` — Display name from OAuth or user (nullable)
- `password_hash` — Nullable for OAuth users

**OAuth User Creation Rules:**
- Look up by `provider='kakao'` AND `provider_user_id`
- If exists: update `last_login` and `avatar_url` (if provided)
- If not exists: check for email conflict with existing `provider='email'` user → return 409
- Create new user with Kakao email or placeholder `kakao_{id}@kakao.local`

### 5. Shared Session Helpers

**Location:** `app/routers/_session.py`

Two pure functions used by both chat endpoints:

- **`resolve_user_id(current_user, db)`** — Returns a plain `uuid.UUID` for authenticated or guest user. Materialises the UUID so it survives ORM session expiry.
- **`resolve_or_create_session(db, user_id, session_id)`** — Reuses existing `ChatSession` or creates a new one. Returns `(session, is_new)`. Flushed but not committed (callers decide commit strategy).

---

## Chat RAG Pipeline

### Pipeline Steps

```
  1. Resolve user (authenticated or guest)
  2. Resolve session (reuse or create)
  3. Retrieve context (verses + citations from DB)
  4. Detect grounding (any verses found?)
  5. Build system prompt (grounded vs ungrounded)
  6. Build user prompt (message + context + history)
  7. Call LLM (OpenAI / Ollama)
  8. Parse response (interpretation + advice)
  9. Enrich (verse text, citation details, candidates)
  10. Persist messages to DB
  11. Return structured response
```

### Detailed Flow

```
chat.py / chat_stream.py
    │
    ├── resolve_user_id()        → UUID
    ├── resolve_or_create_session() → (ChatSession, bool)
    │
    └── ChatService.process_chat()
            │
            ├── MultilingualService.prepare_context()
            │   → {verses: [...], citations: [...]}
            │
            ├── grounded = len(verses) > 0
            │
            ├── PromptBuilder.build_system_prompt(language, grounded)
            │   → System prompt string
            │
            ├── PromptBuilder.build_user_prompt(message, verses, citations, history)
            │   → User prompt string
            │
            ├── LLMGenerationService.generate(system_prompt, user_prompt, language)
            │   → Raw LLM text
            │
            ├── PromptBuilder.parse_llm_response(raw_text, language)
            │   → {interpretation: "...", advice: "..."}
            │
            ├── _enrich_verse(verse_id) → {fa, en, kr}
            ├── _enrich_citations(citation_ids) → [{id, book, page, snippet}]
            ├── _build_candidates(verses_ctx) → [{refId, book, page}]
            │
            └── Return result dict
```

### Honest Mode (Ungrounded)

When retrieval returns 0 verses and 0 citations:

- System prompt switches to ungrounded variant
- LLM is instructed: **"Do NOT fabricate, invent, or quote any Rumi verses"**
- Response `grounded` field = `false`
- `verse` = `{fa: "", en: "", kr: ""}`
- `citations` = `[]`

### Multi-Turn History

- Frontend sends max 6 turns in `ChatRequest.history`
- Backend injects into user prompt under "Previous conversation" section
- Each turn truncated to 300 chars
- Language-aware (same language as current request)

---

## Database Schema

### Entity Relationship

```
Users ──< 1:N >── Chat_Sessions ──< 1:N >── Messages
Users ──< 1:N >── Feedback_Reports
Messages ──< 0:1 >── Feedback_Reports
Books ──< 1:N >── Verses ──< 1:N >── Citations
Messages.verse_id ──> Verses (optional FK)
Messages.citation_ids ──> Citations[] (UUID array)
```

### Tables

| Table | Key Fields |
|-------|-----------|
| **Users** | `id` (UUID PK), `email` (unique), `password_hash` (nullable), `provider` (email/google/kakao/guest), `provider_user_id` (nullable), `avatar_url` (nullable), `display_name` (nullable), `preferred_lang`, `theme`, `is_guest`, `is_deleted`, `created_at`, `last_login` |
| **Chat_Sessions** | `id` (UUID PK), `user_id` (FK→Users), `source_mode`, `created_at` |
| **Messages** | `id` (UUID PK), `session_id` (FK→Sessions), `role`, `message_text`, `language`, `verse_id` (FK→Verses), `citation_ids` (UUID[]), `feedback`, `created_at` |
| **Feedback_Reports** | `id` (UUID PK), `message_id` (FK→Messages, optional), `user_id` (FK→Users), `session_id` (optional), `issue_type`, `comment`, `created_at` |
| **Books** | `id` (UUID PK), `title`, `title_en`, `pdf_url`, `type`, `created_at` |
| **Verses** | `id` (UUID PK), `book_id` (FK→Books), `line_number`, `text_fa`, `text_en`, `text_kr`, `created_at` |
| **Citations** | `id` (UUID PK), `verse_id` (FK→Verses), `book_id` (FK→Books), `page_number`, `line_range`, `highlight_box` (JSON), `snippet` |

Migrations managed by **Alembic** (`alembic/versions/`).

---

## API Endpoints

### Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/` | Service info |
| `POST` | `/api/auth/signup` | Register |
| `POST` | `/api/auth/login` | Login (returns JWT) |
| `POST` | `/api/auth/kakao` | Kakao OAuth login (exchanges code for JWT) |
| `POST` | `/api/auth/google` | Google OAuth login (exchanges code for JWT) |

### Optional Auth (works for guests)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/chat` | Non-streaming chat |
| `POST` | `/api/chat/stream` | SSE streaming chat |
| `GET` | `/api/search?query=…&lang=fa` | Search verses |
| `GET` | `/api/citation/:id` | Citation detail |
| `GET` | `/api/books/:id/pages/:n` | Book page |
| `POST` | `/api/feedback` | Submit feedback |

### Required Auth

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/user/me` | Current user profile |
| `PATCH` | `/api/user/settings` | Update language/theme |

### Chat Request/Response Contract

**Request** (`ChatRequest`):
```json
{
  "question": "How do I deal with loss?",
  "language": "en",
  "source_scope": "books",
  "session_id": null,
  "history": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]
}
```

**Response** (`ChatResponse`):
```json
{
  "session_id": "uuid",
  "verse": {"fa": "...", "en": "...", "kr": "..."},
  "interpretation": "...",
  "advice": "...",
  "citations": [{"id": "uuid", "book": "Masnavi", "page_number": 42, "snippet": "..."}],
  "retrieved_candidates": [...],
  "grounded": true
}
```

**SSE Events** (streaming):
```
data: {"type": "chunk", "text": "partial text..."}
data: {"type": "done", "session_id": "...", "verse": {...}, ...}
data: {"type": "error", "message": "..."}
```

---

## Configuration

**Location:** `app/config.py` (pydantic-settings `BaseSettings`)

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `DATABASE_URL` | str | `postgresql://rumi_user:…` | PostgreSQL connection |
| `SECRET_KEY` | str | — | JWT signing key |
| `LLM_API_KEY` | str | — | LLM API key |
| `LLM_API_URL` | str | OpenAI endpoint | LLM endpoint |
| `LLM_MODEL` | str | `gpt-4` | Model name |
| `USE_MOCK` | bool | `false` | Mock LLM responses |
| `DEBUG` | bool | `false` | Debug logging |
| `ALLOWED_HOSTS` | str | `localhost,127.0.0.1` | CORS origins |
| `JWT_ALGORITHM` | str | `HS256` | JWT algorithm |
| `JWT_EXPIRATION_HOURS` | int | `24` | Token TTL |
| `KAKAO_REST_API_KEY` | str | — | Kakao OAuth REST API key |
| `KAKAO_CLIENT_SECRET` | str | — | Kakao OAuth client secret (optional) |
| `KAKAO_REDIRECT_URI` | str | — | Kakao OAuth redirect URI |
| `GOOGLE_CLIENT_ID` | str | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | str | — | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | str | — | Google OAuth redirect URI |
| `RATE_LIMIT_REQUESTS` | int | `100` | Requests per window |
| `RATE_LIMIT_WINDOW` | int | `60` | Window in seconds |
| `REDIS_URL` | str | `redis://localhost:6379/0` | Redis (optional) |
| `VECTOR_DB_URL` | str | — | Vector DB (planned) |
| `ELASTICSEARCH_URL` | str | `localhost:9200` | Elastic (planned) |

All settings are loaded from `.env` via `load_dotenv(override=True)` in `main.py`.

---

## Docker Compose Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `db` | `postgres:13-alpine` | 5432 | PostgreSQL database |
| `api` | `Dockerfile` | 8000 | FastAPI backend |
| `nginx` | `nginx:alpine` | 80 | Reverse proxy |
| `adminer` | `adminer` | 8080 | DB management UI |

Development mode: run only `db` via Docker, run `api` locally with `--reload`.

---

## Debug Logging

The chat pipeline includes structured debug logs at each stage:

```
INFO  Processing chat for session=..., user_message='...' (lang=FA, scope=books)
DEBUG Context retrieved: 3 verses, 2 citations. Top verse IDs: [uuid1, uuid2, uuid3]
DEBUG Prompts built: system_len=450, user_len=1200
DEBUG LLM generated response (first 100 chars): In the story of the reed...
DEBUG LLM response parsed: interpretation_len=280, advice_len=150
DEBUG Enrichment complete: verse_present=True, citations_count=2, candidates_count=3
```

Logging level controlled by `DEBUG` env var (`True` → `DEBUG`, `False` → `INFO`).

---

## Known Limitations (MVP)

| Gap | Impact | Plan |
|-----|--------|------|
| No vector search | Retrieval uses SQL text matching | pgvector extension |
| No `source_scope` filtering | Parameter accepted but unused | Backend filtering logic |
| No chat history reload | Session persisted but no GET endpoint | `GET /api/chat/history/:id` |
| No Elasticsearch | Full-text uses SQL LIKE | BM25 index |
| No Redis | Rate limiting in-memory | Distributed caching |
| No PDF/OCR pipeline | Books not ingestible | OCR + alignment pipeline |
| No WebSocket chat | SSE only | Optional upgrade |

---

## Development

### Run Locally

```bash
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload --port 8000
```

### API Docs

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Migrations

```bash
alembic revision --autogenerate -m "description"
alembic upgrade head
alembic downgrade -1
```
