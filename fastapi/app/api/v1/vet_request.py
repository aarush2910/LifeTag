from typing import List, Optional
from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy import select, and_, func, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db  
from app.models.vet_appointment import Appointment 
from app.models.user import Farmer, Vet
from app.models.cattle import Cattle
from app.services.appointment_helpers import (
    appointment_to_response,
    resolve_farmer,
    resolve_cattle,
    resolve_vet,
)
from app.schemas.vet import VetCard
from app.schemas.vet_appointment import ( 
    AppointmentUpdate,
    AppointmentResponse,
    StatusEnum as StatusEnumSchema,
    PaginatedAppointments,
    AppointmentCreateWithIds,
)
from app.core.redis_client import cache_get, cache_set, cache_delete_pattern
from app.tasks.notification_tasks import send_appointment_approved_notification_now

router = APIRouter(tags=["Appointments"])


@router.get("/vets", response_model=List[VetCard])
async def list_vets(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=500),
    specialization: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
):
    """Return a list of vets for the farmer dashboard. Supports simple filtering by specialization or partial name."""
    # Cache key
    cache_key = f"vets:list:limit:{limit}:spec:{(specialization or '').lower()}:name:{(name or '').lower()}"
    cached = await cache_get(cache_key)
    if cached:
        return cached
    stmt = select(Vet)
    if specialization:
        stmt = stmt.where(func.lower(Vet.specialization).like(f"%{specialization.lower()}%"))
    if name:
        stmt = stmt.where(func.lower(Vet.vname).like(f"%{name.lower()}%"))
    stmt = stmt.limit(limit)
    res = await db.execute(stmt)
    vets = res.scalars().all()
    cards = []
    for v in vets:
        addr = getattr(v, "vaddress", None) or ""
        short_addr = (addr[:60] + "...") if addr and len(addr) > 60 else (addr or None)
        cards.append(VetCard(
            vid=v.vid,
            name=v.vname,
            specialization=getattr(v, "specialization", None),
            clinic=getattr(v, "vclinic", None),
            phone=getattr(v, "vphone", None),
            short_address=short_addr,
        ))
    # Cache results (10 minutes)
    try:
        await cache_set(cache_key, [c.model_dump() for c in cards], ttl=600)
    except Exception:
        pass
    return cards




