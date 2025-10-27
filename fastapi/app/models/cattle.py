from sqlalchemy.orm import Mapped, mapped_column , relationship
from sqlalchemy import String, Integer, DateTime, func, Index , ForeignKey , Float
from datetime import datetime
import uuid 

from app.db.base import Base


class Cattle(Base):
    __tablename__ = "cattles"

    cid: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())

    #  INAPH / Lifetag fields
    inaph_tag_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=True)
    inaph_farmer_id: Mapped[str] = mapped_column(String(30), nullable=True)
    local_cattle_id: Mapped[str] = mapped_column(String(30), unique=True, nullable=True)

    species: Mapped[str] = mapped_column(String(30), nullable=False)
    breed: Mapped[str] = mapped_column(String(50), nullable=False)
    sex: Mapped[str] = mapped_column(String(10), nullable=False)
    dob: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    colour_markings: Mapped[str] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="Active")
    last_known_location: Mapped[str] = mapped_column(String(200), nullable=True)

    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("farmers.fid"), nullable=False)
    farmer = relationship("Farmer", backref="cattles")


