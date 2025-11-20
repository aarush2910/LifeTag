from pydantic import BaseModel, EmailStr
from typing import Optional , List
from datetime import datetime
from uuid import UUID


class FarmerCreate(BaseModel):
    fname: str
    faadhar: str
    fphone: str
    femail: EmailStr
    faddress: str
    farmname: str
    farmtype: str
    password: str

class FarmerResponse(BaseModel):
    fid: UUID
    fname: str
    fphone: Optional[str] = None
    femail: Optional[str] = None
    faadhar: Optional[str] = None
    faddress: Optional[str] = None
    farmtype: Optional[str] = None
    inaph_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True



class LoginRequest(BaseModel):
    role: str
    identifier: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    user_name: str
    role: str
    message: str = "Login successful"


class InaphLoginRequest(BaseModel):
    inaph_id: str
    password: Optional[str] = None


class CreatePasswordRequest(BaseModel):
    inaph_id: str
    new_password: str


class InaphLoginResponse(BaseModel):
    message: str
    user_id: Optional[UUID] = None
    user_name: Optional[str] = None
    role: Optional[str] = "farmer"
    faadhar: Optional[str] = None  # Aadhaar added for dashboard redirect
    access_token: Optional[str] = None
    token_type: Optional[str] = None

    class Config:
        orm_mode = True


    class Config:
        orm_mode = True
