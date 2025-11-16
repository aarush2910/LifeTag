from fastapi import APIRouter, Depends, HTTPException, status, Body, Response, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.auth import (
    LoginRequest,
    FarmerCreate,
    FarmerResponse,
    InaphLoginRequest,
    CreatePasswordRequest,
    InaphLoginResponse,
)
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



@router.get("/farmer-info", response_model=FarmerResponse)
async def get_farmer_info(
    identifier: str = Query(..., description="INAPH ID, email or phone number"),
    db: AsyncSession = Depends(get_db)
):
    """
    🔍 Fetch farmer details by INAPH ID / Email / Phone
    Used for frontend 
    """
    # try normalizing known identifier formats to improve matching
    norm_aadhaar = None
    norm_phone = None
    try:
        norm_aadhaar = _normalize_aadhaar(identifier)
    except Exception:
        norm_aadhaar = None
    try:
        norm_phone = _normalize_phone(identifier)
    except Exception:
        norm_phone = None

    # lowercase email for consistent matching
    email_candidate = identifier.lower()

    farmer = await db.scalar(
        select(Farmer).where(
            (Farmer.inaph_id == identifier) |
            (Farmer.femail == email_candidate) |
            (Farmer.fphone == norm_phone) |
            (Farmer.faadhar == norm_aadhaar)
        )
    )

    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    return farmer


#login
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


@router.post("/inaph/login", response_model=InaphLoginResponse)
async def inaph_login(payload: InaphLoginRequest, db: AsyncSession = Depends(get_db)):
    """Login/create-password flow using INAPH ID.

    Flow:
    - POST /inaph/login with { inaph_id }
      - If farmer not found -> 404
      - If farmer exists but has no password_hash -> returns needs_password message (password required)
      - If farmer exists and has password_hash -> requires password in request and verifies it
    - To set a password, call POST /inaph/create-password with { inaph_id, new_password }
    """
    farmer = await db.scalar(select(Farmer).where(Farmer.inaph_id == payload.inaph_id))
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    # No password set yet -> tell frontend to show create-password UI
    if not farmer.password_hash:
        # Return a clear message so frontend can show the create-password screen.
        return InaphLoginResponse(
            message="Password required",
            user_id=str(farmer.fid),
            user_name=farmer.fname,
            role="farmer",
        )

    # Password exists -> require password in request
    if not payload.password:
        raise HTTPException(status_code=400, detail="Password required for INAPH login")

    if not verify_password(payload.password, farmer.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return InaphLoginResponse(
        message="Login successful",
        user_id=str(farmer.fid),
        user_name=farmer.fname,
        role="farmer",
    )



# check password route 
@router.get("/inaph/check-password")
async def check_inaph_password(
    inaph_id: str = Query(..., description="INAPH ID to check"),
    db: AsyncSession = Depends(get_db),
):
    """Check if a farmer already has a password for their INAPH account."""
    farmer = await db.scalar(select(Farmer).where(Farmer.inaph_id == inaph_id))
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    return {"exists": bool(farmer.password_hash)}


#create-password
@router.post("/inaph/create-password")
async def inaph_create_password(payload: CreatePasswordRequest, db: AsyncSession = Depends(get_db)):
    """Set a new password for a farmer who signed up via INAPH and doesn't have a password yet."""
    farmer = await db.scalar(select(Farmer).where(Farmer.inaph_id == payload.inaph_id))
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    if farmer.password_hash:
        raise HTTPException(status_code=400, detail="Password already set for this account")

    farmer.password_hash = hash_password(payload.new_password)
    db.add(farmer)
    await db.commit()
    await db.refresh(farmer)

    return {"message": "Password created successfully", "user_id": str(farmer.fid)}

 