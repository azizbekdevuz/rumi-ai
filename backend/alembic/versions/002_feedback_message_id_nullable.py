"""Make feedback_reports.message_id nullable for general feedback

General feedback (navbar feedback form, contact page, etc.) is not
linked to a specific chat message, so message_id must be nullable.

Revision ID: 002_feedback_nullable
Revises: 1133bdb7857a
Create Date: 2026-03-03

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_feedback_nullable'
down_revision = '1133bdb7857a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Allow message_id to be NULL so general feedback can be stored
    op.alter_column(
        'feedback_reports',
        'message_id',
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=True,
    )


def downgrade() -> None:
    # Delete orphaned rows that have no message_id before re-adding constraint
    op.execute("DELETE FROM feedback_reports WHERE message_id IS NULL")
    op.alter_column(
        'feedback_reports',
        'message_id',
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=False,
    )
