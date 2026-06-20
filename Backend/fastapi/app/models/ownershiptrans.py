from sqlalchemy.orm import Mapped, mapped_column , relationship 
from sqlalchemy import String, Numeric, DateTime, Text, func , ForeignKey , Date , Boolean
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
import uuid
import enum
from app.db.base import Base


class Transferstatus(str, enum.Enum):
    Pending = "Pending"
    Accepted = "Accepted"
    Rejected = "Rejected"
    Cancelled = "Cancelled"
    Verified = "verified"
    Completed = "completed"



class OwnershiTransfer(Base):
    __tablename__ = "ownership_transfers"
    

    otid: Mapped[uuid.UUID] = mapped_column( primary_key=True , index=True , default=uuid.uuid4)

    cattle_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cattles.cid"), nullable=False, index=True)
    from_owner_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("farmers.fid"), nullable=True, index=True)
    to_owner_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("farmers.fid"), nullable=True, index=True)

    # current owner snapshot (columns)
    from_full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    from_contact_no: Mapped[str | None] = mapped_column(String(20), nullable=True)
    from_aadhar_no: Mapped[str | None] = mapped_column(String(30), nullable=True)
    from_inaph_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    from_address: Mapped[str | None] = mapped_column(String(300), nullable=True)

    # new owner snapshot
    to_full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    to_contact_no: Mapped[str | None] = mapped_column(String(20), nullable=True)
    to_aadhar_no: Mapped[str | None] = mapped_column(String(30), nullable=True)
    to_inaph_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    to_address: Mapped[str | None] = mapped_column(String(300), nullable=True)

    # cattle snapshot as JSONB (store tag, name, breed, type, gender, dob/age, other)
    cattle_snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False)

    transfer_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    other_details: Mapped[str | None] = mapped_column(Text, nullable=True)
    proposed_transfer_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    handover_location: Mapped[str | None] = mapped_column(String(300), nullable=True)

    status: Mapped[Transferstatus] = mapped_column(String(30), nullable=False, default=Transferstatus.Pending)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # relationships
    cattle = relationship("Cattle", foreign_keys=[cattle_id], backref="ownership_transfers")
    from_owner = relationship("Farmer", foreign_keys=[from_owner_id])
    to_owner = relationship("Farmer", foreign_keys=[to_owner_id])
