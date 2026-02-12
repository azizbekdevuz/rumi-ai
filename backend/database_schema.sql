-- RUMI AI Agent Backend Database Schema
-- PostgreSQL
-- Based on ERD: Users, Chat_Sessions, Messages, Feedback_Reports, Verses, Books, Citations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector extension for embeddings (optional, uncomment if needed)
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Table for storing user information
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    preferred_lang TEXT,
    theme TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_is_deleted ON users(is_deleted);

-- Table for storing chat session information
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source_mode TEXT
);

-- Indexes for chat_sessions
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_created_at ON chat_sessions(created_at);

-- Table for storing individual messages within chat sessions
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL,  -- e.g., "user", "assistant"
    message_text TEXT,
    language TEXT,
    verse_id UUID REFERENCES verses(id) ON DELETE SET NULL,
    citation_ids UUID[],  -- Array of citation UUIDs
    feedback TEXT
);

-- Indexes for messages
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_role ON messages(role);
CREATE INDEX idx_messages_verse_id ON messages(verse_id);
CREATE INDEX idx_messages_citation_ids ON messages USING GIN(citation_ids);

-- Table for storing user feedback on messages
CREATE TABLE feedback_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    issue_type TEXT,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for feedback_reports
CREATE INDEX idx_feedback_reports_message_id ON feedback_reports(message_id);
CREATE INDEX idx_feedback_reports_user_id ON feedback_reports(user_id);
CREATE INDEX idx_feedback_reports_created_at ON feedback_reports(created_at);

-- Table for storing book information
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    title_en TEXT,
    pdf_url TEXT,
    type TEXT  -- e.g., "poetry", "prose"
);

-- Indexes for books
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_type ON books(type);

-- Table for storing individual verses from books
CREATE TABLE verses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    line_number INTEGER,
    text_fa TEXT,  -- Farsi text
    text_en TEXT,  -- English text
    text_kr TEXT,  -- Korean text
    -- Note: embedding column would use pgvector extension
    -- embedding vector(1536)  -- Uncomment when pgvector is installed
);

-- Indexes for verses
CREATE INDEX idx_verses_book_id ON verses(book_id);
CREATE INDEX idx_verses_line_number ON verses(line_number);
-- Index for vector similarity search (uncomment when pgvector is installed)
-- CREATE INDEX idx_verses_embedding ON verses USING ivfflat (embedding vector_cosine_ops);

-- Table for storing citation details for verses within books
CREATE TABLE citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verse_id UUID NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    page_number INTEGER,
    line_range TEXT,
    highlight_box JSONB  -- JSON data for bounding box
);

-- Indexes for citations
CREATE INDEX idx_citations_verse_id ON citations(verse_id);
CREATE INDEX idx_citations_book_id ON citations(book_id);
CREATE INDEX idx_citations_page_number ON citations(page_number);
CREATE INDEX idx_citations_highlight_box ON citations USING GIN(highlight_box);

-- Function to update the updated_at timestamp (if needed in future)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';
