import asyncio
import uuid
from sqlalchemy.future import select
from app.models.recipe import Recipe, CategoryEnum, DifficultyEnum
from app.models.ingredient import Ingredient
from app.models.image import RecipeImage
from app.models.user import User
from app.database import AsyncSessionLocal

async def seed_test_recipes():
    async with AsyncSessionLocal() as session:
        # Get admin user
        result = await session.execute(select(User).filter_by(role="admin"))
        admin = result.scalars().first()
        if not admin:
            print("Admin user not found. Please run seed.py first.")
            return

        # Recipe 1: Paneer Butter Masala
        pbm = Recipe(
            title="Paneer Butter Masala",
            description="Creamy Indian curry",
            instructions="1. Cook tomato gravy\n2. Add paneer\n3. Simmer",
            servings=4,
            prep_time_minutes=15,
            cook_time_minutes=30,
            category=CategoryEnum.dinner,
            difficulty=DifficultyEnum.medium,
            is_public=True,
            owner_id=admin.id,
            share_token=str(uuid.uuid4())
        )
        pbm.ingredients.extend([
            Ingredient(name="Paneer", quantity=250, unit="g"),
            Ingredient(name="Tomato", quantity=3, unit="pcs"),
            Ingredient(name="Butter", quantity=50, unit="g")
        ])
        pbm.images.append(RecipeImage(
            url="https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=2000&auto=format&fit=crop",
            is_primary=True
        ))

        # Recipe 2: Veg Fried Rice
        vfr = Recipe(
            title="Veg Fried Rice",
            description="Quick vegetable rice",
            instructions="1. Cook rice\n2. Stir fry vegetables\n3. Mix and serve",
            servings=2,
            prep_time_minutes=10,
            cook_time_minutes=15,
            category=CategoryEnum.lunch,
            difficulty=DifficultyEnum.easy,
            is_public=True,
            owner_id=admin.id,
            share_token=str(uuid.uuid4())
        )
        vfr.ingredients.extend([
            Ingredient(name="Rice", quantity=1, unit="cup"),
            Ingredient(name="Carrot", quantity=1, unit="pcs"),
            Ingredient(name="Capsicum", quantity=1, unit="pcs")
        ])
        vfr.images.append(RecipeImage(
            url="https://images.unsplash.com/photo-1603133872878-684f208fb84b?q=80&w=2000&auto=format&fit=crop",
            is_primary=True
        ))

        session.add_all([pbm, vfr])
        await session.commit()
        print("Successfully seeded 2 test recipes!")

if __name__ == "__main__":
    asyncio.run(seed_test_recipes())
