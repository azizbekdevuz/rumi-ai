# Contributing to Rumi AI Agent

Thank you for your interest in contributing. This document provides guidelines specific to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Authentication & OAuth](#authentication--oauth)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold these standards.

## Getting Started

1. **Fork and clone** the repository
2. **Read the docs**:
   - [README.md](README.md) — setup and overview
   - [ARCHITECTURE.md](ARCHITECTURE.md) — system architecture
   - [AUTH_PROVIDER_CONTRACT.md](AUTH_PROVIDER_CONTRACT.md) — OAuth integration rules

3. **Open an issue** before large changes to discuss scope and approach

## Development Setup

### Prerequisites

- **Node.js** ≥ 20, **pnpm** ≥ 10
- **Python** ≥ 3.9
- **Docker** and **Docker Compose** (for PostgreSQL)

### Backend

```bash
cd backend
docker-compose up db -d
cp .env.example .env   # edit with your keys
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
# from project root
pnpm install
cp .env.local.example .env.local   # set BACKEND_URL, OAuth keys
pnpm dev
```

Frontend runs on **port 3003** by default. OAuth redirect URIs in `.env` and provider consoles must match (e.g. `http://localhost:3003/api/auth/google/callback`).

## Project Structure

| Layer | Purpose |
|-------|---------|
| `src/app/` | Next.js App Router pages and BFF API routes |
| `src/features/` | Feature-scoped components (auth, chat, profile, books) |
| `src/lib/` | Shared libraries (auth, api, i18n, theme) |
| `backend/app/routers/` | FastAPI route handlers (thin controllers) |
| `backend/app/services/` | Business logic (RAG, LLM, search) |
| `backend/app/models.py` | SQLAlchemy ORM models |
| `backend/app/schemas.py` | Pydantic request/response schemas |

## Coding Standards

### Frontend (Next.js, React, TypeScript)

- Use **App Router** conventions; no `pages/` directory
- Prefer **server components** where possible; use `"use client"` only when needed
- Use **Tailwind CSS** and design tokens from `src/styles/tokens.css`
- Follow **i18n**: all user-facing strings via `src/lib/i18n/translations.ts` (FA, EN, KR)
- Respect `prefers-reduced-motion` in animations

### Backend (FastAPI, Python)

- **Routers** handle HTTP only; **services** contain business logic
- Use **Pydantic v2** schemas for all request/response validation
- Use `settings` from `app.config`; never `os.getenv()` directly
- Add **Alembic migrations** for schema changes; do not edit migrations by hand after they are applied

### General

- **No secrets in code** — use `.env` / `.env.local`; these files are gitignored
- **Minimal diffs** — avoid refactors unrelated to the change
- **Preserve existing behavior** — do not break auth, redirects, or session flows without explicit approval

## Authentication & OAuth

OAuth integration is strictly governed by [AUTH_PROVIDER_CONTRACT.md](AUTH_PROVIDER_CONTRACT.md). Key rules:

- **Redirect URI**: Backend must use server-configured `GOOGLE_REDIRECT_URI` / `KAKAO_REDIRECT_URI`; never trust client-supplied `redirect_uri` in token exchange
- **Provider model**: Reuse `provider`, `provider_user_id`, `avatar_url`, `display_name`; no provider-specific tables
- **Route structure**: `GET /api/auth/{provider}/start`, `GET /api/auth/{provider}/callback`, `POST /api/auth/{provider}`
- **Email conflict**: Return 409 when OAuth email matches existing email user; do not auto-merge

Before adding a new OAuth provider, read the contract and open an issue to align on implementation.

## Pull Request Process

1. **Branch** from `main`; use a descriptive name (e.g. `feat/add-apple-oauth`, `fix/chat-history-cache`)

2. **Scope** — one logical change per PR; avoid mixing features, fixes, and refactors

3. **Checks** before submitting:
   ```bash
   pnpm lint
   npx tsc --noEmit
   cd backend && python -m py_compile app/routers/auth.py
   ```

4. **Description** — include:
   - What changed and why
   - How to test (manual steps if no automated tests)
   - Screenshots for UI changes

5. **Review** — address feedback; maintainers may request changes

6. **Merge** — squash or merge per maintainer preference

## Testing

- **Lint**: `pnpm lint` (ESLint)
- **Type check**: `npx tsc --noEmit`
- **Backend syntax**: `python -m py_compile app/<module>.py`

Manual testing is expected for:

- Auth flows (email login, signup, Google, Kakao)
- OAuth redirect and callback
- Chat streaming (SSE)
- Profile and settings persistence
- RTL layout (Persian)

Automated tests are planned; contributions to add tests are welcome.

---

Thank you for contributing to Rumi AI Agent.
