# Integration Summary - RUMI AI Agent
**Condensed from Forensic Audit Report**

---

## Executive Summary

• **Frontend and backend are completely disconnected** - Chat API route returns mock data (`src/app/api/chat/route.ts:L13`), authentication is simulated (`src/app/login/LoginPageClient.tsx:L159`)

• **P0 Database constraint violation** - `ChatSession.user_id` is `NOT NULL` but router attempts `user_id=None` for anonymous sessions (`backend/app/routers/chat.py:L54-L57`), will crash on first anonymous request

• **P0 CORS misconfiguration** - `ALLOWED_HOSTS` defaults to `["localhost"]` without protocol/port (`backend/app/config.py:L29`), blocks all browser requests from `http://localhost:3000`

• **Type mismatches block integration** - Frontend expects `advice: string[]` (`src/types/chat.ts:L54`) but backend returns `advice: str` (`backend/app/schemas.py:L277`); frontend sends `message` but backend expects `question`

• **No API client infrastructure** - Frontend has no token storage, no Authorization header logic, no centralized API client utility

• **Request schema mismatch** - Frontend sends `{message, language, country, sourceScope, history}` but backend only accepts `{question, language}` (`src/app/chat/page.tsx:L68` vs `backend/app/schemas.py:L252`)

• **All other endpoints unintegrated** - Search, books, feedback, citation endpoints exist in backend but have no frontend implementation

• **Environment variables missing** - Frontend lacks `NEXT_PUBLIC_API_URL`, backend `ALLOWED_HOSTS` needs protocol/port

• **Citation field name mismatch** - Frontend expects `page` but backend returns `page_number` (`src/types/chat.ts:L27` vs `backend/app/schemas.py:L269`)

• **No error handling strategy** - Generic catch blocks, no retry logic, no standardized error response format

---

## P0 Blockers (Critical - Blocks Integration)

### BLOCKER 1: Frontend Chat API Route is Mocked
**Evidence:** `src/app/api/chat/route.ts:L13` → `getMockResponse()`  
**Impact:** Never calls backend, returns hardcoded data

### BLOCKER 2: ChatSession.user_id NOT NULL Constraint Violation
**Evidence:**
- `backend/alembic/versions/001_create_erd_schema.py:L44` → `nullable=False`
- `backend/app/models.py:L36` → `nullable=False`
- `backend/app/routers/chat.py:L54-L57` → Attempts `user_id=None`

**Impact:** Will crash with `IntegrityError` on first anonymous chat request

### BLOCKER 3: CORS Configuration Missing Protocol/Port
**Evidence:**
- `backend/app/config.py:L29` → Default: `"localhost,127.0.0.1"` (no `http://` or `:3000`)
- `backend/main.py:L35` → `allow_origins=settings.ALLOWED_HOSTS`
- Frontend runs on `http://localhost:3000`

**Impact:** All API requests blocked by CORS preflight

---

## Contract Mismatches Table

| Feature | Frontend Type | Backend Schema | Status | Mismatch |
|---------|--------------|----------------|--------|----------|
| **Chat Request** | `{message, language, country, sourceScope, history}`<br/>`src/types/chat.ts:L38-L44` | `{question: str, language: str}`<br/>`backend/app/schemas.py:L252-L256` | ❌ | Field name: `message` vs `question`. Extra fields: `country`, `sourceScope`, `history` |
| **Chat Response - advice** | `advice: string[]`<br/>`src/types/chat.ts:L54` | `advice: str`<br/>`backend/app/schemas.py:L277` | ❌ | **Type: array vs string** |
| **Chat Response - citations** | `{book, page, refId, snippet}`<br/>`src/types/chat.ts:L25-L30` | `{id, book?, page_number?, snippet?}`<br/>`backend/app/schemas.py:L265-L270` | ⚠️ | Field: `page` vs `page_number`, `refId` missing |
| **Chat Response - verse** | `{fa, en?, kr?}`<br/>`src/types/chat.ts:L48-L52` | `{fa?, en?, kr?}`<br/>`backend/app/schemas.py:L258-L262` | ✅ | Compatible |
| **Auth Login Request** | N/A (mocked) | `{email, password}`<br/>`backend/app/schemas.py:L35-L38` | ❌ | Not integrated |
| **Auth Login Response** | N/A | `{token: str}`<br/>`backend/app/schemas.py:L336-L338` | ❌ | Not integrated |

---

## Integration Plan (BFF Proxy Approach)

**Architecture:** `Browser → Next.js API Route → FastAPI Backend → Database`

