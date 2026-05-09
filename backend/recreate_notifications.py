import asyncio
from app.database import engine, Base
from sqlalchemy import text
from app.models.notification import Notification

async def recreate_table():
    async with engine.begin() as conn:
        await conn.execute(text('DROP TABLE IF EXISTS notifications'))
        await conn.run_sync(Base.metadata.create_all)
    print("Notifications table recreated successfully.")

if __name__ == "__main__":
    asyncio.run(recreate_table())
