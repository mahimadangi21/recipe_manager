import asyncio
from app.database import AsyncSessionLocal
from sqlalchemy import text

async def check_tables():
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public';"))
        tables = [row[0] for row in result.fetchall()]
        print("TABLES IN DB:", tables)

if __name__ == "__main__":
    asyncio.run(check_tables())
