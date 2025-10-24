from pydantic import BaseModel,EmailStr,StringConstraints
from typing import Optional,Annotated
from datetime import datetime

INDIAN_PHONE_REGEX = r"^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0])?[6789]\d{9}$"

class CattleComplaintCreate(BaseModel):
    reporter_name: str
    reporter_phone: str
    reporter_email: EmailStr
    reporter_location: str
    cattle_count: int
    cattle_type: str
    cattle_condition: str
    description: Optional[str] = None
    spotted_date: Optional[datetime] = None
    exact_location: str
    gps_latitude: Optional[float] = None
    gps_longitude: Optional[float] = None
    nearest_landmark: Optional[str] = None

class CattleComplaintRead(BaseModel):
    complaint_id: int
    reporter_name: str
    reporter_phone: Annotated[str, StringConstraints(pattern=INDIAN_PHONE_REGEX)]
    reporter_email: EmailStr
    cattle_count: int
    cattle_type: str
    cattle_condition: str
    exact_location: str
    spotted_date: datetime
    status: str
    created_at: datetime

    class Config:
        orm_mode = True
