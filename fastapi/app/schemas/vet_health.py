from pydantic import BaseModel , ConfigDict
from datetime import date
import uuid


class VetHealthRecordBase(BaseModel):
    diagnosis: str
    treatment: str
    medicines: str | None = None
    follow_up_date: date | None = None
    remarks: str | None = None
    cattle_id: str      # form me jo field hai


class VetHealthRecordCreate(VetHealthRecordBase):
    pass


class VetHealthRecordResponse(VetHealthRecordBase):
    health_record_id: uuid.UUID
    appointment_code: str   # backend fill karega
    inaph_id: str           # backend fill karega

    class Config:
        orm_mode = True
        # Pydantic v2 ho to:
        # from_attributes = True
