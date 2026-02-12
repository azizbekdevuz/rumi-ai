# Forensic Integration Audit Report
## RUMI AI Agent - Monorepo Integration Analysis

**Date:** 2025-01-22  
**Scope:** Frontend (Next.js) ↔ Backend (FastAPI) Integration  
**Methodology:** Evidence-based code analysis with exact file citations

---

## Executive Summary

The frontend and backend are **not integrated**. The frontend uses mocked responses for chat (`src/app/api/chat/route.ts:L13`) and authentication (`src/app/login/LoginPageClient.tsx:L159`). Critical blockers include: (1) ChatSession model constraint violation (user_id is NOT NULL but code attempts anonymous sessions), (2) CORS misconfiguration (ALLOWED_HOSTS lacks protocol/port for localhost:3000), (3) Type mismatches (advice: string vs string[], request schema mismatch), and (4) No API client infrastructure. **P0 blockers must be resolved before integration can proceed.**

---

## 1. Data Flow Analysis

### 1.1 Chat Flow

**Frontend Entry Point:**
- `src/app/chat/page.tsx:L65` → `fetch('/api/chat', ...)`
- Request payload: `{message, language, country, sourceScope, history}`

**Frontend API Route (MOCKED):**
- `src/app/api/chat/route.ts:L5-L22`
- **Evidence:** Line 13 calls `getMockResponse()` from `src/lib/data/mock-responses.ts:L42`
- Returns mock data immediately, no backend call

**Backend Endpoint (NOT CALLED):**
- `backend/app/routers/chat.py:L22-L156`
- Expected request: `{question: str, language: str}` (Pydantic schema `ChatRequest`)
- Response: `{verse, interpretation, advice: str, citations[]}` (Pydantic schema `ChatResponse`)

**Backend Service Layer:**
- `backend/app/services/chat_service.py:L19-L59` → processes via `MultilingualGenerationService` and `LLMGenerationService`
- `backend/app/routers/chat.py:L40-L61` → creates ChatSession (see **BLOCKER B**)

**Database:**
- `backend/app/models.py:L31-L42` → ChatSession model
- `backend/app/models.py:L45-L61` → Message model

**Issue:** Frontend sends `message` but backend expects `question`. Frontend sends `{message, language, country, sourceScope, history}` but backend only accepts `{question, language}`.

---

### 1.2 Authentication Flow

**Frontend Entry Point:**
- `src/app/login/LoginPageClient.tsx:L154-L193`
- **Evidence:** Line 159 comment: `// Simulate API call - replace with actual auth`
- Lines 160, 184: `await new Promise((resolve) => setTimeout(resolve, 1500))` - mock delay only
- No actual API calls to backend

**Backend Endpoints (NOT CALLED):**
- `backend/app/routers/auth.py:L30-L51` → `POST /api/auth/signup`
- `backend/app/routers/auth.py:L54-L81` → `POST /api/auth/login`
- Returns JWT token: `{token: str}`

**Auth Middleware:**
- `backend/app/middleware/auth.py:L43-L60` → `get_current_user()` (required auth)
- `backend/app/middleware/auth.py:L63-L83` → `get_optional_user()` (optional auth)

**Issue:** Frontend has no JWT token storage, no Authorization header logic, no API client.

---

### 1.3 Search Flow

**Frontend:** No search API calls found in codebase search.

**Backend Endpoint:**
- `backend/app/routers/search.py:L19-L77` → `GET /api/search?query=...&lang=...`
- Response: `{results: VerseSummary[]}`

**Status:** Not integrated.

---

### 1.4 Books Flow

**Frontend:** No books API calls found.

**Backend Endpoint:**
- `backend/app/routers/books.py:L18-L68` → `GET /api/books/{book_id}/pages/{page_number}`
- Response: `{book_id, page, verses[], highlighted[], pdf_url}`

**Status:** Not integrated.

---

### 1.5 Feedback Flow

