"""add_display_name_to_users

Revision ID: a1b2c3d4e5f6
Revises: 493449dda5b1
Create Date: 2026-03-08

"""
from alembic import op
import sqlalchemy as sa


revision = 'a1b2c3d4e5f6'
down_revision = '493449dda5b1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('display_name', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'display_name')
