from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.shelter import ShelterCreate
from app.models.user import Shelter
from app.core.security import hash_password
from app.tasks.email_tasks import schedule_welcome_shelter_email

router = APIRouter(tags=["shelter"])


@router.post("/signup/shelter", status_code=201)
async def signup_shelter(payload: ShelterCreate, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    if await db.scalar(select(Shelter).where(Shelter.semail == payload.semail)):
        raise HTTPException(400, "Email already registered")
    if await db.scalar(select(Shelter).where(Shelter.sregistration == payload.sregistration)):
        raise HTTPException(400, "Registration number already exists")

    new_user = Shelter(**payload.model_dump(exclude={"password"}))
    new_user.password_hash = hash_password(payload.password)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)


    # schedule welcome email via centralized task helper
    schedule_welcome_shelter_email(background_tasks, new_user)
    return {"message": "Shelter signup successful", "user_id": new_user.sid}