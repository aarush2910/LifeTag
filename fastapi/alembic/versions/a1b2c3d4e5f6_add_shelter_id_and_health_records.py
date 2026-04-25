"""add shelter_id to cattles and create shelter_health_records table
Revision ID: a1b2c3d4e5f6
Revises: 51404701bced
Create Date: 2026-03-29 23:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "51404701bced"
branch_labels = None
depends_on = None


def upgrade():
    # 1. Add shelter_id column to cattles table
    op.add_column(
        "cattles",
        sa.Column(
            "shelter_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("shelters.sid", ondelete="SET NULL"),
            nullable=True,
        ),
    )

    # 2. Create shelter_health_records table
    op.create_table(
        "shelter_health_records",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "shelter_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("shelters.sid", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "cattle_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("cattles.cid", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "vet_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("vets.vid", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("record_type", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("medicine", sa.String(length=200), nullable=True),
        sa.Column("record_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=True),
    )

    # 3. Create indexes
    op.create_index("ix_shelter_health_records_shelter_id", "shelter_health_records", ["shelter_id"])
    op.create_index("ix_shelter_health_records_cattle_id", "shelter_health_records", ["cattle_id"])


def downgrade():
    op.drop_index("ix_shelter_health_records_cattle_id", table_name="shelter_health_records")
    op.drop_index("ix_shelter_health_records_shelter_id", table_name="shelter_health_records")
    op.drop_table("shelter_health_records")
    op.drop_column("cattles", "shelter_id")
