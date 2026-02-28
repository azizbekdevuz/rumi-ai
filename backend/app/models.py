"""
SQLAlchemy models for RUMI AI Agent Backend database schema.
SQLite-compatible version.
"""
from sqlalchemy import Column, String, Integer, Text, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    """Model for storing user information."""
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(Text, nullable=False, unique=True)
    password_hash = Column(Text, nullable=False)
    preferred_lang = Column(Text, nullable=True)
    theme = Column(Text, nullable=True)
    created_at = Column(Text, server_default=func.now())
    last_login = Column(Text, nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)
    is_guest = Column(Boolean, default=False, nullable=False)

    # Relationships
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    feedback_reports = relationship("FeedbackReport", back_populates="user", cascade="all, delete-orphan")


class ChatSession(Base):
    """Model for storing chat session information."""
    __tablename__ = "chat_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(Text, server_default=func.now())
    source_mode = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("Message", back_populates="chat_session", cascade="all, delete-orphan")


class Message(Base):
    """Model for storing individual messages within chat sessions."""
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(Text, nullable=False)
    message_text = Column(Text, nullable=True)
    language = Column(Text, nullable=True)
    verse_id = Column(String(36), nullable=True)
    citation_ids = Column(Text, nullable=True)
    feedback = Column(Text, nullable=True)

    # Relationships
    chat_session = relationship("ChatSession", back_populates="messages")
    feedback_reports = relationship("FeedbackReport", back_populates="message", cascade="all, delete-orphan")


class FeedbackReport(Base):
    """Model for storing user feedback on messages."""
    __tablename__ = "feedback_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    message_id = Column(String(36), ForeignKey("messages.id", ondelete="CASCADE"), nullable=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    issue_type = Column(Text, nullable=True)
    comment = Column(Text, nullable=True)
    created_at = Column(Text, server_default=func.now())

    # Relationships
    message = relationship("Message", back_populates="feedback_reports")
    user = relationship("User", back_populates="feedback_reports")


class Book(Base):
    """Model for storing book information."""
    __tablename__ = "books"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(Text, nullable=True)
    title_en = Column(Text, nullable=True)
    pdf_url = Column(Text, nullable=True)
    type = Column(Text, nullable=True)

    # Relationships
    verses = relationship("Verse", back_populates="book", cascade="all, delete-orphan")
    citations = relationship("Citation", back_populates="book", cascade="all, delete-orphan")


class Verse(Base):
    """Model for storing individual verses from books."""
    __tablename__ = "verses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    book_id = Column(String(36), ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    line_number = Column(Integer, nullable=True)
    text_fa = Column(Text, nullable=True)
    text_en = Column(Text, nullable=True)
    text_kr = Column(Text, nullable=True)

    # Relationships
    book = relationship("Book", back_populates="verses")
    citations = relationship("Citation", back_populates="verse", cascade="all, delete-orphan")


class Citation(Base):
    """Model for storing citation details for verses within books."""
    __tablename__ = "citations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    verse_id = Column(String(36), ForeignKey("verses.id", ondelete="CASCADE"), nullable=False)
    book_id = Column(String(36), ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    page_number = Column(Integer, nullable=True)
    line_range = Column(Text, nullable=True)
    highlight_box = Column(JSON, nullable=True)

    # Relationships
    verse = relationship("Verse", back_populates="citations")
    book = relationship("Book", back_populates="citations")
