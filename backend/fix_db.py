import asyncio
from app.database import engine
from sqlalchemy import text

async def main():
    async with engine.begin() as conn:
        try:
            await conn.execute(text('ALTER TABLE notifications ADD COLUMN recipe_id INTEGER REFERENCES recipes(id) ON DELETE SET NULL'))
            print("Successfully added recipe_id column to notifications")
        except Exception as e:
            print(f"Error (maybe already exists?): {e}")

if __name__ == "__main__":
    asyncio.run(main())
