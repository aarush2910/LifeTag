from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.vet_health import VetEvent
from app.schemas.vet_event import VetEventCreate
from uuid import UUID

async def create_vet_event(db: AsyncSession, event: VetEventCreate) -> VetEvent:
    data = event.model_dump()
    new_event = VetEvent(**data)
    db.add(new_event)
    await db.commit()
    await db.refresh(new_event)
    return new_event


async def get_all_vet_events(db: AsyncSession):
    result = await db.execute(select(VetEvent))
    return result.scalars().all()


async def get_events_by_cattle(db: AsyncSession, cattle_id: UUID):
    result = await db.execute(
        select(VetEvent).where(VetEvent.cattle_id == cattle_id)
    )
    return result.scalars().all()
