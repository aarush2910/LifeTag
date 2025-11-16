"""added cattle table and modify farmer table

Revision ID: 2293f5f28ca2
Revises: 6c11b86fbdc3
Create Date: 2025-10-26 14:00:55.200852

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2293f5f28ca2'
down_revision: Union[str, Sequence[str], None] = '6c11b86fbdc3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
