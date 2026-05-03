"""
Shelter profile, intake request management, stats, and health records.

GET  /api/shelter/list               → public list of all shelters
GET  /api/shelter/me                 → shelter profile
PATCH /api/shelter/me                → update profile
GET  /api/shelter/stats              → dashboard stats for this shelter
GET  /api/shelter/intake-requests    → intake requests directed to this shelter
PATCH /api/shelter/intake-requests/{id} → approve / reject + update cattle.shelter_id
GET  /api/shelter/cattle             → all accepted cattle under this shelter
POST /api/shelter/health-records     → add health record for a shelter animal
GET  /api/shelter/health-records     → list health records for this shelter's animals
"""
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, Header, BackgroundTasks
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.user import Shelter, Farmer
from app.models.cattle import Cattle
from app.models.shelter_intake import ShelterIntakeRequest
from app.models.notification import Notification
from app.schemas.shelter import (
    ShelterCreate,
    ShelterResponse,
    ShelterUpdate,
    IntakeRequestResponse,
    IntakeStatusUpdate,
    ShelterListItem,
    ShelterStats,
    ShelterCattleResponse,
    ShelterHealthRecordCreate,
    ShelterHealthRecordResponse,
)
from app.core.security import hash_password
from app.core.config import settings
from app.tasks.email_tasks import schedule_welcome_shelter_email
from app.tasks.notification_tasks import _create_notification_in_background

router = APIRouter(tags=["Shelter"])


