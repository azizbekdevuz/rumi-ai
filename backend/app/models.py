"""
SQLAlchemy models for RUMI AI Agent Backend database schema.
Based on ERD: Users, Chat_Sessions, Messages, Feedback_Reports, Verses, Books, Citations
"""
from sqlalchemy import Column, String, Integer, Text, ForeignKey, JSON, TIMESTAMP, Boolean, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid


class User(Base):
    """Model for storing user information."""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(Text, nullable=False, unique=True)
    password_hash = Column(Text, nullable=False)
    preferred_lang = Column(Text, nullable=True)
    theme = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    last_login = Column(TIMESTAMP(timezone=True), nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)

    # Relationships
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    feedback_reports = relationship("FeedbackReport", back_populates="user", cascade="all, delete-orphan")


class ChatSession(Base):
    """Model for storing chat session information."""
    __tablename__ = "chat_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    source_mode = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("Message", back_populates="chat_session", cascade="all, delete-orphan")


class Message(Base):
    """Model for storing individual messages within chat sessions."""
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(Text, nullable=False)  # e.g., "user", "assistant"
    message_text = Column(Text, nullable=True)
    language = Column(Text, nullable=True)
    verse_id = Column(UUID(as_uuid=True), ForeignKey("verses.id", ondelete="SET NULL"), nullable=True)
    citation_ids = Column(ARRAY(UUID(as_uuid=True)), nullable=True)  # Array of citation UUIDs
    feedback = Column(Text, nullable=True)

    # Relationships
    chat_session = relationship("ChatSession", back_populates="messages")
    verse = relationship("Verse", foreign_keys=[verse_id])
    feedback_reports = relationship("FeedbackReport", back_populates="message", cascade="all, delete-orphan")


class FeedbackReport(Base):
    """Model for storing user feedback on messages."""
    __tablename__ = "feedback_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    issue_type = Column(Text, nullable=True)
    comment = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    message = relationship("Message", back_populates="feedback_reports")
    user = relationship("User", back_populates="feedback_reports")


class Book(Base):
    """Model for storing book information."""
    __tablename__ = "books"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(Text, nullable=True)
    title_en = Column(Text, nullable=True)
    pdf_url = Column(Text, nullable=True)
    type = Column(Text, nullable=True)  # e.g., "poetry", "prose"

    # Relationships
    verses = relationship("Verse", back_populates="book", cascade="all, delete-orphan")
    citations = relationship("Citation", back_populates="book", cascade="all, delete-orphan")


class Verse(Base):
    """Model for storing individual verses from books."""
    __tablename__ = "verses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    line_number = Column(Integer, nullable=True)
    text_fa = Column(Text, nullable=True)  # Farsi text
    text_en = Column(Text, nullable=True)  # English text
    text_kr = Column(Text, nullable=True)  # Korean text
    # Note: embedding column would use pgvector extension
    # embedding = Column(Vector(1536))  # Uncomment when pgvector is installed

    # Relationships
    book = relationship("Book", back_populates="verses")
    citations = relationship("Citation", back_populates="verse", cascade="all, delete-orphan")


class Citation(Base):
    """Model for storing citation details for verses within books."""
    __tablename__ = "citations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    verse_id = Column(UUID(as_uuid=True), ForeignKey("verses.id", ondelete="CASCADE"), nullable=False)
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    page_number = Column(Integer, nullable=True)
    line_range = Column(Text, nullable=True)
    highlight_box = Column(JSON, nullable=True)  # JSON data for bounding box

    # Relationships
    verse = relationship("Verse", back_populates="citations")
    book = relationship("Book", back_populates="citations")
