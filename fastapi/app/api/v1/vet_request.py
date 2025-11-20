from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import date
from pydantic import BaseModel
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
    AppointmentCreate, 
    AppointmentUpdate,
    AppointmentResponse,
    StatusEnum as StatusEnumSchema,
    PaginatedAppointments,
    AppointmentCreateWithIds,
)

router = APIRouter(tags=["appointments"])


@router.get("/vets", response_model=List[VetCard])
async def list_vets(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=500),
    specialization: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
):
    """Return a list of vets for the farmer dashboard. Supports simple filtering by specialization or partial name."""
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
    owner_header = None
    if request is not None:
        owner_header = request.headers.get("x-owner-id") or request.headers.get("x-user-id")
    if owner_header and not inaph_id:
        # header contains owner UUID (fid) — filter by Appointment.owner_id so a logged-in farmer
        # sees only their own appointments. If `inaph_id` query param is provided it takes precedence.
        try:
            owner_uuid = UUID(owner_header)
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

    return PaginatedAppointments(total=total, skip=skip, limit=limit, results=[appointment_to_response(a) for a in appts])



# Update appointment (status and/or remarks)
@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(appointment_id: UUID, payload: AppointmentUpdate, db: AsyncSession = Depends(get_db)):
    # load appointment with related farmer and cattle
    stmt = select(Appointment).options(selectinload(Appointment.farmer), selectinload(Appointment.cattle)).where(Appointment.aid == appointment_id)
    res = await db.execute(stmt)
    appt = res.scalars().first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    update_data = payload.dict(exclude_unset=True)
    if "status" in update_data:
        appt.status = update_data["status"].value if isinstance(update_data["status"], StatusEnumSchema) else update_data["status"]
    if "remarks" in update_data:
        appt.remarks = update_data["remarks"]

    db.add(appt)
    await db.commit()
    # re-query with eager loads for the response
    stmt = select(Appointment).options(selectinload(Appointment.farmer), selectinload(Appointment.cattle)).where(Appointment.aid == appointment_id)
    res = await db.execute(stmt)
    appt = res.scalars().first()
    return appointment_to_response(appt)



# Delete appointment
@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment(appointment_id: UUID, db: AsyncSession = Depends(get_db)):
    appt = await db.get(Appointment, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    await db.delete(appt)
    await db.commit()
    return None