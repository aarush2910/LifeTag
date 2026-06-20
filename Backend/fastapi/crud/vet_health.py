from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.vet_health import VetHealthRecord
from app.schemas.vet_health import VetHealthRecordCreate
from sqlalchemy.exc import SQLAlchemyError


# 🩺 Create new health record
async def create_health_record(db: AsyncSession, record: VetHealthRecordCreate):
    try:
        new_record = VetHealthRecord(**record.model_dump())
        db.add(new_record)
        await db.commit()
        await db.refresh(new_record)
        return new_record
    except SQLAlchemyError as e:
        await db.rollback()
        raise e


# 📋 Get all health records
async def get_all_health_records(db: AsyncSession):
    result = await db.execute(select(VetHealthRecord))
    return result.scalars().all()


# 🔍 Get records by INAPH ID
async def get_records_by_inaph(db: AsyncSession, inaph_id: str):
    result = await db.execute(select(VetHealthRecord).where(VetHealthRecord.inaph_id == inaph_id))
    return result.scalars().all()


# 🔍 Get records by Cattle ID
async def get_records_by_cattle(db: AsyncSession, cattle_id: str):
    result = await db.execute(select(VetHealthRecord).where(VetHealthRecord.cattle_id == cattle_id))
    return result.scalars().all()
