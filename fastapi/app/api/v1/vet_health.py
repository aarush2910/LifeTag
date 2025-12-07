from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.schemas.vet_health import VetHealthRecordCreate, VetHealthRecordResponse
from app.models.vet_health import VetHealthRecord
from app.models.vet_appointment import Appointment

router = APIRouter( tags=["Vet Health Record"])


# 🩺 Create new health record FOR AN APPOINTMENT
@router.post("/ ", response_model=VetHealthRecordResponse, status_code=status.HTTP_201_CREATED)
async def add_health_record(
    appointment_code: str,
    record: VetHealthRecordCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        # 1️⃣ Appointment fetch karo + farmer + cattle saath me lao
        stmt = (
            select(Appointment)
            .options(
                selectinload(Appointment.farmer),
                selectinload(Appointment.cattle),
            )
            .where(Appointment.appointment_code == appointment_code)
        )
        res = await db.execute(stmt)
        appt = res.scalars().first()

        if not appt:
            raise HTTPException(status_code=404, detail="Appointment not found")

        if not appt.farmer or not appt.cattle:
            raise HTTPException(
                status_code=400,
                detail="Appointment is not linked to farmer or cattle properly",
            )

        # 2️⃣ Appointment se inaph_id & cattle info nikaalo
        inaph_id = appt.farmer.inaph_id
        # form se cattle_id aa raha hai, lekin agar tum tag_id use karna chaho:
        # cattle_id = appt.cattle.tag_id
        cattle_id = record.cattle_id

        # 3️⃣ Health record create karo
        data = record.model_dump() if hasattr(record, "model_dump") else record.dict()

        new_record = VetHealthRecord(
            appointment_code=appt.appointment_code,
            inaph_id=inaph_id,
            cattle_id=cattle_id,
            diagnosis=data["diagnosis"],
            treatment=data["treatment"],
            medicines=data.get("medicines"),
            follow_up_date=data.get("follow_up_date"),
            remarks=data.get("remarks"),
        )

        db.add(new_record)
        await db.commit()
        await db.refresh(new_record)
        return new_record

    except HTTPException:
        # direct raise wali cases yahi re-throw
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Error creating health record: {str(e)}",
        )


# 📋 Get all health records
@router.get("/", response_model=list[VetHealthRecordResponse])
async def list_health_records(db: AsyncSession = Depends(get_db)):
    result = await db.scalars(select(VetHealthRecord))
    return result.all()


# 🔍 Get records by INAPH ID
@router.get("/Inaph_ID", response_model=list[VetHealthRecordResponse])
async def get_by_inaph(inaph_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.scalars(
        select(VetHealthRecord).where(VetHealthRecord.inaph_id == inaph_id)
    )
    records = result.all()
    if not records:
        raise HTTPException(status_code=404, detail="No records found for this INAPH ID")
    return records


# 🔍 Get records by Cattle ID
@router.get("/cattle_ID", response_model=list[VetHealthRecordResponse])
async def get_by_cattle(cattle_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.scalars(
        select(VetHealthRecord).where(VetHealthRecord.cattle_id == cattle_id)
    )
    records = result.all()
    if not records:
        raise HTTPException(status_code=404, detail="No records found for this cattle ID")
    return records
