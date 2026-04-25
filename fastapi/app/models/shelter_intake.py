from sqlalchemy import String, Text, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
import uuid

from app.db.base import Base


class ShelterIntakeRequest(Base):
    __tablename__ = "shelter_intake_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )

    # The farmer submitting the request
    farmer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("farmers.fid", ondelete="CASCADE"), nullable=False
    )
    farmer = relationship("Farmer", backref="farmer_retirement_requests")

    # The cattle being retired/deceased
    cattle_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cattles.cid", ondelete="CASCADE"), nullable=False
    )
    cattle = relationship("Cattle", backref="cattle_intake_requests")

    # Retirement or Death
    reason: Mapped[str] = mapped_column(String(50), nullable=False)  # 'Retirement' | 'Death'
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Status lifecycle: Pending → Approved / Rejected
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Pending")

    # Optional: shelter this is directed to (shelter can self-assign via approval)
    shelter_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("shelters.sid", ondelete="SET NULL"), nullable=True
    )
    shelter = relationship("Shelter", backref="shelter_intake_requests")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())
