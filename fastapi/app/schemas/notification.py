from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    user_role: str
    notification_type: str
    title: str
    message: str
    entity_id: UUID | None = None
    entity_type: str | None = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationListResponse(BaseModel):
    total: int
    skip: int
    limit: int
    results: list[NotificationResponse]


class UnreadCountResponse(BaseModel):
    unread_count: int
