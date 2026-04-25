# Migration script - run from backend/fastapi/ using venv Python
import asyncio
import os

os.environ["SECRET_KEY"] = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
os.environ["ALGORITHM"] = "HS256"
os.environ["DB_USER"] = "aarush_dev"
os.environ["DB_PASSWORD"] = "<Nm_4dnjuB8>"
os.environ["DB_HOST"] = "ep-holy-scene-a1k1omc8-pooler.ap-southeast-1.aws.neon.tech"
os.environ["DB_PORT"] = "5432"
os.environ["DB_NAME"] = "neondb"
os.environ["DATABASE_URL"] = (
    "postgresql+asyncpg://aarush_dev:<Nm_4dnjuB8>"
    "@ep-holy-scene-a1k1omc8-pooler.ap-southeast-1.aws.neon.tech:5432/neondb?sslmode=require"
)
os.environ["MAIL_SERVER"] = "smtp.gmail.com"
os.environ["MAIL_PORT"] = "587"
os.environ["REDIS_URL"] = "rediss://default:AY2RAAIncDE0NzE1ZTRjZWI0MDA0MmVmYTRjMmUwNDE0NWM5MDU3YnAxMzYyNDE@loved-katydid-36241.upstash.io:6379"

from app.db.session import engine
from app.db.base import Base  # noqa: F401 — registers all models


async def migrate():
    print("Connecting to Neon DB...")
    async with engine.begin() as conn:
        print("Running create_all (checkfirst=True)...")
        await conn.run_sync(Base.metadata.create_all, checkfirst=True)
    await engine.dispose()
    print("Done! shelter_intake_requests table created (if it did not exist).")


if __name__ == "__main__":
    asyncio.run(migrate())
