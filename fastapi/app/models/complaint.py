from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, DateTime, Float, Text, func
from datetime import datetime
import uuid

from app.db.base import Base


class CattleComplaint(Base):
    __tablename__ = "cattle_complaints"


    complaint_id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        index=True,
        default=uuid.uuid4
    )

    # Reporter Info
    reporter_name: Mapped[str] = mapped_column(String(50), nullable=False)
    reporter_phone: Mapped[str] = mapped_column(String(10), nullable=False) 
    reporter_email: Mapped[str] = mapped_column(String(100), nullable=True)
    reporter_location: Mapped[str] = mapped_column(String(200), nullable=False)

    # Cattle Details
    cattle_count: Mapped[int] = mapped_column(Integer, nullable=False)
    cattle_type: Mapped[str] = mapped_column(String(20), nullable=False)
    cattle_condition: Mapped[str] = mapped_column(String(30), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    photo_path: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Location Details
    spotted_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    exact_location: Mapped[str] = mapped_column(Text, nullable=False)
    gps_latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    gps_longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    nearest_landmark: Mapped[str | None] = mapped_column(String(100), nullable=True)

    
    complaint_status: Mapped[str] = mapped_column(String(20), default='Open')
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())
