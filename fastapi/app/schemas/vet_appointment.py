from pydantic import BaseModel, ConfigDict, model_validator
from typing import Optional
from datetime import date
from enum import Enum
from typing import List
from uuid import UUID

# ---- ENUM (must match model enum) ----
class StatusEnum(str, Enum):
    Pending = "Pending"
    Approved = "Approved"
    Completed = "Completed"
    Cancelled = "Cancelled"

# ---- Response Base Schema ----
class AppointmentBase(BaseModel):
    aid: Optional[UUID] = None
    appointment_id: Optional[UUID] = None
    id: Optional[UUID] = None
    farmer_name: Optional[str] = None
    inaph_id: Optional[str] = None
    cattle_name: Optional[str] = None
    cattle_tag_id: Optional[str] = None
    cattle_breed: Optional[str] = None
    symptoms: str
    appointment_date: date
    time_slot: Optional[str] = None
    status: Optional[StatusEnum] = StatusEnum.Pending
    remarks: Optional[str] = None

    # Provide explicit tag fields so frontend can display both identifiers
    inaph_tag_id: Optional[str] = None
    local_cattle_id: Optional[str] = None
    cattle_cid_short: Optional[str] = None

# ---- Create Schema (what farmer sends) ----
class AppointmentCreate(BaseModel):
    # optional: front-end may send inaph_id to help resolve farmer if owner_id header missing
    inaph_id: Optional[str] = None
    # Farmer chooses cattle by name in UI; frontend must send `cattle_id` (UUID) or `cattle_tag_id`.
    # `AppointmentCreateWithIds` extends this with explicit UUIDs.
    symptoms: str
    appointment_date: date
    time_slot: str
    remarks: Optional[str] = None

# ---- Update Schema (for vet approvals etc.) ----
class AppointmentUpdate(BaseModel):
    status: Optional[StatusEnum] = None
    remarks: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_status_aliases(cls, data):
        if not isinstance(data, dict):
            return data

        raw_status = data.get("status")
        if isinstance(raw_status, str):
            normalized = raw_status.strip().lower()
            status_map = {
                "accepted": StatusEnum.Approved.value,
                "approve": StatusEnum.Approved.value,
                "approved": StatusEnum.Approved.value,
                "pending": StatusEnum.Pending.value,
                "completed": StatusEnum.Completed.value,
                "cancelled": StatusEnum.Cancelled.value,
                "canceled": StatusEnum.Cancelled.value,
            }
            if normalized in status_map:
                data["status"] = status_map[normalized]

        return data

# ---- Response Schema ----
class AppointmentResponse(AppointmentBase):
    appointment_code: str
    created_at: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class PaginatedAppointments(BaseModel):
    total: int
    skip: int
    limit: int
    results: List[AppointmentResponse]


class AppointmentCreateWithIds(AppointmentCreate):
    owner_id: Optional[UUID] = None
    cattle_id: Optional[UUID] = None
    vet_id: Optional[UUID] = None
    cattle_tag_id: Optional[str] = None

    @model_validator(mode="after")
    def ensure_cattle_identifier(cls, values):
        # Require at least one of `cattle_id` (UUID) or `cattle_tag_id` (local/inaph tag)
        cid = values.cattle_id if hasattr(values, 'cattle_id') else None
        ctag = values.cattle_tag_id if hasattr(values, 'cattle_tag_id') else None
        if not cid and not ctag:
            raise ValueError("Either `cattle_id` or `cattle_tag_id` must be provided in the request body.")
        return values


class VetAvailabilityUpdate(BaseModel):
    available_date: date
    work_start: str
    work_end: str
    slot_minutes: int


class VetAvailabilityResponse(BaseModel):
    vet_id: UUID
    available_date: date
    work_start: str
    work_end: str
    slot_minutes: int


class AvailableSlotsResponse(BaseModel):
    vet_id: UUID
    appointment_date: date
    work_start: str
    work_end: str
    slot_minutes: int
    slots: List[str]