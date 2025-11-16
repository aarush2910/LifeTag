from pydantic import BaseModel, EmailStr, field_validator

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
