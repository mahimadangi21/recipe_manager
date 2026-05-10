import asyncio
from app.database import AsyncSessionLocal
from app.models.recipe import Recipe
from sqlalchemy import update

async def approve_all():
    async with AsyncSessionLocal() as session:
        # Use execute with update statement
        await session.execute(
            update(Recipe).values(status="approved", is_public=True)
        )
        await session.commit()
        print("All recipes approved successfully.")

if __name__ == "__main__":
    asyncio.run(approve_all())
