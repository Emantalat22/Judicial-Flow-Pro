"""create hearings table

Revision ID: f1d3470a57e8
Revises: a2f662ca9217
Create Date: 2026-08-30 20:55:15.745028

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f1d3470a57e8'
down_revision: Union[str, None] = 'a2f662ca9217'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'hearings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('case_id', sa.Integer(), nullable=False),
        sa.Column('hearing_type', sa.String(), nullable=True),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('location', sa.String(), nullable=True),
        sa.Column('judge', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='SCHEDULED'),
        sa.Column('outcome', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_hearings_case_id'), 'hearings', ['case_id'], unique=False)
    op.create_index(op.f('ix_hearings_id'), 'hearings', ['id'], unique=False)
    op.create_index(op.f('ix_hearings_scheduled_at'), 'hearings', ['scheduled_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_hearings_scheduled_at'), table_name='hearings')
    op.drop_index(op.f('ix_hearings_case_id'), table_name='hearings')
    op.drop_index(op.f('ix_hearings_id'), table_name='hearings')
    op.drop_table('hearings')
