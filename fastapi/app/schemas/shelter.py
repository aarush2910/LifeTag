from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from typing import Optional, List, Any
from uuid import UUID
from datetime import datetime, date

from app.schemas.common import _normalize_phone


class ShelterCreate(BaseModel):
    sname: str
    semail: EmailStr
    sphone: str
    sregistration: str
    saddress: str
    scapacity: int
    password: str

    @field_validator('sphone', mode='before')
    @classmethod
    def validate_sphone(cls, v: str) -> str:
        return _normalize_phone(v)


class ShelterResponse(BaseModel):
    sid: UUID
    sname: str
    semail: str
    sphone: str
    sregistration: str
    saddress: str
    scapacity: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ShelterUpdate(BaseModel):
    sname: Optional[str] = None
    sphone: Optional[str] = None
    saddress: Optional[str] = None
    scapacity: Optional[int] = None


# ─── Public shelter listing item ───────────────────────────────────────────────
class ShelterListItem(BaseModel):
    sid: UUID
    sname: str
    saddress: str
    sphone: str
    scapacity: int

    model_config = ConfigDict(from_attributes=True)


# ─── Intake request schemas ─────────────────────────────────────────────────────
class IntakeRequestCreate(BaseModel):
    farmer_id: UUID
    cattle_id: UUID
    reason: str  # 'Retirement' or 'Death'
    notes: Optional[str] = None
    shelter_id: Optional[UUID] = None


class IntakeRequestResponse(BaseModel):
    id: UUID
    farmer_id: UUID
    cattle_id: UUID
    reason: str
    notes: Optional[str] = None
    status: str
    shelter_id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    # populated extras
    farmer_name: Optional[str] = None
    cattle_name: Optional[str] = None
    cattle_breed: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class IntakeStatusUpdate(BaseModel):
    status: str  # 'Approved' or 'Rejected'
    shelter_id: Optional[UUID] = None


# ─── Shelter dashboard stats ────────────────────────────────────────────────────
class ShelterStats(BaseModel):
    pending_intake_count: int
    total_animals: int
    tagged_count: int
    untagged_count: int
    pending_adoptions: int
    recent_activity: List[str]
    chart_data: List[Any]  # [{"month": "Jan", "intakes": 5, "adoptions": 2}]


# ─── Shelter cattle ─────────────────────────────────────────────────────────────
class ShelterCattleResponse(BaseModel):
    cid: UUID
    cattle_name: str
    breed: str
    colour_markings: Optional[str] = None
    inaph_tag_id: Optional[str] = None
    local_cattle_id: Optional[str] = None
    health_condition: Optional[str] = None
    species: str
    sex: str
    weight: Optional[float] = None
    dob: Optional[str] = None
    previous_owner: Optional[str] = None
    previous_owner_id: Optional[UUID] = None
    status: Optional[str] = None
    photo_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ─── Shelter health records ─────────────────────────────────────────────────────
class ShelterHealthRecordCreate(BaseModel):
    cattle_id: UUID
    vet_id: Optional[UUID] = None
    record_type: str   # Vaccination, Sick, Checkup, Deworming, Other
    description: str
    medicine: Optional[str] = None
    record_date: date


class ShelterHealthRecordResponse(BaseModel):
    id: UUID
    shelter_id: UUID
    cattle_id: UUID
    vet_id: Optional[UUID] = None
    record_type: str
    description: str
    medicine: Optional[str] = None
    record_date: date
    created_at: Optional[datetime] = None
    # Populated extras
    cattle_name: Optional[str] = None
    vet_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_with_extras(cls, record: Any) -> "ShelterHealthRecordResponse":
        obj = cls.model_validate(record)
        if hasattr(record, "cattle") and record.cattle:
            obj.cattle_name = record.cattle.cattle_name
        if hasattr(record, "vet") and record.vet:
            obj.vet_name = record.vet.vname
        return obj
