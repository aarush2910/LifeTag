import os
import time
from pathlib import Path
import asyncio
from sqlalchemy import text as sa_text
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.db.session import engine
from app.db.base import Base
from app.core.redis_client import get_redis, close_redis
from app.api.v1 import auth, complaints, vet, shelter, cattles, vet_event, vet_health ,vet_get_cattles, notifications
from app.api.v1.vet_request import router as vet_request_router
from app.api.v1.farmer_retirement import router as farmer_retirement_router
from app.services.notification_service import run_notification_ttl_cleanup_loop
# Ensure ShelterIntakeRequest table is registered with SQLAlchemy metadata
import app.models.shelter_intake  # noqa
import app.models.shelter_health   # noqa  (ShelterHealthRecord)
from starlette.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi import HTTPException



app = FastAPI(title="LifeTag API")


notification_ttl_stop_event: asyncio.Event | None = None
notification_ttl_task: asyncio.Task | None = None


# ─── Global exception handler: always attach CORS headers to error responses ──
# FastAPI's default 500 handler bypasses CORSMiddleware, so the browser sees
# "No Access-Control-Allow-Origin" on any unhandled server error.
@app.exception_handler(Exception)
async def cors_aware_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin", "*")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)},
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        },
    )


@app.exception_handler(HTTPException)
async def cors_aware_http_exception_handler(request: Request, exc: HTTPException):
    origin = request.headers.get("origin", "*")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        },
    )


