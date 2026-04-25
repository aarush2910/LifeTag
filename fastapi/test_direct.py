import asyncio
import os
import sys

# Configure mock paths directly without import errors
sys.path.append(os.path.dirname(__file__))

# Run tests
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, or_

# Mock out redis so it doesnt throw errors
import app.core.redis_client as redis_client
redis_client.cache_get = lambda k: asyncio.sleep(0)
redis_client.cache_set = lambda k, v, ttl: asyncio.sleep(0)

from app.api.v1.auth import get_farmer_info
from app.db.session import async_session_maker

async def main():
    try:
        async with async_session_maker() as session:
            print("Querying the info...")
            res = await get_farmer_info("INAPH-F0049", db=session)
            print("Result:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(main())
