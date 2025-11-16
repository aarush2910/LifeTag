from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass

from app.models import user 
from app.models import complaint  
# Ensure new models are imported so they are registered on Base.metadata
from app.models import cattle
