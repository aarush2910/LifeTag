from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, DateTime, func, Index
from datetime import datetime
import uuid 

from app.db.base import Base


# --- 2. Farmer Model ---
class Farmer(Base):
    __tablename__ = "farmers"

    fid: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        index=True,
        default=uuid.uuid4
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())
    registration_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    fname: Mapped[str] = mapped_column(String(35), nullable=False)
    faadhar: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    fphone: Mapped[str] = mapped_column(String(13), nullable=False)
    femail: Mapped[str] = mapped_column(String(100), nullable=False, unique=True) 
    faddress: Mapped[str] = mapped_column(String(100), nullable=False)
    district: Mapped[str] = mapped_column(String(100), nullable=True)
    state: Mapped[str] = mapped_column(String(100), nullable=True)
    farmname: Mapped[str] = mapped_column(String(50), nullable=False)
    farmtype: Mapped[str] = mapped_column(String(10), nullable=False)
    inaph_id: Mapped[str] = mapped_column(String(30), unique=True, nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=True)

# --- 3. Vet Model ---
class Vet(Base):
    __tablename__ = "vets"

    vid: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        index=True,
        default=uuid.uuid4
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())

    vname: Mapped[str] = mapped_column(String(35), nullable=False)
    vemail: Mapped[str] = mapped_column(String(100), nullable=False, unique=True) 
    vphone: Mapped[str] = mapped_column(String(13), nullable=False)
    vlicense: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    vclinic: Mapped[str] = mapped_column(String(100), nullable=False)
    vaddress: Mapped[str] = mapped_column(String(200), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

# --- 4. Shelter Model ---
class Shelter(Base):
    __tablename__ = "shelters"

    sid: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        index=True,
        default=uuid.uuid4
    )
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())

    sname: Mapped[str] = mapped_column(String(100), nullable=False)
    semail: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    sphone: Mapped[str] = mapped_column(String(13), nullable=False)
    sregistration: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    saddress: Mapped[str] = mapped_column(String(200), nullable=False)
    scapacity: Mapped[int] = mapped_column(Integer, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
