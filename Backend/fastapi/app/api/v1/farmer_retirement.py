"""
Farmer retirement / shelter intake request API.
POST /api/farmer/retirement-request     → farmer submits request for a cow
GET  /api/farmer/retirement-requests    → list farmer's own requests
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.shelter_intake import ShelterIntakeRequest
from app.models.cattle import Cattle
from app.schemas.shelter import IntakeRequestCreate, IntakeRequestResponse

router = APIRouter(tags=["Farmer"])


@router.post("/retirement-request", response_model=IntakeRequestResponse, status_code=201)
async def create_retirement_request(
    payload: IntakeRequestCreate,
    x_user_id: str = Header(..., alias="x-user-id"),
    db: AsyncSession = Depends(get_db),
):
    """
    Farmer submits a retirement or death request for their cattle.
    The shelter will see this in their intake dashboard and can approve/reject.
    """
    try:
        farmer_uuid = UUID(x_user_id)
    except ValueError:
        raise HTTPException(400, "Invalid farmer id in x-user-id header")

    # Ensure cattle belongs to the farmer
    cattle = await db.get(Cattle, payload.cattle_id)
    if not cattle:
        raise HTTPException(404, "Cattle not found")
    if cattle.owner_id != farmer_uuid:
        raise HTTPException(403, "This cattle does not belong to you")

    # Check no duplicate pending request exists for this cattle
    existing = await db.scalar(
        select(ShelterIntakeRequest).where(
            ShelterIntakeRequest.cattle_id == payload.cattle_id,
            ShelterIntakeRequest.status == "Pending",
        )
    )
    if existing:
        raise HTTPException(400, "A pending request already exists for this cattle")

    req = ShelterIntakeRequest(
        farmer_id=farmer_uuid,
        cattle_id=payload.cattle_id,
        reason=payload.reason,
        notes=payload.notes,
        status="Pending",
        shelter_id=payload.shelter_id,
    )
    db.add(req)
    await db.commit()
    await db.refresh(req)

    # Reload with relationships
    stmt = (
        select(ShelterIntakeRequest)
        .options(
            selectinload(ShelterIntakeRequest.farmer),
            selectinload(ShelterIntakeRequest.cattle),
        )
        .where(ShelterIntakeRequest.id == req.id)
    )
    result = await db.execute(stmt)
    req = result.scalars().first()

    return IntakeRequestResponse(
        id=req.id,
        farmer_id=req.farmer_id,
        cattle_id=req.cattle_id,
        reason=req.reason,
        notes=req.notes,
        status=req.status,
        shelter_id=req.shelter_id,
        created_at=req.created_at,
        farmer_name=req.farmer.fname if req.farmer else None,
        cattle_name=req.cattle.cattle_name if req.cattle else None,
        cattle_breed=req.cattle.breed if req.cattle else None,
    )


@router.get("/retirement-requests", response_model=List[IntakeRequestResponse])
async def list_farmer_retirement_requests(
    x_user_id: str = Header(..., alias="x-user-id"),
    db: AsyncSession = Depends(get_db),
):
    """Lists all retirement/death requests submitted by this farmer."""
    try:
        farmer_uuid = UUID(x_user_id)
    except ValueError:
        raise HTTPException(400, "Invalid farmer id in x-user-id header")

    stmt = (
        select(ShelterIntakeRequest)
        .options(
            selectinload(ShelterIntakeRequest.farmer),
            selectinload(ShelterIntakeRequest.cattle),
        )
        .where(ShelterIntakeRequest.farmer_id == farmer_uuid)
        .order_by(ShelterIntakeRequest.created_at.desc())
    )
    result = await db.execute(stmt)
    requests = result.scalars().all()

    return [
        IntakeRequestResponse(
            id=r.id,
            farmer_id=r.farmer_id,
            cattle_id=r.cattle_id,
            reason=r.reason,
            notes=r.notes,
            status=r.status,
            shelter_id=r.shelter_id,
            created_at=r.created_at,
            farmer_name=r.farmer.fname if r.farmer else None,
            cattle_name=r.cattle.cattle_name if r.cattle else None,
            cattle_breed=r.cattle.breed if r.cattle else None,
        )
        for r in requests
    ]
