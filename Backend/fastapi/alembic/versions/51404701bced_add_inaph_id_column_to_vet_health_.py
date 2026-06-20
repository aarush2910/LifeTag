"""add inaph_id column to vet_health_records
Revision ID: 51404701bced
Revises: 9573a5aa3715
Create Date: 2025-11-21 23:05:22.828427
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "51404701bced"
down_revision = "9573a5aa3715"
branch_labels = None
depends_on = None


def upgrade():
    # ONLY add inaph_id column + index
    op.add_column(
        "vet_health_records",
        sa.Column("inaph_id", sa.String(length=50), nullable=False),
    )
    op.create_index(
        "ix_vet_health_records_inaph_id",
        "vet_health_records",
        ["inaph_id"],
        unique=False,
    )


def downgrade():
    op.drop_index("ix_vet_health_records_inaph_id", table_name="vet_health_records")
    op.drop_column("vet_health_records", "inaph_id")
