from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.vet_appointment import Appointment
from app.models.cattle import Cattle
from app.schemas.cattle import CattleRead  # tumhara hi schema

router = APIRouter(tags=["appointments-extra"])

@router.get("/appointments/{appointment_id}/cattle", response_model=list[CattleRead])
async def list_cattle_for_appointment(appointment_id: UUID, db: AsyncSession = Depends(get_db)):
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
    return cattles
