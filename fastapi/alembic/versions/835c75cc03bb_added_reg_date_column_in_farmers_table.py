"""added reg date column in farmers table

Revision ID: 835c75cc03bb
Revises: b8a1c3d4e5f6
Create Date: 2025-10-26 16:24:16.236651

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '835c75cc03bb'
down_revision: Union[str, Sequence[str], None] = 'b8a1c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('farmers', sa.Column('registration_date', sa.DateTime(), nullable=True))

def downgrade() -> None:
     op.drop_column('farmers', 'registration_date')

