from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.schemas.vet_event import VetEventCreate, VetEventResponse
from crud.vet_event import (
    create_vet_event,
    get_all_vet_events,
    get_events_by_cattle
)
from app.db.session import get_db

router = APIRouter( tags=["Vet Events"])

# 🟢 Create new vaccination event
@router.post("/create", response_model=VetEventResponse, status_code=201)
async def add_vet_event(event: VetEventCreate, db: AsyncSession = Depends(get_db)):
    try:
        new_event = await create_vet_event(db, event)
        return new_event
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 🔵 Get all vaccination events
@router.get("/", response_model=list[VetEventResponse])
async def list_vet_events(db: AsyncSession = Depends(get_db)):
    events = await get_all_vet_events(db)
    if not events:
        raise HTTPException(status_code=404, detail="No vaccination events found")
    return events


# 🟣 Get vaccination events for a specific cattle
@router.get("/cattle_id", response_model=list[VetEventResponse])
async def list_vet_events_for_cattle(cattle_id: UUID, db: AsyncSession = Depends(get_db)):
    events = await get_events_by_cattle(db, cattle_id)
    if not events:
        raise HTTPException(status_code=404, detail="No events found for this cattle")
    return events
