# Contract Mapping: Frontend ↔ Backend via BFF

This document details the transformations performed in the Next.js BFF (Backend for Frontend) layer.

## Chat API: `/api/chat`

### Request Transformation (Frontend → Backend)

**Frontend Request** (`src/types/chat.ts`):
```typescript
interface ChatRequest {
  message: string;
  language: Language; // 'fa' | 'en' | 'kr'
  country: Country;   // 'KR' | 'IR' | 'UZ'
  sourceScope: SourceScope; // 'books' | 'web_books' | 'web'
  history: ChatMessage[];
}
```

**Backend Request** (`backend/app/schemas.py`):
```python
class ChatRequest(BaseModel):
    question: str
    language: str  # "fa", "en", or "kr"
```

**Transformation** (`src/app/api/chat/route.ts`):
```typescript
{
  question: frontendRequest.message,  // message → question
  language: frontendRequest.language,  // Direct mapping
  // country, sourceScope, history are ignored (not in backend schema)
}
```

### Response Transformation (Backend → Frontend)

**Backend Response** (`backend/app/schemas.py`):
```python
class ChatResponse(BaseModel):
    verse: VerseMultilingual  # {fa?: str, en?: str, kr?: str}
    interpretation: str
    advice: str  # ⚠️ String, not array
    citations: List[CitationSummary]  # {id, book?, page_number?, snippet?}
```

**Frontend Response** (`src/types/chat.ts`):
```typescript
interface ChatResponse {
  id: string;
  verse: {
    fa: string;
    en?: string;
    kr?: string;
  };
  interpretation: string;
  advice: string[];  // ⚠️ Array, not string
  citations: Citation[];  // {book, page, refId, snippet}
  retrievedCandidates?: RetrievedCandidate[];
}
```

**Transformation** (`src/app/api/chat/route.ts`):

1. **advice: str → string[]**
   ```typescript
   // Split on newlines
   adviceArray = backendResponse.advice.split(/\n+/).filter(line => line.trim())
   
   // If single item, try splitting on bullets (•, -, *)
   if (adviceArray.length <= 1 && backendResponse.advice.includes('•')) {
     adviceArray = backendResponse.advice.split(/[•\-\*]/).filter(line => line.trim())
   }
   
   // Fallback: single-item array
   if (adviceArray.length === 0) {
     adviceArray = [backendResponse.advice]
   }
   ```

2. **citations: CitationSummary → Citation**
   ```typescript
   {
     book: citation.book || '',
     page: citation.page_number || 0,      // page_number → page
     refId: citation.id || '',              // id → refId
     snippet: citation.snippet || '',
   }
   ```

3. **verse: VerseMultilingual**
   ```typescript
   {
     fa: backendResponse.verse?.fa || '',
     en: backendResponse.verse?.en,  // Optional
     kr: backendResponse.verse?.kr, // Optional
   }
   ```

4. **id: string**
   ```typescript
   id: crypto.randomUUID()  // Generated in BFF (not in backend response)
   ```

5. **retrievedCandidates**
   - Not in backend response currently
   - Left as optional undefined

## Authentication API

### Login: `/api/auth/login`

**Frontend Request:**
```typescript
{ email: string, password: string }
```

**Backend Request:**
```python
class UserLogin(BaseModel):
    email: EmailStr
    password: str
```

**Transformation:** Direct pass-through (no transformation needed)

**Backend Response:**
```python
class LoginResponse(BaseModel):
    token: str
```

**Frontend Response:**
```typescript
{ success: boolean, message?: string }
```

**Transformation:**
- Backend token is stored in httpOnly cookie (`rumi_token`)
- Token is NOT returned in response body
- Only success status is returned

### Logout: `/api/auth/logout`

**Frontend Request:** None (empty body)

**Backend Request:** N/A (handled entirely in BFF)

**Transformation:** Cookie deletion only

**Frontend Response:**
```typescript
{ success: boolean, message?: string }
```

### Signup: `/api/auth/signup`

**Frontend Request:**
```typescript
{ email: string, password: string }
```

**Backend Request:**
```python
class SignupRequest(BaseModel):
    email: EmailStr
    password: str  # min_length=8
```

**Transformation:** Direct pass-through (validation in BFF)

**Backend Response:**
```python
class SignupResponse(BaseModel):
    status: str = "User created"
```

**Frontend Response:**
```typescript
{ success: boolean, message?: string }
```

**Transformation:**
- Backend `status` → Frontend `success: true`
- Optional auto-login after signup (calls `/api/auth/login`)

## Authentication Header Forwarding

**Cookie → Authorization Header:**

```typescript
// In BFF route
const token = cookieStore.get('rumi_token')?.value;

if (token) {
  headers['Authorization'] = `Bearer ${token}`;
}
```

**Backend expects:**
```
Authorization: Bearer <jwt-token>
```

## Error Handling

### Backend Error Response
```python
HTTPException(status_code=401, detail="Invalid email or password")
```

### BFF Error Transformation
```typescript
if (!backendResponse.ok) {
  const errorData = await backendResponse.json().catch(() => ({ detail: 'Error' }));
  return NextResponse.json(
    { success: false, message: errorData.detail || 'Error message' },
    { status: backendResponse.status }  // Preserve backend status code
  );
}
```

### Frontend Error Format
```typescript
{ success: false, message: string }
```

## Summary Table

| Feature | Frontend Field | Backend Field | Transformation |
|---------|---------------|---------------|----------------|
| **Chat Request** | `message` | `question` | Direct rename |
| **Chat Request** | `language` | `language` | Direct pass-through |
| **Chat Request** | `country` | - | Ignored |
| **Chat Request** | `sourceScope` | - | Ignored |
| **Chat Request** | `history` | - | Ignored |
| **Chat Response** | `advice: string[]` | `advice: str` | Split on newlines/bullets |
| **Chat Response** | `citations[].refId` | `citations[].id` | Direct mapping |
| **Chat Response** | `citations[].page` | `citations[].page_number` | Direct mapping |
| **Chat Response** | `citations[].book` | `citations[].book` | Direct mapping |
| **Chat Response** | `citations[].snippet` | `citations[].snippet` | Direct mapping |
| **Chat Response** | `verse` | `verse` | Direct mapping (fa, en?, kr?) |
| **Chat Response** | `interpretation` | `interpretation` | Direct mapping |
| **Chat Response** | `id` | - | Generated in BFF (UUID) |
| **Auth** | Cookie `rumi_token` | Header `Authorization: Bearer` | Cookie → Header |
| **Auth** | Response `{success}` | Response `{token}` | Token stored in cookie, not body |
