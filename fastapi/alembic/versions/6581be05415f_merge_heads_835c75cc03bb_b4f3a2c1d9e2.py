"""merge heads 835c75cc03bb + b4f3a2c1d9e2

Revision ID: 6581be05415f
Revises: 835c75cc03bb, b4f3a2c1d9e2
Create Date: 2025-10-28 16:32:41.477681

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6581be05415f'
down_revision: Union[str, Sequence[str], None] = ('835c75cc03bb', 'b4f3a2c1d9e2')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
