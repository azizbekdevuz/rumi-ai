# BFF Integration Setup Guide

This document describes the BFF (Backend for Frontend) proxy integration between the Next.js frontend and FastAPI backend.

## Architecture

```
Browser → Next.js API Routes (BFF) → FastAPI Backend → Database
```

- **Browser** never directly calls the backend
- **Next.js API routes** act as a proxy layer, handling:
  - Request/response transformation
  - Cookie-based authentication
  - Error handling

## Environment Variables

### Frontend (.env.local)

Create a `.env.local` file in the project root:

```bash
# Backend API URL (server-only, not exposed to browser)
BACKEND_URL=http://localhost:8000
```

**Important:** `BACKEND_URL` is a server-only variable (not prefixed with `NEXT_PUBLIC_`), so it's only available in Next.js API routes, not in browser code.

### Backend (.env)

Create a `.env` file in the `backend/` directory:

```bash
# Database
DATABASE_URL=postgresql://rumi_user:rumi_password@localhost:5432/rumi_ai

# Security
SECRET_KEY=your-secret-key-change-in-production
ALLOWED_HOSTS=http://localhost:3000,http://127.0.0.1:3000

# JWT Configuration
JWT_EXPIRATION_HOURS=24

# LLM Configuration (if needed)
LLM_API_KEY=your-llm-api-key
LLM_API_URL=https://api.openai.com/v1/chat/completions
LLM_MODEL=gpt-4
```

## Database Setup

### Guest User

The system uses a dedicated "guest user" for anonymous chat sessions. The guest user is automatically created on first use.

**Guest User Details:**
- Email: `guest@rumi.ai`
- Password: Cannot login (password hash is set but user is system-managed)
- Purpose: All anonymous chat sessions are tied to this user

**No migration needed** - the guest user is created automatically via the `get_or_create_guest_user()` service function.

## API Routes

### Frontend BFF Routes

#### `POST /api/chat`
- **Input:** Frontend `ChatRequest` format
- **Transforms:** `message` → `question`, extracts `language`
- **Auth:** Reads `rumi_token` cookie, forwards as `Authorization: Bearer <token>`
- **Output:** Frontend `ChatResponse` format with transformed fields

#### `POST /api/auth/login`
- **Input:** `{email, password}`
- **Calls:** Backend `/api/auth/login`
- **Sets:** `rumi_token` httpOnly cookie
- **Output:** `{success: boolean, message?: string}`

#### `POST /api/auth/logout`
- **Clears:** `rumi_token` cookie
- **Output:** `{success: boolean, message?: string}`

#### `POST /api/auth/signup`
- **Input:** `{email, password}`
- **Calls:** Backend `/api/auth/signup`
- **Output:** `{success: boolean, message?: string}`

### Backend Routes

All backend routes remain unchanged. The BFF layer handles transformation.

## Contract Mapping

### Chat Request Transformation

| Frontend Field | Backend Field | Notes |
|---------------|---------------|-------|
| `message` | `question` | Direct mapping |
| `language` | `language` | Direct mapping |
| `country` | - | Ignored (not in backend) |
| `sourceScope` | - | Ignored (not in backend) |
| `history` | - | Ignored (not in backend) |

### Chat Response Transformation

| Backend Field | Frontend Field | Transformation |
|---------------|----------------|----------------|
| `advice: str` | `advice: string[]` | Split on newlines/bullets, fallback to single-item array |
| `citations[].id` | `citations[].refId` | Direct mapping |
| `citations[].page_number` | `citations[].page` | Direct mapping |
| `citations[].book` | `citations[].book` | Direct mapping |
| `citations[].snippet` | `citations[].snippet` | Direct mapping |
| `verse` | `verse` | Direct mapping (fa, en?, kr?) |
| `interpretation` | `interpretation` | Direct mapping |

## Authentication Flow

1. **Login:**
   - Browser → `POST /api/auth/login` (Next.js route)
   - Next.js route → `POST /api/auth/login` (FastAPI backend)
   - Backend returns JWT token
   - Next.js route sets `rumi_token` httpOnly cookie
   - Browser receives success response (no token in body)

2. **Authenticated Request:**
   - Browser → `POST /api/chat` (Next.js route)
   - Next.js route reads `rumi_token` cookie
   - Next.js route → `POST /api/chat` (FastAPI backend) with `Authorization: Bearer <token>`
   - Backend validates token and processes request
   - Next.js route transforms response and returns to browser

3. **Anonymous Request:**
   - Browser → `POST /api/chat` (Next.js route, no cookie)
   - Next.js route → `POST /api/chat` (FastAPI backend, no Authorization header)
   - Backend uses guest user for session
   - Next.js route transforms response and returns to browser

4. **Logout:**
   - Browser → `POST /api/auth/logout` (Next.js route)
   - Next.js route deletes `rumi_token` cookie
   - Browser receives success response

## Verification Steps

### 1. Test Anonymous Chat

```bash
# Start backend
cd backend
uvicorn main:app --reload

# Start frontend (in another terminal)
npm run dev

# Test anonymous chat via curl
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is love?",
    "language": "en",
    "country": "KR",
    "sourceScope": "books",
    "history": []
  }'
```

Expected: Should return chat response with guest user session created in database.

### 2. Test Login

```bash
# First, create a user via signup or directly in database
# Then test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' \
  -v
```

Expected: Should see `Set-Cookie: rumi_token=...` in response headers.

### 3. Test Authenticated Chat

```bash
# Use the cookie from login response
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: rumi_token=<token-from-login>" \
  -d '{
    "message": "What is wisdom?",
    "language": "en",
    "country": "KR",
    "sourceScope": "books",
    "history": []
  }'
```

Expected: Should return chat response with authenticated user session.

### 4. Test Logout

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Cookie: rumi_token=<token>" \
  -v
```

Expected: Should clear the cookie (see `Set-Cookie: rumi_token=; Max-Age=0`).

## Database Verification

Check that guest user exists and anonymous sessions use it:

```sql
-- Check guest user
SELECT * FROM users WHERE email = 'guest@rumi.ai';

-- Check anonymous chat sessions (should have guest user ID)
SELECT cs.*, u.email 
FROM chat_sessions cs
JOIN users u ON cs.user_id = u.id
WHERE u.email = 'guest@rumi.ai'
ORDER BY cs.created_at DESC
LIMIT 10;
```

## Troubleshooting

### CORS Errors
- Ensure `ALLOWED_HOSTS` in backend `.env` includes `http://localhost:3000`
- Backend CORS is mainly for future direct calls; BFF pattern doesn't require it

### Cookie Not Set
- Check that `secure` flag is `false` in development (localhost)
- Check that `sameSite: 'lax'` is set
- Verify cookie is httpOnly (should not be accessible via `document.cookie`)

### Token Not Forwarded
- Verify cookie name is `rumi_token` (matches in login route and chat route)
- Check that cookie is being sent in request (browser DevTools → Network → Request Headers)

### Guest User Not Created
- Check database connection
- Verify `get_or_create_guest_user()` is being called
- Check database logs for errors

## Next Steps

1. **Add more BFF routes** as needed (search, books, feedback, etc.)
2. **Add request validation** in BFF routes
3. **Add rate limiting** at BFF layer
4. **Add logging/monitoring** for BFF routes
5. **Add error handling** for specific backend error codes
