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
    FarmerUpdate,
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
from app.tasks.email_tasks import schedule_welcome_farmer_email, schedule_welcome_shelter_email
from pydantic import BaseModel, EmailStr
from datetime import datetime
import random
import re


router = APIRouter(tags=["auth"])  # ✅ All authentication-related routes live here


class ShelterRegisterRequest(BaseModel):
    shelter_name: str | None = None
    shelter_id: str | None = None
    contact: str | None = None
    email: EmailStr | None = None
    address: str | None = None
    capacity: int | None = None
    password: str
    # Canonical keys (also supported)
    sname: str | None = None
    sregistration: str | None = None
    sphone: str | None = None
    semail: EmailStr | None = None
    saddress: str | None = None
    scapacity: int | None = None


async def _generate_unique_shelter_registration(db: AsyncSession, shelter_name: str) -> str:
    """Generate shelter id in format: NAME-YYYY-1234."""
    year = datetime.utcnow().year
    prefix = re.sub(r"[^A-Za-z0-9]+", "", (shelter_name or "").upper()) or "SHELTER"
    prefix = prefix[:40]  # keep within DB column limit with suffix

    for _ in range(60):
        four_digits = random.randint(1000, 9999)
        shelter_id = f"{prefix}-{year}-{four_digits}"
        exists = await db.scalar(select(Shelter).where(Shelter.sregistration == shelter_id))
        if not exists:
            return shelter_id

    raise HTTPException(500, "Unable to generate unique shelter id. Please retry.")


class ShelterLoginRequest(BaseModel):
    shelter_id: str | None = None
    email: EmailStr | None = None
    identifier: str | None = None
    password: str


@router.post("/shelter/register", status_code=201)
async def register_shelter(
    payload: ShelterRegisterRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Register shelter account from Shelter signup form."""
    sname = (payload.sname or payload.shelter_name or "").strip()
    sphone_raw = payload.sphone or payload.contact or ""
    semail = (str(payload.semail or payload.email or "")).strip().lower()
    saddress = (payload.saddress or payload.address or "").strip()
    scapacity = payload.scapacity if payload.scapacity is not None else payload.capacity

    if not sname or not sphone_raw or not semail or not payload.password:
        raise HTTPException(400, "Missing required shelter fields")

    if scapacity is None:
        scapacity = 0

    try:
        sphone = _normalize_phone(sphone_raw)
    except Exception:
        raise HTTPException(400, "Invalid contact number")

    if await db.scalar(select(Shelter).where(Shelter.semail == semail)):
        raise HTTPException(400, "Email already registered")

    # Auto-generate shelter ID: NAME-YYYY-1234
    sregistration = await _generate_unique_shelter_registration(db, sname)

    new_user = Shelter(
        sname=sname,
        semail=semail,
        sphone=sphone,
        sregistration=sregistration,
        saddress=saddress or "-",
        scapacity=int(scapacity),
        password_hash=hash_password(payload.password),
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    schedule_welcome_shelter_email(background_tasks, new_user)

    return {
        "message": "Shelter signup successful",
        "user_id": str(new_user.sid),
        "shelter_id": new_user.sregistration,
    }


# Alias: sign-up.tsx calls /api/auth/signup/{role}, so shelter → /signup/shelter
@router.post("/signup/shelter", status_code=201)
async def signup_shelter_alias(
    payload: ShelterRegisterRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Alias for /shelter/register — used by the shared sign-up.tsx component."""
    return await register_shelter(payload, background_tasks, db)


@router.post("/shelter/login", response_model=Token)
async def login_shelter(payload: ShelterLoginRequest, db: AsyncSession = Depends(get_db)):
    """Login shelter by shelter id or email and return JWT."""
    identifier = (payload.identifier or payload.shelter_id or payload.email or "").strip()
    if not identifier:
        raise HTTPException(400, "Shelter ID or email is required")

    user = await db.scalar(select(Shelter).where(Shelter.sregistration == identifier))
    if not user:
        user = await db.scalar(select(Shelter).where(Shelter.semail == identifier.lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")

    role = "shelter"
    user_id = str(user.sid)
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_id, "role": role},
        expires_delta=access_token_expires,
    )
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user_id,
        user_name=user.sname,
        role=role,
        message="Login successful",
    )


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
#  UPDATE FARMER PROFILE (by user_id from JWT header)
# ============================================================
from fastapi import Header as FastAPIHeader
from uuid import UUID as PyUUID

