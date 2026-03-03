# Rumi AI Agent — System Architecture

Comprehensive system overview with diagrams for the Rumi AI Agent: a multilingual RAG-powered spiritual companion built with Next.js 16 and FastAPI.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Chat RAG Pipeline](#5-chat-rag-pipeline)
6. [Authentication Flow](#6-authentication-flow)
7. [Data Model](#7-data-model)
8. [API Contract Map](#8-api-contract-map)
9. [Streaming (SSE) Flow](#9-streaming-sse-flow)
10. [Internationalization & Theming](#10-internationalization--theming)
11. [Infrastructure & Deployment](#11-infrastructure--deployment)
12. [Future Architecture (Planned)](#12-future-architecture-planned)

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        RUMI AI AGENT                            │
│                                                                 │
│  A multilingual AI spiritual companion inspired by Rumi's       │
│  poetry. Users ask life questions; the system retrieves          │
│  relevant verses, generates contextual interpretation and        │
│  practical advice via LLM, and cites sources with page refs.    │
│                                                                 │
│  Languages: Persian (FA) · English (EN) · Korean (KR)           │
│  Themes:    Light (parchment) · Dark                            │
│  Auth:      JWT + OAuth (Kakao) + anonymous guest               │
│  Chat:      Real-time SSE streaming + non-streaming fallback    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. High-Level Architecture

```
                          ┌─────────────┐
                          │   Browser    │
                          │  (User/PWA)  │
                          └──────┬───────┘
                                 │  HTTPS
                                 ▼
┌────────────────────────────────────────────────────────────────┐
│                    FRONTEND  (Next.js 16)                       │
│                                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Pages   │  │  Shared  │  │ Features │  │   Providers   │  │
│  │ (App     │  │  Layout  │  │ (domain  │  │ Auth · i18n · │  │
│  │  Router) │  │ Nav/Foot │  │  comps)  │  │    Theme      │  │
│  └────┬─────┘  └──────────┘  └──────────┘  └───────────────┘  │
│       │                                                        │
│       ▼                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              BFF API Routes  (src/app/api/)              │   │
│  │  /auth/*  /chat/*  /books/*  /search  /feedback  /user  │   │
│  └───────────────────────┬─────────────────────────────────┘   │
│                          │  httpOnly cookie (JWT)               │
└──────────────────────────┼─────────────────────────────────────┘
                           │  HTTP / SSE
                           ▼
┌────────────────────────────────────────────────────────────────┐
│                    BACKEND  (FastAPI)                           │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              API Gateway (Middleware)                   │    │
│  │  CORS · Rate Limiting · Request Validation · JWT Auth  │    │
│  └────────────────────────┬───────────────────────────────┘    │
│                           │                                    │
│  ┌────────────────────────▼───────────────────────────────┐    │
│  │                    Routers (Thin)                       │    │
│  │  auth · chat · chat_stream · search · books ·          │    │
│  │  citation · feedback · user · _session                  │    │
│  └────────────────────────┬───────────────────────────────┘    │
│                           │                                    │
│  ┌────────────────────────▼───────────────────────────────┐    │
│  │               Services (Business Logic)                │    │
│  │  ChatService · PromptBuilder · LLMGenerationService ·  │    │
│  │  MultilingualService · SearchService · CitationService  │    │
│  └────────────┬───────────────────────────┬───────────────┘    │
│               │                           │                    │
│               ▼                           ▼                    │
│  ┌────────────────────┐    ┌──────────────────────────┐        │
│  │   PostgreSQL 13    │    │   LLM API (External)     │        │
│  │  (SQLAlchemy ORM)  │    │  OpenAI / Ollama / etc.  │        │
│  └────────────────────┘    └──────────────────────────┘        │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. Frontend Architecture

### 3.1 Application Layer Map

```
src/
├── app/                         # Next.js App Router
│   ├── layout.tsx               #  Root: ThemeProvider → I18nProvider → AuthProvider
│   ├── template.tsx             #  Page transition animations
│   ├── page.tsx                 #  Home (Hero + Features + HowItWorks)
│   ├── chat/page.tsx            #  Chat (SSE streaming + non-streaming fallback)
│   ├── books/page.tsx           #  Books Library (search + cards + carousel)
│   ├── books/[bookId]/page.tsx  #  Book detail / page viewer
│   ├── about/page.tsx           #  About page
│   ├── login/                   #  Login / Signup (tabbed form)
│   ├── profile/page.tsx         #  User settings
│   └── api/                     #  BFF proxy routes
│
├── components/                  # Shared / global UI
│   ├── layout/                  #   Navbar · Footer
│   ├── ui/                      #   Background · Icons · SectionDivider
│   ├── home/                    #   Hero · FeatureCards · HowItWorks
│   └── feedback/                #   FeedbackModal (global)
│
├── features/                    # Domain-scoped feature components
│   ├── chat/components/         #   12 components (MessageBubble, Composer, …)
│   ├── books/components/        #   8 components (BookCard, BooksPanel, …)
│   ├── auth/components/         #   6 components (AuthFormLogin, AuthPanel, …)
│   ├── profile/components/      #   4 components (ProfileSidebar, SegmentedControl, …)
│   └── about/components/        #   1 component (AboutPageShell)
│
├── lib/                         # Core libraries & state
│   ├── auth/auth-context.tsx    #   AuthProvider + useAuth hook
│   ├── i18n/                    #   I18nProvider + translations (FA/EN/KR)
│   ├── theme/                   #   ThemeProvider (light/dark)
│   ├── api/                     #   bff.ts · stream-chat.ts · error-utils.ts
│   ├── design-system/           #   Motion tokens (Framer Motion)
│   ├── hooks/                   #   useReducedMotion
│   └── data/                    #   Static data (books, verses, prompts)
│
├── styles/                      # CSS files per domain + tokens
│   └── tokens.css               #   Design tokens (CSS custom properties)
│
└── types/                       # Shared TypeScript interfaces
    ├── chat.ts                  #   ChatMessage, AssistantMessage, ChatRequest, …
    └── auth.ts                  #   AuthUser, AuthStatus
```

### 3.2 Provider Tree

```
<html>
  <body>
    <ThemeProvider>               ← light/dark via CSS [data-theme]
      <I18nProvider>              ← FA/EN/KR + dir (ltr/rtl)
        <AuthProvider>            ← user, status, refresh(), logout()
          <Background />          ← Animated parchment background
          <Navbar />              ← Auth-aware, language switcher, theme toggle
          <main>{children}</main> ← Page content
          <Footer />
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  </body>
</html>
```

### 3.3 State Management

```
┌───────────────────────────────────────────┐
│          Global State (React Context)      │
├───────────────────────────────────────────┤
│  AuthContext                               │
│  ├── user: AuthUser | null                 │
│  ├── status: loading | authenticated       │
│  │           | unauthenticated             │
│  ├── refresh(): Promise<void>              │
│  └── logout(): Promise<void>               │
├───────────────────────────────────────────┤
│  ThemeContext                               │
│  ├── theme: 'light' | 'dark'              │
│  └── toggleTheme()                         │
├───────────────────────────────────────────┤
│  I18nContext                               │
│  ├── language: 'en' | 'fa' | 'kr'        │
│  ├── dir: 'ltr' | 'rtl'                  │
│  ├── t: translations object                │
│  └── setLanguage()                         │
└───────────────────────────────────────────┘

┌───────────────────────────────────────────┐
│           Page-Local State                 │
├───────────────────────────────────────────┤
│  Chat Page                                 │
│  ├── messages[]: UserMessage | Assistant   │
│  ├── sessionId: UUID (persisted localStorage)│
│  ├── isLoading: boolean                    │
│  ├── sourceScope: books | web_books | web  │
│  └── citeEnabled: boolean                  │
├───────────────────────────────────────────┤
│  Profile Page                              │
│  ├── mounted: boolean (hydration guard)    │
│  ├── isSaving / saveError / saveSuccess    │
│  └── language / theme (from providers)     │
└───────────────────────────────────────────┘
```

### 3.4 BFF Route Mapping

```
Frontend BFF Route              →  Backend Endpoint
─────────────────────────────────────────────────────
POST /api/auth/login            →  POST /api/auth/login
POST /api/auth/signup           →  POST /api/auth/signup
GET  /api/auth/kakao/start      →  (redirects to Kakao OAuth)
GET  /api/auth/kakao/callback   →  POST /api/auth/kakao (backend)
POST /api/auth/logout           →  (clears httpOnly cookie)
GET  /api/auth/me               →  GET  /api/user/me
POST /api/chat                  →  POST /api/chat
POST /api/chat/stream           →  POST /api/chat/stream (SSE passthrough)
GET  /api/books                 →  GET  /api/books
GET  /api/books/:id/pages/:n    →  GET  /api/books/:id/pages/:n
GET  /api/citations/:refId      →  GET  /api/citation/:refId
GET  /api/search?query=…        →  GET  /api/search
POST /api/feedback              →  POST /api/feedback
PATCH /api/user/settings        →  PATCH /api/user/settings
```

---

## 4. Backend Architecture

### 4.1 Layer Diagram

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

### 4.2 Service Responsibilities

```
┌─────────────────────────────────────────────────────────────┐
│                      ChatService                             │
│  Orchestrator — full RAG pipeline                            │
│                                                              │
│  1. Calls MultilingualService.prepare_context()              │
│  2. Calls PromptBuilder.build_system_prompt()                │
│  3. Calls PromptBuilder.build_user_prompt()                  │
│  4. Calls LLMGenerationService.generate()                    │
│  5. Calls PromptBuilder.parse_llm_response()                 │
│  6. Enriches verse/citation data from DB                     │
│  7. Returns structured result dict                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    PromptBuilder                              │
│  Constructs system + user prompts                            │
│                                                              │
│  • build_system_prompt(language, grounded)                    │
│    → Grounded: instructs LLM to cite verses                  │
│    → Ungrounded: forbids fabrication                         │
│  • build_user_prompt(message, verses, citations, history)    │
│  • parse_llm_response(raw_text, language)                    │
│    → Splits into {interpretation, advice}                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  LLMGenerationService                        │
│  Handles HTTP calls to LLM API                               │
│                                                              │
│  • Auto-detects Ollama vs OpenAI by URL                      │
│  • Normalises Ollama URL to /api/chat                        │
│  • Mock mode (USE_MOCK=true) for development                 │
│  • Timeout + error handling                                  │
│  • Reads config from settings (not os.getenv)                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              MultilingualGenerationService                    │
│  Prepares retrieval context for the prompt                   │
│                                                              │
│  • prepare_context(message, language, verse_id, cit_ids)     │
│  • Returns {verses: [...], citations: [...]}                 │
│  • Language-aware text selection (FA/EN/KR)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Chat RAG Pipeline

### 5.1 End-to-End Flow

```
  User types message
        │
        ▼
┌─────────────────┐     POST /api/chat/stream
│   Chat Page     │ ──────────────────────────────┐
│  (Next.js)      │                               │
└─────────────────┘                               │
                                                  ▼
                               ┌──────────────────────────────┐
                               │   BFF Route (stream/route.ts) │
                               │  Reads JWT from httpOnly cookie│
                               │  Proxies to backend SSE       │
                               └──────────────┬───────────────┘
                                              │
                                              ▼
        ┌─────────────────────────────────────────────────────────┐
        │                  Backend: chat_stream.py                 │
        │                                                         │
        │  1. resolve_user_id(current_user, db)                   │
        │     → Authenticated user UUID or guest UUID             │
        │                                                         │
        │  2. resolve_or_create_session(db, user_id, session_id)  │
        │     → Reuse existing or create new ChatSession          │
        │     → Commit immediately (streaming durability)         │
        │                                                         │
        │  3. ChatService(db).process_chat(...)                   │
        │     │                                                   │
        │     ▼                                                   │
        │  ┌───────────────────────────────────────────────┐      │
        │  │           ChatService.process_chat()           │      │
        │  │                                               │      │
        │  │  a) MultilingualService.prepare_context()     │      │
        │  │     → Retrieves matching verses + citations   │      │
        │  │     → Returns {verses: [...], citations: [..]}│      │
        │  │                                               │      │
        │  │  b) Detect grounding                          │      │
        │  │     → grounded = len(verses) > 0              │      │
        │  │                                               │      │
        │  │  c) PromptBuilder.build_system_prompt()       │      │
        │  │     → Grounded: "Use the provided verses"     │      │
        │  │     → Ungrounded: "Do NOT fabricate quotes"   │      │
        │  │                                               │      │
        │  │  d) PromptBuilder.build_user_prompt()         │      │
        │  │     → Injects verses, citations, history      │      │
        │  │                                               │      │
        │  │  e) LLMGenerationService.generate()           │      │
        │  │     → Calls OpenAI / Ollama with messages     │      │
        │  │     → Returns raw text                        │      │
        │  │                                               │      │
        │  │  f) PromptBuilder.parse_llm_response()        │      │
        │  │     → Splits into interpretation + advice     │      │
        │  │                                               │      │
        │  │  g) Enrich verse data + citations + candidates│      │
        │  │     → DB lookups for full verse text          │      │
        │  │     → DB lookups for citation details         │      │
        │  │                                               │      │
        │  │  h) Return result dict                        │      │
        │  └───────────────────────────────────────────────┘      │
        │                                                         │
        │  4. Stream response text as SSE chunks                  │
        │     → data: {"type":"chunk","text":"partial..."}        │
        │                                                         │
        │  5. Persist user + assistant Messages to DB             │
        │                                                         │
        │  6. Emit final structured event                         │
        │     → data: {"type":"done","verse":{...},...}           │
        └─────────────────────────────────────────────────────────┘
                                │
                                ▼
              ┌────────────────────────────────┐
              │  Frontend: stream-chat.ts       │
              │                                │
              │  onChunk → append text to msg  │
              │  onComplete → merge structured │
              │               data into msg    │
              │  onError → show error or       │
              │            fall back to POST   │
              └────────────────────────────────┘
```

### 5.2 Honest Mode (Ungrounded Response)

```
  Retrieval returns 0 verses, 0 citations
        │
        ▼
  PromptBuilder.build_system_prompt(grounded=False)
        │
        ▼
  System prompt says:
  ┌──────────────────────────────────────────────┐
  │  "No source material was found. You must     │
  │   NOT fabricate, invent, or quote any Rumi    │
  │   verses. Respond with general wisdom only.   │
  │   Clearly state you have no specific verse."  │
  └──────────────────────────────────────────────┘
        │
        ▼
  Response includes:
  • grounded: false
  • verse: {fa: "", en: "", kr: ""}
  • citations: []
  • interpretation: "general wisdom…"
```

---

## 6. Authentication Flow

```
┌───────────┐                 ┌───────────┐                 ┌───────────┐
│  Browser   │                │  Next.js   │                │  FastAPI   │
│  (Client)  │                │  (BFF)     │                │  (Backend) │
└─────┬─────┘                └─────┬─────┘                └─────┬─────┘
      │                            │                            │
      │  1. POST /api/auth/login   │                            │
      │  {email, password}         │                            │
      │ ─────────────────────────▶ │                            │
      │                            │  2. POST /api/auth/login   │
      │                            │  {email, password}         │
      │                            │ ─────────────────────────▶ │
      │                            │                            │
      │                            │  3. {access_token: "jwt"}  │
      │                            │ ◀───────────────────────── │
      │                            │                            │
      │  4. Set-Cookie:            │                            │
      │     rumi_token=jwt;        │                            │
      │     httpOnly; secure;      │                            │
      │     path=/; sameSite=lax   │                            │
      │ ◀───────────────────────── │                            │
      │                            │                            │
      │  5. AuthProvider.refresh() │                            │
      │     GET /api/auth/me       │                            │
      │ ─────────────────────────▶ │                            │
      │                            │  6. GET /api/user/me       │
      │                            │  Authorization: Bearer jwt │
      │                            │ ─────────────────────────▶ │
      │                            │                            │
      │                            │  7. {id, email, prefs...}  │
      │                            │ ◀───────────────────────── │
      │                            │                            │
      │  8. {authenticated: true,  │                            │
      │      user: {...}}          │                            │
      │ ◀───────────────────────── │                            │
      │                            │                            │
      │  9. status = authenticated │                            │
      │     user = {id, email, …}  │                            │
      │     Navbar updates         │                            │
      │     Redirect to /chat      │                            │


  ── Guest Flow (No Login) ──

      │  1. POST /api/chat         │                            │
      │  (no cookie)               │                            │
      │ ─────────────────────────▶ │                            │
      │                            │  2. POST /api/chat         │
      │                            │  (no Authorization header) │
      │                            │ ─────────────────────────▶ │
      │                            │                            │
      │                            │  3. get_optional_user → None │
      │                            │     resolve_user_id →       │
      │                            │     get_or_create_guest_user│
      │                            │     → guest UUID            │
      │                            │                            │
      │                            │  4. Chat proceeds normally  │


  ── Kakao OAuth Flow ──

      │  1. Click Kakao button      │                            │
      │     GET /api/auth/kakao/    │                            │
      │     start                   │                            │
      │ ─────────────────────────▶ │                            │
      │                            │  2. Redirect to Kakao       │
      │                            │     authorization page      │
      │                            │ ─────────────────────────▶ │
      │                            │                            │
      │  3. User authorizes         │                            │
      │     Kakao redirects to      │                            │
      │     /api/auth/kakao/        │                            │
      │     callback?code=...       │                            │
      │ ◀───────────────────────── │                            │
      │                            │                            │
      │  4. GET /api/auth/kakao/    │                            │
      │     callback?code=...       │                            │
      │ ─────────────────────────▶ │                            │
      │                            │  5. POST /api/auth/kakao    │
      │                            │  {code, redirect_uri}       │
      │                            │ ─────────────────────────▶ │
      │                            │                            │
      │                            │  6. Exchange code for token │
      │                            │     Fetch user info         │
      │                            │     Create/update user      │
      │                            │     (provider='kakao')      │
      │                            │                            │
      │                            │  7. {token: "jwt"}          │
      │                            │ ◀───────────────────────── │
      │                            │                            │
      │  8. Set-Cookie:            │                            │
      │     rumi_token=jwt;        │                            │
      │     httpOnly; secure;      │                            │
      │     path=/; sameSite=lax   │                            │
      │     Redirect to /chat      │                            │
      │ ◀───────────────────────── │                            │
```

---

## 7. Data Model

### 7.1 Entity Relationship Diagram

```
┌────────────────┐       ┌──────────────────┐       ┌────────────────┐
│     Users      │       │  Chat_Sessions   │       │    Messages    │
├────────────────┤       ├──────────────────┤       ├────────────────┤
│ id        (PK) │──┐    │ id          (PK) │──┐    │ id        (PK) │
│ email   (uniq) │  │    │ user_id     (FK) │  │    │ session_id(FK) │
│ password_hash  │  └───▶│ source_mode      │  └───▶│ role           │
│ provider       │       │ created_at       │       │ message_text   │
│ provider_user_ │       └──────────────────┘       │ language       │
│   id           │                                  │ verse_id  (FK) │
│ avatar_url     │                                  │ citation_ids[] │
│ preferred_lang │                                  │ feedback       │
│ theme          │                                  │ created_at     │
│ is_guest       │                                  │                │
│ is_deleted     │                                  │                │
│ created_at     │                                  │                │
│ last_login     │                                  │                │
└───────┬────────┘                                  └───────┬────────┘
        │                                                   │
        │  ┌──────────────────┐                             │
        └─▶│ Feedback_Reports │◀────────────────────────────┘
           ├──────────────────┤
           │ id          (PK) │
           │ message_id  (FK) │  (optional)
           │ user_id     (FK) │
           │ session_id       │  (optional)
           │ issue_type       │
           │ comment          │
           │ created_at       │
           └──────────────────┘

┌────────────────┐       ┌────────────────┐       ┌────────────────┐
│     Books      │       │     Verses     │       │   Citations    │
├────────────────┤       ├────────────────┤       ├────────────────┤
│ id        (PK) │──┐    │ id        (PK) │──┐    │ id        (PK) │
│ title          │  │    │ book_id   (FK) │  │    │ verse_id  (FK) │
│ title_en       │  └───▶│ line_number    │  └───▶│ book_id   (FK) │
│ pdf_url        │       │ text_fa        │       │ page_number    │
│ type           │       │ text_en        │       │ line_range     │
│ created_at     │       │ text_kr        │       │ highlight_box  │
└────────────────┘       │ (embedding)    │       │ snippet        │
                         │ created_at     │       └────────────────┘
                         └────────────────┘
```

### 7.2 Key Relationships

```
User  ──< 1:N >──  ChatSession  ──< 1:N >──  Message
User  ──< 1:N >──  FeedbackReport
Message  ──< 0:1 >──  FeedbackReport
Book  ──< 1:N >──  Verse  ──< 1:N >──  Citation
Message.verse_id  ──>  Verse  (optional FK)
Message.citation_ids  ──>  Citation[]  (UUID array)
```

---

## 8. API Contract Map

### 8.1 Chat Contracts

```
┌────────────────────────────────────────────────────┐
│  ChatRequest (POST body)                           │
├────────────────────────────────────────────────────┤
│  question:      string   (required)                │
│  language:      "fa"|"en"|"kr"  (default "fa")     │
│  session_id:    UUID | null                        │
│  source_scope:  "books"|"web_books"|"web"          │
│  history:       [{role, content}, ...]  (max 6)    │
│  verse_id:      UUID | null                        │
│  citation_ids:  UUID[] | null                      │
└────────────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────────────┐
│  ChatResponse (JSON body)                          │
├────────────────────────────────────────────────────┤
│  session_id:           UUID                        │
│  verse:                {fa, en, kr}                │
│  interpretation:       string                      │
│  advice:               string | string[]           │
│  citations:            CitationSummary[]           │
│  retrieved_candidates: RetrievedCandidate[] | null │
│  grounded:             boolean                     │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│  CitationSummary                                   │
├────────────────────────────────────────────────────┤
│  id:          UUID                                 │
│  book:        string                               │
│  page_number: number                               │
│  snippet:     string                               │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│  SSE Events (streaming)                            │
├────────────────────────────────────────────────────┤
│  {"type":"chunk",  "text":"partial..."}            │
│  {"type":"done",   "session_id":"...",             │
│   "verse":{...}, "interpretation":"...",           │
│   "advice":"...", "citations":[...],               │
│   "grounded":true}                                 │
│  {"type":"error",  "message":"..."}                │
└────────────────────────────────────────────────────┘
```

### 8.2 Auth Contracts

```
┌─────────────────────┐    ┌──────────────────────────┐
│  LoginRequest       │    │  LoginResponse           │
├─────────────────────┤    ├──────────────────────────┤
│  email:    string   │    │  access_token: string    │
│  password: string   │    │  token_type:   "bearer"  │
└─────────────────────┘    └──────────────────────────┘

┌─────────────────────┐    ┌──────────────────────────┐
│  SignupRequest      │    │  AuthMeResponse (BFF)    │
├─────────────────────┤    ├──────────────────────────┤
│  email:    string   │    │  authenticated: boolean  │
│  password: string   │    │  user: AuthUser | null   │
└─────────────────────┘    └──────────────────────────┘

┌──────────────────────────────┐
│  AuthUser                    │
├──────────────────────────────┤
│  id:            string       │
│  email:         string       │
│  preferredLang: string?      │
│  theme:         string?      │
│  avatarUrl:     string?      │  (OAuth profile image)
│  createdAt:     string       │
│  lastLogin:     string?      │
│  isDeleted:     boolean      │
└──────────────────────────────┘
```

### 8.3 Feedback Contract

```
┌────────────────────────────────────────────────────┐
│  FeedbackRequest (POST body)                       │
├────────────────────────────────────────────────────┤
│  session_id:  UUID | null  (optional)              │
│  message_id:  UUID | null  (optional)              │
│  issue_type:  string  (general | bug | feature |   │
│               appreciation | ocr_error | etc.)     │
│  comment:     string | null                        │
└────────────────────────────────────────────────────┘
```

---

## 9. Streaming (SSE) Flow

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  Chat Page   │         │  BFF stream  │         │  Backend     │
│  (React)     │         │  route.ts    │         │  chat_stream │
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │                        │                        │
       │  1. fetch('/api/chat/stream', {method:'POST'})  │
       │ ─────────────────────▶ │                        │
       │                        │  2. fetch(BACKEND+'/api/chat/stream')
       │                        │ ─────────────────────▶ │
       │                        │                        │
       │                        │  3. StreamingResponse  │
       │                        │     media: text/event-stream
       │                        │ ◀───────────────────── │
       │                        │                        │
       │  4. ReadableStream     │                        │
       │ ◀───────────────────── │                        │
       │                        │                        │
       │  5. stream-chat.ts reads chunks                 │
       │     ─── SSE parsing loop ───                    │
       │                        │                        │
       │  ┌── data: {"type":"chunk","text":"In "}        │
       │  │   onChunk("In ") → append to message         │
       │  │                                              │
       │  ├── data: {"type":"chunk","text":"the "}       │
       │  │   onChunk("the ") → append to message        │
       │  │                                              │
       │  ├── data: {"type":"chunk","text":"story…"}     │
       │  │   onChunk("story…") → append to message      │
       │  │                                              │
       │  └── data: {"type":"done","verse":{…},…}        │
       │      onComplete({verse, interpretation, …})     │
       │      → merge structured data into message       │
       │      → show verse card, citations               │
       │                                                 │
       │  6. If SSE fails → fallback POST /api/chat      │
```

---

## 10. Internationalization & Theming

### 10.1 Language Flow

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  User selects │     │  I18nProvider  │     │  Backend      │
│  language     │     │  (Context)     │     │  receives     │
│  in Navbar /  │────▶│  Sets:         │────▶│  language     │
│  Profile      │     │  • language    │     │  in request   │
└───────────────┘     │  • dir (rtl?)  │     │  body         │
                      │  • translations│     └───────┬───────┘
                      └───────────────┘             │
                                                    ▼
                                          ┌───────────────────┐
                                          │  PromptBuilder    │
                                          │  builds prompts   │
                                          │  in that language  │
                                          └───────────────────┘

Language Codes:
  Frontend:  'en' | 'fa' | 'kr'
  Backend:   'EN' | 'FA' | 'KR'  (normalised via _LANG_MAP)
  DB fields: text_fa, text_en, text_kr (on Verse model)
```

### 10.2 Theme System

```
  ThemeProvider (localStorage + CSS data-attribute)
        │
        ├── Sets: document.documentElement.dataset.theme = 'light' | 'dark'
        │
        └── CSS custom properties in tokens.css:
              --bg-primary, --bg-secondary
              --text-primary, --text-muted
              --accent-gold, --accent-teal
              --material-bg-surface, --material-bg-surface-2
              --material-border, --material-shadow-*
              …

  [data-theme='light'] { --bg-primary: warm parchment; … }
  [data-theme='dark']  { --bg-primary: dark slate; … }
```

---

## 11. Infrastructure & Deployment

### 11.1 Development Setup

```
┌─────────────────────────────────────────────────────────┐
│                    Developer Machine                     │
│                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │  Next.js    │    │  FastAPI    │    │  Docker     │ │
│  │  dev server │    │  uvicorn   │    │  ─────────  │ │
│  │  :3000      │───▶│  :8000     │───▶│  PostgreSQL │ │
│  │             │    │            │    │  :5432      │ │
│  │  (pnpm dev) │    │  (reload)  │    │  (Adminer   │ │
│  └─────────────┘    └─────────────┘    │   :8080)    │ │
│                                        └─────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 11.2 Docker Compose Services

```
┌───────────────────────────────────────────────────┐
│              docker-compose.yml                    │
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │    db    │  │   api    │  │  nginx   │        │
│  │ Postgres │  │ FastAPI  │  │ Reverse  │        │
│  │   :5432  │◀─│   :8000  │◀─│  Proxy   │        │
│  │  alpine  │  │ Dockerfile│  │   :80    │        │
│  └──────────┘  └──────────┘  └──────────┘        │
│                                                   │
│  ┌──────────┐                                     │
│  │ adminer  │  Database management UI             │
│  │   :8080  │                                     │
│  └──────────┘                                     │
│                                                   │
│  Volumes: postgres_data, logs, media              │
└───────────────────────────────────────────────────┘
```

### 11.3 Middleware Stack (Request Lifecycle)

```
  Incoming HTTP Request
        │
        ▼
  ┌─ CORS Middleware ────────────────────────┐
  │  Validates origin, sets headers          │
  └──────────────┬───────────────────────────┘
                 │
  ┌─ Request Validator ──────────────────────┐
  │  Checks content-type, size (10MB max)    │
  └──────────────┬───────────────────────────┘
                 │
  ┌─ Rate Limiter ───────────────────────────┐
  │  100 req/min general                     │
  │  30 req/min on /api/chat                 │
  │  Sliding window (in-memory)              │
  └──────────────┬───────────────────────────┘
                 │
  ┌─ Router ─────┴───────────────────────────┐
  │  Depends(get_optional_user) or           │
  │  Depends(get_current_user)               │
  │  → Reads Authorization header            │
  │  → Verifies JWT (python-jose)            │
  │  → Returns User or None                  │
  └──────────────────────────────────────────┘
```

---

## 12. Future Architecture (Planned)

### 12.1 Enhanced RAG Pipeline

```
  Current (MVP):
  ┌──────────┐     ┌──────────┐     ┌──────────┐
  │  User    │────▶│ SQL LIKE │────▶│  LLM     │
  │  Query   │     │ retrieval│     │ generate  │
  └──────────┘     └──────────┘     └──────────┘

  Planned:
  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
  │  User    │────▶│ Embedding│────▶│ pgvector │────▶│ Reranker │
  │  Query   │     │ (model)  │     │ + BM25   │     │ (cross-  │
  └──────────┘     └──────────┘     │ hybrid   │     │ encoder) │
                                    └──────────┘     └────┬─────┘
                                                         │
                                                         ▼
                                                    ┌──────────┐
                                                    │  LLM     │
                                                    │ generate  │
                                                    └──────────┘
```

### 12.2 Planned Infrastructure

```
┌───────────────────────────────────────────────────────────────┐
│                        Future Stack                            │
│                                                               │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐ │
│  │ PostgreSQL│  │  pgvector │  │   Redis   │  │ Elastic-  │ │
│  │  (data)   │  │(embeddings│  │  (cache + │  │  search   │ │
│  │           │  │  + ANN)   │  │  sessions)│  │  (BM25)   │ │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘ │
│                                                               │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐                │
│  │  Object   │  │  Neo4j    │  │  Celery + │                │
│  │  Storage  │  │ (knowledge│  │  Redis    │                │
│  │ (PDFs/img)│  │   graph)  │  │ (async)   │                │
│  └───────────┘  └───────────┘  └───────────┘                │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │           OCR / Alignment / Indexing Pipeline          │   │
│  │  PDF → OCR → Text extraction → Alignment →            │   │
│  │  Embedding → pgvector indexing → Citation mapping      │   │
│  └───────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

### 12.3 Planned Endpoints

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `GET /api/chat/history/:sessionId` | Reload chat history | 🔜 Planned |
| `GET /api/search` (vector) | Semantic verse search | 🔜 pgvector needed |
| `POST /api/books/ingest` | Upload + OCR + index a book | 🔜 Pipeline needed |
| `GET /api/graph/explore` | Knowledge graph traversal | 🔮 Future |
| `GET /api/user/saved-quotes` | Bookmarked verses | 🔮 Future |
| `WS /api/chat/ws` | WebSocket chat (alt to SSE) | 🔮 Future |

---

## Appendix: File Index

### Frontend — Key Files

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout with provider tree |
| `src/app/chat/page.tsx` | Chat page with SSE streaming |
| `src/app/books/page.tsx` | Books library browser |
| `src/app/profile/page.tsx` | User settings with hydration guard |
| `src/app/login/LoginPageClient.tsx` | Login/signup form logic |
| `src/lib/auth/auth-context.tsx` | AuthProvider + useAuth |
| `src/lib/api/stream-chat.ts` | SSE streaming helper |
| `src/lib/api/bff.ts` | Shared BFF utilities |
| `src/features/chat/components/MessageBubble.tsx` | Chat message rendering |
| `src/features/chat/components/ChatHeader.tsx` | Source scope + cite toggle |
| `src/styles/tokens.css` | Design token definitions |
| `src/types/chat.ts` | Chat TypeScript interfaces |
| `src/types/auth.ts` | Auth TypeScript interfaces |

### Backend — Key Files

| File | Purpose |
|------|---------|
| `main.py` | App entry point, middleware, routers |
| `app/config.py` | Centralised settings (pydantic-settings) |
| `app/database.py` | SQLAlchemy engine + session |
| `app/models.py` | ORM models (7 tables) |
| `app/schemas.py` | Pydantic request/response schemas |
| `app/routers/chat.py` | POST /api/chat handler |
| `app/routers/chat_stream.py` | POST /api/chat/stream SSE handler |
| `app/routers/_session.py` | Shared session/user helpers |
| `app/services/chat_service.py` | RAG pipeline orchestrator |
| `app/services/prompt_builder.py` | Prompt construction + parsing |
| `app/services/llm_generation.py` | LLM API integration |
| `app/services/multilingual_generation.py` | Context retrieval prep |
| `app/middleware/auth.py` | JWT verification |