### Phase 1: Fix P0 Blockers (Required First)
1. **Database Migration** - Make `chat_sessions.user_id` nullable
2. **CORS Fix** - Update `ALLOWED_HOSTS` to include `http://localhost:3000`
3. **Chat API Route** - Replace mock with backend proxy + schema transformation

### Phase 2: Core Integration
4. **API Client** - Create `src/lib/api/client.ts` with auth token management
5. **Auth Integration** - Wire login/signup to backend, store JWT in localStorage
6. **Chat Integration** - Update chat page to send auth headers, handle responses

### Phase 3: Schema Alignment
7. **Backend Schema Update** - Change `advice: str` → `advice: List[str]` in `ChatResponse`
8. **Response Transformation** - Map `page_number` → `page`, add `refId` in API route

### Phase 4: Additional Endpoints
9. **Create API Routes** - `src/app/api/search/route.ts`, `books/route.ts`, `feedback/route.ts`, `citation/route.ts`
10. **Environment Setup** - Add `.env.local` and `backend/.env` with required variables

### Phase 5: Testing & Validation
11. **End-to-End Test** - Verify chat flow (anonymous + authenticated)
12. **Error Handling** - Add retry logic, standardized error responses

---

## Exact Patch List

### Backend Files

**1. `backend/alembic/versions/002_make_user_id_nullable.py` (NEW)**
```python
def upgrade():
    op.alter_column('chat_sessions', 'user_id',
                    existing_type=postgresql.UUID(as_uuid=True),
                    nullable=True)
```

**2. `backend/app/models.py:L36`**
```python
# Change from:
user_id = Column(UUID(as_uuid=True), ForeignKey(...), nullable=False)
# To:
user_id = Column(UUID(as_uuid=True), ForeignKey(...), nullable=True)
```

**3. `backend/app/config.py:L29`**
```python
# Change from:
ALLOWED_HOSTS: List[str] = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
# To:
ALLOWED_HOSTS: List[str] = os.getenv(
    "ALLOWED_HOSTS", 
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")
```

**4. `backend/app/schemas.py:L277`**
```python
# Change from:
advice: str
# To:
advice: List[str]
```

**5. `backend/app/routers/chat.py:L120-L152`**
```python
# After line 124, add:
advice_lines = [line.strip() for line in response_text.split('\n') if line.strip()]
advice = advice_lines if advice_lines else [response_text]

# Update return statement (line 147):
return ChatResponse(
    verse=verse_data,
    interpretation=interpretation,
    advice=advice,  # Now a list
    citations=citations
)
```

**6. `backend/.env` (NEW)**
```bash
ALLOWED_HOSTS=http://localhost:3000,http://127.0.0.1:3000
DATABASE_URL=postgresql://rumi_user:rumi_password@localhost:5432/rumi_ai
LLM_API_KEY=your-key-here
```

### Frontend Files

**7. `src/lib/api/client.ts` (NEW)**
```typescript
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

export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}
```

**8. `src/app/api/chat/route.ts` (REPLACE ENTIRE FILE)**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ChatRequest } from '../../../types/chat';
import { getAuthToken } from '@/lib/api/client';

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    
    const backendRequest = {
      question: body.message,
      language: body.language
    };
    
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const token = getAuthToken();
    
    const response = await fetch(`${backendUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(backendRequest)
    });
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      id: `msg-${Date.now()}`,
      verse: data.verse,
      interpretation: data.interpretation,
      advice: Array.isArray(data.advice) ? data.advice : [data.advice],
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

**9. `src/app/login/LoginPageClient.tsx:L154-L193`**
```typescript
// Replace handleLoginSubmit and handleSignupSubmit functions:
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

**10. `src/app/chat/page.tsx:L65-L75`**
```typescript
// Add import at top:
import { getAuthToken } from '@/lib/api/client';

// Update fetch call:
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(getAuthToken() && { 'Authorization': `Bearer ${getAuthToken()}` })
  },
  body: JSON.stringify({
    message: userMessage.content,
    language,
    country: 'KR',
    sourceScope,
    history: messages,
  }),
});
```

**11. `.env.local` (NEW - Frontend root)**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Database Migration

**12. Run migration:**
```bash
cd backend
alembic upgrade head
```

---

## Verification Commands

```bash
# 1. Test backend health
curl http://localhost:8000/health

# 2. Test CORS
curl -X OPTIONS http://localhost:8000/api/chat \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" -v

# 3. Test anonymous chat (after fixes)
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "Test", "language": "fa"}'

# 4. Test auth
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

---

**Total Files to Edit:** 11 files (6 backend, 5 frontend) + 2 new files + 2 env files
