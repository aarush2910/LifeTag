from motor.motor_asyncio import AsyncIOMotorClient
from app.config import MONGO_URL, DB_NAME

client = None
db = None

async def connect_db():
    global client, db
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    print("MongoDB connected.")

async def close_db():
    global client
    client.close()
    print("MongoDB disconnected.")
