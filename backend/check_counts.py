import asyncio
from app.database import engine
from app.models.recipe import Recipe
from sqlalchemy import select, func

async def check():
    async with engine.connect() as conn:
        res = await conn.execute(select(func.count(Recipe.id)))
        print(f"Total count: {res.scalar()}")
        res = await conn.execute(select(Recipe.status, func.count(Recipe.id)).group_by(Recipe.status))
        for row in res:
            print(f"Status: {row[0]}, Count: {row[1]}")

if __name__ == "__main__":
    asyncio.run(check())
