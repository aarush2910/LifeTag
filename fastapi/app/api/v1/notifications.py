from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, Request, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.notification import (
    NotificationListResponse,
    NotificationResponse,
    UnreadCountResponse,
)
from app.services.notification_service import (
    list_notifications,
    unread_count,
    mark_notification_read,
    mark_all_notifications_read,
    notification_ws_manager,
)


router = APIRouter(tags=["Notifications"])


def _resolve_user_id_from_request(request: Request) -> UUID:
    raw = request.headers.get("x-user-id")
    if not raw:
        raise HTTPException(status_code=400, detail="x-user-id header is required")
    try:
        return UUID(raw)
    except Exception:
        raise HTTPException(status_code=400, detail="x-user-id must be a valid UUID")


@router.get("/", response_model=NotificationListResponse)
async def get_notifications(
    request: Request,
    db: AsyncSession = Depends(get_db),
    unread_only: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=200),
):
    user_id = _resolve_user_id_from_request(request)
    total, rows = await list_notifications(
        db,
        user_id=user_id,
        unread_only=unread_only,
        skip=skip,
        limit=limit,
    )
    return NotificationListResponse(
        total=total,
        skip=skip,
        limit=limit,
        results=[NotificationResponse.model_validate(row) for row in rows],
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(request: Request, db: AsyncSession = Depends(get_db)):
    user_id = _resolve_user_id_from_request(request)
    count = await unread_count(db, user_id=user_id)
    return UnreadCountResponse(unread_count=count)


@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def read_notification(
    notification_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    user_id = _resolve_user_id_from_request(request)
    row = await mark_notification_read(db, user_id=user_id, notification_id=notification_id)
    if not row:
        raise HTTPException(status_code=404, detail="Notification not found")
    return NotificationResponse.model_validate(row)


@router.put("/read-all")
async def read_all_notifications(request: Request, db: AsyncSession = Depends(get_db)):
    user_id = _resolve_user_id_from_request(request)
    updated = await mark_all_notifications_read(db, user_id=user_id)
    return {"updated": updated}


@router.websocket("/ws/{user_id}")
async def notifications_ws(websocket: WebSocket, user_id: UUID):
    await notification_ws_manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await notification_ws_manager.disconnect(user_id, websocket)
    except Exception:
        await notification_ws_manager.disconnect(user_id, websocket)
