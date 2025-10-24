from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.auth import (
    FarmerCreate,
    VetCreate,
    ShelterCreate,
    LoginRequest,
    _normalize_aadhaar,
    _normalize_phone,
    DeleteUserRequest,
)
from app.models.user import Farmer, Vet, Shelter
from app.core.security import hash_password, verify_password
from app.services.mailer import send_email
from app.core.config import settings
import asyncio

router = APIRouter(tags=["auth"])

router = APIRouter()

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
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/Cow_icon.png" alt="LifeTag Logo" width="60" />
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


@router.post("/signup/vet", status_code=201)
async def signup_vet(payload: VetCreate, db: AsyncSession = Depends(get_db)):
    if await db.scalar(select(Vet).where(Vet.vemail == payload.vemail)):
        raise HTTPException(400, "Email already registered")
    if await db.scalar(select(Vet).where(Vet.vlicense == payload.vlicense)):
        raise HTTPException(400, "License number already registered")

    new_user = Vet(**payload.model_dump(exclude={"password"}))
    new_user.password_hash = hash_password(payload.password)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    asyncio.create_task(send_email(
        "Welcome to LifeTag - Veterinarian Account",
        new_user.vemail,
        f"Hello Dr. {new_user.vname}, your vet account has been created."
    ))
    return {"message": "Vet signup successful", "user_id": new_user.vid}


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

    asyncio.create_task(send_email(
        "Welcome to LifeTag - Shelter Account",
        new_user.semail,
        f"Hello {new_user.sname}, your shelter account has been created."
    ))
    return {"message": "Shelter signup successful", "user_id": new_user.sid}


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


@router.delete("/delete-user", status_code=200)
async def delete_user(payload: DeleteUserRequest, db: AsyncSession = Depends(get_db)):
    """Delete a user by role and id.

    Accepts a JSON body like {"role": "farmer", "user_id": "..."} so the
    Swagger UI renders a single JSON object and avoids JSON-decode confusion.
    """
    role = payload.role.lower()
    user_id = payload.user_id

    from sqlalchemy import delete as sa_delete
    import uuid

    # convert user_id to UUID where models use UUID primary keys
    try:
        uid = uuid.UUID(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user_id format; expected UUID string")

    if role == "farmer":
        stmt = sa_delete(Farmer).where(Farmer.fid == uid)
    elif role == "vet":
        stmt = sa_delete(Vet).where(Vet.vid == uid)
    elif role == "shelter":
        stmt = sa_delete(Shelter).where(Shelter.sid == uid)
    else:
        raise HTTPException(status_code=400, detail="Unknown role")

    result = await db.execute(stmt)
    # result.rowcount may be None depending on DB/driver; check using SELECT
    await db.commit()

    # verify deletion by attempting to fetch
    if role == "farmer":
        found = await db.scalar(select(Farmer).where(Farmer.fid == uid))
    elif role == "vet":
        found = await db.scalar(select(Vet).where(Vet.vid == uid))
    else:
        found = await db.scalar(select(Shelter).where(Shelter.sid == uid))

    if found:
        raise HTTPException(status_code=500, detail="Deletion attempted but record still exists")

    return {"message": f"{role.capitalize()} deleted successfully", "user_id": user_id}

