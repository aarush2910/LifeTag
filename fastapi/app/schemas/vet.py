from pydantic import BaseModel, EmailStr, field_validator, model_validator, ConfigDict
from uuid import UUID
from typing import Optional
from app.schemas.common import _normalize_phone


class VetCreate(BaseModel):
    vname: str
    vemail: EmailStr
    vphone: str
    vlicense: str
    vclinic: str
    vaddress: str
    password: str

    @field_validator('vphone', mode='before')
    @classmethod
    def validate_vphone(cls, v: str) -> str:
        return _normalize_phone(v)

class VetCard(BaseModel):
    """Compact vet card for farmer dashboard UI and shelter dropdown."""
    vid: UUID
    name: str = ""
    specialization: Optional[str] = None
    clinic: Optional[str] = None
    phone: Optional[str] = None
    short_address: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def _map_vet_fields(cls, data: object):
        """Map Vet ORM field names (vname, vclinic, etc.) to schema names."""
        if hasattr(data, "vname"):
            return {
                "vid": getattr(data, "vid", None),
                "name": getattr(data, "vname", "") or "",
                "specialization": getattr(data, "specialization", None),
                "clinic": getattr(data, "vclinic", None),
                "phone": getattr(data, "vphone", None),
                "short_address": getattr(data, "vaddress", None),
            }
        return data