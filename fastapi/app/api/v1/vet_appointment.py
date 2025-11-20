from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

# Adjust these imports to your project structure
from app.models.vet_appointment import Appointment
from app.models.user import Farmer, Vet
from app.models.cattle import Cattle
from app.schemas.vet_appointment import (
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentResponse,
    StatusEnum as StatusEnumSchema,
)

router = APIRouter(prefix="/appointments", tags=["appointments"])

# Pydantic pagination wrapper
from pydantic import BaseModel
class PaginatedAppointments(BaseModel):
    total: int
    skip: int
    limit: int
    results: List[AppointmentResponse]

# Helper: convert Appointment model to AppointmentResponse-compatible dict/object
def appointment_to_response(appt: Appointment) -> Dict[str, Any]:
    farmer = getattr(appt, "farmer", None)
    cattle = getattr(appt, "cattle", None)
    return {
        "farmer_name": farmer.name if farmer else None,
        "inaph_id": farmer.inaph_id if farmer else None,
        "cattle_tag_id": cattle.tag_id if cattle else None,
        "cattle_breed": cattle.breed if cattle else None,
        "symptoms": appt.symptoms,
        "appointment_date": appt.appointment_date,   # return native date
        "time_slot": appt.time_slot,
        "status": appt.status.value if hasattr(appt.status, "value") else appt.status,
        "remarks": appt.remarks,
        "appointment_code": appt.appointment_code,
        "created_at": appt.created_at,               # return native datetime
    }

# Helper resolvers (async)
async def resolve_farmer(db: AsyncSession, inaph_id: Optional[str] = None, owner_id: Optional[UUID] = None):
    if owner_id:
        farmer = await db.get(Farmer, owner_id)
        if not farmer:
            raise HTTPException(status_code=404, detail="Farmer (owner_id) not found")
        return farmer
    if inaph_id:
        stmt = select(Farmer).where(Farmer.inaph_id == inaph_id)
        res = await db.execute(stmt)
        farmer = res.scalars().first()
        if not farmer:
            raise HTTPException(status_code=404, detail="Farmer (inaph_id) not found")
        return farmer
    raise HTTPException(status_code=400, detail="Either owner_id or inaph_id must be provided to resolve farmer")

async def resolve_cattle(db: AsyncSession, cattle_tag_id: Optional[str] = None, cattle_id: Optional[UUID] = None):
    if cattle_id:
        cattle = await db.get(Cattle, cattle_id)
        if not cattle:
            raise HTTPException(status_code=404, detail="Cattle (cattle_id) not found")
        return cattle
    if cattle_tag_id:
        stmt = select(Cattle).where(Cattle.tag_id == cattle_tag_id)
        res = await db.execute(stmt)
        cattle = res.scalars().first()
        if not cattle:
            raise HTTPException(status_code=404, detail="Cattle (tag_id) not found")
        return cattle
    raise HTTPException(status_code=400, detail="Either cattle_id or cattle_tag_id must be provided to resolve cattle")

async def resolve_vet(db: AsyncSession, vet_id: Optional[UUID] = None):
    if not vet_id:
        raise HTTPException(status_code=400, detail="vet_id is required for creating an appointment")
    vet = await db.get(Vet, vet_id)
    if not vet:
        raise HTTPException(status_code=404, detail="Vet (vet_id) not found")
    return vet

# Create appointment (now uses AppointmentCreate which contains owner_id/cattle_id/vet_id)
@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(payload: AppointmentCreate, db: AsyncSession = Depends(get_db)):
    # resolve farmer/cattle/vet using either ids or alternate identifiers
    farmer = await resolve_farmer(db, inaph_id=payload.inaph_id, owner_id=payload.owner_id)
    cattle = await resolve_cattle(db, cattle_tag_id=payload.cattle_tag_id, cattle_id=payload.cattle_id)
    vet = await resolve_vet(db, vet_id=payload.vet_id)

    appt = Appointment(
        owner_id=farmer.fid,
        cattle_id=cattle.cid,
        vet_id=vet.vid,
        symptoms=payload.symptoms,
        appointment_date=payload.appointment_date,
        time_slot=payload.time_slot,
        status=payload.status.value if isinstance(payload.status, StatusEnumSchema) else payload.status,
        remarks=payload.remarks,
    )

    db.add(appt)
    await db.commit()
    await db.refresh(appt)
    # return native object compatible with AppointmentResponse
    return appointment_to_response(appt)

# Get single appointment
@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(appointment_id: UUID, db: AsyncSession = Depends(get_db)):
    appt = await db.get(Appointment, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment_to_response(appt)

# List appointments (paginated with total)
@router.get("/", response_model=PaginatedAppointments)
async def list_appointments(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=200),
    status: Optional[StatusEnumSchema] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    inaph_id: Optional[str] = Query(None, description="Filter by farmer inaph_id"),
    cattle_tag_id: Optional[str] = Query(None, description="Filter by cattle tag id"),
):
    stmt = select(Appointment)
    filters = []
    join_farmer = False
    join_cattle = False

    if status:
        filters.append(Appointment.status == status.value)
    if date_from:
        filters.append(Appointment.appointment_date >= date_from)
    if date_to:
        filters.append(Appointment.appointment_date <= date_to)
    if inaph_id:
        stmt = stmt.join(Appointment.farmer)
        join_farmer = True
        filters.append(Farmer.inaph_id == inaph_id)
    if cattle_tag_id:
        stmt = stmt.join(Appointment.cattle)
        join_cattle = True
        filters.append(Cattle.tag_id == cattle_tag_id)

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
    appt = await db.get(Appointment, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    update_data = payload.dict(exclude_unset=True)
    if "status" in update_data:
        appt.status = update_data["status"].value if isinstance(update_data["status"], StatusEnumSchema) else update_data["status"]
    if "remarks" in update_data:
        appt.remarks = update_data["remarks"]

    db.add(appt)
    await db.commit()
    await db.refresh(appt)
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
