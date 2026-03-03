"""add_message_created_at_and_structured_data

Revision ID: 5dc715e8c156
Revises: 002_feedback_nullable
Create Date: 2026-03-03 02:54:31.434294

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5dc715e8c156'
down_revision = '002_feedback_nullable'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add created_at column (nullable initially for backfill)
    op.add_column('messages', sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=True))
    
    # Backfill existing rows: set created_at to NOW() for all existing messages
    op.execute("UPDATE messages SET created_at = NOW() WHERE created_at IS NULL")
    
    # Make created_at NOT NULL with server default
    op.alter_column('messages', 'created_at',
                    existing_type=sa.TIMESTAMP(timezone=True),
                    nullable=False,
                    server_default=sa.text('now()'))
    
    # Add structured data columns for assistant message snapshots
    op.add_column('messages', sa.Column('interpretation_text', sa.Text(), nullable=True))
    op.add_column('messages', sa.Column('advice_json', sa.Text(), nullable=True))
    op.add_column('messages', sa.Column('verse_json', sa.Text(), nullable=True))
    op.add_column('messages', sa.Column('citations_json', sa.Text(), nullable=True))
    
    # Create index on (session_id, created_at) for efficient chronological queries
    op.create_index('idx_messages_session_created', 'messages', ['session_id', 'created_at'], unique=False)


def downgrade() -> None:
    # Drop index
    op.drop_index('idx_messages_session_created', table_name='messages')
    
    # Drop structured data columns
    op.drop_column('messages', 'citations_json')
    op.drop_column('messages', 'verse_json')
    op.drop_column('messages', 'advice_json')
    op.drop_column('messages', 'interpretation_text')
    
    # Drop created_at column
    op.drop_column('messages', 'created_at')
