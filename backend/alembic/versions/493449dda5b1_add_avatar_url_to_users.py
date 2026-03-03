"""add_avatar_url_to_users

Revision ID: 493449dda5b1
Revises: 97630c05b435
Create Date: 2026-03-03 21:07:47.959344

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '493449dda5b1'
down_revision = '97630c05b435'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add avatar_url column to users table
    op.add_column('users', sa.Column('avatar_url', sa.Text(), nullable=True))


def downgrade() -> None:
    # Remove avatar_url column
    op.drop_column('users', 'avatar_url')
