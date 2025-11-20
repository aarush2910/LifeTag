from pydantic import BaseModel, EmailStr, field_validator
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
    """Compact vet card for farmer dashboard UI."""
    vid: UUID
    name: str
    specialization: Optional[str] = None
    clinic: Optional[str] = None
    phone: Optional[str] = None
    short_address: Optional[str] = None