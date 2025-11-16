"""add registration_date to farmers

Revision ID: b8a1c3d4e5f6
Revises: 365aacaaced0
Create Date: 2025-10-26 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'b8a1c3d4e5f6'
down_revision = '365aacaaced0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('farmers', sa.Column('registration_date', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('farmers', 'registration_date')
