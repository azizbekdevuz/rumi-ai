"""add_message_turn_index

Revision ID: e0be807b31b2
Revises: 5dc715e8c156
Create Date: 2026-03-03 03:57:00.578544

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e0be807b31b2'
down_revision = '5dc715e8c156'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1) Add turn_index column (nullable for backfill)
    op.add_column('messages', sa.Column('turn_index', sa.Integer(), nullable=True))

    # 2) Backfill existing rows per session deterministically
    #    Order by created_at ASC, id ASC, then assign 1..N within each session.
    op.execute(
        """
        WITH ordered AS (
            SELECT
                id,
                session_id,
                ROW_NUMBER() OVER (
                    PARTITION BY session_id
                    ORDER BY created_at ASC, id ASC
                ) AS rn
            FROM messages
        )
        UPDATE messages AS m
        SET turn_index = o.rn
        FROM ordered o
        WHERE m.id = o.id;
        """
    )

    # 3) Make turn_index NOT NULL going forward
    op.alter_column(
        'messages',
        'turn_index',
        existing_type=sa.Integer(),
        nullable=False,
    )

    # 4) Index to support chronological session queries
    op.create_index(
        'idx_messages_session_turn',
        'messages',
        ['session_id', 'turn_index'],
        unique=False,
    )

    # 5) Ensure per-session turn_index is unique
    op.create_unique_constraint(
        'uq_messages_session_turn',
        'messages',
        ['session_id', 'turn_index'],
    )


def downgrade() -> None:
    op.drop_constraint('uq_messages_session_turn', 'messages', type_='unique')
    op.drop_index('idx_messages_session_turn', table_name='messages')
    op.drop_column('messages', 'turn_index')
