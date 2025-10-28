from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

class CattleCreate(BaseModel):
    inaph_tag_id: Optional[str]
    inaph_farmer_id: Optional[str]
    local_cattle_id: Optional[str]
    species: str
    breed: str
    sex: str
    dob: datetime
    colour_markings: Optional[str] = None
    status: Optional[str] = "Active"
    last_known_location: Optional[str] = None

    # new optional fields
    weight: Optional[float] = None
    health_condition: Optional[str] = None
    purchased_date: Optional[datetime] = None
    source: Optional[str] = None
    photo_url: Optional[str] = None

class CattleRead(BaseModel):
    cid: UUID
    inaph_tag_id: Optional[str]
    inaph_farmer_id: Optional[str]
    local_cattle_id: Optional[str]
    species: str
    breed: str
    sex: str
    dob: datetime
    colour_markings: Optional[str] = None
    status: Optional[str] = "Active"
    last_known_location: Optional[str] = None
    owner_id: UUID

    # new optional fields
    weight: Optional[float] = None
    health_condition: Optional[str] = None
    purchased_date: Optional[datetime] = None
    source: Optional[str] = None
    photo_url: Optional[str] = None

    class Config:
        orm_mode = True


class AddCattleResponse(BaseModel):
    message: str
    cid: UUID
    local_cattle_id: str

    class Config:
        orm_mode = True