**Frontend:** `src/features/chat/components/ReportModal.tsx` exists but no API call found.

**Backend Endpoint:**
- `backend/app/routers/feedback.py:L18-L63` → `POST /api/feedback`
- **Requires authentication:** `Depends(get_current_user)`
- Request: `{session_id, issue_type, comment}`
- Response: `{status, ticket_id}`

**Status:** Not integrated.

---

### 1.6 Citation Flow

**Frontend:** No citation API calls found.

**Backend Endpoint:**
- `backend/app/routers/citation.py:L18-L58` → `GET /api/citation/{citation_id}`
- Response: `{book, page_number, snippet, translation, bbox}`

**Status:** Not integrated.

---

## 2. Contract Matrix

| Feature | Frontend Type (TS) | Backend Schema (Pydantic) | Status | Mismatch Details |
|---------|-------------------|--------------------------|--------|------------------|
| **Chat Request** | `ChatRequest`<br/>`src/types/chat.ts:L38-L44`<br/>`{message, language, country, sourceScope, history}` | `ChatRequest`<br/>`backend/app/schemas.py:L252-L256`<br/>`{question: str, language: str}` | ❌ MISMATCH | Field names differ: `message` vs `question`. Frontend includes `country`, `sourceScope`, `history` not in backend. |
| **Chat Response - advice** | `advice: string[]`<br/>`src/types/chat.ts:L54` | `advice: str`<br/>`backend/app/schemas.py:L277` | ❌ MISMATCH | **Type mismatch: array vs string** |
| **Chat Response - verse** | `verse: {fa, en?, kr?}`<br/>`src/types/chat.ts:L48-L52` | `verse: VerseMultilingual`<br/>`backend/app/schemas.py:L258-L262`<br/>`{fa?, en?, kr?}` | ✅ MATCH | Optional fields match |
| **Chat Response - citations** | `citations: Citation[]`<br/>`src/types/chat.ts:L25-L30`<br/>`{book, page, refId, snippet}` | `citations: List[CitationSummary]`<br/>`backend/app/schemas.py:L265-L270`<br/>`{id, book?, page_number?, snippet?}` | ⚠️ PARTIAL | Field names: `page` vs `page_number`, `refId` missing in backend |
| **Auth Login Request** | N/A (mocked) | `UserLogin`<br/>`backend/app/schemas.py:L35-L38`<br/>`{email, password}` | ❌ NOT INTEGRATED | Frontend has no API call |
| **Auth Login Response** | N/A | `LoginResponse`<br/>`backend/app/schemas.py:L336-L338`<br/>`{token: str}` | ❌ NOT INTEGRATED | Frontend has no token handling |
| **Search Request** | N/A | `SearchRequest`<br/>`backend/app/schemas.py:L281-L285`<br/>Query params: `query, lang` | ❌ NOT INTEGRATED | No frontend implementation |
| **Feedback Request** | N/A | `FeedbackRequest`<br/>`backend/app/schemas.py:L364-L369`<br/>`{session_id, issue_type, comment}` | ❌ NOT INTEGRATED | No frontend API call |

**Single Source of Truth Recommendation:**
1. **Backend schemas** should be the source of truth (Pydantic)
2. Generate TypeScript types from OpenAPI schema (FastAPI auto-generates `/docs` JSON)
3. Use a tool like `openapi-typescript` to sync types

---

## 3. Bug-Risk Scan

### 3.1 Database Constraints vs Router Behavior

**BLOCKER B - ChatSession.user_id Constraint Violation:**

**Evidence:**
- Database schema: `backend/alembic/versions/001_create_erd_schema.py:L44` → `sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False)`
- Model: `backend/app/models.py:L36` → `user_id = Column(UUID(as_uuid=True), ForeignKey(...), nullable=False)`
- Router code: `backend/app/routers/chat.py:L52-L61`:
  ```python
  else:
      # For anonymous users, create a temporary session
      session = ChatSession(
          user_id=None,  # ❌ WILL FAIL - nullable=False constraint
          source_mode="chat"
      )
  ```

