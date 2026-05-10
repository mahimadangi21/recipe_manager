import asyncio
import os
import random
import uuid
from sqlalchemy.future import select
from app.models.recipe import Recipe
from app.models.ingredient import Ingredient
from app.models.image import RecipeImage
from app.models.user import User
from app.services.auth_service import get_password_hash
from app.database import engine, AsyncSessionLocal, Base

RECIPES_DATA = [
    {
        "title": "Classic Margherita Pizza", "cat": "dinner", "diff": "medium",
        "image": "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?q=80&w=1974&auto=format&fit=crop"
    },
    {
        "title": "Avocado Toast", "cat": "breakfast", "diff": "easy",
        "image": "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=1780&auto=format&fit=crop"
    },
    {
        "title": "Chocolate Chip Cookies", "cat": "dessert", "diff": "easy",
        "image": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=1964&auto=format&fit=crop"
    },
    {
        "title": "Spicy Tomato Pasta", "cat": "dinner", "diff": "easy",
        "image": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "Grilled Salmon", "cat": "dinner", "diff": "medium",
        "image": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "Beef Stew", "cat": "dinner", "diff": "hard",
        "image": "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "Caesar Salad", "cat": "lunch", "diff": "easy",
        "image": "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "Pancakes", "cat": "breakfast", "diff": "easy",
        "image": "https://images.unsplash.com/photo-1528207776546-365bb710ee93?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "French Onion Soup", "cat": "lunch", "diff": "medium",
        "image": "https://images.unsplash.com/photo-1583095316173-61a0662d55c7?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "Tacos al Pastor", "cat": "dinner", "diff": "hard",
        "image": "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "Chicken Curry", "cat": "dinner", "diff": "medium",
        "image": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "Mushroom Risotto", "cat": "dinner", "diff": "hard",
        "image": "https://images.unsplash.com/photo-1476124369491-e7addf5db371?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "Greek Salad", "cat": "lunch", "diff": "easy",
        "image": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "Apple Pie", "cat": "dessert", "diff": "medium",
        "image": "https://images.unsplash.com/photo-1562007908-17c67e878c88?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "Eggs Benedict", "cat": "breakfast", "diff": "hard",
        "image": "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "Pho Soup", "cat": "lunch", "diff": "hard",
        "image": "https://images.unsplash.com/photo-1582878826629-29b7ad1cb431?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "Vegetable Stir Fry", "cat": "dinner", "diff": "easy",
        "image": "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "Cheesecake", "cat": "dessert", "diff": "medium",
        "image": "https://images.unsplash.com/photo-1524351199678-941a58a3df50?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "BBQ Ribs", "cat": "dinner", "diff": "hard",
        "image": "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "Smoothie Bowl", "cat": "breakfast", "diff": "easy",
        "image": "https://images.unsplash.com/photo-1494597564530-871f2b93ac55?q=80&w=2000&auto=format&fit=crop"
    }
]

async def seed():
    # Only create tables if needed
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as session:
        # Create/Update demo user
        result = await session.execute(select(User).filter_by(username="demo"))
        user = result.scalars().first()
        if not user:
            user = User(username="demo", email="demo@example.com", hashed_password=get_password_hash("password123"), role="user")
            session.add(user)
        else:
            user.hashed_password = get_password_hash("password123")
            user.role = "user"
        
        await session.commit()
        await session.refresh(user)

        # Create/Update admin user
        result = await session.execute(select(User).filter_by(username="admin"))
        admin = result.scalars().first()
        if not admin:
            admin = User(username="admin", email="admin@example.com", hashed_password=get_password_hash("admin123"), role="admin")
            session.add(admin)
        else:
            admin.hashed_password = get_password_hash("admin123")
            admin.role = "admin"
            
        await session.commit()

        # Clear existing recipes for demo user
        result = await session.execute(select(Recipe).filter_by(owner_id=user.id))
        existing_recipes = result.scalars().all()
        for r in existing_recipes:
            await session.delete(r)
        await session.commit()

        # Add 20 recipes
        recipes_to_add = []
        for i, data in enumerate(RECIPES_DATA):
            r = Recipe(
                title=data["title"],
                description=f"A delicious {data['title'].lower()} recipe perfect for {data['cat']}.",
                instructions="1. Prepare ingredients.\n2. Cook them nicely.\n3. Serve hot and enjoy!",
                servings=random.randint(2, 6),
                prep_time_minutes=random.randint(10, 30),
                cook_time_minutes=random.randint(15, 60),
                category=data["cat"],
                difficulty=data["diff"],
                is_public=True,
                owner_id=user.id,
                share_token=str(uuid.uuid4())
            )
            
            # Add specific image for this recipe
            r.images.append(RecipeImage(url=data["image"], is_primary=True, order=0))
            
            # Add ingredients
            r.ingredients.extend([
                Ingredient(name="Main Ingredient", quantity=1.5, unit="lbs"),
                Ingredient(name="Spice", quantity=2, unit="tbsp"),
                Ingredient(name="Sauce", quantity=0.5, unit="cup")
            ])
            
            recipes_to_add.append(r)

        session.add_all(recipes_to_add)
        await session.commit()
        print(f"Successfully seeded {len(recipes_to_add)} recipes with correct images!")

if __name__ == "__main__":
    asyncio.run(seed())
