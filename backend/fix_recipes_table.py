import asyncio
from app.database import engine
from sqlalchemy import text

async def main():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE recipes ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'"))
            print("Successfully added status column to recipes")
        except Exception as e:
            print(f"Error adding status: {e}")
            
        try:
            await conn.execute(text("ALTER TABLE recipes ADD COLUMN IF NOT EXISTS submitted_by INTEGER REFERENCES users(id)"))
            print("Successfully added submitted_by column to recipes")
        except Exception as e:
            print(f"Error adding submitted_by: {e}")

if __name__ == "__main__":
    asyncio.run(main())
