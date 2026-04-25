from typing import List, Optional
from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy import select, and_, func, or_, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db  
from app.models.vet_appointment import Appointment 
from app.models.user import Farmer, Vet
from app.models.vet_availability import VetAvailability
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
    VetAvailabilityUpdate,
    VetAvailabilityResponse,
    AvailableSlotsResponse,
)
from app.core.redis_client import cache_get, cache_set, cache_delete_pattern
from app.tasks.notification_tasks import send_appointment_approved_notification_now

router = APIRouter(tags=["Appointments"])


# ──────────────────────────────────────────────────────────────────────────────
#  GET /vets — public listing of all vets (for dropdowns in shelter & farmer UI)
# ──────────────────────────────────────────────────────────────────────────────
@router.get("/vets", response_model=list[VetCard])
async def list_all_vets(db: AsyncSession = Depends(get_db)):
    """Public endpoint — returns all registered vets.
    Used by shelter health records form and farmer appointment booking."""
    result = await db.execute(select(Vet).order_by(Vet.vname))
    vets = result.scalars().all()
    return [VetCard.model_validate(v) for v in vets]


def _parse_hhmm(value: str) -> int:
    try:
        hh, mm = value.split(":")
        h = int(hh)
        m = int(mm)
        if not (0 <= h <= 23 and 0 <= m <= 59):
            raise ValueError
        return h * 60 + m
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid time format '{value}'. Use HH:MM")


def _mins_to_hhmm(total: int) -> str:
    return f"{total // 60:02d}:{total % 60:02d}"


def _build_slots(start_hhmm: str, end_hhmm: str, slot_minutes: int) -> List[str]:
    start = _parse_hhmm(start_hhmm)
    end = _parse_hhmm(end_hhmm)
    if start >= end:
        raise HTTPException(status_code=400, detail="work_end must be after work_start")
    if slot_minutes < 10 or slot_minutes > 180:
        raise HTTPException(status_code=400, detail="slot_minutes must be between 10 and 180")

    slots: List[str] = []
    cur = start
    while cur + slot_minutes <= end:
        nxt = cur + slot_minutes
        slots.append(f"{_mins_to_hhmm(cur)}-{_mins_to_hhmm(nxt)}")
        cur = nxt
    return slots


async def _cleanup_expired_availability(db: AsyncSession) -> None:
    try:
        await db.execute(
            delete(VetAvailability).where(VetAvailability.available_date < date.today())
        )
        await db.commit()
    except Exception:
        await db.rollback()


async def _get_or_default_availability(db: AsyncSession, vet_id: UUID, appointment_date: date) -> Optional[VetAvailabilityResponse]:
    # DB-first read; if table is missing or DB user lacks privileges, fall back to cache/default.
    try:
        row = await db.scalar(
            select(VetAvailability).where(
                VetAvailability.vet_id == vet_id,
                VetAvailability.available_date == appointment_date,
            )
        )
        if row:
            return VetAvailabilityResponse(
                vet_id=vet_id,
                available_date=appointment_date,
                work_start=row.work_start,
                work_end=row.work_end,
                slot_minutes=row.slot_minutes,
            )
    except Exception:
        # If this SELECT fails (missing table/permission), clear failed transaction
        # so later queries in the same request don't crash with InFailedSQLTransactionError.
        await db.rollback()
        pass

    # No explicit availability configured for this date.
    return None


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

    # Enforce Vet availability and no double-booking for selected date/slot.
    availability = await _get_or_default_availability(db, vet.vid, payload.appointment_date)
    if not availability:
        raise HTTPException(status_code=400, detail="Vet has not configured availability for this date")
    valid_slots = _build_slots(availability.work_start, availability.work_end, availability.slot_minutes)
    if payload.time_slot not in valid_slots:
        raise HTTPException(status_code=400, detail="Selected slot is unavailable for the selected date")

    conflict_stmt = select(Appointment).where(
        Appointment.vet_id == vet.vid,
        Appointment.appointment_date == payload.appointment_date,
        Appointment.time_slot == payload.time_slot,
        Appointment.status != "Cancelled",
    )
    conflict = await db.scalar(conflict_stmt)
    if conflict:
        raise HTTPException(status_code=409, detail="This time slot is already booked")

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

    # Do NOT call db.refresh(appt) here — the Neon connection pooler closes the
    # connection right after commit(), making refresh() fail with
    # ConnectionDoesNotExistError. The appt.aid UUID is already set (uuid4),
    # so we can go straight to a fresh eager-loaded SELECT.
    appt_id = appt.aid
    stmt = (
        select(Appointment)
        .options(selectinload(Appointment.farmer), selectinload(Appointment.cattle))
        .where(Appointment.aid == appt_id)
    )
    res = await db.execute(stmt)
    appt = res.scalars().first()

    # Invalidate appointments cache
    try:
        await cache_delete_pattern("appointments:*")
    except Exception:
        pass
    return appointment_to_response(appt)


