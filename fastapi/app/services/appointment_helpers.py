from typing import Optional, Dict, Any
from uuid import UUID
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.models.vet_appointment import Appointment
from app.models.user import Farmer, Vet
from app.models.cattle import Cattle


def appointment_to_response(appt: Appointment) -> Dict[str, Any]:
    """Convert Appointment model instance to a JSON-serializable dict used by responses.

    Keeps the same shape previously defined in the route module.
    """
    farmer = getattr(appt, "farmer", None)
    cattle = getattr(appt, "cattle", None)
    # Build explicit tag fields so frontend can display both local and inaph IDs.
    local_tag = getattr(cattle, "local_cattle_id", None) if cattle else None
    inaph_tag = getattr(cattle, "inaph_tag_id", None) if cattle else None
    short_cid = (str(cattle.cid)[:8] if getattr(cattle, "cid", None) else None) if cattle else None
    # Preferred tag for `cattle_tag_id` (frontend-friendly): prefer inaph_tag if present, else local_tag, else short cid
    preferred_tag = inaph_tag or local_tag or short_cid

    return {
        "farmer_name": farmer.fname if farmer else None,
        "inaph_id": farmer.inaph_id if farmer else None,
        "cattle_name": cattle.cattle_name if cattle else None,
        "cattle_tag_id": preferred_tag,
        "inaph_tag_id": inaph_tag,
        "local_cattle_id": local_tag,
        "cattle_cid_short": short_cid,
        "cattle_breed": cattle.breed if cattle else None,
        "symptoms": appt.symptoms,
        "appointment_date": appt.appointment_date.isoformat() if appt.appointment_date else None,
        "time_slot": appt.time_slot,
        "status": appt.status.value if hasattr(appt.status, "value") else appt.status,
        "remarks": appt.remarks,
        "appointment_code": appt.appointment_code,
        "created_at": appt.created_at.isoformat() if appt.created_at else None,
    }


async def resolve_farmer(db: AsyncSession, inaph_id: Optional[str] = None, owner_id: Optional[UUID] = None) -> Farmer:
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


async def resolve_cattle(db: AsyncSession, cattle_tag_id: Optional[str] = None, cattle_id: Optional[UUID] = None, cattle_name: Optional[str] = None) -> Cattle:
    if cattle_id:
        cattle = await db.get(Cattle, cattle_id)
        if not cattle:
            raise HTTPException(status_code=404, detail="Cattle (cattle_id) not found")
        return cattle

    if cattle_tag_id:
        stmt = select(Cattle).where(or_(Cattle.local_cattle_id == cattle_tag_id, Cattle.inaph_tag_id == cattle_tag_id))
        res = await db.execute(stmt)
        cattle = res.scalars().first()
        if not cattle:
            raise HTTPException(status_code=404, detail="Cattle (tag id) not found")
        return cattle

    if cattle_name:
        stmt = select(Cattle).where(Cattle.cattle_name == cattle_name)
        res = await db.execute(stmt)
        cattle = res.scalars().first()
        if cattle:
            return cattle
        stmt = select(Cattle).where(func.lower(Cattle.cattle_name).like(f"%{cattle_name.lower()}%"))
        res = await db.execute(stmt)
        cattle = res.scalars().first()
        if cattle:
            return cattle
        raise HTTPException(status_code=404, detail="Cattle (by name) not found")

    raise HTTPException(status_code=400, detail="Either cattle_id, cattle_tag_id, or cattle_name must be provided to resolve cattle")


async def resolve_vet(db: AsyncSession, vet_id: Optional[UUID] = None) -> Vet:
    if not vet_id:
        raise HTTPException(status_code=400, detail="vet_id is required for creating an appointment")
    vet = await db.get(Vet, vet_id)
    if not vet:
        raise HTTPException(status_code=404, detail="Vet (vet_id) not found")
    return vet