@router.patch("/farmer-info", response_model=FarmerResponse)
async def update_farmer_info(
    payload: FarmerUpdate,
    x_user_id: str = FastAPIHeader(..., alias="x-user-id"),
    db: AsyncSession = Depends(get_db),
):
    """
    🔹 Updates a farmer's editable profile fields (phone, email, address, farmname, farmtype).
    🔹 Reads farmer by UUID from the X-User-Id header (set by frontend after login).
    """
    try:
        farmer_uuid = PyUUID(x_user_id)
    except ValueError:
        raise HTTPException(400, "Invalid farmer id in x-user-id header")

    farmer = await db.scalar(select(Farmer).options(selectinload(Farmer.cattles)).where(Farmer.fid == farmer_uuid))
    if not farmer:
        raise HTTPException(404, "Farmer not found")

    update_data = payload.model_dump(exclude_unset=True)

    # Check email uniqueness if changing
    if "femail" in update_data and update_data["femail"] != farmer.femail:
        existing = await db.scalar(select(Farmer).where(Farmer.femail == update_data["femail"]))
        if existing:
            raise HTTPException(400, "Email already in use")

    for field, value in update_data.items():
        setattr(farmer, field, value)

    db.add(farmer)
    await db.commit()
    # Reload with relationships
    farmer = await db.scalar(select(Farmer).options(selectinload(Farmer.cattles)).where(Farmer.fid == farmer_uuid))
    return farmer


