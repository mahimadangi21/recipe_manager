import asyncio
from app.database import engine
from sqlalchemy import text

async def migrate():
    async with engine.connect() as conn:
        print("Starting migration...")
        try:
            # 1. Drop the default value
            await conn.execute(text("ALTER TABLE recipes ALTER COLUMN status DROP DEFAULT"))
            
            # 2. Alter the column type
            await conn.execute(text("ALTER TABLE recipes ALTER COLUMN status TYPE recipestatus USING status::recipestatus"))
            
            # 3. Set the new default value (cast to the enum type)
            await conn.execute(text("ALTER TABLE recipes ALTER COLUMN status SET DEFAULT 'pending'::recipestatus"))
            
            await conn.commit()
            print("Successfully migrated status column to recipestatus Enum.")
        except Exception as e:
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
