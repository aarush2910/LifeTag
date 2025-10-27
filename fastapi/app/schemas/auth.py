from pydantic import BaseModel, EmailStr, field_validator, Field, ConfigDict
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


class LoginRequest(BaseModel):
    role: str
    identifier: str
    password: str
