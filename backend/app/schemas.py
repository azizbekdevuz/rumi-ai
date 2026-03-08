"""
Pydantic schemas for request/response validation in RUMI AI Agent Backend API.
Based on ERD: Users, Chat_Sessions, Messages, Feedback_Reports, Verses, Books, Citations
"""
from pydantic import BaseModel, Field, EmailStr, validator, ConfigDict
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from uuid import UUID
import json


# User Schemas
class UserBase(BaseModel):
    """Base schema for user."""
    email: EmailStr
    preferred_lang: Optional[str] = None
    theme: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a user."""
    password: str = Field(..., min_length=8)


class UserResponse(UserBase):
    """Schema for user response."""
    id: UUID
    created_at: datetime
    last_login: Optional[datetime] = None
    avatar_url: Optional[str] = None
    display_name: Optional[str] = None
    is_deleted: bool = False

    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


# Chat Session Schemas
class ChatSessionBase(BaseModel):
    """Base schema for chat session."""
    source_mode: Optional[str] = None


class ChatSessionCreate(ChatSessionBase):
    """Schema for creating a chat session."""
    user_id: UUID


class ChatSessionResponse(ChatSessionBase):
    """Schema for chat session response."""
    id: UUID
    user_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatSessionWithPreview(ChatSessionResponse):
    """Chat session with embedded preview text and message count.

    Returned by the ``GET /api/chat/sessions`` endpoint so the
    frontend does not need N+1 requests to show session previews.
    """
    message_count: int = 0
    preview: str = ""


class ChatSessionListResponse(BaseModel):
    """Schema for chat session list response."""
    sessions: List[ChatSessionResponse]
    total: int


# Message Schemas
class MessageBase(BaseModel):
    """Base schema for message."""
    role: str = Field(..., description="Role of the message sender (e.g., 'user', 'assistant')")
    message_text: Optional[str] = None
    language: Optional[str] = None
    verse_id: Optional[UUID] = None
    citation_ids: Optional[List[UUID]] = None
    feedback: Optional[str] = None

    @validator("role")
    def validate_role(cls, v):
        allowed_roles = ["user", "assistant", "system"]
        if v not in allowed_roles:
            raise ValueError(f"role must be one of {allowed_roles}")
        return v


class MessageCreate(MessageBase):
    """Schema for creating a message."""
    session_id: UUID


class MessageResponse(MessageBase):
    """Schema for message response."""
    id: UUID
    session_id: UUID
    created_at: Optional[datetime] = None
    turn_index: Optional[int] = None
    # Structured data for assistant messages (from JSON snapshots)
    interpretation: Optional[str] = None
    advice: Optional[List[str]] = None  # Always normalized to a list of strings
    verse: Optional[Dict[str, str]] = None  # {fa, en, kr}
    citations: Optional[List[Dict[str, Any]]] = None  # CitationSummary-like dicts

    model_config = ConfigDict(from_attributes=True)
    
    @classmethod
    def from_orm_with_structured(cls, obj: Any) -> "MessageResponse":
        """Create MessageResponse from Message ORM object, parsing JSON fields."""
        data = {
            "id": obj.id,
            "session_id": obj.session_id,
            "role": obj.role,
            "message_text": obj.message_text,
            "language": obj.language,
            "verse_id": obj.verse_id,
            "citation_ids": obj.citation_ids,
            "feedback": obj.feedback,
            "created_at": obj.created_at,
            "turn_index": obj.turn_index,
        }
        
        # For assistant messages, parse structured JSON fields
        if obj.role == "assistant":
            data["interpretation"] = obj.interpretation_text
            
            if obj.advice_json:
                try:
                    loaded = json.loads(obj.advice_json)
                    if isinstance(loaded, list):
                        data["advice"] = [str(x) for x in loaded]
                    elif isinstance(loaded, str):
                        data["advice"] = [loaded]
                    else:
                        data["advice"] = None
                except (json.JSONDecodeError, TypeError):
                    data["advice"] = None
            
            if obj.verse_json:
                try:
                    data["verse"] = json.loads(obj.verse_json)
                except (json.JSONDecodeError, TypeError):
                    data["verse"] = None
            
            if obj.citations_json:
                try:
                    data["citations"] = json.loads(obj.citations_json)
                except (json.JSONDecodeError, TypeError):
                    data["citations"] = None
        
        return cls(**data)


class MessageListResponse(BaseModel):
    """Schema for message list response."""
    messages: List[MessageResponse]
    total: int


# Feedback Report Schemas
class FeedbackReportBase(BaseModel):
    """Base schema for feedback report."""
    issue_type: Optional[str] = None
    comment: Optional[str] = None


class FeedbackReportCreate(FeedbackReportBase):
    """Schema for creating a feedback report."""
    message_id: UUID
    user_id: UUID


class FeedbackReportResponse(FeedbackReportBase):
    """Schema for feedback report response."""
    id: UUID
    message_id: UUID
    user_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FeedbackReportListResponse(BaseModel):
    """Schema for feedback report list response."""
    reports: List[FeedbackReportResponse]
    total: int


# Book Schemas
class BookBase(BaseModel):
    """Base schema for book."""
    title: Optional[str] = None
    title_en: Optional[str] = None
    pdf_url: Optional[str] = None
    type: Optional[str] = None


class BookCreate(BookBase):
    """Schema for creating a book."""
    pass


class BookResponse(BookBase):
    """Schema for book response."""
    id: UUID

    model_config = ConfigDict(from_attributes=True)


class BookListResponse(BaseModel):
    """Schema for book list response."""
    books: List[BookResponse]
    total: int


# Verse Schemas
class VerseBase(BaseModel):
    """Base schema for verse."""
    line_number: Optional[int] = None
    text_fa: Optional[str] = None
    text_en: Optional[str] = None
    text_kr: Optional[str] = None


class VerseCreate(VerseBase):
    """Schema for creating a verse."""
    book_id: UUID


class VerseResponse(VerseBase):
    """Schema for verse response."""
    id: UUID
    book_id: UUID

    model_config = ConfigDict(from_attributes=True)


class VerseListResponse(BaseModel):
    """Schema for verse list response."""
    verses: List[VerseResponse]
    total: int


# Citation Schemas
class CitationBase(BaseModel):
    """Base schema for citation."""
    page_number: Optional[int] = None
    line_range: Optional[str] = None
    highlight_box: Optional[Dict[str, Any]] = None


class CitationCreate(CitationBase):
    """Schema for creating a citation."""
    verse_id: UUID
    book_id: UUID


class CitationResponse(CitationBase):
    """Schema for citation response."""
    id: UUID
    verse_id: UUID
    book_id: UUID

    model_config = ConfigDict(from_attributes=True)


class CitationListResponse(BaseModel):
    """Schema for citation list response."""
    citations: List[CitationResponse]
    total: int


# Error Schemas
class ErrorDetail(BaseModel):
    """Schema for error details."""
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    """Schema for error response."""
    error: ErrorDetail


# Pagination Schemas
class PaginationParams(BaseModel):
    """Schema for pagination parameters."""
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(10, ge=1, le=100, description="Number of items per page")


class PaginationResponse(BaseModel):
    """Schema for pagination response."""
    page: int
    page_size: int
    total: int
    total_pages: int


# API Endpoint Schemas (matching specification)
class HistoryTurn(BaseModel):
    """A single turn in the conversation history."""
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., description="Message text")


class ChatRequest(BaseModel):
    """Schema for /api/chat POST request."""
    question: str = Field(..., description="User's question or problem")
    language: str = Field("fa", description="Language code: fa, en, or kr")
    source_scope: Optional[str] = Field("books", description="Source scope: books, web, web_books")
    session_id: Optional[UUID] = Field(None, description="Existing chat session ID for multi-turn")
    history: Optional[List[HistoryTurn]] = Field(None, description="Recent conversation turns (max 6)")


class VerseMultilingual(BaseModel):
    """Multilingual verse text."""
    fa: Optional[str] = None
    en: Optional[str] = None
    kr: Optional[str] = None


class CitationSummary(BaseModel):
    """Citation summary for chat response."""
    id: UUID
    book: Optional[str] = None
    page_number: Optional[int] = None
    snippet: Optional[str] = None


class RetrievedCandidate(BaseModel):
    """Retrieved candidate for reasoning display."""
    id: UUID
    book: Optional[str] = None
    page_number: Optional[int] = None
    snippet: Optional[str] = None
    score: Optional[float] = None


class ChatResponse(BaseModel):
    """Schema for /api/chat POST response."""
    session_id: Optional[UUID] = None
    verse: VerseMultilingual
    interpretation: str
    advice: List[str]
    citations: List[CitationSummary]
    retrieved_candidates: Optional[List[RetrievedCandidate]] = None
    grounded: bool = Field(True, description="True when response is grounded in retrieved corpus data")


class SearchRequest(BaseModel):
    """Schema for /api/search GET request (query params)."""
    query: str
    lang: str = Field("fa", description="Language code: fa, en, or kr")


class VerseSummary(BaseModel):
    """Verse summary for search results."""
    id: UUID
    text: str
    book: Optional[str] = None
    page: Optional[int] = None
    score: float = Field(0.0, description="Relevance score")


class SearchResponse(BaseModel):
    """Schema for /api/search GET response."""
    results: List[VerseSummary]


class CitationDetail(BaseModel):
    """Schema for /api/citation/:id GET response."""
    book: Optional[str] = None
    page_number: Optional[int] = None
    snippet: Optional[str] = None
    translation: Optional[str] = None
    bbox: Optional[Dict[str, float]] = None  # {x, y, width, height}


class BookPageVerse(BaseModel):
    """Verse in book page."""
    line: Optional[int] = None
    translation: Optional[str] = None


class BookPageResponse(BaseModel):
    """Schema for /api/books/:id/pages/:n GET response."""
    book_id: UUID
    page: int
    verses: List[BookPageVerse]
    highlighted: List[int] = Field(default_factory=list, description="Indices of highlighted verses")
    pdf_url: Optional[str] = None


class SignupRequest(BaseModel):
    """Schema for /api/auth/signup POST request."""
    email: EmailStr
    password: str = Field(..., min_length=8)


class SignupResponse(BaseModel):
    """Schema for /api/auth/signup POST response."""
    status: str = "User created"


class LoginResponse(BaseModel):
    """Schema for /api/auth/login POST response."""
    token: str


class KakaoOAuthRequest(BaseModel):
    """Schema for Kakao OAuth callback request."""
    code: str = Field(..., description="Authorization code from Kakao")
    redirect_uri: str = Field(..., description="Redirect URI used in OAuth flow")


class GoogleOAuthRequest(BaseModel):
    """Schema for Google OAuth callback request."""
    code: str = Field(..., description="Authorization code from Google")
    redirect_uri: str = Field(..., description="Redirect URI used in OAuth flow")


class UserSettingsUpdate(BaseModel):
    """Schema for /api/user/settings PATCH request."""
    preferred_lang: Optional[str] = Field(None, description="Language: fa, en, or kr")
    theme: Optional[str] = Field(None, description="Theme: light or dark")

    @validator("preferred_lang")
    def validate_lang(cls, v):
        if v and v not in ["fa", "en", "kr"]:
            raise ValueError("preferred_lang must be fa, en, or kr")
        return v

    @validator("theme")
    def validate_theme(cls, v):
        if v and v not in ["light", "dark"]:
            raise ValueError("theme must be light or dark")
        return v


class SettingsResponse(BaseModel):
    """Schema for /api/user/settings PATCH response."""
    status: str = "Settings updated"


class FeedbackRequest(BaseModel):
    """Schema for /api/feedback POST request.

    Both ``session_id`` and ``message_id`` are optional so that general
    feedback (not tied to a specific chat message) can be submitted from
    the navbar feedback form.
    """
    session_id: Optional[UUID] = None
    message_id: Optional[UUID] = None
    issue_type: str = Field(..., description="Issue type: ocr_error, incorrect_translation, general, bug, feature, appreciation, etc.")
    comment: Optional[str] = None


class FeedbackResponse(BaseModel):
    """Schema for /api/feedback POST response."""
    status: str = "Feedback received"
    ticket_id: UUID
