from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import Vet
from app.schemas.vet_auth import (
    VetLicenseCheckRequest,
    VetCreatePasswordRequest,
    VetLoginRequest,
    VetLoginResponse
)

from app.core.security import hash_password, verify_password


router = APIRouter(tags=["vet-auth"])

# ============================================================
# 1. CHECK LICENSE — FIRST STEP
# ============================================================
@router.post("/vet/check-license")
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
@router.post("/vet/create-password")
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
@router.post("/vet/login", response_model=VetLoginResponse)
async def vet_login(payload: VetLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Step 3:
    ✔ Vet logs in using license number + password
    """

    vet = await db.scalar(
        select(Vet).where(Vet.vlicense == payload.license)
    )

    if not vet:
        raise HTTPException(401, "Invalid license number or password")

    if not vet.password_hash:
        raise HTTPException(400, "Password not set. Please create password first.")

    # Validate password
    if not verify_password(payload.password, vet.password_hash):
        raise HTTPException(401, "Invalid license number or password")

    return VetLoginResponse(
        vid=vet.vid,
        vname=vet.vname,
        role="vet"
    )
