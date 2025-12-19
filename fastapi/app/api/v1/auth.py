from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta

from app.db.session import get_db
from app.core.redis_client import cache_get, cache_set, cache_delete_pattern
from app.schemas.auth import (
    LoginRequest,
    FarmerCreate,
    FarmerResponse,
    InaphLoginRequest,
    CreatePasswordRequest,
    InaphLoginResponse,
    Token,
)
from app.schemas.common import _normalize_aadhaar, _normalize_phone
from app.models.user import Farmer, Vet, Shelter
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import settings
from app.tasks.email_tasks import schedule_welcome_farmer_email


router = APIRouter(tags=["auth"])  # ✅ All authentication-related routes live here


# ============================================================
#  NORMAL FARMER SIGNUP
# ============================================================
@router.post("/signup/farmer", status_code=201)
async def signup_farmer(
    payload: FarmerCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    🔹 For non-INAPH farmers only.
    🔹 Registers a new farmer using manual signup (Aadhaar, Email, Password, etc.)
    🔹 Sends welcome email after successful signup.
    """
    # Aadhaar uniqueness check
    existing = await db.scalar(
        select(Farmer).where(Farmer.faadhar == payload.faadhar)
    )
    if existing:
        raise HTTPException(400, "Farmer already registered with this Aadhar")

    # Email uniqueness check
    existing_email = await db.scalar(
        select(Farmer).where(Farmer.femail == payload.femail)
    )
    if existing_email:
        raise HTTPException(400, "Email already registered")

    # Create farmer with hashed password
    new_user = Farmer(**payload.model_dump(exclude={"password"}))
    new_user.password_hash = hash_password(payload.password)

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Background welcome mail
    schedule_welcome_farmer_email(background_tasks, new_user)

    return {"message": "Farmer signup successful", "user_id": new_user.fid}


# ============================================================
#  FETCH FARMER DETAILS (by Aadhaar / Email / Phone / INAPH)
# ============================================================
@router.get("/farmer-info", response_model=FarmerResponse)
async def get_farmer_info(
    identifier: str = Query(..., description="INAPH ID, email, phone or Aadhaar"),
    db: AsyncSession = Depends(get_db),
):
    """
    🔹 Used to fetch farmer details for profile or linking checks.
    🔹 Identifier can be INAPH ID, Aadhaar, Email, or Phone.
    """
    # Build cache key
    cache_key = f"farmer_info:{identifier}"
    
    # Try cache first
    cached = await cache_get(cache_key)
    if cached:
        print(f"✓ Cache HIT: {cache_key}")
        return FarmerResponse(**cached)
    
    print(f"✗ Cache MISS: {cache_key}")
    
    # Cache miss - query DB
    norm_aadhaar = None
    norm_phone = None

    # Try to normalize Aadhaar
    try:
        norm_aadhaar = _normalize_aadhaar(identifier)
    except Exception:
        pass

    # Try to normalize phone
    try:
        norm_phone = _normalize_phone(identifier)
    except Exception:
        pass

    email_candidate = identifier.lower()

    farmer = await db.scalar(
        select(Farmer)
        .options(selectinload(Farmer.cattles))
        .where(
            (Farmer.inaph_id == identifier)
            | (Farmer.femail == email_candidate)
            | (Farmer.fphone == norm_phone)
            | (Farmer.faadhar == norm_aadhaar)
        )
    )

    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    # Convert to response model
    response = FarmerResponse.model_validate(farmer)
    
    # Cache the result (10 minutes)
    await cache_set(cache_key, response.model_dump(), ttl=600)
    
    return response


# ============================================================
#  NORMAL LOGIN (Farmer / Vet / Shelter)  → returns JWT
# ============================================================
@router.post("/login", response_model=Token)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    🔹 Normal (non-INAPH) login.
    🔹 Works for:
        - Farmer (Aadhaar-based)
        - Vet (Email-based)
        - Shelter (Email-based)
    🔹 Returns JWT + basic user info.
    """
    role = payload.role.lower()
    identifier = payload.identifier
    pwd = payload.password
    user = None

    # Identify user based on role
    if role == "farmer":
        try:
            norm_id = _normalize_aadhaar(identifier)
        except Exception:
            norm_id = identifier
        user = await db.scalar(select(Farmer).where(Farmer.faadhar == norm_id))

    elif role == "vet":
        user = await db.scalar(select(Vet).where(Vet.vemail == identifier.lower()))

    elif role == "shelter":
        user = await db.scalar(
            select(Shelter).where(Shelter.semail == identifier.lower())
        )

    # User not found
    if not user:
        raise HTTPException(401, "Invalid credentials")

    # Password check
    if not verify_password(pwd, user.password_hash):
        raise HTTPException(401, "Invalid credentials")

    # Display name + user_id extraction based on role
    if role == "farmer":
        user_name = user.fname
        user_id = str(user.fid)
    elif role == "vet":
        user_name = user.vname
        user_id = str(user.vid)
    elif role == "shelter":
        user_name = user.sname
        user_id = str(user.sid)
    else:
        raise HTTPException(400, "Unsupported role")

    # 🔐 Create JWT token
    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    access_token = create_access_token(
        data={"sub": user_id, "role": role},
        expires_delta=access_token_expires,
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user_id,
        user_name=user_name,
        role=role,
        message="Login successful",
    )


# ============================================================
#  INAPH LOGIN FLOW (for tagged farmers)  → returns JWT on success
# ============================================================
@router.post("/inaph/login", response_model=InaphLoginResponse)
async def inaph_login(
    payload: InaphLoginRequest, db: AsyncSession = Depends(get_db)
):
    """
    🔹 Used for INAPH-tagged farmers only.
    🔹 Flow:
        1️⃣ If no password exists → returns "Password required" (frontend redirects to create-password page)
        2️⃣ If password exists → verifies and logs in farmer
        3️⃣ On successful login → returns JWT token as well
    """
    farmer = await db.scalar(
        select(Farmer).where(Farmer.inaph_id == payload.inaph_id)
    )
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    # Case 1: No password set yet → UI should ask to create password (no token here)
    if not farmer.password_hash:
        return InaphLoginResponse(
            message="Password required",
            user_id=str(farmer.fid),
            user_name=farmer.fname,
            role="farmer",
            faadhar=farmer.faadhar,
            access_token=None,
            token_type=None,
        )

    # Case 2: Password exists but not provided
    if not payload.password:
        raise HTTPException(
            status_code=400, detail="Password required for INAPH login"
        )

    # Case 3: Wrong password
    if not verify_password(payload.password, farmer.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # ✅ Successful login → create JWT token
    user_id = str(farmer.fid)
    role = "farmer"

    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    access_token = create_access_token(
        data={"sub": user_id, "role": role},
        expires_delta=access_token_expires,
    )

    return InaphLoginResponse(
        message="Login successful",
        user_id=user_id,
        user_name=farmer.fname,
        role=role,
        faadhar=farmer.faadhar,
        access_token=access_token,
        token_type="bearer",
    )


# ============================================================
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
    farmer = await db.scalar(
        select(Farmer).where(Farmer.inaph_id == inaph_id)
    )
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    return {
        "has_password": bool(farmer.password_hash),
        "faadhar": farmer.faadhar,
        "role": "farmer",
    }


# ============================================================
#  CREATE PASSWORD FOR INAPH FARMER
# ============================================================
@router.post("/inaph/create-password")
async def inaph_create_password(
    payload: CreatePasswordRequest, db: AsyncSession = Depends(get_db)
):
    """
    🔹 Sets new password for INAPH farmers who don’t have one yet.
    🔹 Called after the /inaph/check-password result is false.
    """
    farmer = await db.scalar(
        select(Farmer).where(Farmer.inaph_id == payload.inaph_id)
    )
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    if farmer.password_hash:
        raise HTTPException(
            status_code=400,
            detail="Password already set for this account",
        )

    farmer.password_hash = hash_password(payload.new_password)
    db.add(farmer)
    await db.commit()
    await db.refresh(farmer)

    return {
        "message": "Password created successfully",
        "user_id": str(farmer.fid),
    }
