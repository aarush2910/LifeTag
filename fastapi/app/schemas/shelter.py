from pydantic import BaseModel, EmailStr, field_validator

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
