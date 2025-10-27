import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine
from app.db.base import Base
from app.api.v1 import auth, complaints, vet, shelter
from starlette.staticfiles import StaticFiles

app = FastAPI(title="LifeTag API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth")
app.include_router(vet.router, prefix="/api/auth")
app.include_router(shelter.router, prefix="/api/auth")
app.include_router(complaints.router, prefix="/api/complaints")

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

@app.on_event("startup")
async def startup_event():
    os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(STATIC_DIR, exist_ok=True)
    os.makedirs(STATIC_DIR / "images", exist_ok=True)
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("Database tables created successfully or already exist.")
    except Exception as e:
        print(f"Database startup failed: {e}")
