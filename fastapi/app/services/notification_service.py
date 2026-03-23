import asyncio
from datetime import datetime, timedelta
from uuid import UUID
from fastapi import WebSocket
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.db.session import AsyncSessionLocal
from app.core.redis_client import cache_delete_pattern
from app.tasks.notification_tasks import format_ws_payload


class NotificationConnectionManager:
    def __init__(self):
        self._connections: dict[str, set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, user_id: UUID, websocket: WebSocket):
        await websocket.accept()
        key = str(user_id)
        async with self._lock:
            self._connections.setdefault(key, set()).add(websocket)

    async def disconnect(self, user_id: UUID, websocket: WebSocket):
        key = str(user_id)
        async with self._lock:
            sockets = self._connections.get(key)
            if not sockets:
                return
            sockets.discard(websocket)
            if not sockets:
                self._connections.pop(key, None)

    async def push(self, user_id: UUID, payload: dict):
        key = str(user_id)
        sockets = list(self._connections.get(key, set()))
        for ws in sockets:
            try:
                await ws.send_json(payload)
            except Exception:
                await self.disconnect(user_id, ws)


notification_ws_manager = NotificationConnectionManager()





async def create_notification(
    db: AsyncSession,
    *,
    user_id: UUID,
    notification_type: str,
    title: str,
    message: str,
    user_role: str = "farmer",
    entity_id: UUID | None = None,
    entity_type: str | None = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        user_role=user_role,
        notification_type=notification_type,
        title=title,
        message=message,
        entity_id=entity_id,
        entity_type=entity_type,
        is_read=False,
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)

    try:
        await cache_delete_pattern(f"notifications:{user_id}:*")
    except Exception:
        pass

    await notification_ws_manager.push(
        user_id,
        format_ws_payload(notification),
    )
    return notification


async def list_notifications(
    db: AsyncSession,
    *,
    user_id: UUID,
    unread_only: bool,
    skip: int,
    limit: int,
) -> tuple[int, list[Notification]]:
    count_stmt = select(func.count()).select_from(Notification).where(Notification.user_id == user_id)
    query_stmt = select(Notification).where(Notification.user_id == user_id)

    if unread_only:
        count_stmt = count_stmt.where(Notification.is_read.is_(False))
        query_stmt = query_stmt.where(Notification.is_read.is_(False))

    total = (await db.execute(count_stmt)).scalar_one() or 0
    query_stmt = query_stmt.order_by(Notification.created_at.desc()).offset(skip).limit(limit)
    rows = (await db.execute(query_stmt)).scalars().all()
    return total, rows


async def unread_count(db: AsyncSession, *, user_id: UUID) -> int:
    stmt = (
        select(func.count())
        .select_from(Notification)
        .where(Notification.user_id == user_id, Notification.is_read.is_(False))
    )
    return (await db.execute(stmt)).scalar_one() or 0


async def mark_notification_read(db: AsyncSession, *, user_id: UUID, notification_id: UUID) -> Notification | None:
    stmt = select(Notification).where(Notification.id == notification_id, Notification.user_id == user_id)
    notification = (await db.execute(stmt)).scalars().first()
    if not notification:
        return None
    if not notification.is_read:
        notification.is_read = True
        db.add(notification)
        await db.commit()
        await db.refresh(notification)
        try:
            await cache_delete_pattern(f"notifications:{user_id}:*")
        except Exception:
            pass
    return notification


async def mark_all_notifications_read(db: AsyncSession, *, user_id: UUID) -> int:
    stmt = (
        select(Notification)
        .where(Notification.user_id == user_id, Notification.is_read.is_(False))
    )
    rows = (await db.execute(stmt)).scalars().all()
    if not rows:
        return 0

    for row in rows:
        row.is_read = True
        db.add(row)
    await db.commit()
    try:
        await cache_delete_pattern(f"notifications:{user_id}:*")
    except Exception:
        pass
    return len(rows)


async def delete_expired_read_notifications(db: AsyncSession, *, days: int = 30) -> int:
    cutoff = datetime.utcnow() - timedelta(days=days)
    stmt = delete(Notification).where(
        Notification.is_read.is_(True),
        Notification.created_at < cutoff,
    )
    result = await db.execute(stmt)
    await db.commit()
    return result.rowcount or 0


async def run_notification_ttl_cleanup_loop(stop_event: asyncio.Event, *, interval_seconds: int = 3600):
    while not stop_event.is_set():
        try:
            async with AsyncSessionLocal() as db:
                deleted = await delete_expired_read_notifications(db, days=30)
                if deleted:
                    print(f"✓ Notification TTL cleanup removed {deleted} rows")
        except Exception as e:
            print(f"⚠ Notification TTL cleanup failed: {e}")

        try:
            await asyncio.wait_for(stop_event.wait(), timeout=interval_seconds)
        except asyncio.TimeoutError:
            continue
