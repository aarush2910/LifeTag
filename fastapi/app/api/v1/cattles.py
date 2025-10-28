from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.cattle import Cattle
from datetime import date, datetime
from app.core.config import settings
import os
import uuid

from app.schemas.cattle import AddCattleResponse

router = APIRouter(tags=["cattles"])

#add cattle route
@router.post("/add-new-cattle", response_model=AddCattleResponse)
async def add_new_cattle(
    cattleName: str | None = Form(None),
    species: str = Form(...),
    breed: str = Form(...),
    sex: str = Form(...),
    dob: date = Form(...),
    weight: float | None = Form(None),
    colour: str | None = Form(None),
    healthCondition: str | None = Form(None),
    purchaseDate: date | None = Form(None),
    source: str | None = Form(None),
    photo: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
    request: Request = None,
):
    
    try:
        # save photo if provided
        photo_url = None
        if photo:
            os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
            dest = os.path.join(settings.UPLOAD_FOLDER, photo.filename)
            with open(dest, "wb") as buffer:
                buffer.write(await photo.read())
            photo_url = dest.replace("\\", "/")


        # generate server-side CID (UUID4)
        cid_val = uuid.uuid4()

        # owner_id resolution: frontend should include logged-in farmer fid in header
        # e.g., X-Owner-Id or X-User-Id. We do not accept ownerId from the form anymore.
        owner_uuid = None
        if request is not None:
            header_owner = request.headers.get("x-owner-id") or request.headers.get("x-user-id")
            if header_owner:
                try:
                    owner_uuid = uuid.UUID(header_owner)
                except Exception:
                    raise HTTPException(status_code=400, detail="x-owner-id header must be a valid UUID")

        if not owner_uuid:
            raise HTTPException(status_code=401, detail="Missing owner id header (provide X-Owner-Id after login)")

        # generate local_cattle_id in format LIFE-<8hex> if not provided
        local_id_val = f"LIFE-{uuid.uuid4().hex[:8]}"

        new_cattle = Cattle(
            cid=cid_val,
            species=species,
            breed=breed,
            sex=sex,
            dob=datetime.combine(dob, datetime.min.time()),
            weight=weight,
            colour_markings=colour,
            health_condition=healthCondition,
            purchased_date=(datetime.combine(purchaseDate, datetime.min.time()) if purchaseDate else None),
            source=source,
            photo_url=photo_url,
            owner_id=owner_uuid,
            local_cattle_id=local_id_val,
        )

        db.add(new_cattle)
        await db.commit()
        await db.refresh(new_cattle)

        return {"message": "Cattle added successfully!", "cid": str(new_cattle.cid), "local_cattle_id": local_id_val}
    except Exception as e:
        try:
            await db.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=400, detail=str(e))