**Risk:** **P0 - Runtime Error.** Anonymous chat will crash with `IntegrityError: null value in column "user_id" violates not-null constraint`.

**Fix Required:** Either:
- Option A: Make `user_id` nullable in migration + model
- Option B: Create a system/anonymous user and assign sessions to it
- Option C: Use a separate "anonymous_sessions" table

---

### 3.2 Auth Requirements vs Anonymous Flow

**Current State:**
- Chat endpoint: `backend/app/routers/chat.py:L25` → `Depends(get_optional_user)` ✅ Allows anonymous
- Search endpoint: `backend/app/routers/search.py:L23` → `Depends(get_optional_user)` ✅ Allows anonymous
- Feedback endpoint: `backend/app/routers/feedback.py:L21` → `Depends(get_current_user)` ❌ Requires auth

**Issue:** Feedback requires auth but chat allows anonymous. If anonymous user creates session, they cannot submit feedback (see BLOCKER B - session creation will fail anyway).

---

### 3.3 CORS + Cookies/JWT Implications

**BLOCKER C - CORS Misconfiguration:**

**Evidence:**
- `backend/main.py:L33-L39`:
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=settings.ALLOWED_HOSTS,  # ❌ Problem here
      allow_credentials=True,
  )
  ```
- `backend/app/config.py:L29`:
  ```python
  ALLOWED_HOSTS: List[str] = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
  ```
- Default value: `["localhost", "127.0.0.1"]` (no protocol, no port)
- Frontend runs on: `http://localhost:3000` (from `package.json` dev script)

**Risk:** **P0 - CORS Error.** Browser will reject requests: `Access-Control-Allow-Origin` header will not match `http://localhost:3000`.

**Fix Required:**
```python
# backend/app/config.py
ALLOWED_HOSTS: List[str] = os.getenv(
    "ALLOWED_HOSTS", 
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")
```

**JWT Storage:** Frontend has no token storage mechanism. Need to:
- Store token in `localStorage` or `httpOnly` cookie (via Next.js API route)
- Add `Authorization: Bearer <token>` header to all authenticated requests

---

### 3.4 Environment Variable Usage + Missing Defaults

**Backend Environment Variables:**
- `backend/app/config.py:L22-L58` - All have defaults except:
  - `LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")` ❌ Empty string default
  - `VECTOR_DB_URL: str = os.getenv("VECTOR_DB_URL", "")` ❌ Empty string default

**Risk:** Chat service may fail if `LLM_API_KEY` is not set (depends on `LLMGenerationService` implementation).

**Frontend:** No `.env` file found. No API base URL configuration.

**Missing:** `NEXT_PUBLIC_API_URL` or similar for backend base URL.

---

### 3.5 Error Handling + 500 Sources

**Backend Error Handling:**
- `backend/main.py:L83-L95` → Global HTTPException handler
- `backend/app/routers/chat.py:L154-L156` → Try/except with rollback
- `backend/app/routers/chat.py:L124` → Simple string parsing for interpretation/advice (risky)

**Frontend Error Handling:**
- `src/app/chat/page.tsx:L81-L95` → Generic catch, shows error message in UI
- No retry logic, no error reporting

**Potential 500 Sources:**
1. Database constraint violation (BLOCKER B)
2. LLM API failure (if `LLM_API_KEY` invalid/missing)
3. Database connection failure (no connection pool config visible)
4. CORS preflight failure (BLOCKER C)

---

## 4. Suspected Issues Verification

### Issue A: Frontend /api/chat is mocked and not calling backend

**STATUS: ✅ CONFIRMED**

**Evidence:**
- `src/app/api/chat/route.ts:L13` → `const response: ChatResponse = getMockResponse();`
- `src/lib/data/mock-responses.ts:L42` → Returns hardcoded mock data
- No `fetch()` or HTTP client call to backend
- Backend endpoint exists at `backend/app/routers/chat.py:L22` but is never called

