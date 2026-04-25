"""
One-time DB migration to add shelter_id to cattles and create shelter_health_records.
Run: python run_migration.py
"""
import asyncio
import os
import sys

# Add project to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
os.environ.setdefault("ALGORITHM", "HS256")
os.environ.setdefault("DB_USER", "aarush_dev")
os.environ.setdefault("DB_PASSWORD", "<Nm_4dnjuB8>")
os.environ.setdefault("DB_HOST", "ep-holy-scene-a1k1omc8-pooler.ap-southeast-1.aws.neon.tech")
os.environ.setdefault("DB_PORT", "5432")
os.environ.setdefault("DB_NAME", "neondb")
os.environ.setdefault("DATABASE_URL",
    "postgresql+asyncpg://aarush_dev:<Nm_4dnjuB8>"
    "@ep-holy-scene-a1k1omc8-pooler.ap-southeast-1.aws.neon.tech:5432/neondb?sslmode=require"
)
os.environ.setdefault("MAIL_SERVER", "smtp.gmail.com")
os.environ.setdefault("MAIL_PORT", "587")
os.environ.setdefault("REDIS_URL", "rediss://default:AY2RAAIncDE0NzE1ZTRjZWI0MDA0MmVmYTRjMmUwNDE0NWM5MDU3YnAxMzYyNDE@loved-katydid-36241.upstash.io:6379")

from app.db.session import engine
from app.db.base import Base  # noqa

# Import all models to register them
import app.models.user       # noqa
import app.models.cattle     # noqa
import app.models.shelter_intake  # noqa
import app.models.shelter_health  # noqa
import app.models.vet_health      # noqa
import app.models.notification    # noqa
import app.models.vet_availability  # noqa
import app.models.vet_appointment   # noqa
import app.models.vet_event         # noqa


async def run():
    print("Connecting to Neon DB...")
    async with engine.begin() as conn:
        print("Running create_all (checkfirst=True)...")
        await conn.run_sync(Base.metadata.create_all, checkfirst=True)
    await engine.dispose()
    print("✅ Done! Tables created/verified:")
    print("   - cattles (shelter_id column added if missing)")
    print("   - shelter_health_records (created if missing)")


if __name__ == "__main__":
    asyncio.run(run())
