"""add_is_guest_to_users

Revision ID: 1133bdb7857a
Revises: 001_create_erd_schema
Create Date: 2026-02-19 15:37:07.725366

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1133bdb7857a'
down_revision = '001_create_erd_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add is_guest column to users table
    op.add_column('users', sa.Column('is_guest', sa.Boolean(), nullable=False, server_default='false'))
    # Create index for faster guest user lookups
    op.create_index('idx_users_is_guest', 'users', ['is_guest'])


def downgrade() -> None:
    # Remove index and column
    op.drop_index('idx_users_is_guest', table_name='users')
    op.drop_column('users', 'is_guest')
