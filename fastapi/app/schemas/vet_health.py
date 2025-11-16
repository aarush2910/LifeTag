from pydantic import BaseModel
from datetime import date
import uuid

class VetHealthRecordBase(BaseModel):
    inaph_id: str
    cattle_id: str
    diagnosis: str
    treatment: str
    medicines: str | None = None
    follow_up_date: date | None = None
    remarks: str | None = None

class VetHealthRecordCreate(VetHealthRecordBase):
    pass

class VetHealthRecordResponse(VetHealthRecordBase):
    health_record_id: uuid.UUID

    class Config:
        orm_mode = True
