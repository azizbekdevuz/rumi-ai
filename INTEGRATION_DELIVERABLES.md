# BFF Integration Deliverables

This document summarizes all code changes, database setup, and verification steps for the BFF proxy integration.

## A) Backend: Guest User Design

### Files Created/Modified

1. **`backend/app/services/guest_user.py`** (NEW)
   - Service function: `get_or_create_guest_user(db: Session) -> User`
   - Idempotent: Creates guest user if doesn't exist, returns existing if found
   - Guest user email: `guest@rumi.ai`
   - Password: System-managed (cannot login normally)

2. **`backend/app/routers/chat.py`** (MODIFIED)
   - Updated anonymous user handling
   - Replaced `user_id=None` with `get_or_create_guest_user(db).id`
   - All anonymous sessions now tied to guest user

### Database Changes

**No migration required** - Guest user is created automatically via service function.

**Guest User Details:**
- Email: `guest@rumi.ai` (unique constraint ensures single guest user)
- Password hash: System-generated (user cannot login)
- Created: Automatically on first anonymous chat request

### Verification

```sql
-- Check guest user exists
SELECT * FROM users WHERE email = 'guest@rumi.ai';

-- Verify anonymous sessions use guest user
SELECT cs.*, u.email 
FROM chat_sessions cs
JOIN users u ON cs.user_id = u.id
WHERE u.email = 'guest@rumi.ai';
```

## B) Frontend: Chat BFF Route

### Files Created/Modified

1. **`src/app/api/chat/route.ts`** (REPLACED)
   - Removed mock implementation
   - Added real backend proxy
   - Request transformation: `message` → `question`
   - Response transformation: `advice: str` → `advice: string[]`, citation field mapping
   - Cookie-based auth forwarding: Reads `rumi_token`, sends `Authorization: Bearer <token>`
   - Error handling: Preserves backend status codes, returns 502 for backend errors

### Contract Transformations

See `CONTRACT_MAPPING.md` for detailed transformation table.

## C) Frontend: Auth BFF Routes

### Files Created

1. **`src/app/api/auth/login/route.ts`** (NEW)
   - Accepts `{email, password}`
   - Calls backend `/api/auth/login`
   - Sets httpOnly cookie: `rumi_token`
   - Cookie settings:
     - `httpOnly: true`
     - `secure: true` (production), `false` (development)
     - `sameSite: 'lax'`
     - `path: '/'`
     - `maxAge: 24 hours`
   - Returns `{success: boolean, message?: string}` (no token in body)

2. **`src/app/api/auth/logout/route.ts`** (NEW)
   - Deletes `rumi_token` cookie
   - Returns `{success: boolean, message?: string}`

3. **`src/app/api/auth/signup/route.ts`** (NEW)
   - Accepts `{email, password}`
   - Calls backend `/api/auth/signup`
   - Optional: Auto-login after signup
   - Returns `{success: boolean, message?: string}`

### Files Modified

1. **`src/app/login/LoginPageClient.tsx`** (MODIFIED)
   - Replaced mocked login with `/api/auth/login` call
   - Replaced mocked signup with `/api/auth/signup` call
   - Removed localStorage token handling
   - Added error handling from API responses
   - Auto-login after successful signup

## D) Environment Variables and Config

### Files Created/Modified

1. **`backend/app/config.py`** (MODIFIED)
   - Updated `ALLOWED_HOSTS` default to include protocol and port
   - Default: `"http://localhost:3000,http://127.0.0.1:3000"`
   - Updated comment to explain BFF pattern

2. **`.env.local.example`** (NEW - if not blocked)
   - Sample frontend environment variables
   - `BACKEND_URL=http://localhost:8000` (server-only)

3. **`backend/.env.example`** (NEW - if not blocked)
   - Sample backend environment variables
   - Includes `ALLOWED_HOSTS` with protocol/port

### Environment Variables Required

**Frontend (`.env.local`):**
```bash
BACKEND_URL=http://localhost:8000
```

**Backend (`.env`):**
```bash
ALLOWED_HOSTS=http://localhost:3000,http://127.0.0.1:3000
DATABASE_URL=postgresql://rumi_user:rumi_password@localhost:5432/rumi_ai
SECRET_KEY=your-secret-key-change-in-production
JWT_EXPIRATION_HOURS=24
```

## Verification Steps

### 1. Anonymous Chat (No Auth)

