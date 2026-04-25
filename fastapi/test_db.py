import asyncio
from app.api.v1.auth import get_farmer_info
from app.db.session import async_session_maker

async def test():
    async with async_session_maker() as db:
        try:
            print("Calling get_farmer_info...")
            res = await get_farmer_info("INAPH-F0049", db=db)
            print("Result:", res)
        except Exception as e:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    print("Testing DB...")
    asyncio.run(test())
