from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.utils.file import allowed_file, save_upload_file
from app.schemas.complaint import CattleComplaintCreate, CattleComplaintRead
from app.models.complaint import CattleComplaint
from app.services.mailer import send_email
import asyncio
from datetime import datetime
import logging
import html

router = APIRouter(tags=["complaints"])

@router.post("/cattle", status_code=201)
async def create_cattle_complaint(
        reporter_name: str = Form(...),
        reporter_phone: str = Form(...),
        reporter_email: str | None = Form(None),
        reporter_location: str = Form(...),
        cattle_count: int = Form(...),
        cattle_type: str = Form(...),
        cattle_condition: str = Form(...),
        description: str | None = Form(None),
        spotted_date: str | None = Form(None),
        exact_location: str = Form(...),
        gps_latitude: float | None = Form(None),
        gps_longitude: float | None = Form(None),
        nearest_landmark: str | None = Form(None),
        photo: UploadFile | None = File(None),
        db: AsyncSession = Depends(get_db)
):
        # handle photo
        photo_path = None
        if photo is not None:
                if not allowed_file(photo.filename):
                        raise HTTPException(status_code=400, detail="Invalid file type")
                photo_path = await save_upload_file(photo)

        if spotted_date:
                try:
                    
                        spotted = datetime.fromisoformat(spotted_date.replace("Z", "+00:00"))
                except Exception:
                        raise HTTPException(status_code=400, detail="Invalid spotted_date format")
        else:
                spotted = datetime.utcnow()

        new = CattleComplaint(
                reporter_name=reporter_name,
                reporter_phone=reporter_phone,
                reporter_email=reporter_email,
                reporter_location=reporter_location,
                cattle_count=cattle_count,
                cattle_type=cattle_type,
                cattle_condition=cattle_condition,
                description=description,
                photo_path=photo_path,
                spotted_date=spotted,
                exact_location=exact_location,
                gps_latitude=gps_latitude,
                gps_longitude=gps_longitude,
                nearest_landmark=nearest_landmark
        )

        
        db.add(new)
        await db.flush()
        await db.commit()
        await db.refresh(new)

        # send email async (fire-and-forget). Use the created instance `new` and escape user input.
        try:
                if new.reporter_email:
                        # escape user-provided fields to avoid HTML injection in the email body
                        safe_name = html.escape(new.reporter_name or "Reporter")
                        safe_complaint_id = html.escape(str(new.complaint_id))
                        html_content = f"""
<!DOCTYPE html>
<html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f7fa; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="text-align: center;">
                <!-- embedded CID image served as inline attachment by the mailer -->
                <img src="cid:life_logo" alt="LifeTag Logo" width="60" />
                <h2 style="color: #2c7be5;">Complaint Registered Successfully</h2>
                <p style="color: #444;">LifeTag – Livestock Welfare & Monitoring System</p>
            </div>
            <hr style="margin: 20px 0;">

            <p>Dear <b>{safe_name}</b>,</p>

            <p>Thank you for reaching out to <b>LifeTag</b>. Your cattle-related complaint has been successfully registered in our system.</p>

            <p><b>Complaint Details:</b></p>
            <ul>
                <li><b>Complaint ID:</b> {safe_complaint_id}</li>
                <li><b>Status:</b> Open (Under Review)</li>
                <li><b>Category:</b> Livestock Complaint / Abandoned Animal Report</li>
            </ul>

            <p>Our verification team has been notified and will initiate the necessary actions in coordination with nearby shelters and authorities. You can track the progress of your complaint by logging into your LifeTag account or visiting the complaint tracking portal.</p>

            <p style="margin-top: 20px;">Track your complaint at:<br>
                <a href="https://lifetag.in/complaint-status/{safe_complaint_id}" 
                style="color: #2c7be5; text-decoration: none;">https://lifetag.in/complaint-status/{safe_complaint_id}</a>
            </p>

            <p>If any additional information is required, our team will contact you at your registered email or phone number.</p>

            <p style="margin-top: 30px;">Thank you for contributing to animal welfare.<br>
            <b>Team LifeTag</b><br>
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
                                "LifeTag – Cattle Complaint Registered Successfully",
                                new.reporter_email,
                                html_content,
                                True
                        ))

        except Exception:
                logging.exception("Failed to schedule/send complaint notification email")

        return {
                "message": "Cattle complaint registered successfully",
                "complaint_id": str(new.complaint_id),
                "status": "Open"
        }


@router.get("/cattle")
async def list_cattle_complaints(status: str | None = None, page: int = 1, per_page: int = 10, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select, func as sql_func
    query = select(CattleComplaint)
    if status:
        query = query.where(CattleComplaint.complaint_status == status)
    
    total_query = select(sql_func.count()).select_from(CattleComplaint)
    if status:
        total_query = total_query.where(CattleComplaint.complaint_status == status)
    total_result = await db.execute(total_query)
    total = total_result.scalar()
    
    query = query.order_by(CattleComplaint.created_at.desc()).offset((page-1)*per_page).limit(per_page)
    result = await db.execute(query)
    items = result.scalars().all()
    res = []
    for c in items:
        res.append({
            "complaint_id": str(c.complaint_id),
            "reporter_name": c.reporter_name,
            "reporter_phone": c.reporter_phone,
            "reporter_email": c.reporter_email,
            "cattle_count": c.cattle_count,
            "cattle_type": c.cattle_type,
            "cattle_condition": c.cattle_condition,
            "exact_location": c.exact_location,
            "spotted_date": c.spotted_date.isoformat(),
            "status": c.complaint_status,
            "created_at": c.created_at.isoformat(),
            "has_photo": bool(c.photo_path)
        })
    return {"complaints": res, "total": total, "page": page}

@router.get("/cattle/{complaint_id}")
async def get_cattle_complaint(complaint_id: str, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    import uuid
    try:
        complaint_uuid = uuid.UUID(complaint_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid complaint ID format")
    
    query = select(CattleComplaint).where(CattleComplaint.complaint_id == complaint_uuid)
    result = await db.execute(query)
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return {
        "complaint_id": str(c.complaint_id),
        "reporter_name": c.reporter_name,
        "reporter_phone": c.reporter_phone,
        "reporter_email": c.reporter_email,
        "reporter_location": c.reporter_location,
        "cattle_count": c.cattle_count,
        "cattle_type": c.cattle_type,
        "cattle_condition": c.cattle_condition,
        "description": c.description,
        "photo_path": c.photo_path,
        "spotted_date": c.spotted_date.isoformat(),
        "exact_location": c.exact_location,
        "gps_latitude": c.gps_latitude,
        "gps_longitude": c.gps_longitude,
        "nearest_landmark": c.nearest_landmark,
        "status": c.complaint_status,
        "created_at": c.created_at.isoformat(),
        "updated_at": c.updated_at.isoformat()
    }

@router.put("/cattle/{complaint_id}/status")
async def update_complaint_status(complaint_id: str, new_status: str, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    import uuid
    
    if new_status not in ['Open','In Progress','Resolved','Closed']:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    try:
        complaint_uuid = uuid.UUID(complaint_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid complaint ID format")
    
    query = select(CattleComplaint).where(CattleComplaint.complaint_id == complaint_uuid)
    result = await db.execute(query)
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")
    c.complaint_status = new_status
    c.updated_at = datetime.utcnow()
    await db.commit()
    return {"message":"Complaint status updated successfully","complaint_id": str(complaint_id),"new_status": new_status}
