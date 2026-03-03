# Rumi AI Agent

A multilingual AI spiritual companion inspired by the poetry of Jalāl al-Dīn Rūmī. The system provides guidance and practical advice grounded in Rumi's literary works using Retrieval-Augmented Generation (RAG) and Large Language Models.

Supports **Persian (FA)**, **English (EN)**, and **Korean (KR)** — including full RTL support for Persian.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | Next.js (App Router) | 16.1.2 |
| React | React + React DOM | 19.2.3 |
| Animations | Framer Motion | 12.29.0 |
| Fonts | Inter, Playfair Display, Vazirmatn | Google Fonts + @fontsource |
| Icons | Lucide React | 0.562.0 |
| CSS | PostCSS + Tailwind CSS 4 + CSS Modules | — |
| Package Manager | pnpm | 10.15.0 |
| Backend Framework | FastAPI | ≥0.100 |
| ORM | SQLAlchemy | ≥1.4, <2.0 |
| Database | PostgreSQL | 13 (Docker) |
| Migrations | Alembic | ≥1.7 |
| Auth | JWT (python-jose) + bcrypt | — |
| HTTP Client | httpx | ≥0.23 |
| LLM | OpenAI-compatible / Ollama | configurable |
| Containerization | Docker + Docker Compose | — |

## Project Structure

```
rumi-ai2/
├── src/                          # ── Frontend (Next.js) ──
│   ├── app/                      # App Router pages + API routes (BFF)
│   │   ├── page.tsx              #   Home page
│   │   ├── chat/page.tsx         #   Chat page (streaming SSE)
│   │   ├── books/page.tsx        #   Books library browser
│   │   ├── about/page.tsx        #   About page
│   │   ├── login/                #   Login / signup (tabbed)
│   │   ├── profile/page.tsx      #   User settings
│   │   ├── layout.tsx            #   Root layout (providers, nav, footer)
│   │   ├── globals.css           #   Global styles + component classes
│   │   └── api/                  #   BFF routes (proxy to backend)
│   │       ├── auth/             #     login / signup / logout / me / kakao
│   │       ├── chat/             #     POST /api/chat + /api/chat/stream
│   │       ├── books/            #     GET /api/books, /api/books/:id/pages/:n
│   │       ├── citations/        #     GET /api/citations/:refId
│   │       ├── feedback/         #     POST /api/feedback
│   │       ├── search/           #     GET /api/search
│   │       └── user/settings/    #     PATCH /api/user/settings
│   ├── components/               # Shared layout & UI components
│   │   ├── layout/               #   Navbar, Footer
│   │   ├── ui/                   #   Background, icons, SectionDivider
│   │   ├── home/                 #   Hero, FeatureCards, HowItWorks
│   │   └── feedback/             #   FeedbackModal
│   ├── features/                 # Feature-scoped components
│   │   ├── chat/components/      #   MessageBubble, Composer, ChatHeader, …
│   │   ├── books/components/     #   BookCard, BooksPanel, VerseCarousel, …
│   │   ├── auth/components/      #   AuthFormLogin, AuthFormSignup, …
│   │   ├── profile/components/   #   ProfileSidebar, SegmentedControl, …
│   │   └── about/components/     #   AboutPageShell
│   ├── lib/                      # Core libraries
│   │   ├── api/                  #   bff.ts, stream-chat.ts, error-utils.ts
│   │   ├── auth/                 #   auth-context.tsx (AuthProvider + useAuth)
│   │   ├── i18n/                 #   i18n-context.tsx, translations.ts
│   │   ├── theme/                #   theme-context.tsx (light/dark)
│   │   ├── design-system/        #   motion.ts (animation tokens)
│   │   ├── hooks/                #   useReducedMotion
│   │   └── data/                 #   books.ts, verses.ts, suggested-prompts.ts
│   ├── styles/                   # Page & component CSS files
│   │   ├── tokens.css            #   Design tokens (colors, spacing, fonts)
│   │   ├── chat.css, books.css, auth.css, profile.css, …
│   │   └── background.css, navbar.css, home.css, about.css
│   └── types/                    # Shared TypeScript types
│       ├── chat.ts               #   ChatMessage, AssistantMessage, ChatRequest, …
│       └── auth.ts               #   AuthUser, AuthStatus
│
├── backend/                      # ── Backend (FastAPI) ──
│   ├── main.py                   # App entry point (CORS, middleware, routers)
│   ├── app/
│   │   ├── config.py             #   Centralised settings (pydantic-settings)
│   │   ├── database.py           #   SQLAlchemy engine + session
│   │   ├── models.py             #   ORM models (User, ChatSession, Message, …)
│   │   ├── schemas.py            #   Pydantic request/response schemas
│   │   ├── routers/              #   API endpoint handlers
│   │   │   ├── auth.py           #     POST /api/auth/login, /signup, /kakao
│   │   │   ├── chat.py           #     POST /api/chat
│   │   │   ├── chat_stream.py    #     POST /api/chat/stream (SSE)
│   │   │   ├── search.py         #     GET  /api/search
│   │   │   ├── books.py          #     GET  /api/books/:id/pages/:n
│   │   │   ├── citation.py       #     GET  /api/citation/:id
│   │   │   ├── feedback.py       #     POST /api/feedback
│   │   │   ├── user.py           #     GET  /api/user/me, PATCH /api/user/settings
│   │   │   └── _session.py       #     Shared session/user resolution helpers
│   │   ├── services/             #   Business logic layer
│   │   │   ├── chat_service.py   #     RAG pipeline orchestrator
│   │   │   ├── prompt_builder.py #     System/user prompt construction
│   │   │   ├── llm_generation.py #     LLM API integration (Ollama/OpenAI)
│   │   │   ├── multilingual_generation.py  # Context preparation
│   │   │   ├── search_service.py #     Verse search
│   │   │   ├── citation_service.py   # Citation lookup
│   │   │   └── guest_user_service.py # Anonymous user handling
│   │   └── middleware/           #   API gateway layer
│   │       ├── auth.py           #     JWT verification
│   │       ├── rate_limit.py     #     Request rate limiting
│   │       └── request_validator.py  # Input validation
│   ├── alembic/                  # Database migrations
│   ├── docker-compose.yml        # PostgreSQL + API + Nginx + Adminer
│   ├── Dockerfile                # API container image
│   ├── requirements.txt          # Python dependencies
│   └── nginx.conf                # Reverse proxy config
│
├── aboutProject/                 # Design references & architecture docs
│   ├── *.png, *.jpeg             #   Frontend design drafts
│   ├── *.txt                     #   Frontend design proposal
│   └── backend/                  #   Backend architecture PDF + diagrams
│
└── public/img/                   # Static assets (avatars, backgrounds)
```