# Simple timing middleware to expose backend processing time in the response header
@app.middleware("http")
async def add_process_time_header(request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    response.headers["X-Process-Time-ms"] = f"{duration_ms:.2f}"
    return response


# Chrome 94+ Private Network Access (PNA) policy:
# When localhost/127.0.0.1 makes a fetch to another local port, Chrome sends
# "Access-Control-Request-Private-Network: true" in the preflight. The server
# must respond with "Access-Control-Allow-Private-Network: true" or the browser
# blocks the request with a generic "Failed to fetch" error.
# NOTE: This middleware is registered BEFORE CORSMiddleware so that CORSMiddleware
# (registered last) runs outermost and handles all preflight OPTIONS first.
from starlette.responses import Response as _StarletteResponse

@app.middleware("http")
async def private_network_access_middleware(request, call_next):
    if (
        request.method == "OPTIONS"
        and request.headers.get("access-control-request-private-network") == "true"
    ):
        origin = request.headers.get("origin", "*")
        return _StarletteResponse(
            status_code=204,
            headers={
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Private-Network": "true",
                "Vary": "Origin",
            },
        )
    response = await call_next(request)
    response.headers["Access-Control-Allow-Private-Network"] = "true"
    return response


# ─── CORS Middleware ──────────────────────────────────────────────────────────
# IMPORTANT: CORSMiddleware must be registered LAST so Starlette places it as
# the outermost layer. This ensures ALL preflight OPTIONS requests are handled
# (and Access-Control-Allow-Origin is added) before any inner middleware or
# exception handler can return a response without CORS headers.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
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
app.include_router(notifications.router, prefix="/api/notifications")
app.include_router(farmer_retirement_router, prefix="/api/farmer")



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
        
        try:
            async with engine.begin() as conn:
                # Always run create_all with checkfirst=True — safe for new tables
                await conn.run_sync(Base.metadata.create_all, checkfirst=True)
            print("✓ Database tables created successfully or already exist.")
        except Exception as db_err:
            print(f"⚠ DB create_all skipped (run migration manually if needed): {db_err}")

        # ── Column & constraint migrations (each runs independently) ───────────
        # create_all only creates missing TABLES, not missing COLUMNS or CONSTRAINTS.
        # Run each statement separately — if one fails (permission denied), others still run.
        column_migrations = [
            # cattles table — extra fields added after initial schema
            ("cattles.weight",          "ALTER TABLE cattles ADD COLUMN IF NOT EXISTS weight FLOAT"),
            ("cattles.health_condition","ALTER TABLE cattles ADD COLUMN IF NOT EXISTS health_condition VARCHAR(100)"),
            ("cattles.purchased_date",  "ALTER TABLE cattles ADD COLUMN IF NOT EXISTS purchased_date TIMESTAMP"),
            ("cattles.source",          "ALTER TABLE cattles ADD COLUMN IF NOT EXISTS source VARCHAR(100)"),
            ("cattles.photo_url",       "ALTER TABLE cattles ADD COLUMN IF NOT EXISTS photo_url VARCHAR(255)"),
            # cattles.shelter_id — links a cattle to a shelter after retirement approval
            ("cattles.shelter_id",      "ALTER TABLE cattles ADD COLUMN IF NOT EXISTS shelter_id UUID REFERENCES shelters(sid) ON DELETE SET NULL"),
            # shelter_intake_requests — updated_at column
            ("shelter_intake.updated_at", "ALTER TABLE shelter_intake_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()"),
            # vet_availability — drop old UNIQUE(vet_id) and add UNIQUE(vet_id, available_date)
            ("drop vet_id_key",         "ALTER TABLE vet_availability DROP CONSTRAINT IF EXISTS vet_availability_vet_id_key"),
            ("add uq_vet_day",          "ALTER TABLE vet_availability ADD CONSTRAINT uq_vet_availability_vet_day UNIQUE (vet_id, available_date)"),
            # cattle_complaints — widen columns that were created too narrow in the original schema
            ("cattle_complaints.reporter_phone type",   "ALTER TABLE cattle_complaints ALTER COLUMN reporter_phone TYPE VARCHAR(15)"),
            ("cattle_complaints.complaint_status type", "ALTER TABLE cattle_complaints ALTER COLUMN complaint_status TYPE VARCHAR(20)"),
        ]
        for label, sql in column_migrations:
            try:
                async with engine.begin() as conn:
                    await conn.execute(sa_text(sql))
                print(f"  ✓ migration: {label}")
            except Exception as m_err:
                err_str = str(m_err)
                # Suppress errors that mean the migration is already applied:
                # - "already exists" / "does not exist" → idempotent re-run
                # - "InsufficientPrivilegeError" → column exists, DB user can't ALTER (harmless)
                if "already exists" in err_str or "does not exist" in err_str:
                    print(f"  · migration skipped (already applied): {label}")
                elif "InsufficientPrivilegeError" in err_str or "insufficient_privilege" in err_str.lower():
                    print(f"  ⚠ migration skipped (DB user lacks ALTER privilege — run manually as owner): {label}")
                else:
                    print(f"  ⚠ migration failed ({label}): {err_str[:120]}")

        print("✓ Migrations complete.")



        # Initialize Redis connection
        try:
            redis_client = await get_redis()
            if redis_client:
                print("✓ Redis connection established successfully")
            else:
                print("⚠ Redis unavailable - continuing without cache")
        except Exception as redis_err:
            print(f"⚠ Redis connection failed (continuing without cache): {redis_err}")

        global notification_ttl_stop_event, notification_ttl_task
        notification_ttl_stop_event = asyncio.Event()
        notification_ttl_task = asyncio.create_task(
            run_notification_ttl_cleanup_loop(notification_ttl_stop_event, interval_seconds=3600)
        )
            
    except asyncio.CancelledError:
            # Reloader or server requested cancellation — stop startup quietly
            # Returning prevents the CancelledError from bubbling into Starlette's
            # lifespan machinery which would log it as an ERROR during reload.
            return
    except Exception as e:
        print(f"✗ Startup failed: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    try:
        global notification_ttl_stop_event, notification_ttl_task
        if notification_ttl_stop_event:
            notification_ttl_stop_event.set()
        if notification_ttl_task:
            notification_ttl_task.cancel()
            try:
                await notification_ttl_task
            except asyncio.CancelledError:
                pass

        await close_redis()
    except Exception as e:
        print(f"⚠ Error during shutdown: {e}")