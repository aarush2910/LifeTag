from sqlalchemy import String, Date, Text, ForeignKey,DateTime,func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.db.base import Base


class VetHealthRecord(Base):
    __tablename__ = "vet_health_records"

    health_record_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )

    # Correct foreign key -> appointment_code (since your Appointment model has that)
    appointment_code: Mapped[str] = mapped_column(
        String(20), ForeignKey("appointments.appointment_code", ondelete="CASCADE"), nullable=False
    )

    cattle_id: Mapped[str] = mapped_column(String(50), nullable=False)
    diagnosis: Mapped[str] = mapped_column(Text, nullable=False)
    treatment: Mapped[str] = mapped_column(Text, nullable=False)
    medicines: Mapped[str | None] = mapped_column(Text, nullable=True)
    follow_up_date: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column( DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())
    

    # Relationship to Appointment table (optional)
    appointment = relationship("Appointment", backref="health_records")
