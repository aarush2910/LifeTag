from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from pydantic import BaseModel

from app.db.session import get_db
from app.models.user import Vet
from app.schemas.vet_auth import (
    VetLicenseCheckRequest,
    VetCreatePasswordRequest,
    VetLoginRequest,
    VetLoginResponse
)

from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.schemas.auth import Token
from datetime import timedelta
from app.core.config import settings


router = APIRouter(tags=["vet-auth"])


# ============================================================
# Schema for PATCH /api/vet/me
# ============================================================
class VetProfileUpdate(BaseModel):
    vname: Optional[str] = None
    vphone: Optional[str] = None
    vemail: Optional[str] = None
    vaddress: Optional[str] = None
    vclinic: Optional[str] = None
    specialization: Optional[str] = None


# ============================================================
# GET /api/vet/me  — return vet profile from JWT
# ============================================================
@router.get("/me")
async def get_vet_profile(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    token = authorization.replace("Bearer ", "").strip()
    try:
        payload = decode_access_token(token)
        vet_id = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    import uuid as _uuid
    vet = await db.scalar(select(Vet).where(Vet.vid == _uuid.UUID(vet_id)))
    if not vet:
        raise HTTPException(status_code=404, detail="Vet not found")

    return {
        "vid": str(vet.vid),
        "vname": vet.vname,
        "vemail": vet.vemail,
        "vphone": vet.vphone,
        "vlicense": vet.vlicense,
        "license_no": vet.vlicense,
        "vclinic": vet.vclinic,
        "vaddress": vet.vaddress,
        "qualification": vet.qualification,
        "specialization": vet.specialization,
    }


# ============================================================
# PATCH /api/vet/me  — update vet profile
# ============================================================
@router.patch("/me")
async def update_vet_profile(
    payload: VetProfileUpdate,
    authorization: str = Header(...),
    x_user_id: Optional[str] = Header(None, alias="x-user-id"),
    db: AsyncSession = Depends(get_db),
):
    token = authorization.replace("Bearer ", "").strip()
    try:
        token_payload = decode_access_token(token)
        vet_id = token_payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    import uuid as _uuid
    vet = await db.scalar(select(Vet).where(Vet.vid == _uuid.UUID(vet_id)))
    if not vet:
        raise HTTPException(status_code=404, detail="Vet not found")

    update_data = payload.model_dump(exclude_none=True)
    for field, value in update_data.items():
        if hasattr(vet, field):
            setattr(vet, field, value)

    db.add(vet)
    await db.commit()
    await db.refresh(vet)

    return {
        "vid": str(vet.vid),
        "vname": vet.vname,
        "vemail": vet.vemail,
        "vphone": vet.vphone,
        "vlicense": vet.vlicense,
        "license_no": vet.vlicense,
        "vclinic": vet.vclinic,
        "vaddress": vet.vaddress,
        "qualification": vet.qualification,
        "specialization": vet.specialization,
        "message": "Profile updated successfully",
    }

# ============================================================
# 1. CHECK LICENSE — FIRST STEP
# ============================================================
@router.post("/check-license")
async def check_vet_license(payload: VetLicenseCheckRequest, db: AsyncSession = Depends(get_db)):
    """
    Step 1:
    ✔ Check if vet license exists
    ✔ Check if password exists
    ✔ Return next action to frontend
    """

    vet = await db.scalar(
        select(Vet).where(Vet.vlicense == payload.license)
    )

    if not vet:
        raise HTTPException(404, "Wrong license number")

    # If password not created → redirect to create-password page
    if not vet.password_hash:
        return {
            "password_required": True,
            "vid": vet.vid,
            "vname": vet.vname,
            "license": vet.vlicense
        }

    # If password already exists → go to login page
    return {
        "password_required": False,
        "message": "Password already created. Proceed to login.",
        "license": vet.vlicense
    }


# ============================================================
# 2. CREATE PASSWORD — FIRST TIME ONLY
# ============================================================
@router.post("/create-password")
async def create_vet_password(payload: VetCreatePasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Step 2:
    ✔ Vet sets password for the first time
    ✔ Only if password_hash is empty
    """

    vet = await db.scalar(
        select(Vet).where(Vet.vlicense == payload.license)
    )

    if not vet:
        raise HTTPException(404, "Vet not found")

    if vet.password_hash:
        raise HTTPException(400, "Password already created for this license")

    # Hash & save password
    vet.password_hash = hash_password(payload.new_password)
    db.add(vet)
    await db.commit()
    await db.refresh(vet)

    return {
        "message": "Password created successfully",
        "vid": vet.vid,
        "redirect": "login"
    }


# ============================================================
# 3. LOGIN — USING LICENSE + PASSWORD
# ============================================================
@router.post("/login", response_model=Token)
async def vet_login(payload: VetLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Step 3:
    ✔ Vet logs in using license number + password
    ✔ Returns JWT token + vet info
    """

    vet = await db.scalar(
        select(Vet).where(Vet.vlicense == payload.license)
    )

    if not vet:
        raise HTTPException(status_code=401, detail="Invalid license number or password")

    if not vet.password_hash:
        raise HTTPException(status_code=400, detail="Password not set. Please create password first.")

    # Validate password
    if not verify_password(payload.password, vet.password_hash):
        raise HTTPException(status_code=401, detail="Invalid license number or password")

    user_id = str(vet.vid)
    user_name = vet.vname
    role = "vet"

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
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
