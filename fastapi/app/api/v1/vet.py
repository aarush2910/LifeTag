from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.vet import VetCreate
from app.models.user import Vet
from app.core.security import hash_password
from app.tasks.email_tasks import schedule_welcome_vet_email

router = APIRouter(tags=["vets"])


@router.post("/signup/vet", status_code=201)
async def signup_vet(payload: VetCreate, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    if await db.scalar(select(Vet).where(Vet.vemail == payload.vemail)):
        raise HTTPException(400, "Email already registered")
    if await db.scalar(select(Vet).where(Vet.vlicense == payload.vlicense)):
        raise HTTPException(400, "License number already registered")

    new_user = Vet(**payload.model_dump(exclude={"password"}))
    new_user.password_hash = hash_password(payload.password)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # schedule welcome email via centralized task helper
    schedule_welcome_vet_email(background_tasks, new_user)
    return {"message": "Vet signup successful", "user_id": new_user.vid}