## Getting Started

### Prerequisites

- **Node.js** ≥ 20 and **pnpm** ≥ 10
- **Python** ≥ 3.9
- **Docker** and **Docker Compose** (for PostgreSQL)

### 1. Start the Database

```bash
cd backend
docker-compose up db -d
```

### 2. Start the Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # edit with your LLM_API_KEY, DATABASE_URL, etc.
alembic upgrade head
uvicorn main:app --reload --port 8000
```

### 3. Start the Frontend

```bash
# from project root
pnpm install
cp .env.local.example .env.local   # set BACKEND_URL=http://localhost:8000
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

### Frontend (`.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `BACKEND_URL` | Backend API base URL | `http://localhost:8000` |
| `KAKAO_REST_API_KEY` | Kakao OAuth REST API key | — |
| `KAKAO_REDIRECT_URI` | Kakao OAuth redirect URI | `http://localhost:3000/api/auth/kakao/callback` |

### Backend (`.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://rumi_user:rumi_password@localhost:5432/rumi_ai` |
| `SECRET_KEY` | JWT signing key | (change in production) |
| `LLM_API_KEY` | OpenAI / Ollama API key | — |
| `LLM_API_URL` | LLM endpoint URL | `https://api.openai.com/v1/chat/completions` |
| `LLM_MODEL` | Model name | `gpt-4` |
| `USE_MOCK` | Return mock LLM responses | `false` |
| `DEBUG` | Enable debug logging | `false` |
| `ALLOWED_HOSTS` | CORS allowed hosts (comma-separated) | `localhost,127.0.0.1` |
| `KAKAO_REST_API_KEY` | Kakao OAuth REST API key | — |
| `KAKAO_CLIENT_SECRET` | Kakao OAuth client secret (optional) | — |
| `KAKAO_REDIRECT_URI` | Kakao OAuth redirect URI | `http://localhost:3000/api/auth/kakao/callback` |

## Key Features

### Chat System
- **Real-time streaming** via Server-Sent Events (SSE)
- **Multi-turn conversation** with bounded history window (last 6 turns)
- **Session persistence** — messages saved to DB, session ID reused across turns
- **Honest Mode** — when no corpus data is retrieved, the LLM is instructed not to fabricate Rumi quotes; response includes `grounded: false` flag
- **Source scope toggle** — Books / Hybrid / Web (UI wired, backend filtering planned)
- **Non-streaming fallback** if SSE fails

### Authentication
- JWT-based auth with httpOnly cookies
- OAuth support: Kakao Login (Google and Apple coming soon)
- Guest user support (anonymous chat)
- Centralised `AuthProvider` context with `useAuth()` hook
- Login / Signup / Logout flows
- Profile avatar support (OAuth providers)

### Internationalization
- Three languages: Persian (FA), English (EN), Korean (KR)
- Full RTL support for Persian
- Language-aware prompt construction
- Translations managed in `src/lib/i18n/translations.ts`

### Design System
- Light and dark themes with CSS custom properties
- Parchment / spiritual aesthetic with earthy palette and gold/teal accents
- Motion tokens for consistent animations (respects `prefers-reduced-motion`)
- Responsive layout (mobile-friendly)

### Profile & Settings
- Language and theme preferences persisted to backend
- Email notifications toggle (UI placeholder)
- Account management section

## Development

### Lint & Type Check

```bash
pnpm lint            # ESLint
npx tsc --noEmit     # TypeScript
```

### Backend Syntax Check

```bash
cd backend
python -m py_compile app/services/chat_service.py
```

### Database Migrations

```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
alembic downgrade -1
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/chat` | Submit question, receive structured response |
| `POST` | `/api/chat/stream` | SSE streaming chat |
| `GET` | `/api/search?query=…&lang=fa` | Search verses |
| `GET` | `/api/citation/:id` | Citation details |
| `GET` | `/api/books/:id/pages/:n` | Book page with verses |
| `POST` | `/api/auth/login` | Login (returns JWT) |
| `POST` | `/api/auth/signup` | Register |
| `POST` | `/api/auth/kakao` | Kakao OAuth login (backend) |
| `GET` | `/api/auth/kakao/start` | Kakao OAuth start (frontend) |
| `GET` | `/api/auth/kakao/callback` | Kakao OAuth callback (frontend) |
| `GET` | `/api/user/me` | Current user profile |
| `PATCH` | `/api/user/settings` | Update language/theme prefs |
| `POST` | `/api/feedback` | Submit feedback/report |
| `GET` | `/health` | Health check |

## Architecture

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for detailed system architecture with diagrams.

## License

MIT
