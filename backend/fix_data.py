import asyncio
from app.database import AsyncSessionLocal
from app.models.recipe import Recipe
from app.models.user import User
from sqlalchemy.future import select

async def fix():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).filter_by(role='admin'))
        admin = result.scalars().first()
        if not admin:
            print("No admin user found.")
            return
            
        result = await session.execute(select(Recipe).filter(Recipe.owner_id == None))
        recipes = result.scalars().all()
        
        for r in recipes:
            r.owner_id = admin.id
            
        await session.commit()
        print(f"Fixed {len(recipes)} recipes by assigning them to admin {admin.username}")

if __name__ == "__main__":
    asyncio.run(fix())
