from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.vet_vactination import VetEvent
from app.schemas.vet_vactination import VetEventCreate

# ✅ Create vet vaccination event
async def create_vet_event(db: AsyncSession, event_data: VetEventCreate):
    new_event = VetEvent(**event_data.model_dump())
    db.add(new_event)
    await db.commit()
    await db.refresh(new_event)
    return new_event

# ✅ Get all vet events
async def get_all_vet_events(db: AsyncSession):
    result = await db.execute(select(VetEvent))
    return result.scalars().all()

# ✅ Get events by cattle ID
async def get_events_by_cattle(db: AsyncSession, cattle_id: str):
    result = await db.execute(select(VetEvent).filter(VetEvent.cattle_id == cattle_id))
    return result.scalars().all()