# Create appointment (accepts owner_id/cattle_id/vet_id in JSON body)
@router.post("/create-appointment", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(payload: AppointmentCreateWithIds, db: AsyncSession = Depends(get_db), request: Request = None):
    # Resolve farmer: prefer explicit owner_id/inaph_id from payload, otherwise use header `X-Owner-Id` or `X-User-Id`.
    owner_id = payload.owner_id
    if not owner_id and request is not None:
        header_owner = request.headers.get("x-owner-id") or request.headers.get("x-user-id")
        if header_owner:
            try:
                owner_id = UUID(header_owner)
            except Exception:
                raise HTTPException(status_code=400, detail="x-owner-id header must be a valid UUID")

    farmer = await resolve_farmer(db, inaph_id=payload.inaph_id, owner_id=owner_id)
    # Prefer `cattle_tag_id` (local/inaph tag) if provided by frontend; otherwise use UUID `cattle_id`.
    if getattr(payload, "cattle_tag_id", None):
        cattle = await resolve_cattle(db, cattle_tag_id=payload.cattle_tag_id)
    else:
        cattle = await resolve_cattle(db, cattle_id=payload.cattle_id)
    vet = await resolve_vet(db, vet_id=payload.vet_id)

    # Ensure the selected cattle belongs to the farmer submitting the request
    if cattle.owner_id != farmer.fid:
        raise HTTPException(status_code=400, detail="Selected cattle does not belong to the requesting farmer")

    appt = Appointment(
        owner_id=farmer.fid,
        cattle_id=cattle.cid,
        vet_id=vet.vid,
        symptoms=payload.symptoms,
        appointment_date=payload.appointment_date,
        time_slot=payload.time_slot,
        remarks=payload.remarks,
    )

    db.add(appt)
    await db.commit()
    # refresh then re-query with eager loads so response builder does not trigger lazy async loads
    await db.refresh(appt)
    stmt = select(Appointment).options(selectinload(Appointment.farmer), selectinload(Appointment.cattle)).where(Appointment.aid == appt.aid)
    res = await db.execute(stmt)
    appt = res.scalars().first()
    # Invalidate appointments cache (simple, broad invalidation)
    try:
        await cache_delete_pattern("appointments:*")
    except Exception:
        pass
    return appointment_to_response(appt)




# List appointments (paginated with total)
@router.get("/view-appointments", response_model=PaginatedAppointments)
async def list_appointments(
    db: AsyncSession = Depends(get_db),
    request: Request = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=200),
    status: Optional[StatusEnumSchema] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    inaph_id: Optional[str] = Query(None, description="Filter by farmer inaph_id"),
    cattle_tag_id: Optional[str] = Query(None, description="Filter by cattle tag id"),
    vet_id: Optional[UUID] = Query(None, description="Filter by vet id"),
):
    # Build a cache key from filter params
    header_owner = None
    if request is not None:
        header_owner = request.headers.get("x-owner-id") or request.headers.get("x-user-id")
    cache_key_parts = [
        f"owner:{header_owner}" if header_owner else "owner:",
        f"inaph:{inaph_id or ''}",
        f"ctag:{cattle_tag_id or ''}",
        f"vet:{str(vet_id) if vet_id else ''}",
        f"status:{status.value if status else ''}",
        f"from:{date_from.isoformat() if date_from else ''}",
        f"to:{date_to.isoformat() if date_to else ''}",
        f"skip:{skip}",
        f"limit:{limit}",
    ]
    cache_key = "appointments:" + ":".join(cache_key_parts)

    # Try cache first
    cached = await cache_get(cache_key)
    if cached:
        return PaginatedAppointments(**cached)
    stmt = select(Appointment).options(selectinload(Appointment.farmer), selectinload(Appointment.cattle))
    filters = []
    join_farmer = False
    join_cattle = False

    if status:
        filters.append(Appointment.status == status.value)
    if date_from:
        filters.append(Appointment.appointment_date >= date_from)
    if date_to:
        filters.append(Appointment.appointment_date <= date_to)
    # If the client sent X-Owner-Id / X-User-Id header (logged-in farmer), prefer filtering by owner_id.
    if header_owner and not inaph_id:
        # header contains owner UUID (fid) — filter by Appointment.owner_id so a logged-in farmer
        # sees only their own appointments. If `inaph_id` query param is provided it takes precedence.
        try:
            owner_uuid = UUID(header_owner)
            filters.append(Appointment.owner_id == owner_uuid)
        except Exception:
            raise HTTPException(status_code=400, detail="x-owner-id header must be a valid UUID")
    elif inaph_id:
        stmt = stmt.join(Appointment.farmer)
        join_farmer = True
        filters.append(Farmer.inaph_id == inaph_id)
    if cattle_tag_id:
        stmt = stmt.join(Appointment.cattle)
        join_cattle = True
        filters.append(or_(Cattle.local_cattle_id == cattle_tag_id, Cattle.inaph_tag_id == cattle_tag_id))
    if vet_id:
        filters.append(Appointment.vet_id == vet_id)

    if filters:
        stmt = stmt.where(and_(*filters))

    # count
    count_stmt = select(func.count()).select_from(Appointment)
    if join_farmer:
        count_stmt = count_stmt.join(Farmer)
    if join_cattle:
        count_stmt = count_stmt.join(Cattle)
    if filters:
        count_stmt = count_stmt.where(and_(*filters))

    total_res = await db.execute(count_stmt)
    total = total_res.scalar_one() or 0

    stmt = stmt.order_by(Appointment.appointment_date.desc(), Appointment.created_at.desc()).offset(skip).limit(limit)
    res = await db.execute(stmt)
    appts = res.scalars().all()

    response = PaginatedAppointments(total=total, skip=skip, limit=limit, results=[appointment_to_response(a) for a in appts])
    # Cache short TTL (appointments change frequently)
    try:
        await cache_set(cache_key, response.model_dump(), ttl=120)
    except Exception:
        pass
    return response




# Update appointment (status and/or remarks
@router.put("/{appointment_id}/accept", response_model=AppointmentResponse)
async def accept_appointment(
    appointment_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Convenience endpoint for frontend Accept button: Pending -> Approved."""
    stmt = select(Appointment).options(selectinload(Appointment.farmer), selectinload(Appointment.cattle)).where(Appointment.aid == appointment_id)
    res = await db.execute(stmt)
    appt = res.scalars().first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appt.status = StatusEnumSchema.Approved.value
    db.add(appt)
    await db.commit()

    stmt = select(Appointment).options(selectinload(Appointment.farmer), selectinload(Appointment.cattle)).where(Appointment.aid == appointment_id)
    res = await db.execute(stmt)
    appt = res.scalars().first()

    try:
        await cache_delete_pattern("appointments:*")
    except Exception:
        pass

    await send_appointment_approved_notification_now(
        user_id=appt.owner_id,
        appointment_code=appt.appointment_code,
        appointment_id=appt.aid,
    )

    return appointment_to_response(appt)


# Delete appointment
@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment_by_path(appointment_id: UUID, db: AsyncSession = Depends(get_db)):
    """Path-param delete endpoint for frontend convenience."""
    appt = await db.get(Appointment, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    await db.delete(appt)
    await db.commit()
    try:
        await cache_delete_pattern("appointments:*")
    except Exception:
        pass
    return None