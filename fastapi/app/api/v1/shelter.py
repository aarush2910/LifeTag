from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.shelter import ShelterCreate
from app.models.user import Shelter
from app.core.security import hash_password
from app.services.mailer import send_email
import asyncio

router = APIRouter(tags=["shelter"])


@router.post("/signup/shelter", status_code=201)
async def signup_shelter(payload: ShelterCreate, db: AsyncSession = Depends(get_db)):
    if await db.scalar(select(Shelter).where(Shelter.semail == payload.semail)):
        raise HTTPException(400, "Email already registered")
    if await db.scalar(select(Shelter).where(Shelter.sregistration == payload.sregistration)):
        raise HTTPException(400, "Registration number already exists")

    new_user = Shelter(**payload.model_dump(exclude={"password"}))
    new_user.password_hash = hash_password(payload.password)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    shelter_html = f"""
    <!DOCTYPE html>
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f7fa; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="text-align: center;">
                    <img src="cid:life_logo" alt="LifeTag Logo" width="60" />
                    <h2 style="color: #2c7be5;">Welcome to LifeTag</h2>
                    <p style="color: #444;">Shelter Account Created</p>
                </div>
                <hr style="margin: 20px 0;">
                <p>Dear <b>{new_user.sname}</b>,</p>
                <p>Your shelter account has been successfully created. You can now manage shelter listings, coordinate rescues, and receive alerts from LifeTag.</p>
                <p style="margin-top: 30px;">Warm regards,<br><b>The LifeTag Support Team</b></p>
            </div>
        </body>
    </html>
    """

    asyncio.create_task(send_email(
                "Welcome to LifeTag - Shelter Account",
                new_user.semail,
                shelter_html,
                True
        ))
    return {"message": "Shelter signup successful", "user_id": new_user.sid}