```bash
# Start backend
cd backend
uvicorn main:app --reload

# Start frontend (in another terminal)
npm run dev

# Test anonymous chat
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

**Expected:**
- Status: 200
- Response: Chat response with `advice` as array, `citations` with `refId` and `page`
- Database: Guest user created (if first time), session created with guest user ID

**Verify in database:**
```sql
SELECT cs.id, cs.created_at, u.email 
FROM chat_sessions cs
JOIN users u ON cs.user_id = u.id
WHERE u.email = 'guest@rumi.ai'
ORDER BY cs.created_at DESC
LIMIT 1;
```

### 2. Login (Check Cookie)

```bash
# First, ensure a user exists (create via signup or directly in DB)
# Then test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' \
  -v
```

**Expected:**
- Status: 200
- Response: `{"success": true, "message": "Login successful"}`
- Headers: `Set-Cookie: rumi_token=<jwt-token>; HttpOnly; Path=/; SameSite=Lax`
- **No token in response body**

### 3. Authenticated Chat (With Cookie)

```bash
# Use cookie from login response
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: rumi_token=<token-from-step-2>" \
  -d '{
    "message": "What is wisdom?",
    "language": "en",
    "country": "KR",
    "sourceScope": "books",
    "history": []
  }'
```

**Expected:**
- Status: 200
- Response: Chat response
- Database: Session created with authenticated user ID (not guest user)

**Verify in database:**
```sql
SELECT cs.id, cs.created_at, u.email 
FROM chat_sessions cs
JOIN users u ON cs.user_id = u.id
WHERE u.email = 'test@example.com'
ORDER BY cs.created_at DESC
LIMIT 1;
```

### 4. Logout (Clear Cookie)

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Cookie: rumi_token=<token>" \
  -v
```

**Expected:**
- Status: 200
- Response: `{"success": true, "message": "Logout successful"}`
- Headers: `Set-Cookie: rumi_token=; Max-Age=0; Path=/`

### 5. Signup Flow

```bash
# Test signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123"
  }'

# Should return success, then auto-login sets cookie
```

**Expected:**
- Status: 200 (or 201)
- Response: `{"success": true, "message": "Account created successfully"}`
- If auto-login enabled: Cookie set in response

## Contract Mapping Table

See `CONTRACT_MAPPING.md` for complete transformation details.

### Quick Reference

| Frontend → Backend | Backend → Frontend |
|-------------------|-------------------|
| `message` → `question` | `advice: str` → `advice: string[]` (split) |
| `language` → `language` | `citations[].id` → `citations[].refId` |
| `country`, `sourceScope`, `history` → ignored | `citations[].page_number` → `citations[].page` |
| Cookie `rumi_token` → Header `Authorization: Bearer` | `verse`, `interpretation` → direct mapping |

## Error Handling

### Backend Errors

- **401 Unauthorized:** Invalid credentials → Frontend receives `{success: false, message: "Invalid email or password"}`
- **400 Bad Request:** Validation error → Frontend receives `{success: false, message: <backend detail>}`
- **500 Internal Server Error:** Backend error → Frontend receives `{error: <backend error text>}` with status 502

### BFF Errors

- **500 Internal Server Error:** BFF processing error → Frontend receives `{error: "Failed to process request"}`

## Database Migration Steps

**No migration required** - Guest user is created automatically.

However, if you want to manually seed the guest user:

```sql
-- Check if guest user exists
SELECT * FROM users WHERE email = 'guest@rumi.ai';

-- If not exists, create it (or let the service create it automatically)
-- The service will create it on first anonymous chat request
```

## Seeding Steps

**Automatic:** Guest user is created on first use via `get_or_create_guest_user()`.

**Manual (optional):**
```python
# In Python shell or migration script
from app.database import SessionLocal
from app.services.guest_user import get_or_create_guest_user

db = SessionLocal()
guest_user = get_or_create_guest_user(db)
print(f"Guest user created/found: {guest_user.id}")
db.close()
```

## Testing Checklist

- [ ] Anonymous chat works (creates guest user session)
- [ ] Login sets httpOnly cookie
- [ ] Authenticated chat uses user session (not guest)
- [ ] Logout clears cookie
- [ ] Signup creates user and optionally logs in
- [ ] Error handling preserves backend status codes
- [ ] Response transformations work (advice array, citation mapping)
- [ ] Cookie not accessible via `document.cookie` (httpOnly)
- [ ] Backend CORS allows Next.js origin

## Next Steps

1. **Add more BFF routes** for other endpoints (search, books, feedback)
2. **Add request validation** in BFF routes
3. **Add rate limiting** at BFF layer
4. **Add logging** for BFF requests
5. **Add monitoring** for BFF performance
