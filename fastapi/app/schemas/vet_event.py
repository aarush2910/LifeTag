from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date
from uuid import UUID

class VetEventBase(BaseModel):
    # yaha ab cattle_id UUID hoga (cid)
    cattle_id: UUID
    event_type: str
    event_name: str
    event_date: date
    next_due_date: Optional[date] = None
    remarks: Optional[str] = None


class VetEventCreate(VetEventBase):
    pass


class VetEventResponse(VetEventBase):
    id: UUID

    model_config = ConfigDict(from_attributes=True)  # Pydantic v2 style
