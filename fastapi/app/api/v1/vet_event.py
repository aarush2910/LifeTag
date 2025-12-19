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
from app.core.redis_client import cache_get, cache_set, cache_delete_pattern

router = APIRouter( tags=["Vet Events"])

# 🟢 Create new vaccination event
@router.post("/create", response_model=VetEventResponse, status_code=201)
async def add_vet_event(event: VetEventCreate, db: AsyncSession = Depends(get_db)):
    try:
        new_event = await create_vet_event(db, event)
        # Invalidate events caches
        try:
            await cache_delete_pattern("vet_events:*")
        except Exception:
            pass
        return new_event
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 🔵 Get all vaccination events
@router.get("/", response_model=list[VetEventResponse])
async def list_vet_events(db: AsyncSession = Depends(get_db)):
    cache_key = "vet_events:all"
    cached = await cache_get(cache_key)
    if cached:
        return cached
    events = await get_all_vet_events(db)
    if not events:
        raise HTTPException(status_code=404, detail="No vaccination events found")
    payload = [VetEventResponse.model_validate(e).model_dump() for e in events]
    try:
        await cache_set(cache_key, payload, ttl=600)
    except Exception:
        pass
    return payload


# 🟣 Get vaccination events for a specific cattle
@router.get("/cattle_id", response_model=list[VetEventResponse])
async def list_vet_events_for_cattle(cattle_id: UUID, db: AsyncSession = Depends(get_db)):
    cache_key = f"vet_events:cattle:{cattle_id}"
    cached = await cache_get(cache_key)
    if cached:
        return cached
    events = await get_events_by_cattle(db, cattle_id)
    if not events:
        raise HTTPException(status_code=404, detail="No events found for this cattle")
    payload = [VetEventResponse.model_validate(e).model_dump() for e in events]
    try:
        await cache_set(cache_key, payload, ttl=600)
    except Exception:
        pass
    return payload
