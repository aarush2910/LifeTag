from pydantic import BaseModel
from uuid import UUID


# 1. License check request
class VetLicenseCheckRequest(BaseModel):
    license: str


# 2. Create password request
class VetCreatePasswordRequest(BaseModel):
    license: str
    new_password: str


# 3. Login request
class VetLoginRequest(BaseModel):
    license: str
    password: str


# 4. Login response
class VetLoginResponse(BaseModel):
    vid: UUID
    vname: str
    role: str = "vet"

    class Config:
        from_attributes = True
