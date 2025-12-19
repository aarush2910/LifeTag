from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.vet_appointment import Appointment
from app.models.cattle import Cattle
from app.schemas.cattle import CattleRead  # tumhara hi schema
from app.core.redis_client import cache_get, cache_set

router = APIRouter(tags=["Appointments-Extra"])

@router.get("/cattle", response_model=list[CattleRead])
async def list_cattle_for_appointment(appointment_id: UUID, db: AsyncSession = Depends(get_db)):
    # Cache key
    cache_key = f"appointments:{appointment_id}:cattles"
    cached = await cache_get(cache_key)
    if cached:
        return cached
    # 1️⃣ Appointment lao
    appt = await db.get(Appointment, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # 2️⃣ Owner ke saare cattle lao
    stmt = (
        select(Cattle)
        .where(Cattle.owner_id == appt.owner_id)
        .options(selectinload(Cattle.owner))
    )
    res = await db.execute(stmt)
    cattles = res.scalars().all()
    payload = [CattleRead.model_validate(c).model_dump() for c in cattles]
    try:
        await cache_set(cache_key, payload, ttl=300)
    except Exception:
        pass
    return payload
