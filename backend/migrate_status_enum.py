import asyncio
from app.database import engine
from sqlalchemy import text

async def migrate():
    async with engine.connect() as conn:
        # Check current data to ensure they match enum values
        res = await conn.execute(text("SELECT DISTINCT status FROM recipes"))
        current_statuses = [r[0] for r in res.all()]
        print(f"Current statuses in DB: {current_statuses}")
        
        # Alter column to use the enum type
        # We need to use 'USING status::recipestatus' to cast the existing strings
        try:
            await conn.execute(text("ALTER TABLE recipes ALTER COLUMN status TYPE recipestatus USING status::recipestatus"))
            await conn.commit()
            print("Successfully converted status column to recipestatus Enum.")
        except Exception as e:
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
