"""add cattle and farmer extra columns

Revision ID: 365aacaaced0
Revises: 2293f5f28ca2
Create Date: 2025-10-26 14:19:19.785601

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '365aacaaced0'
down_revision: Union[str, Sequence[str], None] = '2293f5f28ca2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create new table `cattles`
    op.create_table(
        "cattles",
        sa.Column("cid", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),

        sa.Column("inaph_tag_id", sa.String(length=50), nullable=True),
        sa.Column("inaph_farmer_id", sa.String(length=30), nullable=True),
        sa.Column("local_cattle_id", sa.String(length=30), nullable=True),

        sa.Column("species", sa.String(length=30), nullable=False),
        sa.Column("breed", sa.String(length=50), nullable=False),
        sa.Column("sex", sa.String(length=10), nullable=False),
        sa.Column("dob", sa.DateTime(), nullable=False),
        sa.Column("colour_markings", sa.String(length=100), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=True, server_default=sa.text("'Active'")),
        sa.Column("last_known_location", sa.String(length=200), nullable=True),

        sa.Column("owner_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("farmers.fid"), nullable=False),
    )

    # Create indexes/unique constraints for cattle
    op.create_index("ix_cattles_inaph_tag_id", "cattles", ["inaph_tag_id"], unique=True)
    op.create_index("ix_cattles_local_cattle_id", "cattles", ["local_cattle_id"], unique=True)

    # Add new nullable columns to `farmers` so existing rows are not affected.
    op.add_column("farmers", sa.Column("inaph_id", sa.String(length=30), nullable=True))
    op.add_column("farmers", sa.Column("district", sa.String(length=100), nullable=True))
    op.add_column("farmers", sa.Column("state", sa.String(length=100), nullable=True))

    # Add unique constraint for farmer.inaph_id (still nullable)
    op.create_index("ix_farmers_inaph_id", "farmers", ["inaph_id"], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    # Safer downgrade: only remove objects we created if they exist.
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # Remove farmer columns and index if present (do NOT drop the farmers table itself)
    if "farmers" in inspector.get_table_names():
        farmer_cols = [c["name"] for c in inspector.get_columns("farmers")]
        if "inaph_id" in farmer_cols:
            # drop index if exists
            try:
                op.drop_index("ix_farmers_inaph_id", table_name="farmers")
            except Exception:
                pass
            try:
                op.drop_column("farmers", "inaph_id")
            except Exception:
                pass
        if "district" in farmer_cols:
            try:
                op.drop_column("farmers", "district")
            except Exception:
                pass
        if "state" in farmer_cols:
            try:
                op.drop_column("farmers", "state")
            except Exception:
                pass

    # Drop cattle indexes and table only if the 'cattles' table exists
    if "cattles" in inspector.get_table_names():
        try:
            op.drop_index("ix_cattles_inaph_tag_id", table_name="cattles")
        except Exception:
            pass
        try:
            op.drop_index("ix_cattles_local_cattle_id", table_name="cattles")
        except Exception:
            pass
        try:
            op.drop_table("cattles")
        except Exception:
            pass
