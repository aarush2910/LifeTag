from fastapi import APIRouter, Depends, HTTPException, Body, Query, BackgroundTasks
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
from app.models.user import Farmer, Vet, Shelter
from app.core.security import hash_password, verify_password
from app.tasks.email_tasks import schedule_welcome_farmer_email


router = APIRouter(tags=["auth"])  # ✅ All authentication-related routes live here


# ============================================================
#  NORMAL FARMER SIGNUP
# ============================================================
@router.post("/signup/farmer", status_code=201)
async def signup_farmer(payload: FarmerCreate, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    """
    🔹 For non-INAPH farmers only.
    🔹 Registers a new farmer using manual signup (Aadhaar, Email, Password, etc.)
    🔹 Sends welcome email after successful signup.
    """
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

    # schedule sending the welcome email using the centralized email task helper
    schedule_welcome_farmer_email(background_tasks, new_user)

    return {"message": "Farmer signup successful", "user_id": new_user.fid}


# ============================================================
#  FETCH FARMER DETAILS (by Aadhaar / Email / Phone / INAPH)
# ============================================================
@router.get("/farmer-info", response_model=FarmerResponse)
async def get_farmer_info(
    identifier: str = Query(..., description="INAPH ID, email, phone or Aadhaar"),
    db: AsyncSession = Depends(get_db)
):
    """
    🔹 Used to fetch farmer details for profile or linking checks.
    🔹 Identifier can be INAPH ID, Aadhaar, Email, or Phone.
    """
    norm_aadhaar = None
    norm_phone = None
    try:
        norm_aadhaar = _normalize_aadhaar(identifier)
    except Exception:
        pass
    try:
        norm_phone = _normalize_phone(identifier)
    except Exception:
        pass

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


# ============================================================
#  NORMAL LOGIN (Farmer / Vet / Shelter)
# ============================================================
@router.post("/login")
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    🔹 Used for normal (non-INAPH) login.
    🔹 Works for:
        - Farmer (Aadhaar-based)
        - Vet (Email-based)
        - Shelter (Email-based)
    """
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

    # Extract display name
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


# ============================================================
#  INAPH LOGIN FLOW (for tagged farmers)
# ============================================================
@router.post("/inaph/login", response_model=InaphLoginResponse)
async def inaph_login(payload: InaphLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    🔹 Used for INAPH-tagged farmers only.
    🔹 Flow:
        1️⃣ If no password exists → returns "Password required" message (frontend redirects to create-password page)
        2️⃣ If password exists → verifies and logs in farmer
    🔹 Also returns Aadhaar number for linking to dashboard
    """
    farmer = await db.scalar(select(Farmer).where(Farmer.inaph_id == payload.inaph_id))
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    # If no password set yet → show password creation UI
    if not farmer.password_hash:
        return InaphLoginResponse(
            message="Password required",
            user_id=str(farmer.fid),
            user_name=farmer.fname,
            role="farmer",
            faadhar=farmer.faadhar,  
        )

    # Password exists → verify
    if not payload.password:
        raise HTTPException(status_code=400, detail="Password required for INAPH login")

    if not verify_password(payload.password, farmer.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return InaphLoginResponse(
        message="Login successful",
        user_id=str(farmer.fid),
        user_name=farmer.fname,
        role="farmer",
        faadhar=farmer.faadhar,  
    )


## ============================================================
#  CHECK IF INAPH FARMER ALREADY HAS PASSWORD
# ============================================================
@router.get("/inaph/check-password")
async def check_inaph_password(
    inaph_id: str = Query(..., description="INAPH ID to check"),
    db: AsyncSession = Depends(get_db),
):
    """
    🔹 Checks whether an INAPH farmer has already created a password.
    🔹 Also returns Aadhaar and role for dashboard redirection.
    """
    farmer = await db.scalar(select(Farmer).where(Farmer.inaph_id == inaph_id))
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    return {
        "has_password": bool(farmer.password_hash),
        "faadhar": farmer.faadhar,
        "role": "farmer"
    }



# ============================================================
#  CREATE PASSWORD FOR INAPH FARMER
# ============================================================
@router.post("/inaph/create-password")
async def inaph_create_password(payload: CreatePasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    🔹 Sets new password for INAPH farmers who don’t have one yet.
    🔹 Called after the /inaph/check-password result is false.
    """
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