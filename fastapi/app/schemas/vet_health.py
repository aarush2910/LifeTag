from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
import uuid


class VetHealthRecordBase(BaseModel):
    diagnosis: str
    treatment: str
    medicines: str | None = None
    follow_up_date: date | None = None
    remarks: str | None = None
    cattle_id: str


class VetHealthRecordCreate(VetHealthRecordBase):
    pass


class VetHealthRecordResponse(VetHealthRecordBase):
    health_record_id: uuid.UUID
    appointment_code: str
    inaph_id: str
    created_at: datetime | None = None

    # Pydantic v2: enables reading from SQLAlchemy ORM objects
    model_config = ConfigDict(from_attributes=True)
