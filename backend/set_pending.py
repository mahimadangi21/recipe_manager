import asyncio
from app.database import AsyncSessionLocal
from app.models.recipe import Recipe, RecipeStatus
from sqlalchemy import select, update

async def set_pending():
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(Recipe).limit(1))
        recipe = res.scalars().first()
        if recipe:
            print(f"Setting recipe {recipe.id} to pending...")
            await session.execute(update(Recipe).where(Recipe.id == recipe.id).values(status=RecipeStatus.pending))
            await session.commit()
            print("Done.")

if __name__ == "__main__":
    asyncio.run(set_pending())
