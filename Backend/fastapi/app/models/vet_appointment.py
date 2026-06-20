from sqlalchemy import String, Date, Enum as SAEnum, Text, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import event
from datetime import datetime
import uuid
import enum

from app.db.base import Base  # use the shared Base so metadata is registered


class StatusEnum(str, enum.Enum):
    Pending = "Pending"
    Approved = "Approved"
    Completed = "Completed"
    Cancelled = "Cancelled"


class Appointment(Base):
    __tablename__ = "appointments"

    aid: Mapped[uuid.UUID] = mapped_column("aid", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    appointment_code: Mapped[str | None] = mapped_column(String(20), unique=True, index=True)
    symptoms: Mapped[str | None] = mapped_column(Text)
    appointment_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    time_slot: Mapped[str] = mapped_column(String(30), nullable=False)
    status: Mapped[StatusEnum] = mapped_column(SAEnum(StatusEnum), default=StatusEnum.Pending)
    remarks: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())

    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("farmers.fid"), nullable=False)
    farmer = relationship("Farmer", backref="appointments")

    cattle_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cattles.cid"), nullable=False)
    cattle = relationship("Cattle", backref="appointments")

    vet_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("vets.vid"), nullable=False)
    vet = relationship("Vet", backref="appointments")


@event.listens_for(Appointment, "after_insert")
def generate_appointment_code(mapper, connection, target):
    """Auto-assign appointment_code after record insertion"""
    if not target.appointment_code:
        # produce code like APT001 (pad using sequence of the integer part of UUID is not ideal;
        # here just use a simple uuid suffix or adapt to your incremental logic)
        apt_code = f"APT{str(target.aid).split('-')[0].upper()}"
        # update using the model's __table__ reference
        connection.execute(
            Appointment.__table__.update()
            .where(Appointment.__table__.c.aid == target.aid)
            .values(appointment_code=apt_code)
        )