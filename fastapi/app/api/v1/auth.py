from fastapi import APIRouter, Depends, HTTPException, status, Body ,Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.auth import LoginRequest,FarmerCreate
from app.schemas.common import _normalize_aadhaar, _normalize_phone
from app.models.user import Farmer,Vet,Shelter
from fastapi.security import OAuth2PasswordRequestForm
from app.models.cattle import Cattle
from app.core.security import hash_password, verify_password
from app.services.mailer import send_email
from app.core.config import settings
from datetime import timedelta
import asyncio


router = APIRouter(tags=["auth"])  # keep auth router name; farmer-related routes live here

@router.post("/signup/farmer", status_code=201)
async def signup_farmer(payload: FarmerCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.scalar(select(Farmer).where(Farmer.faadhar == payload.faadhar))
    if existing:
        raise HTTPException(400, "Farmer already registered with this Aadhar")

    existing_email = await db.scalar(select(Farmer).where(Farmer.femail == payload.femail))
    if existing_email:
        raise HTTPException(400, "Email already registered")

    new_user = Farmer(**payload.model_dump(exclude={"password"}))
    new_user.password_hash = hash_password(payload.password)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # --- HTML Email Content ---
    html_content = f"""
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f7fa; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="text-align: center;">
            <!-- inline CID image attached by mailer -->
            <img src="cid:life_logo" alt="LifeTag Logo" width="60" />
            <h2 style="color: #2c7be5;">Welcome to LifeTag</h2>
            <p style="color: #444;">Empowering Farmers • Ensuring Livestock Welfare</p>
          </div>
          <hr style="margin: 20px 0;">
          <p>Dear <b>{new_user.fname}</b>,</p>
          <p>We are delighted to inform you that your <b>LifeTag Farmer Account</b> has been successfully created. You are now part of India’s growing digital livestock ecosystem aimed at ensuring traceability, welfare, and transparency.</p>

          <p>With your LifeTag account, you can now:</p>
          <ul>
            <li>Access your registered cattle details and vaccination records.</li>
            <li>Update ownership and track health history.</li>
            <li>Connect with veterinary officers and nearby shelters.</li>
            <li>Receive notifications about upcoming vaccinations and welfare schemes.</li>
          </ul>

          <p style="margin-top: 20px;">You can log in anytime at:  
            <a href="https://lifetag.in/login" style="color: #2c7be5; text-decoration: none;">https://lifetag.in/login</a>
          </p>

          <p>If you have any questions or need assistance, feel free to contact our support team at  
            <a href="mailto:support@lifetag.in">support@lifetag.in</a>.
          </p>

          <p style="margin-top: 30px;">Warm regards,<br>
          <b>The LifeTag Support Team</b><br>
          Department of Digital Livestock Management<br>
          Ministry of Animal Husbandry & Dairying (Prototype)</p>

          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #888; text-align: center;">
            This is an auto-generated email. Please do not reply.<br>
            © 2025 LifeTag. All Rights Reserved.
          </p>
        </div>
      </body>
    </html>
    """

    asyncio.create_task(send_email(
        "Welcome to LifeTag – Your Farmer Registration is Successful",
        new_user.femail,
        html_content,
        True
    ))

    return {"message": "Farmer signup successful", "user_id": new_user.fid}


@router.post("/login")
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    role = payload.role.lower()
    identifier = payload.identifier
    pwd = payload.password
    user = None

    if role == "farmer":
        try:
            norm_id = _normalize_aadhaar(identifier)
        except Exception:
            norm_id = identifier
        user = await db.scalar(select(Farmer).where(Farmer.faadhar == norm_id))
    elif role == "vet":
        user = await db.scalar(select(Vet).where(Vet.vemail == identifier.lower()))
    elif role == "shelter":
        user = await db.scalar(select(Shelter).where(Shelter.semail == identifier.lower()))
    if not user:
        raise HTTPException(401, "Invalid credentials")

    # Password check
    if not verify_password(pwd, user.password_hash):
        raise HTTPException(401, "Invalid credentials")

    if role == "farmer":
        user_name = user.fname
    elif role == "vet":
        user_name = user.vname
    elif role == "shelter":
        user_name = user.sname
    else:
        user_name = ""

    return {
        "message": "Login successful",
        "user_id": str(getattr(user, 'fid', getattr(user, 'vid', getattr(user, 'sid', None))),),
        "user_name": user_name,
        "role": role
    }

 