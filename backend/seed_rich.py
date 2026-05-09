import asyncio
import uuid
from sqlalchemy.future import select
from app.models.recipe import Recipe, CategoryEnum, DifficultyEnum
from app.models.ingredient import Ingredient
from app.models.image import RecipeImage
from app.models.user import User
from app.database import AsyncSessionLocal, engine, Base

async def seed_rich_recipes():
    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Get admin user
        result = await session.execute(select(User).filter_by(role="admin"))
        admin = result.scalars().first()
        if not admin:
            print("Admin user not found. Please ensure seed.py has run.")
            return

        # Recipe 1: Paneer Butter Masala
        pbm = Recipe(
            title="Paneer Butter Masala",
            description="A rich and creamy classic Indian curry made with paneer (Indian cottage cheese), tomatoes, cashews, and a blend of aromatic spices.",
            instructions="1. Prepare Tomato Gravy: Sauté onions, ginger-garlic paste, and tomatoes until soft. Blend with soaked cashews into a smooth paste.\n2. Cook Gravy: Heat butter in a pan, add whole spices, then pour in the blended tomato paste.\n3. Season: Add red chili powder, turmeric, garam masala, and salt. Cook until the oil separates.\n4. Add Paneer: Toss in the paneer cubes and simmer for 5-7 minutes on low heat.\n5. Finish: Stir in heavy cream and crushed kasuri methi (dried fenugreek leaves). Serve hot with naan.",
            servings=4,
            prep_time_minutes=20,
            cook_time_minutes=30,
            category=CategoryEnum.dinner,
            difficulty=DifficultyEnum.medium,
            is_public=True,
            owner_id=admin.id,
            share_token=str(uuid.uuid4())
        )
        pbm.ingredients.extend([
            Ingredient(name="Paneer cubes", quantity=250, unit="g"),
            Ingredient(name="Ripe tomatoes", quantity=3, unit="large"),
            Ingredient(name="Unsalted Butter", quantity=2, unit="tbsp"),
            Ingredient(name="Heavy Cream", quantity=0.25, unit="cup"),
            Ingredient(name="Cashews", quantity=10, unit="pcs", notes="soaked in warm water"),
            Ingredient(name="Ginger-Garlic Paste", quantity=1, unit="tsp"),
            Ingredient(name="Garam Masala", quantity=0.5, unit="tsp")
        ])
        pbm.images.append(RecipeImage(
            url="https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=2000&auto=format&fit=crop",
            is_primary=True
        ))

        # Recipe 2: Veg Fried Rice
        vfr = Recipe(
            title="Veg Fried Rice",
            description="A quick and flavorful Indo-Chinese dish made with basmati rice, colorful vegetables, and soy sauce. Perfect for a busy weeknight meal.",
            instructions="1. Prep Rice: Cook basmati rice until grains are separate and let it cool completely.\n2. Stir Fry Veggies: Heat oil in a large wok on high heat. Sauté garlic, onions, carrots, and capsicum for 2-3 minutes until slightly tender but still crunchy.\n3. Mix Rice: Add the cooled rice to the wok.\n4. Seasoning: Pour in soy sauce, vinegar, and a pinch of black pepper. Toss everything together for 2 minutes on high heat.\n5. Serve: Garnish with freshly chopped spring onions and serve hot with Manchurian or chili sauce.",
            servings=2,
            prep_time_minutes=15,
            cook_time_minutes=10,
            category=CategoryEnum.lunch,
            difficulty=DifficultyEnum.easy,
            is_public=True,
            owner_id=admin.id,
            share_token=str(uuid.uuid4())
        )
        vfr.ingredients.extend([
            Ingredient(name="Cooked Basmati Rice", quantity=2, unit="cups", notes="preferably day-old"),
            Ingredient(name="Finely chopped Carrot", quantity=0.5, unit="cup"),
            Ingredient(name="Green Capsicum", quantity=0.25, unit="cup"),
            Ingredient(name="Soy Sauce", quantity=1, unit="tbsp"),
            Ingredient(name="Rice Vinegar", quantity=1, unit="tsp"),
            Ingredient(name="Garlic cloves", quantity=3, unit="minced"),
            Ingredient(name="Spring onions", quantity=2, unit="stalks")
        ])
        vfr.images.append(RecipeImage(
            url="https://images.unsplash.com/photo-1603133872878-684f208fb84b?q=80&w=2000&auto=format&fit=crop",
            is_primary=True
        ))

        session.add_all([pbm, vfr])
        await session.commit()
        print("Successfully seeded 2 RICH test recipes!")

if __name__ == "__main__":
    asyncio.run(seed_rich_recipes())
