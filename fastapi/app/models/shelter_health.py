"""
ShelterHealthRecord model — health records added by shelter staff
for animals under their care (not tied to a vet appointment).
"""
from sqlalchemy import String, Text, Date, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, date
import uuid

from app.db.base import Base


class ShelterHealthRecord(Base):
    __tablename__ = "shelter_health_records"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )

    shelter_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("shelters.sid", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    cattle_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cattles.cid", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Optional: vet who treated the animal
    vet_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vets.vid", ondelete="SET NULL"),
        nullable=True,
    )

    record_type: Mapped[str] = mapped_column(String(50), nullable=False)  # Vaccination, Sick, Checkup, etc.
    description: Mapped[str] = mapped_column(Text, nullable=False)
    medicine: Mapped[str | None] = mapped_column(String(200), nullable=True)
    record_date: Mapped[date] = mapped_column(Date, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    # Relationships
    shelter = relationship("Shelter", backref="health_records")
    cattle = relationship("Cattle", backref="shelter_health_records")
    vet = relationship("Vet", backref="shelter_health_records")