@router.put("/availability/me", response_model=VetAvailabilityResponse)
async def upsert_my_availability(
    payload: VetAvailabilityUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Vet sets working hours + slot duration."""
    x_user_id = request.headers.get("x-user-id")
    if not x_user_id:
        raise HTTPException(status_code=400, detail="x-user-id header is required")
    try:
        vet_id = UUID(x_user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="x-user-id must be a valid UUID")

    _build_slots(payload.work_start, payload.work_end, payload.slot_minutes)
    if payload.available_date < date.today():
        raise HTTPException(status_code=400, detail="Cannot set availability for past dates")

    # Try DB persistence
    try:
        await _cleanup_expired_availability(db)
        # Check if a row already exists for this exact (vet, date) pair
        row = await db.scalar(
            select(VetAvailability).where(
                VetAvailability.vet_id == vet_id,
                VetAvailability.available_date == payload.available_date,
            )
        )
        if row:
            # Update existing row for this date
            row.work_start = payload.work_start
            row.work_end = payload.work_end
            row.slot_minutes = payload.slot_minutes
        else:
            row = VetAvailability(
                vet_id=vet_id,
                available_date=payload.available_date,
                work_start=payload.work_start,
                work_end=payload.work_end,
                slot_minutes=payload.slot_minutes,
            )
            db.add(row)

        await db.commit()
        return VetAvailabilityResponse(
            vet_id=vet_id,
            available_date=payload.available_date,
            work_start=payload.work_start,
            work_end=payload.work_end,
            slot_minutes=payload.slot_minutes,
        )

    except Exception as e:
        await db.rollback()
        err_str = str(e)

        # ── Fallback for old DB schema with UNIQUE(vet_id) only ────────────────
        # If the migration hasn't run yet, the DB still has a UNIQUE constraint on
        # vet_id alone. When a second date is added, INSERT fails with UniqueViolationError.
        # Workaround: UPDATE the one existing row to use the new date & settings.
        if "vet_availability_vet_id_key" in err_str or "UniqueViolationError" in err_str:
            try:
                existing = await db.scalar(
                    select(VetAvailability).where(VetAvailability.vet_id == vet_id)
                )
                if existing:
                    existing.available_date = payload.available_date
                    existing.work_start = payload.work_start
                    existing.work_end = payload.work_end
                    existing.slot_minutes = payload.slot_minutes
                    db.add(existing)
                    await db.commit()
                    return VetAvailabilityResponse(
                        vet_id=vet_id,
                        available_date=payload.available_date,
                        work_start=payload.work_start,
                        work_end=payload.work_end,
                        slot_minutes=payload.slot_minutes,
                    )
            except Exception as fallback_err:
                await db.rollback()
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to save availability (fallback): {str(fallback_err)}",
                )
        # ──────────────────────────────────────────────────────────────────────

        raise HTTPException(
            status_code=500,
            detail=f"Failed to save availability in database: {err_str}",
        )



@router.get("/availability/me/list", response_model=List[VetAvailabilityResponse])
async def list_my_availability(
    request: Request,
    db: AsyncSession = Depends(get_db),
    days: int = Query(30, ge=1, le=180),
):
    """List vet's configured availability for upcoming dates."""
    x_user_id = request.headers.get("x-user-id")
    if not x_user_id:
        raise HTTPException(status_code=400, detail="x-user-id header is required")
    try:
        vet_id = UUID(x_user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="x-user-id must be a valid UUID")

    await _cleanup_expired_availability(db)
    try:
        stmt = (
            select(VetAvailability)
            .where(
                VetAvailability.vet_id == vet_id,
                VetAvailability.available_date >= date.today(),
            )
            .order_by(VetAvailability.available_date.asc())
            .limit(days)
        )
        res = await db.execute(stmt)
        rows = res.scalars().all()
        return [
            VetAvailabilityResponse(
                vet_id=r.vet_id,
                available_date=r.available_date,
                work_start=r.work_start,
                work_end=r.work_end,
                slot_minutes=r.slot_minutes,
            )
            for r in rows
        ]
    except Exception:
        # If DB access is restricted, still keep API stable.
        return []


@router.get("/availability/{vet_id}", response_model=AvailableSlotsResponse)
async def get_available_slots(
    vet_id: UUID,
    appointment_date: date = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Return vet's free slots for selected date."""
    availability = await _get_or_default_availability(db, vet_id, appointment_date)
    if not availability:
        return AvailableSlotsResponse(
            vet_id=vet_id,
            appointment_date=appointment_date,
            work_start="",
            work_end="",
            slot_minutes=0,
            slots=[],
        )
    all_slots = _build_slots(availability.work_start, availability.work_end, availability.slot_minutes)

    try:
        booked_res = await db.execute(
            select(Appointment.time_slot).where(
                Appointment.vet_id == vet_id,
                Appointment.appointment_date == appointment_date,
                Appointment.status != "Cancelled",
            )
        )
        booked = {row[0] for row in booked_res.all() if row and row[0]}
    except Exception:
        await db.rollback()
        booked = set()
    free_slots = [s for s in all_slots if s not in booked]

    return AvailableSlotsResponse(
        vet_id=vet_id,
        appointment_date=appointment_date,
        work_start=availability.work_start,
        work_end=availability.work_end,
        slot_minutes=availability.slot_minutes,
        slots=free_slots,
    )




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

    stmt = select(Appointment).options(
        selectinload(Appointment.farmer),
        selectinload(Appointment.cattle),
        selectinload(Appointment.vet),
    ).where(Appointment.aid == appointment_id)
    res = await db.execute(stmt)
    appt = res.scalars().first()

    try:
        await cache_delete_pattern("appointments:*")
    except Exception:
        pass

    # Build enrichment data for the notification
    vet_name = getattr(appt.vet, "vname", None) if appt.vet else None
    cattle = appt.cattle
    cattle_tag = (
        getattr(cattle, "inaph_tag_id", None)
        or getattr(cattle, "local_cattle_id", None)
    ) if cattle else None
    appt_date = appt.appointment_date.strftime("%d %b %Y") if appt.appointment_date else None
    time_slot = appt.time_slot

    await send_appointment_approved_notification_now(
        user_id=appt.owner_id,
        appointment_code=appt.appointment_code,
        appointment_id=appt.aid,
        vet_name=vet_name,
        cattle_tag_id=cattle_tag,
        appointment_date=appt_date,
        time_slot=time_slot,
    )

    return appointment_to_response(appt)


@router.put("/{appointment_id}/cancel", response_model=AppointmentResponse)
async def cancel_appointment(
    appointment_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Set appointment status to Cancelled."""
    stmt = select(Appointment).options(
        selectinload(Appointment.farmer), selectinload(Appointment.cattle)
    ).where(Appointment.aid == appointment_id)
    res = await db.execute(stmt)
    appt = res.scalars().first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appt.status = StatusEnumSchema.Cancelled.value
    db.add(appt)
    await db.commit()

    res = await db.execute(stmt)
    appt = res.scalars().first()
    try:
        await cache_delete_pattern("appointments:*")
    except Exception:
        pass
    return appointment_to_response(appt)


@router.put("/{appointment_id}/complete", response_model=AppointmentResponse)
async def complete_appointment(
    appointment_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Set appointment status to Completed."""
    stmt = select(Appointment).options(
        selectinload(Appointment.farmer), selectinload(Appointment.cattle)
    ).where(Appointment.aid == appointment_id)
    res = await db.execute(stmt)
    appt = res.scalars().first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appt.status = StatusEnumSchema.Completed.value
    db.add(appt)
    await db.commit()

    res = await db.execute(stmt)
    appt = res.scalars().first()
    try:
        await cache_delete_pattern("appointments:*")
    except Exception:
        pass
    return appointment_to_response(appt)


# ─── Auto-cleanup: delete old resolved appointments (MUST be before /{appointment_id}) ─
from datetime import timedelta as _timedelta

@router.delete("/bulk-clear-old", status_code=status.HTTP_200_OK)
async def bulk_clear_old_appointments(
    days: int = 7,
    db: AsyncSession = Depends(get_db),
):
    """
    Deletes all Approved, Completed, or Cancelled appointments whose
    appointment_date is more than `days` days ago (default: 7).
    Called automatically by a frontend scheduler on each dashboard load.
    Returns the count of deleted records.
    """
    from datetime import date as _date
    from app.models.vet_health import VetHealthRecord
    cutoff = _date.today() - _timedelta(days=days)

    stmt = select(Appointment).where(
        and_(
            Appointment.appointment_date < cutoff,
            Appointment.status.in_(["Approved", "Completed", "Cancelled"])
        )
    )
    result = await db.execute(stmt)
    old_appts = result.scalars().all()
    count = len(old_appts)

    for appt in old_appts:
        # Delete associated health records first (FK constraint)
        hr_stmt = select(VetHealthRecord).where(
            VetHealthRecord.appointment_code == appt.appointment_code
        )
        hr_res = await db.execute(hr_stmt)
        for hr in hr_res.scalars().all():
            await db.delete(hr)
        await db.delete(appt)

    if count:
        await db.commit()
        try:
            await cache_delete_pattern("appointments:*")
        except Exception:
            pass

    return {"deleted": count, "cutoff_date": str(cutoff), "days": days}


# ─── Vet manually clears one appointment (static prefix BEFORE wildcard) ───────
@router.delete("/clear/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def clear_appointment(
    appointment_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Vet-initiated clear: permanently deletes a single appointment and its
    associated health records. Only allowed for Approved, Completed, or Cancelled.
    """
    try:
        appt_uuid = UUID(appointment_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid appointment ID format")

    appt = await db.get(Appointment, appt_uuid)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appt_status = appt.status.value if hasattr(appt.status, "value") else str(appt.status)
    if appt_status == "Pending":
        raise HTTPException(
            status_code=400,
            detail="Cannot clear a Pending appointment. Accept or cancel it first."
        )

    # Manually delete associated health records first to avoid FK constraint errors
    # (the ondelete=CASCADE may not be applied in the live DB if schema was created earlier)
    from app.models.vet_health import VetHealthRecord
    health_stmt = select(VetHealthRecord).where(
        VetHealthRecord.appointment_code == appt.appointment_code
    )
    health_res = await db.execute(health_stmt)
    health_records = health_res.scalars().all()
    for hr in health_records:
        await db.delete(hr)

    await db.delete(appt)
    await db.commit()
    try:
        await cache_delete_pattern("appointments:*")
    except Exception:
        pass
    return None


# Delete appointment by UUID (wildcard — must come AFTER all static-prefix DELETE routes)
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
