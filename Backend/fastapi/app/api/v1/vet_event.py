from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from uuid import UUID
from app.schemas.vet_event import VetEventCreate, VetEventResponse
from crud.vet_event import (
    create_vet_event,
    get_all_vet_events,
    get_events_by_cattle
)
from app.db.session import get_db
from app.core.redis_client import cache_get, cache_set, cache_delete_pattern
from app.models.cattle import Cattle
from app.models.vet_health import VetEvent
from app.models.vet_appointment import Appointment
from app.tasks.notification_tasks import schedule_vet_event_notification

router = APIRouter( tags=["Vet Events"])

# 🟢 Create new vaccination event
@router.post("/create", response_model=VetEventResponse, status_code=201)
async def add_vet_event(
    event: VetEventCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    try:
        new_event = await create_vet_event(db, event)

        cattle_stmt = select(Cattle).where(Cattle.cid == new_event.cattle_id)
        cattle = (await db.execute(cattle_stmt)).scalars().first()
        if cattle:
            schedule_vet_event_notification(
                background_tasks,
                user_id=cattle.owner_id,
                event_type=new_event.event_type,
                event_name=new_event.event_name,
                next_due_date=new_event.next_due_date,
                event_id=new_event.id,
            )

        # Invalidate events caches
        try:
            await cache_delete_pattern("vet_events:*")
        except Exception:
            pass
        return new_event
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 🔵 Get all vaccination events
@router.get("/", response_model=list[VetEventResponse])
async def list_vet_events(db: AsyncSession = Depends(get_db)):
    cache_key = "vet_events:all"
    cached = await cache_get(cache_key)
    if cached:
        return cached
    events = await get_all_vet_events(db)
    if not events:
        raise HTTPException(status_code=404, detail="No vaccination events found")
    payload = [VetEventResponse.model_validate(e).model_dump() for e in events]
    try:
        await cache_set(cache_key, payload, ttl=600)
    except Exception:
        pass
    return payload


# 🟣 Get vaccination events for a specific cattle
@router.get("/cattle_id", response_model=list[VetEventResponse])
async def list_vet_events_for_cattle(cattle_id: UUID, db: AsyncSession = Depends(get_db)):
    cache_key = f"vet_events:cattle:{cattle_id}"
    cached = await cache_get(cache_key)
    if cached:
        return cached
    events = await get_events_by_cattle(db, cattle_id)
    if not events:
        raise HTTPException(status_code=404, detail="No events found for this cattle")
    payload = [VetEventResponse.model_validate(e).model_dump() for e in events]
    try:
        await cache_set(cache_key, payload, ttl=600)
    except Exception:
        pass
    return payload


# 👨‍⚕️ Get vaccination events for the currently logged-in vet
@router.get("/by-vet", response_model=list[VetEventResponse])
async def list_events_by_vet(
    x_user_id: str = Header(..., alias="x-user-id"),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns all vaccination/events for cattle that the vet has handled
    (i.e., cattle from the vet's appointments).
    """
    try:
        vet_uuid = UUID(x_user_id)
    except ValueError:
        raise HTTPException(400, "Invalid vet id in x-user-id header")

    # Get all cattle_ids from this vet's appointments
    appt_stmt = select(Appointment.cattle_id).where(Appointment.vet_id == vet_uuid).distinct()
    cattle_ids_res = await db.execute(appt_stmt)
    cattle_ids = [row[0] for row in cattle_ids_res.all()]

    if not cattle_ids:
        return []

    stmt = (
        select(VetEvent)
        .where(VetEvent.cattle_id.in_(cattle_ids))
        .order_by(VetEvent.event_date.desc())
    )
    result = await db.execute(stmt)
    events = result.scalars().all()
    return [VetEventResponse.model_validate(e) for e in events]


# 🐄 Get cattle list for vet (for vaccination event dropdown)
@router.get("/vet-cattle", response_model=list[dict])
async def get_vet_cattle(
    x_user_id: str = Header(..., alias="x-user-id"),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns cattle that the logged-in vet has handled via approved/past appointments.
    Used to populate the cattle dropdown in the vaccination/events form.
    """
    try:
        vet_uuid = UUID(x_user_id)
    except ValueError:
        raise HTTPException(400, "Invalid vet id in x-user-id header")

    # Get distinct cattle_ids from this vet's appointments
    appt_stmt = (
        select(Appointment.cattle_id)
        .where(Appointment.vet_id == vet_uuid)
        .distinct()
    )
    cattle_ids_res = await db.execute(appt_stmt)
    cattle_ids = [row[0] for row in cattle_ids_res.all()]

    if not cattle_ids:
        return []

    stmt = (
        select(Cattle)
        .options(selectinload(Cattle.farmer))
        .where(Cattle.cid.in_(cattle_ids))
        .order_by(Cattle.cattle_name)
    )
    result = await db.execute(stmt)
    cattle_list = result.scalars().all()

    return [
        {
            "cid": str(c.cid),
            "cattle_name": c.cattle_name,
            "breed": c.breed,
            "inaph_tag_id": c.inaph_tag_id,
            "local_cattle_id": c.local_cattle_id,
            "owner_name": c.farmer.fname if c.farmer else None,
        }
        for c in cattle_list
    ]


# 🔔 Notify farmer about an event
@router.post("/{event_id}/notify-farmer", status_code=200)
async def notify_farmer_about_event(
    event_id: UUID,
    background_tasks: BackgroundTasks,
    x_user_id: str = Header(..., alias="x-user-id"),
    db: AsyncSession = Depends(get_db),
):
    """Vet manually sends a notification to the farmer about a vaccination/event."""
    event = await db.get(VetEvent, event_id)
    if not event:
        raise HTTPException(404, "Event not found")

    cattle = await db.get(Cattle, event.cattle_id)
    if not cattle:
        raise HTTPException(404, "Cattle not found for this event")

    schedule_vet_event_notification(
        background_tasks,
        user_id=cattle.owner_id,
        event_type=event.event_type,
        event_name=event.event_name,
        next_due_date=event.next_due_date,
        event_id=event.id,
    )
    return {"message": "Notification sent to farmer"}


# 🌾 Get all vaccination events for a farmer's cattle (by farmer user_id)
@router.get("/farmer/{farmer_id}", response_model=list[VetEventResponse])
async def list_events_for_farmer(
    farmer_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Returns all vaccination/event records for cattle owned by this farmer."""
    cache_key = f"vet_events:farmer:{farmer_id}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    # Get all cattle_ids owned by this farmer
    cattle_stmt = select(Cattle.cid).where(Cattle.owner_id == farmer_id)
    cattle_res = await db.execute(cattle_stmt)
    cattle_ids = [row[0] for row in cattle_res.all()]

    if not cattle_ids:
        return []

    stmt = (
        select(VetEvent)
        .where(VetEvent.cattle_id.in_(cattle_ids))
        .order_by(VetEvent.event_date.desc())
    )
    result = await db.execute(stmt)
    events = result.scalars().all()

    payload = [VetEventResponse.model_validate(e).model_dump(mode="json") for e in events]
    try:
        await cache_set(cache_key, payload, ttl=300)
    except Exception:
        pass
    return payload

