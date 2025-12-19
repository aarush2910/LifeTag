from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Request 
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.redis_client import cache_get, cache_set, cache_delete_pattern
from app.models.cattle import Cattle
from datetime import date, datetime
from app.core.config import settings
import os
import uuid

from app.schemas.cattle import AddCattleResponse

router = APIRouter(tags=["cattles"])


# --- Cattle cards for frontend ---
@router.get("/view-cattles")
async def cattle_cards(limit: int = 20, owner_id: str | None = None, db: AsyncSession = Depends(get_db)):
    """Return a list of cattle in a compact card-friendly shape for the frontend.

    - `limit`: maximum number of cards to return.
    - `owner_id`: optional owner UUID (string) to filter by owner.
    """
    # Build cache key
    cache_key = f"cattles:owner:{owner_id or 'all'}:limit:{limit}"
    
    # Try cache first
    cached = await cache_get(cache_key)
    if cached:
        print(f"✓ Cache HIT: {cache_key}")
        return cached
    
    print(f"✗ Cache MISS: {cache_key}")
    
    try:
        stmt = select(Cattle)
        if owner_id:
            try:
                owner_uuid = uuid.UUID(owner_id)
                stmt = stmt.filter(Cattle.owner_id == owner_uuid)
            except Exception:
                raise HTTPException(status_code=400, detail="owner_id must be a valid UUID string")

        stmt = stmt.limit(limit)
        result = await db.execute(stmt)
        rows = result.scalars().all()

        cards = []
        for c in rows:
            # display name: prefer explicit cattle_name, then local id, then inaph tag, otherwise CID short
            display_name = getattr(c, "cattle_name", None) or c.local_cattle_id or c.inaph_tag_id or (str(c.cid)[:8])

            dob_str = None
            try:
                if getattr(c, "dob", None):
                    dob_str = c.dob.strftime("%d %b %Y")
            except Exception:
                dob_str = None

            health = c.health_condition or "Unknown"

            features = []
            if getattr(c, "weight", None):
                features.append(f"Weight: {c.weight} kg")
            if getattr(c, "source", None):
                features.append(str(c.source))
            if c.breed:
                features.append(str(c.breed))

            # Use `cattle_name` as the single display name. Do not return a separate duplicate field.
            cards.append({
                "name": getattr(c, "cattle_name", None) or display_name,
                "breed": c.breed,
                "dob": dob_str,
                "health_condition": health,
                "key_features": ", ".join(features) if features else None,
                "photo_url": c.photo_url,
                "cattle_tag_id": c.inaph_tag_id,
            })

        # Cache for 3 minutes
        await cache_set(cache_key, cards, ttl=180)
        
        return cards
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



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
            cattle_name=(cattleName.strip() if cattleName else None),
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
        # Invalidate cattle cards cache
        try:
            await cache_delete_pattern("cattles:owner:*")
        except Exception:
            pass
        return {"message": "Cattle added successfully!", "cid": str(new_cattle.cid), "local_cattle_id": local_id_val, "cattle_name": new_cattle.cattle_name}
    except Exception as e:
        try:
            await db.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=400, detail=str(e))
    

