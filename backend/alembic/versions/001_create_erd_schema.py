"""Create new schema based on ERD: users, chat_sessions, messages, feedback_reports, verses, books, citations

Revision ID: 001_create_erd_schema
Revises: 
Create Date: 2025-01-22

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_create_erd_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable UUID extension
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('email', sa.Text(), nullable=False),
        sa.Column('password_hash', sa.Text(), nullable=False),
        sa.Column('preferred_lang', sa.Text(), nullable=True),
        sa.Column('theme', sa.Text(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
        sa.Column('last_login', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.UniqueConstraint('email')
    )
    op.create_index('idx_users_email', 'users', ['email'])
    op.create_index('idx_users_created_at', 'users', ['created_at'])
    op.create_index('idx_users_is_deleted', 'users', ['is_deleted'])
    
    # Create chat_sessions table
    op.create_table(
        'chat_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
        sa.Column('source_mode', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )
    op.create_index('idx_chat_sessions_user_id', 'chat_sessions', ['user_id'])
    op.create_index('idx_chat_sessions_created_at', 'chat_sessions', ['created_at'])
    
    # Create books table (created before verses since verses references books)
    op.create_table(
        'books',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('title', sa.Text(), nullable=True),
        sa.Column('title_en', sa.Text(), nullable=True),
        sa.Column('pdf_url', sa.Text(), nullable=True),
        sa.Column('type', sa.Text(), nullable=True)
    )
    op.create_index('idx_books_title', 'books', ['title'])
    op.create_index('idx_books_type', 'books', ['type'])
    
    # Create verses table
    op.create_table(
        'verses',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('book_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('line_number', sa.Integer(), nullable=True),
        sa.Column('text_fa', sa.Text(), nullable=True),
        sa.Column('text_en', sa.Text(), nullable=True),
        sa.Column('text_kr', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['book_id'], ['books.id'], ondelete='CASCADE')
    )
    op.create_index('idx_verses_book_id', 'verses', ['book_id'])
    op.create_index('idx_verses_line_number', 'verses', ['line_number'])
    
    # Create citations table
    op.create_table(
        'citations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('verse_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('book_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('page_number', sa.Integer(), nullable=True),
        sa.Column('line_range', sa.Text(), nullable=True),
        sa.Column('highlight_box', postgresql.JSONB(), nullable=True),
        sa.ForeignKeyConstraint(['verse_id'], ['verses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['book_id'], ['books.id'], ondelete='CASCADE')
    )
    op.create_index('idx_citations_verse_id', 'citations', ['verse_id'])
    op.create_index('idx_citations_book_id', 'citations', ['book_id'])
    op.create_index('idx_citations_page_number', 'citations', ['page_number'])
    op.create_index('idx_citations_highlight_box', 'citations', ['highlight_box'], postgresql_using='gin')
    
    # Create messages table
    op.create_table(
        'messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.Text(), nullable=False),
        sa.Column('message_text', sa.Text(), nullable=True),
        sa.Column('language', sa.Text(), nullable=True),
        sa.Column('verse_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('citation_ids', postgresql.ARRAY(postgresql.UUID(as_uuid=True)), nullable=True),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['chat_sessions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['verse_id'], ['verses.id'], ondelete='SET NULL')
    )
    op.create_index('idx_messages_session_id', 'messages', ['session_id'])
    op.create_index('idx_messages_role', 'messages', ['role'])
    op.create_index('idx_messages_verse_id', 'messages', ['verse_id'])
    op.create_index('idx_messages_citation_ids', 'messages', ['citation_ids'], postgresql_using='gin')
    
    # Create feedback_reports table
    op.create_table(
        'feedback_reports',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('message_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('issue_type', sa.Text(), nullable=True),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['message_id'], ['messages.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )
    op.create_index('idx_feedback_reports_message_id', 'feedback_reports', ['message_id'])
    op.create_index('idx_feedback_reports_user_id', 'feedback_reports', ['user_id'])
    op.create_index('idx_feedback_reports_created_at', 'feedback_reports', ['created_at'])


def downgrade() -> None:
    # Drop tables in reverse order of dependencies
    op.drop_table('feedback_reports')
    op.drop_table('messages')
    op.drop_table('citations')
    op.drop_table('verses')
    op.drop_table('books')
    op.drop_table('chat_sessions')
    op.drop_table('users')