# ──────────────────────────────────────────────────────────
#  Shelter Signup
# ──────────────────────────────────────────────────────────
@router.post("/signup/shelter", status_code=201)
async def signup_shelter(
    payload: ShelterCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    if await db.scalar(select(Shelter).where(Shelter.semail == payload.semail)):
        raise HTTPException(400, "Email already registered")
    if await db.scalar(select(Shelter).where(Shelter.sregistration == payload.sregistration)):
        raise HTTPException(400, "Registration number already exists")

    new_user = Shelter(**payload.model_dump(exclude={"password"}))
    new_user.password_hash = hash_password(payload.password)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    schedule_welcome_shelter_email(background_tasks, new_user)
    return {"message": "Shelter signup successful", "user_id": new_user.sid}


# ──────────────────────────────────────────────────────────
#  GET /api/shelter/list → public list of shelters
# ──────────────────────────────────────────────────────────
@router.get("/list", response_model=List[ShelterListItem])
async def list_shelters(db: AsyncSession = Depends(get_db)):
    """Public endpoint — returns all shelters for farmer shelter-selection dropdown."""
    result = await db.execute(select(Shelter).order_by(Shelter.sname))
    shelters = result.scalars().all()
    return [
        ShelterListItem(
            sid=s.sid,
            sname=s.sname,
            saddress=s.saddress,
            sphone=s.sphone,
            scapacity=s.scapacity,
        )
        for s in shelters
    ]


# ──────────────────────────────────────────────────────────
#  GET /api/shelter/me  → shelter profile
# ──────────────────────────────────────────────────────────
@router.get("/me", response_model=ShelterResponse)
async def get_shelter_profile(
    x_user_id: str = Header(..., alias="x-user-id"),
    db: AsyncSession = Depends(get_db),
):
    try:
        shelter_uuid = UUID(x_user_id)
    except ValueError:
        raise HTTPException(400, "Invalid shelter id in x-user-id header")

    shelter = await db.get(Shelter, shelter_uuid)
    if not shelter:
        raise HTTPException(404, "Shelter not found")
    return shelter


# ──────────────────────────────────────────────────────────
#  PATCH /api/shelter/me  → update profile
# ──────────────────────────────────────────────────────────
@router.patch("/me", response_model=ShelterResponse)
async def update_shelter_profile(
    payload: ShelterUpdate,
    x_user_id: str = Header(..., alias="x-user-id"),
    db: AsyncSession = Depends(get_db),
):
    try:
        shelter_uuid = UUID(x_user_id)
    except ValueError:
        raise HTTPException(400, "Invalid shelter id in x-user-id header")

    shelter = await db.get(Shelter, shelter_uuid)
    if not shelter:
        raise HTTPException(404, "Shelter not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(shelter, field, value)

    db.add(shelter)
    await db.commit()
    await db.refresh(shelter)
    return shelter


# ──────────────────────────────────────────────────────────
#  GET /api/shelter/stats → dashboard stats
# ──────────────────────────────────────────────────────────
@router.get("/stats", response_model=ShelterStats)
async def get_shelter_stats(
    x_user_id: str = Header(..., alias="x-user-id"),
    db: AsyncSession = Depends(get_db),
):
    """Returns real stats for shelter dashboard home page."""
    try:
        shelter_uuid = UUID(x_user_id)
    except ValueError:
        raise HTTPException(400, "Invalid shelter id in x-user-id header")

    # Pending intakes for this shelter
    pending_stmt = select(func.count()).select_from(ShelterIntakeRequest).where(
        ShelterIntakeRequest.shelter_id == shelter_uuid,
        ShelterIntakeRequest.status == "Pending",
    )
    pending_count = (await db.execute(pending_stmt)).scalar_one() or 0

    # Total animals (Approved intakes) under shelter
    animals_stmt = select(func.count()).select_from(Cattle).where(
        Cattle.shelter_id == shelter_uuid
    )
    total_animals = (await db.execute(animals_stmt)).scalar_one() or 0

    # Tagged vs untagged
    tagged_stmt = select(func.count()).select_from(Cattle).where(
        Cattle.shelter_id == shelter_uuid,
        Cattle.inaph_tag_id.isnot(None),
    )
    tagged_count = (await db.execute(tagged_stmt)).scalar_one() or 0
    untagged_count = total_animals - tagged_count

    # Recent activity — last 8 intake events for this shelter
    recent_stmt = (
        select(ShelterIntakeRequest)
        .options(
            selectinload(ShelterIntakeRequest.farmer),
            selectinload(ShelterIntakeRequest.cattle),
        )
        .where(ShelterIntakeRequest.shelter_id == shelter_uuid)
        .order_by(ShelterIntakeRequest.updated_at.desc())
        .limit(8)
    )
    recent_result = await db.execute(recent_stmt)
    recent_rows = recent_result.scalars().all()
    recent_activity = []
    for r in recent_rows:
        cattle_name = r.cattle.cattle_name if r.cattle else "Unknown cattle"
        farmer_name = r.farmer.fname if r.farmer else "Unknown farmer"
        if r.status == "Approved":
            recent_activity.append(f"{cattle_name} intake approved from {farmer_name}")
        elif r.status == "Rejected":
            recent_activity.append(f"{cattle_name} intake rejected from {farmer_name}")
        else:
            recent_activity.append(f"Pending intake request for {cattle_name} from {farmer_name}")

    # Chart data — monthly intakes and approvals for last 6 months
    # Fetch all requests for this shelter
    all_requests_stmt = (
        select(ShelterIntakeRequest)
        .where(ShelterIntakeRequest.shelter_id == shelter_uuid)
    )
    all_result = await db.execute(all_requests_stmt)
    all_requests = all_result.scalars().all()

    monthly: dict = defaultdict(lambda: {"intakes": 0, "adoptions": 0})
    for r in all_requests:
        month_key = r.created_at.strftime("%b") if r.created_at else "Unknown"
        monthly[month_key]["intakes"] += 1
        if r.status == "Approved":
            monthly[month_key]["adoptions"] += 1

    chart_data = [
        {"month": m, "intakes": v["intakes"], "adoptions": v["adoptions"]}
        for m, v in monthly.items()
    ]

    return ShelterStats(
        pending_intake_count=pending_count,
        total_animals=total_animals,
        tagged_count=tagged_count,
        untagged_count=untagged_count,
        pending_adoptions=0,  # adoption feature can be extended later
        recent_activity=recent_activity,
        chart_data=chart_data,
    )


# ──────────────────────────────────────────────────────────
#  GET /api/shelter/intake-requests → list intake requests FOR THIS SHELTER
# ──────────────────────────────────────────────────────────
@router.get("/intake-requests", response_model=List[IntakeRequestResponse])
async def list_intake_requests(
    x_user_id: str = Header(..., alias="x-user-id"),
    db: AsyncSession = Depends(get_db),
):
    """Lists retirement/intake requests directed to THIS shelter only."""
    try:
        shelter_uuid = UUID(x_user_id)
    except ValueError:
        raise HTTPException(400, "Invalid shelter id in x-user-id header")

    stmt = (
        select(ShelterIntakeRequest)
        .options(
            selectinload(ShelterIntakeRequest.farmer),
            selectinload(ShelterIntakeRequest.cattle),
        )
        .where(ShelterIntakeRequest.shelter_id == shelter_uuid)
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


# ──────────────────────────────────────────────────────────
#  PATCH /api/shelter/intake-requests/{id} → approve/reject
# ──────────────────────────────────────────────────────────
@router.patch("/intake-requests/{request_id}", response_model=IntakeRequestResponse)
async def update_intake_request_status(
    request_id: UUID,
    payload: IntakeStatusUpdate,
    background_tasks: BackgroundTasks,
    x_user_id: str = Header(..., alias="x-user-id"),
    db: AsyncSession = Depends(get_db),
):
    """Shelter approves or rejects an intake request.
    On Approve: sets cattle.shelter_id so the animal appears in shelter's cattle list."""
    if payload.status not in ("Approved", "Rejected"):
        raise HTTPException(400, "Status must be 'Approved' or 'Rejected'")

    try:
        shelter_uuid = UUID(x_user_id)
    except ValueError:
        raise HTTPException(400, "Invalid shelter id")

    stmt = (
        select(ShelterIntakeRequest)
        .options(
            selectinload(ShelterIntakeRequest.farmer),
            selectinload(ShelterIntakeRequest.cattle),
        )
        .where(ShelterIntakeRequest.id == request_id)
    )
    result = await db.execute(stmt)
    req = result.scalars().first()
    if not req:
        raise HTTPException(404, "Intake request not found")

    req.status = payload.status
    req.shelter_id = shelter_uuid

    # On approval: update cattle.shelter_id so it appears in shelter animals
    if payload.status == "Approved" and req.cattle:
        cattle = await db.get(Cattle, req.cattle_id)
        if cattle:
            cattle.shelter_id = shelter_uuid
            db.add(cattle)

    db.add(req)
    await db.commit()

    # Notify the farmer
    if req.farmer_id:
        shelter = await db.get(Shelter, shelter_uuid)
        shelter_name = shelter.sname if shelter else "the shelter"
        if payload.status == "Approved":
            title = "✅ Intake Request Approved"
            message = f"Your cattle retirement request has been approved by {shelter_name}. The animal has been transferred to shelter care."
        else:
            title = "❌ Intake Request Rejected"
            message = f"Your cattle retirement request has been rejected by {shelter_name}."

        background_tasks.add_task(
            _create_notification_in_background,
            user_id=req.farmer_id,
            user_role="farmer",
            notification_type="INTAKE_REQUEST_" + payload.status.upper(),
            title=title,
            message=message,
            entity_id=req.id,
            entity_type="shelter_intake",
        )

    # Also notify the shelter itself (activity log for their bell)
    cattle_name = req.cattle.cattle_name if req.cattle else "Unknown cattle"
    farmer_name = req.farmer.fname if req.farmer else "Unknown farmer"
    if payload.status == "Approved":
        shelter_title = "✅ Intake Approved"
        shelter_message = f"You accepted {cattle_name} from farmer {farmer_name}. The animal is now in your care."
    else:
        shelter_title = "❌ Intake Rejected"
        shelter_message = f"You rejected the intake request for {cattle_name} from farmer {farmer_name}."

    background_tasks.add_task(
        _create_notification_in_background,
        user_id=shelter_uuid,
        user_role="shelter",
        notification_type="INTAKE_REQUEST_" + payload.status.upper(),
        title=shelter_title,
        message=shelter_message,
        entity_id=req.id,
        entity_type="shelter_intake",
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


# ──────────────────────────────────────────────────────────
#  GET /api/shelter/cattle → all cattle accepted by this shelter
# ──────────────────────────────────────────────────────────
@router.get("/cattle", response_model=List[ShelterCattleResponse])
async def list_shelter_cattle(
    x_user_id: str = Header(..., alias="x-user-id"),
    db: AsyncSession = Depends(get_db),
):
    """Returns all cattle currently under this shelter's care."""
    try:
        shelter_uuid = UUID(x_user_id)
    except ValueError:
        raise HTTPException(400, "Invalid shelter id")

    stmt = (
        select(Cattle)
        .options(selectinload(Cattle.farmer))
        .where(Cattle.shelter_id == shelter_uuid)
        .order_by(Cattle.created_at.desc())
    )
    result = await db.execute(stmt)
    cattle_list = result.scalars().all()

    return [
        ShelterCattleResponse(
            cid=c.cid,
            cattle_name=c.cattle_name,
            breed=c.breed,
            colour_markings=c.colour_markings,
            inaph_tag_id=c.inaph_tag_id,
            local_cattle_id=c.local_cattle_id,
            health_condition=c.health_condition,
            species=c.species,
            sex=c.sex,
            weight=c.weight,
            dob=str(c.dob.date()) if c.dob else None,
            previous_owner=c.farmer.fname if c.farmer else None,
            previous_owner_id=c.owner_id,
            status=c.status,
            photo_url=c.photo_url,
        )
        for c in cattle_list
    ]


# ──────────────────────────────────────────────────────────
#  POST /api/shelter/health-records → add health record
#  GET  /api/shelter/health-records → list health records
# ──────────────────────────────────────────────────────────
@router.post("/health-records", response_model=ShelterHealthRecordResponse, status_code=201)
async def add_shelter_health_record(
    payload: ShelterHealthRecordCreate,
    x_user_id: str = Header(..., alias="x-user-id"),
    db: AsyncSession = Depends(get_db),
):
    """Add health record for a shelter-owned animal."""
    try:
        shelter_uuid = UUID(x_user_id)
    except ValueError:
        raise HTTPException(400, "Invalid shelter id")

    # Verify cattle belongs to this shelter
    cattle = await db.get(Cattle, payload.cattle_id)
    if not cattle:
        raise HTTPException(404, "Cattle not found")
    if cattle.shelter_id != shelter_uuid:
        raise HTTPException(403, "This cattle is not under your shelter")

    from app.models.shelter_health import ShelterHealthRecord
    record = ShelterHealthRecord(
        shelter_id=shelter_uuid,
        cattle_id=payload.cattle_id,
        vet_id=payload.vet_id,
        record_type=payload.record_type,
        description=payload.description,
        medicine=payload.medicine,
        record_date=payload.record_date,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


@router.get("/health-records", response_model=List[ShelterHealthRecordResponse])
async def list_shelter_health_records(
    x_user_id: str = Header(..., alias="x-user-id"),
    db: AsyncSession = Depends(get_db),
):
    """List all health records for this shelter's animals."""
    try:
        shelter_uuid = UUID(x_user_id)
    except ValueError:
        raise HTTPException(400, "Invalid shelter id")

    from app.models.shelter_health import ShelterHealthRecord
    from sqlalchemy.orm import selectinload as si
    stmt = (
        select(ShelterHealthRecord)
        .options(si(ShelterHealthRecord.cattle), si(ShelterHealthRecord.vet))
        .where(ShelterHealthRecord.shelter_id == shelter_uuid)
        .order_by(ShelterHealthRecord.record_date.desc())
    )
    result = await db.execute(stmt)
    records = result.scalars().all()
    return records


# ──────────────────────────────────────────────────────────
#  DELETE /api/shelter/me  → permanently delete shelter account
# ──────────────────────────────────────────────────────────
@router.delete("/me", status_code=204)
async def delete_shelter_account(
    x_user_id: str = Header(..., alias="x-user-id"),
    db: AsyncSession = Depends(get_db),
):
    """
    Permanently deletes the shelter account and ALL associated data.
    Guards against tables that may not exist in the live DB yet.
    """
    from sqlalchemy import text as sql_text
    import uuid as _uuid

    try:
        shelter_uuid = _uuid.UUID(x_user_id)
    except (ValueError, AttributeError):
        raise HTTPException(400, "Invalid shelter id in x-user-id header")

    shelter = await db.get(Shelter, shelter_uuid)
    if not shelter:
        raise HTTPException(404, "Shelter not found")

    async def table_exists(table_name: str) -> bool:
        """Check if a table exists in the public schema."""
        res = await db.execute(
            sql_text(
                "SELECT EXISTS ("
                "  SELECT 1 FROM information_schema.tables"
                "  WHERE table_schema = 'public' AND table_name = :tname"
                ")"
            ),
            {"tname": table_name},
        )
        return res.scalar()

    try:
        # Step 1: NULL-out cattle.shelter_id (cattle stay, just unassigned)
        await db.execute(
            sql_text("UPDATE cattles SET shelter_id = NULL WHERE shelter_id = :sid"),
            {"sid": shelter_uuid},
        )

        # Step 2: NULL-out intake_requests shelter_id
        await db.execute(
            sql_text("UPDATE shelter_intake_requests SET shelter_id = NULL WHERE shelter_id = :sid"),
            {"sid": shelter_uuid},
        )

        # Step 3: Delete shelter health records — only if the table exists in the DB
        if await table_exists("shelter_health_records"):
            await db.execute(
                sql_text("DELETE FROM shelter_health_records WHERE shelter_id = :sid"),
                {"sid": shelter_uuid},
            )

        # Step 4: Delete notifications
        if await table_exists("notifications"):
            await db.execute(
                sql_text("DELETE FROM notifications WHERE user_id = :sid"),
                {"sid": shelter_uuid},
            )

        # Step 5: Delete the shelter itself
        await db.execute(
            sql_text("DELETE FROM shelters WHERE sid = :sid"),
            {"sid": shelter_uuid},
        )

        await db.commit()

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")

    return None