import os
from pathlib import Path
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine
from app.db.base import Base
from app.api.v1 import auth, complaints, vet, shelter, cattles, vet_event, vet_health ,vet_get_cattles
from app.api.v1.vet_request import router as vet_request_router
from starlette.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi import HTTPException



app = FastAPI(title="LifeTag API")


# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers with correct prefixes and tags
app.include_router(auth.router, prefix="/api/auth",)
app.include_router(vet.router, prefix="/api/vet")
app.include_router(vet_request_router, prefix="/api/vet/appointments")
app.include_router(vet_get_cattles.router, prefix="/api/vet/appointments")
app.include_router(vet_health.router, prefix="/api/vet/health-record")
app.include_router(vet_event.router, prefix="/api/vet/vaccination-events")
app.include_router(shelter.router, prefix="/api/shelter")
app.include_router(complaints.router, prefix="/api/complaints")
app.include_router(cattles.router, prefix="/api/cattles")



# Static files configuration
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")



# Health check endpoints
@app.get("/", tags=["health"])
async def root():
    return {"message": "LifeTag API is running"}

@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok"}


# Serve favicon from static directory if present (prevents 404 noise in logs)
@app.get("/favicon.ico")
async def favicon():
    favicon_path = STATIC_DIR / "favicon.ico"
    if favicon_path.exists():
        return FileResponse(favicon_path)
    raise HTTPException(status_code=404, detail="favicon not found")


@app.on_event("startup")
async def startup_event():
    """Create necessary directories and database tables on startup."""
    try:
        # Create upload folder if it exists in settings
        if hasattr(settings, 'UPLOAD_FOLDER'):
            os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
        
        # Create static directories
        os.makedirs(STATIC_DIR, exist_ok=True)
        os.makedirs(STATIC_DIR / "images", exist_ok=True)
        
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✓ Database tables created successfully or already exist.")
    except asyncio.CancelledError:
            # Reloader or server requested cancellation — stop startup quietly
            # Returning prevents the CancelledError from bubbling into Starlette's
            # lifespan machinery which would log it as an ERROR during reload.
            return
    except Exception as e:
        print(f"✗ Startup failed: {e}")
        raise