from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

from app.schemas.vet_health import VetHealthRecordCreate, VetHealthRecordResponse
from app.models.vet_health import VetHealthRecord

router = APIRouter(prefix="/vet/health-record", tags=["Vet Health Record"])


# 🩺 Create new health record
@router.post("/", response_model=VetHealthRecordResponse, status_code=status.HTTP_201_CREATED)
async def add_health_record(
    record: VetHealthRecordCreate,
    db: AsyncSession = Depends(get_db)
):
    try:
        new_record = VetHealthRecord(**record.model_dump())
        db.add(new_record)
        await db.commit()
        await db.refresh(new_record)
        return new_record
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating health record: {str(e)}")


# 📋 Get all health records
@router.get("/", response_model=list[VetHealthRecordResponse])
async def list_health_records(db: AsyncSession = Depends(get_db)):
    result = await db.scalars(select(VetHealthRecord))
    return result.all()


# 🔍 Get records by INAPH ID
@router.get("/inaph/{inaph_id}", response_model=list[VetHealthRecordResponse])
async def get_by_inaph(inaph_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.scalars(select(VetHealthRecord).where(VetHealthRecord.inaph_id == inaph_id))
    records = result.all()
    if not records:
        raise HTTPException(status_code=404, detail="No records found for this INAPH ID")
    return records


# 🔍 Get records by Cattle ID
@router.get("/cattle/{cattle_id}", response_model=list[VetHealthRecordResponse])
async def get_by_cattle(cattle_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.scalars(select(VetHealthRecord).where(VetHealthRecord.cattle_id == cattle_id))
    records = result.all()
    if not records:
        raise HTTPException(status_code=404, detail="No records found for this cattle ID")
    return records
