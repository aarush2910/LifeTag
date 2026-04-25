from sqlalchemy import String, Integer, ForeignKey, Date, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date
import uuid

from app.db.base import Base


class VetAvailability(Base):
    __tablename__ = "vet_availability"
    __table_args__ = (
        UniqueConstraint("vet_id", "available_date", name="uq_vet_availability_vet_day"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    vet_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vets.vid"), nullable=False, index=True
    )
    available_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    work_start: Mapped[str] = mapped_column(String(5), nullable=False, default="09:00")
    work_end: Mapped[str] = mapped_column(String(5), nullable=False, default="17:00")
    slot_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=30)

    vet = relationship("Vet", backref="availability")
