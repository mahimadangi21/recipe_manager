import asyncio
from app.database import engine
from sqlalchemy import text

async def main():
    async with engine.begin() as conn:
        res = await conn.execute(text('SELECT id FROM recipes WHERE id=1'))
        row = res.fetchone()
        print(f"Recipe 1 exists: {row is not None}")
        
        # Check meal_plans table schema
        res = await conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'meal_plans'"))
        columns = res.fetchall()
        print(f"meal_plans schema: {columns}")

if __name__ == "__main__":
    asyncio.run(main())