---

### Issue B: Backend anonymous session creation conflicts with DB model constraints

**STATUS: ✅ CONFIRMED**

**Evidence:**
- Migration: `backend/alembic/versions/001_create_erd_schema.py:L44` → `nullable=False`
- Model: `backend/app/models.py:L36` → `nullable=False`
- Router: `backend/app/routers/chat.py:L54-L57` → Attempts `user_id=None`

**Impact:** **P0 - Will crash on first anonymous chat request.**

---

### Issue C: Backend CORS allow_origins uses ALLOWED_HOSTS and likely won't match http://localhost:3000

**STATUS: ✅ CONFIRMED**

**Evidence:**
- `backend/app/config.py:L29` → Default: `"localhost,127.0.0.1"` (no protocol/port)
- `backend/main.py:L35` → `allow_origins=settings.ALLOWED_HOSTS`
- Frontend: `http://localhost:3000` (from Next.js default)

**Impact:** **P0 - All API requests will be blocked by CORS.**

---

### Issue D: advice type mismatch: backend string vs frontend string[]

**STATUS: ✅ CONFIRMED**

**Evidence:**
- Backend: `backend/app/schemas.py:L277` → `advice: str`
- Frontend: `src/types/chat.ts:L54` → `advice: string[]`
- Frontend usage: `src/app/chat/page.tsx:L92` → `advice: ['Please try again...']` (array)

**Impact:** **P1 - Frontend expects array, backend returns string. UI may break or need transformation.**

---

## 5. Blockers (Ranked by Severity)

### P0 - Critical (Blocks Integration)

#### BLOCKER 1: Frontend Chat API Route is Mocked
**Location:** `src/app/api/chat/route.ts:L13`  
**Issue:** Returns mock data, never calls backend  
**Fix:**
```typescript
// src/app/api/chat/route.ts
export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    
    // Transform frontend request to backend format
    const backendRequest = {
      question: body.message,  // Map 'message' -> 'question'
      language: body.language
    };
    
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add Authorization header if token exists
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        })
      },
      body: JSON.stringify(backendRequest)
    });
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Transform backend response to frontend format
    return NextResponse.json({
      id: `msg-${Date.now()}`,
      verse: data.verse,
      interpretation: data.interpretation,
      advice: Array.isArray(data.advice) ? data.advice : [data.advice], // Handle string -> array
      citations: data.citations.map((c: any) => ({
        book: c.book,
        page: c.page_number,
        refId: c.id.toString(),
        snippet: c.snippet
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
```

**Environment Variable Required:**
```bash
# .env.local (frontend)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

#### BLOCKER 2: ChatSession.user_id NOT NULL Constraint Violation
**Location:** `backend/app/routers/chat.py:L54-L57`  
**Issue:** Attempts to create session with `user_id=None` but column is `nullable=False`  
**Fix Option A (Recommended - Make nullable):**

1. Create migration:
```python
# backend/alembic/versions/002_make_user_id_nullable.py
def upgrade():
    op.alter_column('chat_sessions', 'user_id',
                    existing_type=postgresql.UUID(as_uuid=True),
                    nullable=True)
```

2. Update model:
```python
# backend/app/models.py:L36
user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)  # Changed to True
```

3. Update foreign key constraint (if needed):
```sql
-- May need to drop and recreate FK if CASCADE behavior changes
ALTER TABLE chat_sessions DROP CONSTRAINT chat_sessions_user_id_fkey;
ALTER TABLE chat_sessions ADD CONSTRAINT chat_sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

**Fix Option B (Alternative - Anonymous User):**
Create a system user for anonymous sessions:
```python
# In chat router, before creating anonymous session:
anonymous_user = db.query(User).filter(User.email == "anonymous@system").first()
if not anonymous_user:
    anonymous_user = User(email="anonymous@system", password_hash="", ...)
    db.add(anonymous_user)
    db.commit()

session = ChatSession(user_id=anonymous_user.id, source_mode="chat")
```

