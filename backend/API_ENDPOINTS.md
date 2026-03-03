# RUMI AI Agent Backend API Endpoints

This document lists all API endpoints matching the specification.

## Authentication Endpoints

### POST /api/auth/login
Authenticates a user and provides a session token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400` - OAuth users cannot use password login
- `401` - Invalid email or password

### POST /api/auth/signup
Creates a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "User created"
}
```

### POST /api/auth/kakao
Handles Kakao OAuth callback and authenticates user.

**Request Body:**
```json
{
  "code": "authorization_code_from_kakao",
  "redirect_uri": "http://localhost:3000/api/auth/kakao/callback"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400` - Invalid authorization code or failed token exchange
- `409` - Email already registered with email provider (must login with email first)
- `500` - Kakao OAuth not configured
- `503` - Failed to connect to Kakao API

**Flow:**
1. Frontend redirects to `/api/auth/kakao/start` → redirects to Kakao authorization
2. User authorizes → Kakao redirects to `/api/auth/kakao/callback?code=...`
3. Frontend calls backend `POST /api/auth/kakao` with code
4. Backend exchanges code for access token, fetches user info
5. Backend creates/updates user with `provider='kakao'` and `provider_user_id`
6. Backend returns JWT token
7. Frontend sets `rumi_token` cookie and redirects to `/chat`

## Chat Endpoint

### POST /api/chat
Allows user to submit a question and receive advice based on Rumi's poetry using RAG and LLM.

**Request Body:**
```json
{
  "question": "How should I deal with sadness?",
  "language": "fa"
}
```

**Parameters:**
- `question` (string, required): User's question or problem
- `language` (string, optional): Language code - "fa" (Farsi), "en" (English), or "kr" (Korean). Default: "fa"

**Response:**
```json
{
  "verse": {
    "fa": "متن شعر فارسی",
    "en": "English verse text",
    "kr": "한국어 시 텍스트"
  },
  "interpretation": "Interpretation of the verse...",
  "advice": "Advice based on the verse...",
  "citations": [
    {
      "id": "uuid",
      "book": "Book Title",
      "page_number": 42,
      "snippet": "Verse snippet text"
    }
  ]
}
```

## Search Endpoint

### GET /api/search
Retrieves relevant Rumi verses by keyword from the corpus.

**Query Parameters:**
- `query` (string, required): Search keyword
- `lang` (string, optional): Language code - "fa", "en", or "kr". Default: "fa"

**Response:**
```json
{
  "results": [
    {
      "id": "uuid",
      "text": "Verse text in requested language",
      "book": "Book Title",
      "page": 42,
      "score": 0.85
    }
  ]
}
```

## Citation Endpoint

### GET /api/citation/:id
Returns detailed citation information including text snippets and PDF bounding box coordinates.

**Path Parameters:**
- `id` (UUID, required): Citation ID

**Response:**
```json
{
  "book": "Book Title",
  "page_number": 42,
  "snippet": "Text snippet from the verse",
  "translation": "English translation",
  "bbox": {
    "x": 100.5,
    "y": 200.3,
    "width": 150.0,
    "height": 30.0
  }
}
```

## Books Endpoint

### GET /api/books/:id/pages/:n
Returns the content of a specific book page for PDF viewing, including highlighted verses.

**Path Parameters:**
- `id` (UUID, required): Book ID
- `n` (integer, required): Page number (1-indexed)

**Response:**
```json
{
  "book_id": "uuid",
  "page": 42,
  "verses": [
    {
      "line": 1,
      "translation": "English translation of the verse"
    }
  ],
  "highlighted": [0, 2],
  "pdf_url": "https://example.com/book.pdf"
}
```

## User Endpoints

### GET /api/user/me
Retrieves the current authenticated user's profile data.

**Authentication:** Required (JWT token)

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "preferred_lang": "fa",
  "theme": "light",
  "avatar_url": "https://k.kakaocdn.net/dn/.../img_640x640.jpg",
  "created_at": "2025-01-22T10:00:00Z",
  "last_login": "2025-01-22T12:00:00Z",
  "is_deleted": false
}
```

**Note:** `avatar_url` is `null` for email users, populated for OAuth users (e.g., Kakao).

### PATCH /api/user/settings
Updates user preferences such as language or interface theme.

**Authentication:** Required (JWT token)

**Request Body:**
```json
{
  "preferred_lang": "en",
  "theme": "dark"
}
```

**Parameters:**
- `preferred_lang` (string, optional): Language code - "fa", "en", or "kr"
- `theme` (string, optional): Theme - "light" or "dark"

**Response:**
```json
{
  "status": "Settings updated"
}
```

## Feedback Endpoint

### POST /api/feedback
Reports issues related to AI responses, OCR accuracy, or incorrect translations.

**Authentication:** Required (JWT token)

**Request Body:**
```json
{
  "session_id": "uuid",
  "issue_type": "ocr_error",
  "comment": "The OCR text seems incorrect"
}
```

**Parameters:**
- `session_id` (UUID, required): Chat session ID
- `issue_type` (string, required): Issue type (e.g., "ocr_error", "incorrect_translation", "ai_response_error")
- `comment` (string, optional): Additional comments

**Response:**
```json
{
  "status": "Feedback received",
  "ticket_id": "uuid"
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": {}
  }
}
```

## HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Endpoints that don't require authentication:
- `POST /api/auth/login`
- `POST /api/auth/signup`
- `POST /api/auth/kakao`
- `POST /api/chat` (optional authentication)
- `GET /api/search` (optional authentication)
- `GET /api/citation/:id` (optional authentication)
- `GET /api/books/:id/pages/:n` (optional authentication)

## Rate Limiting

- Default: 100 requests per minute per IP/user
- Chat endpoint: 30 requests per minute
- Search endpoint: 60 requests per minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
