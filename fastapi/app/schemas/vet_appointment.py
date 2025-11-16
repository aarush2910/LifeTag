from pydantic import BaseModel
from typing import Optional
from datetime import date
from enum import Enum

# ---- ENUM (must match model enum) ----
class StatusEnum(str, Enum):
    Pending = "Pending"
    Approved = "Approved"
    Completed = "Completed"
    Cancelled = "Cancelled"

# ---- Base Schema ----
class AppointmentBase(BaseModel):
    farmer_name: str
    inaph_id: str
    cattle_tag_id: str
    cattle_breed: Optional[str] = None
    symptoms: str
    appointment_date: date
    time_slot: str
    status: Optional[StatusEnum] = StatusEnum.Pending
    remarks: Optional[str] = None

# ---- Create Schema ----
class AppointmentCreate(AppointmentBase):
    pass

# ---- Update Schema (for vet approvals etc.) ----
class AppointmentUpdate(BaseModel):
    status: Optional[StatusEnum] = None
    remarks: Optional[str] = None

# ---- Response Schema ----
class AppointmentResponse(AppointmentBase):
    appointment_code: str
    created_at: Optional[str]

    class Config:
        orm_mode = True