---

#### BLOCKER 3: CORS Configuration Missing Protocol/Port
**Location:** `backend/app/config.py:L29`, `backend/main.py:L35`  
**Issue:** `ALLOWED_HOSTS` default is `["localhost", "127.0.0.1"]` but needs `["http://localhost:3000"]`  
**Fix:**
```python
# backend/app/config.py:L29
ALLOWED_HOSTS: List[str] = os.getenv(
    "ALLOWED_HOSTS", 
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")
```

**Environment Variable:**
```bash
# backend/.env
ALLOWED_HOSTS=http://localhost:3000,http://127.0.0.1:3000
```

---

### P1 - High Priority (Breaks Functionality)

#### BLOCKER 4: Advice Type Mismatch (string vs string[])
**Location:** `backend/app/schemas.py:L277`, `src/types/chat.ts:L54`  
**Issue:** Backend returns `advice: str`, frontend expects `advice: string[]`  
**Fix Option A (Change Backend - Recommended):**
```python
# backend/app/schemas.py:L277
class ChatResponse(BaseModel):
    verse: VerseMultilingual
    interpretation: str
    advice: List[str]  # Changed from str to List[str]
    citations: List[CitationSummary]
```

Update chat router to return list:
```python
# backend/app/routers/chat.py:L120-L124
# Parse advice into list (split by newlines or bullets)
advice_lines = [line.strip() for line in response_text.split('\n') if line.strip()]
advice = advice_lines if advice_lines else [response_text]

return ChatResponse(
    verse=verse_data,
    interpretation=interpretation,
    advice=advice,  # Now a list
    citations=citations
)
```

**Fix Option B (Transform in Frontend):**
Handle in Next.js API route (see BLOCKER 1 fix, line with `advice` transformation).

---

#### BLOCKER 5: Frontend Auth Not Integrated
**Location:** `src/app/login/LoginPageClient.tsx:L154-L193`  
**Issue:** Mocked login/signup, no API calls, no token storage  
**Fix:**

1. Create API client utility:
```typescript
// src/lib/api/client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }
  
  const data = await response.json();
  // Store token
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', data.token);
  }
  return data;
}

export async function signup(email: string, password: string) {
  const response = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Signup failed');
  }
  
  return await response.json();
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}
```

2. Update login page:
```typescript
// src/app/login/LoginPageClient.tsx
import { login, signup } from '@/lib/api/client';

const handleLoginSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoginLoading(true);
  setLoginError('');
  
  try {
    await login(loginEmail, loginPassword);
    router.push('/chat');
  } catch (error: any) {
    setLoginError(error.message || c.loginError);
  } finally {
    setIsLoginLoading(false);
  }
};

const handleSignupSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSignupLoading(true);
  setSignupError('');
  
  if (signupPassword !== confirmPassword) {
    setSignupError('Passwords do not match');
    setIsSignupLoading(false);
    return;
  }
  
  try {
    await signup(signupEmail, signupPassword);
    router.push('/chat');
  } catch (error: any) {
    setSignupError(error.message || c.signupError);
  } finally {
    setIsSignupLoading(false);
  }
};
```

3. Update chat API route to forward auth header:
```typescript
// src/app/api/chat/route.ts (in BLOCKER 1 fix)
const authHeader = request.headers.get('authorization');
// ... in fetch call
headers: {
  'Content-Type': 'application/json',
  ...(authHeader && { 'Authorization': authHeader })
}
```

4. Update frontend chat page to send token:
```typescript
// src/app/chat/page.tsx
import { getAuthToken } from '@/lib/api/client';

const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(getAuthToken() && { 'Authorization': `Bearer ${getAuthToken()}` })
  },
  body: JSON.stringify({...})
});
```

---

