from pydantic import BaseModel , ConfigDict
from typing import Optional
from datetime import date

class VetEventBase(BaseModel):
    cattle_id: str
    event_type: str
    event_name: str
    event_date: date
    next_due_date: Optional[date] = None
    remarks: Optional[str] = None

class VetEventCreate(VetEventBase):
    pass

class VetEventResponse(VetEventBase):
    id: str

    model_config = ConfigDict(from_attributes=True)
