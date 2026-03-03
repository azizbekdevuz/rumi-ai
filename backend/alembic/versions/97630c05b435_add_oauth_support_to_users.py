"""add_oauth_support_to_users

Revision ID: 97630c05b435
Revises: e0be807b31b2
Create Date: 2026-03-03 19:04:22.922976

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '97630c05b435'
down_revision = 'e0be807b31b2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1) Make password_hash nullable (for OAuth users who don't have passwords)
    op.alter_column('users', 'password_hash',
                    existing_type=sa.Text(),
                    nullable=True)
    
    # 2) Add provider column with default 'email' for existing users
    op.add_column('users', sa.Column('provider', sa.Text(), nullable=False, server_default='email'))
    
    # 3) Add provider_user_id column (nullable)
    op.add_column('users', sa.Column('provider_user_id', sa.Text(), nullable=True))
    
    # 4) Create unique constraint on (provider, provider_user_id) where provider_user_id IS NOT NULL
    #    PostgreSQL partial unique index
    op.create_index(
        'idx_users_provider_user_id',
        'users',
        ['provider', 'provider_user_id'],
        unique=True,
        postgresql_where=sa.text('provider_user_id IS NOT NULL')
    )


def downgrade() -> None:
    # Drop unique constraint/index
    op.drop_index('idx_users_provider_user_id', table_name='users')
    
    # Drop new columns
    op.drop_column('users', 'provider_user_id')
    op.drop_column('users', 'provider')
    
    # Make password_hash NOT NULL again (may fail if OAuth users exist)
    op.alter_column('users', 'password_hash',
                    existing_type=sa.Text(),
                    nullable=False)