#### BLOCKER 6: Request Schema Mismatch (message vs question)
**Location:** `src/types/chat.ts:L38`, `backend/app/schemas.py:L252`  
**Issue:** Frontend sends `message`, backend expects `question`  
**Fix:** Handle in Next.js API route transformation (see BLOCKER 1 fix).

---

### P2 - Medium Priority (Nice to Have)

#### BLOCKER 7: Missing API Base URL Configuration
**Location:** Frontend has no env var for backend URL  
**Fix:** Add to `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### BLOCKER 8: Citation Field Name Mismatch
**Location:** Frontend expects `page`, backend returns `page_number`  
**Fix:** Transform in API route (see BLOCKER 1 fix).

#### BLOCKER 9: Missing Frontend API Routes for Other Endpoints
**Status:** Search, books, feedback, citation endpoints not integrated  
**Fix:** Create Next.js API routes following same pattern as chat (BFF proxy approach).

---

## 6. Integration Plan

### Approach A: BFF Proxy (Next.js API Routes) - RECOMMENDED

**Architecture:**
```
Browser → Next.js API Route (/api/chat) → FastAPI Backend → Database
```

**Advantages:**
- Hides backend URL from browser
- Can transform request/response schemas
- Single CORS origin (browser → Next.js only)
- Can add caching, rate limiting in Next.js layer
- Easier to handle auth (server-side token storage)

**Implementation Steps:**

1. **Fix P0 Blockers First:**
   - Fix ChatSession.user_id constraint (BLOCKER 2)
   - Fix CORS configuration (BLOCKER 3)
   - Create Next.js API route for chat (BLOCKER 1)

2. **Create API Client Utility:**
   - `src/lib/api/client.ts` (see BLOCKER 5 fix)
   - Centralized fetch logic with auth headers

3. **Update Frontend Components:**
   - Replace mock calls with real API client
   - Add error handling and loading states

4. **Create Additional API Routes:**
   - `src/app/api/search/route.ts`
   - `src/app/api/books/route.ts`
   - `src/app/api/feedback/route.ts`
   - `src/app/api/citation/route.ts`

5. **Add Environment Variables:**
   ```bash
   # Frontend .env.local
   NEXT_PUBLIC_API_URL=http://localhost:8000
   
   # Backend .env
   ALLOWED_HOSTS=http://localhost:3000
   DATABASE_URL=postgresql://...
   LLM_API_KEY=...
   ```

6. **Test Integration:**
   - Start backend: `cd backend && uvicorn main:app --reload`
   - Start frontend: `npm run dev`
   - Test chat flow end-to-end

---

### Approach B: Direct Browser-to-Backend (CORS)

**Architecture:**
```
Browser → FastAPI Backend (CORS enabled) → Database
```

**Advantages:**
- Simpler (no proxy layer)
- Direct API calls

**Disadvantages:**
- Exposes backend URL
- CORS complexity
- Harder to transform schemas
- Auth token visible in browser

**Implementation Steps:**

1. **Fix CORS (BLOCKER 3):**
   ```python
   ALLOWED_HOSTS=http://localhost:3000,http://127.0.0.1:3000
   ```

2. **Create Frontend API Client:**
   ```typescript
   // src/lib/api/client.ts
   const API_URL = 'http://localhost:8000';
   
   export async function chat(message: string, language: string) {
     const token = getAuthToken();
     const response = await fetch(`${API_URL}/api/chat`, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         ...(token && { 'Authorization': `Bearer ${token}` })
       },
       body: JSON.stringify({
         question: message,  // Transform here
         language
       })
     });
     const data = await response.json();
     // Transform response: advice string -> array
     return {
       ...data,
       advice: Array.isArray(data.advice) ? data.advice : [data.advice]
     };
   }
   ```

3. **Update Frontend to Call Backend Directly:**
   - Remove Next.js `/api/chat` route
   - Update `src/app/chat/page.tsx` to use API client

4. **Handle CORS Preflight:**
   - Backend already handles with `allow_methods=["*"]`
   - Ensure `allow_credentials=True` for cookies/JWT

---

## 7. Verification Steps

### Step 1: Verify Backend is Running
```bash
cd backend
# Set environment variables
export DATABASE_URL="postgresql://rumi_user:rumi_password@localhost:5432/rumi_ai"
export ALLOWED_HOSTS="http://localhost:3000"
export LLM_API_KEY="your-key-here"  # If using LLM

