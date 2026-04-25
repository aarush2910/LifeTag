import sys, os, asyncio, traceback
sys.path.insert(0, '.')

from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def main():
    try:
        async with AsyncSessionLocal() as session:
            r = await session.execute(text("SELECT inaph_id, fname FROM farmers WHERE inaph_id = 'INAPH-F0049' LIMIT 1"))
            row = r.fetchone()
            print('Row:', row)
    except Exception:
        traceback.print_exc()

asyncio.run(main())