# ============================================================
#  FETCH FARMER DETAILS (by Aadhaar / Email / Phone / INAPH)
# ============================================================
@router.get("/debug-farmer")
async def debug_farmer_info(
    identifier: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    import traceback as _tb
    result: dict = {}
    from sqlalchemy import text as _text
    try:
        r = await db.execute(_text("SELECT inaph_id, fname FROM farmers WHERE inaph_id = :id LIMIT 1"), {"id": identifier})
        row = r.fetchone()
        result["sql_row"] = dict(row._mapping) if row else None
    except Exception as e:
        result["sql_error"] = str(e)
    try:
        farmer = await db.scalar(select(Farmer).options(selectinload(Farmer.cattles)).where(Farmer.inaph_id == identifier))
        result["orm_found"] = farmer is not None
        if farmer:
            result["fname"] = farmer.fname
            result["cattle_count"] = len(farmer.cattles or [])
            try:
                FarmerResponse.model_validate(farmer)
                result["pydantic_ok"] = True
            except Exception as pe:
                result["pydantic_error"] = str(pe)
                result["pydantic_tb"] = _tb.format_exc()
    except Exception as oe:
        result["orm_error"] = str(oe)
        result["orm_tb"] = _tb.format_exc()
    return result


@router.get("/farmer-info", response_model=FarmerResponse)
async def get_farmer_info(
    identifier: str = Query(..., description="INAPH ID, email, phone or Aadhaar"),
    db: AsyncSession = Depends(get_db),
):
    """
    🔹 Used to fetch farmer details for profile or linking checks.
    🔹 Identifier can be INAPH ID, Aadhaar, Email, or Phone.
    """
    # Build cache key (v2 includes cid — bumped to auto-invalidate old entries)
    cache_key = f"farmer_info_v2:{identifier}"
    
    # Try cache first
    cached = await cache_get(cache_key)
    if cached:
        print(f"✓ Cache HIT: {cache_key}")
        try:
            return FarmerResponse.model_validate(cached)
        except Exception:
            pass  # cache corrupted - fall through to DB
    
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

    # Try UUID (fid) direct match
    import uuid as _uuid
    fid_candidate = None
    try:
        fid_candidate = _uuid.UUID(identifier)
    except (ValueError, AttributeError):
        pass

    from sqlalchemy import or_, text as _sql_text

    # Find farmer using raw SQL columns only — no lazy relationships
    conditions = [Farmer.inaph_id == identifier, Farmer.femail == email_candidate]
    if norm_phone is not None:
        conditions.append(Farmer.fphone == norm_phone)
    if norm_aadhaar is not None:
        conditions.append(Farmer.faadhar == norm_aadhaar)
    if fid_candidate is not None:
        conditions.append(Farmer.fid == fid_candidate)

    # Query farmer scalar columns only (no relationship loading)
    from sqlalchemy import Column
    farmer_row = await db.execute(
        select(
            Farmer.fid, Farmer.fname, Farmer.fphone, Farmer.femail,
            Farmer.faadhar, Farmer.faddress, Farmer.farmtype, Farmer.inaph_id,
        ).where(or_(*conditions)).limit(1)
    )
    farmer_data = farmer_row.fetchone()


    if not farmer_data:
        raise HTTPException(status_code=404, detail="Farmer not found")

    farmer_fid = farmer_data.fid

    # Fetch cattles via separate column-only query — no ORM relationships
    from app.models.cattle import Cattle
    cattle_rows = await db.execute(
        select(
            Cattle.cid, Cattle.cattle_name, Cattle.breed,
            Cattle.inaph_tag_id, Cattle.local_cattle_id,
        ).where(Cattle.owner_id == farmer_fid)
    )
    cattle_list = [
        {
            "cid": str(row.cid),
            "cattle_name": row.cattle_name,
            "breed": row.breed,
            "inaph_tag_id": row.inaph_tag_id,
            "local_cattle_id": row.local_cattle_id,
        }
        for row in cattle_rows.fetchall()
    ]

    response_data = {
        "fid": str(farmer_data.fid),
        "fname": farmer_data.fname,
        "fphone": farmer_data.fphone,
        "femail": farmer_data.femail,
        "faadhar": farmer_data.faadhar,
        "faddress": farmer_data.faddress,
        "farmtype": farmer_data.farmtype,
        "inaph_id": farmer_data.inaph_id,
        "cattles": cattle_list,
    }

    try:
        response = FarmerResponse.model_validate(response_data)
    except Exception as e:
        print(f"❌ FarmerResponse validation error: {e}")
        raise HTTPException(status_code=500, detail=f"Data serialization error: {e}")

    # Cache for 10 minutes
    await cache_set(cache_key, response.model_dump(by_alias=True), ttl=600)

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


# ============================================================
#  GET /me  →  Return logged-in farmer's full profile (JWT-based)
# ============================================================
from fastapi import Header
import uuid as _uuid

# ============================================================
#  GET /me  →  Return logged-in user's full profile (JWT-based)
# ============================================================
from fastapi import Header
import uuid as _uuid
from typing import Any

@router.get("/me", response_model=Any)
async def get_my_profile(
    authorization: str = Header(..., alias="Authorization"),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns the logged-in user's profile (Farmer, Vet, or Shelter) decoded from the JWT token.
    No identifier parameter needed — safest approach.
    """
    from app.core.security import decode_access_token
    try:
        token = authorization.removeprefix("Bearer ").strip()
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        role = payload.get("role", "farmer").lower()
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        uuid_val = _uuid.UUID(str(user_id))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if role == "farmer":
        user = await db.scalar(
            select(Farmer)
            .options(selectinload(Farmer.cattles))
            .where(Farmer.fid == uuid_val)
        )
        if not user:
            raise HTTPException(status_code=404, detail="Farmer not found")
        return FarmerResponse.model_validate(user)
    elif role == "vet":
        user = await db.scalar(select(Vet).where(Vet.vid == uuid_val))
        if not user:
            raise HTTPException(status_code=404, detail="Vet not found")
        # Ensure we return a dump so Any works well
        return user.__dict__
    elif role == "shelter":
        user = await db.scalar(select(Shelter).where(Shelter.sid == uuid_val))
        if not user:
            raise HTTPException(status_code=404, detail="Shelter not found")
        return user.__dict__
    else:
        raise HTTPException(status_code=400, detail="Invalid role in token")


# ============================================================
#  POST /change-password  →  Change farmer password
# ============================================================
from pydantic import BaseModel as _BaseModel

class ChangePasswordRequest(_BaseModel):
    current_password: str
    new_password: str

@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    authorization: str = Header(..., alias="Authorization"),
    db: AsyncSession = Depends(get_db),
):
    """Change password for the logged-in user (Farmer, Vet, or Shelter)."""
    from app.core.security import decode_access_token
    try:
        token = authorization.removeprefix("Bearer ").strip()
        token_data = decode_access_token(token)
        user_id = token_data.get("sub")
        role = token_data.get("role", "farmer")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Find the user by role
    user = None
    if role == "farmer":
        user = await db.scalar(select(Farmer).where(Farmer.fid == _uuid.UUID(user_id)))
    elif role == "vet":
        user = await db.scalar(select(Vet).where(Vet.vid == _uuid.UUID(user_id)))
    elif role == "shelter":
        user = await db.scalar(select(Shelter).where(Shelter.sid == _uuid.UUID(user_id)))

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    user.password_hash = hash_password(payload.new_password)
    db.add(user)
    await db.commit()

    return {"message": "Password changed successfully"}


# ── DEBUG: Test email endpoint ─────────────────────────────────────────────────
@router.get("/test-email")
async def test_email(to: str = Query(..., description="Recipient email address")):
    """Send a test email to verify SMTP credentials are working. Returns exact error if it fails."""
    import aiosmtplib
    from email.message import EmailMessage

    msg = EmailMessage()
    msg["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM or settings.MAIL_USERNAME}>"
    msg["To"] = to
    msg["Subject"] = "LifeTag — SMTP Test Email"
    msg.set_content("This is a test email from LifeTag Support.")
    msg.add_alternative(
        "<h2>✅ LifeTag SMTP Test</h2><p>If you see this, email is working!</p>",
        subtype="html"
    )

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.MAIL_SERVER,
            port=settings.MAIL_PORT,
            username=settings.MAIL_USERNAME,
            password=settings.MAIL_PASSWORD,
            use_tls=settings.MAIL_USE_SSL,
            start_tls=settings.MAIL_USE_TLS,
        )
        return {
            "status": "success",
            "message": f"✅ Email sent to {to}",
            "from": settings.MAIL_USERNAME,
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "from_account": settings.MAIL_USERNAME,
            "smtp_server": f"{settings.MAIL_SERVER}:{settings.MAIL_PORT}",
            "tls": settings.MAIL_USE_TLS,
            "ssl": settings.MAIL_USE_SSL,
        }