# Run backend
uvicorn main:app --reload --port 8000
```

**Test:**
```bash
curl http://localhost:8000/health
# Expected: {"status":"healthy","service":"RUMI AI Agent Backend","version":"0.1.0"}
```

---

### Step 2: Verify CORS Configuration
```bash
curl -X OPTIONS http://localhost:8000/api/chat \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Expected headers:
# Access-Control-Allow-Origin: http://localhost:3000
# Access-Control-Allow-Credentials: true
```

---

### Step 3: Test Chat Endpoint (After Fixes)
```bash
# Test anonymous chat
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"question": "How to deal with sadness?", "language": "fa"}'

# Expected: ChatResponse with verse, interpretation, advice, citations
```

**Verify Response:**
- `advice` should be `string` (or `string[]` after BLOCKER 4 fix)
- `citations` should be array
- No database errors (after BLOCKER 2 fix)

---

### Step 4: Test Authentication
```bash
# Signup
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Expected: {"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
```

**Test Authenticated Chat:**
```bash
TOKEN="<token-from-login>"
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"question": "Test question", "language": "en"}'
```

---

### Step 5: Test Frontend Integration
```bash
# Start frontend
npm run dev

# Open browser: http://localhost:3000/chat
# Send a message
# Check browser console for errors
# Check Network tab for API calls
```

**Verify:**
- Request goes to `/api/chat` (Next.js route) or directly to backend
- Response is received and displayed
- No CORS errors
- No 500 errors from database constraint violations

---

### Step 6: Test Anonymous Session Creation
```bash
# After BLOCKER 2 fix, test anonymous chat
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "Anonymous test", "language": "fa"}'

# Should succeed (no user_id required after fix)
# Check database: SELECT * FROM chat_sessions WHERE user_id IS NULL;
```

---

## 8. Summary of Required Changes

### Backend Changes:
1. ✅ Fix `ChatSession.user_id` to be nullable (migration + model)
2. ✅ Fix `ALLOWED_HOSTS` to include `http://localhost:3000`
3. ✅ Change `advice` type from `str` to `List[str]` in `ChatResponse` schema
4. ✅ Update chat router to return `advice` as list
5. ✅ Add `.env` file with proper defaults

### Frontend Changes:
1. ✅ Replace mock chat API route with real backend call
2. ✅ Create API client utility (`src/lib/api/client.ts`)
3. ✅ Integrate auth (login/signup API calls + token storage)
4. ✅ Transform request/response schemas in API route
5. ✅ Add environment variable `NEXT_PUBLIC_API_URL`
6. ✅ Update chat page to use API client with auth headers

### Database Changes:
1. ✅ Run migration to make `chat_sessions.user_id` nullable
2. ✅ Verify foreign key constraint allows NULL

---

## 9. Additional Recommendations

1. **Generate TypeScript Types from OpenAPI:**
   ```bash
   # Install openapi-typescript
   npm install -D openapi-typescript
   
   # Generate types
   npx openapi-typescript http://localhost:8000/openapi.json -o src/types/api.ts
   ```

2. **Add Request/Response Logging:**
   - Backend: Add middleware to log all requests
   - Frontend: Add API client interceptor for debugging

3. **Error Handling:**
   - Standardize error response format
   - Add error boundaries in React
   - Add retry logic for transient failures

4. **Testing:**
   - Add integration tests for API routes
   - Add E2E tests for chat flow
   - Test anonymous vs authenticated flows

5. **Documentation:**
   - Update API documentation with actual request/response examples
   - Document environment variables required
   - Add setup instructions for local development

---

**Report End**
