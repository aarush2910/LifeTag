from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional


def _normalize_aadhaar(value: str) -> str:
    if not isinstance(value, str):
        raise ValueError("Invalid Aadhaar format")
    digits = ''.join(ch for ch in value if ch.isdigit())
    if len(digits) != 12:
        raise ValueError("Aadhaar must have 12 digits")
    if digits[0] in ('0', '1'):
        raise ValueError("Aadhaar must start with 2-9")
    return f"{digits[0:4]} {digits[4:8]} {digits[8:12]}"


def _normalize_phone(value: str) -> str:
    if not isinstance(value, str):
        raise ValueError("Invalid phone format")
    digits = ''.join(ch for ch in value if ch.isdigit())
    if len(digits) > 10:
        digits = digits[-10:]
    if len(digits) != 10:
        raise ValueError("Phone must be 10 digits")
    if digits[0] not in ('6', '7', '8', '9'):
        raise ValueError("Phone must start with 6, 7, 8, or 9")
    return digits


class FarmerCreate(BaseModel):
    fname: str
    faadhar: str
    fphone: str
    femail: EmailStr
    faddress: str
    farmname: str
    farmtype: str
    password: str

    @field_validator('faadhar', mode='before')
    @classmethod
    def validate_faadhar(cls, v: str) -> str:
        return _normalize_aadhaar(v)

    @field_validator('fphone', mode='before')
    @classmethod
    def validate_fphone(cls, v: str) -> str:
        return _normalize_phone(v)


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


class LoginRequest(BaseModel):
    role: str
    identifier: str
    password: str


class DeleteUserRequest(BaseModel):
    role: str
    user_id: str
