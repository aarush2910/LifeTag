"""add notifications table

Revision ID: 7f41d8a3c912
Revises: e0a533ddf624
Create Date: 2026-03-23 11:00:00.000000
"""

from alembic import op


revision = "7f41d8a3c912"
down_revision = "e0a533ddf624"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS notifications (
            id UUID NOT NULL,
            user_id UUID NOT NULL,
            user_role VARCHAR(20) NOT NULL,
            notification_type VARCHAR(50) NOT NULL,
            title VARCHAR(150) NOT NULL,
            message TEXT NOT NULL,
            entity_id UUID,
            entity_type VARCHAR(40),
            is_read BOOLEAN DEFAULT false NOT NULL,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
            PRIMARY KEY (id)
        )
        """
    )

    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_id ON notifications (id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_user_id ON notifications (user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_notification_type ON notifications (notification_type)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_is_read ON notifications (is_read)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_created_at ON notifications (created_at)")


def downgrade():
    op.execute("DROP INDEX IF EXISTS ix_notifications_created_at")
    op.execute("DROP INDEX IF EXISTS ix_notifications_is_read")
    op.execute("DROP INDEX IF EXISTS ix_notifications_notification_type")
    op.execute("DROP INDEX IF EXISTS ix_notifications_user_id")
    op.execute("DROP INDEX IF EXISTS ix_notifications_id")
    op.execute("DROP TABLE IF EXISTS notifications")
