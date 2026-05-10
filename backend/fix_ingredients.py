"""
Fix seed data: replace placeholder ingredient names with real per-recipe ingredients
"""
import asyncio
from sqlalchemy.future import select
from app.models.recipe import Recipe
from app.models.ingredient import Ingredient
from app.database import engine, AsyncSessionLocal

# Real ingredients mapped to each recipe title
REAL_INGREDIENTS = {
    "Classic Margherita Pizza": [
        ("Pizza Dough", 1, "ball"), ("Tomato Sauce", 0.5, "cup"),
        ("Fresh Mozzarella", 200, "g"), ("Fresh Basil", 10, "leaves"),
        ("Olive Oil", 2, "tbsp"), ("Salt", 1, "tsp"),
    ],
    "Avocado Toast": [
        ("Sourdough Bread", 2, "slices"), ("Avocado", 1, "whole"),
        ("Lemon Juice", 1, "tbsp"), ("Red Pepper Flakes", 0.5, "tsp"),
        ("Salt", 0.5, "tsp"), ("Olive Oil", 1, "tbsp"),
    ],
    "Chocolate Chip Cookies": [
        ("All-Purpose Flour", 2.25, "cups"), ("Butter", 1, "cup"),
        ("Sugar", 0.75, "cup"), ("Brown Sugar", 0.75, "cup"),
        ("Eggs", 2, "whole"), ("Vanilla Extract", 1, "tsp"),
        ("Chocolate Chips", 2, "cups"), ("Baking Soda", 1, "tsp"),
    ],
    "Spicy Tomato Pasta": [
        ("Spaghetti", 400, "g"), ("Canned Tomatoes", 400, "g"),
        ("Garlic", 4, "cloves"), ("Red Chili", 2, "whole"),
        ("Olive Oil", 3, "tbsp"), ("Parmesan", 50, "g"),
        ("Salt", 1, "tsp"), ("Black Pepper", 0.5, "tsp"),
    ],
    "Grilled Salmon": [
        ("Salmon Fillet", 0.75, "lbs"), ("Lemon", 1, "whole"),
        ("Garlic", 2, "cloves"), ("Dill", 1, "tbsp"),
        ("Olive Oil", 2, "tbsp"), ("Salt", 1, "tsp"),
        ("Black Pepper", 0.5, "tsp"),
    ],
    "Beef Stew": [
        ("Beef Chuck", 2, "lbs"), ("Carrots", 3, "whole"),
        ("Potatoes", 4, "whole"), ("Onion", 2, "whole"),
        ("Beef Broth", 2, "cups"), ("Tomato Paste", 2, "tbsp"),
        ("Flour", 3, "tbsp"), ("Garlic", 3, "cloves"),
        ("Thyme", 1, "tsp"), ("Bay Leaves", 2, "leaves"),
    ],
    "Caesar Salad": [
        ("Romaine Lettuce", 1, "head"), ("Parmesan", 60, "g"),
        ("Croutons", 1, "cup"), ("Caesar Dressing", 4, "tbsp"),
        ("Black Pepper", 0.5, "tsp"), ("Lemon Juice", 1, "tbsp"),
    ],
    "Pancakes": [
        ("All-Purpose Flour", 1.5, "cups"), ("Milk", 1.25, "cups"),
        ("Egg", 1, "whole"), ("Butter", 3, "tbsp"),
        ("Baking Powder", 3.5, "tsp"), ("Sugar", 1, "tbsp"),
        ("Salt", 0.5, "tsp"), ("Vanilla Extract", 1, "tsp"),
    ],
    "French Onion Soup": [
        ("Onions", 4, "whole"), ("Beef Broth", 4, "cups"),
        ("Butter", 4, "tbsp"), ("Flour", 2, "tbsp"),
        ("Gruyere Cheese", 100, "g"), ("Baguette", 4, "slices"),
        ("White Wine", 0.5, "cup"), ("Thyme", 1, "tsp"),
    ],
    "Tacos al Pastor": [
        ("Pork Shoulder", 2, "lbs"), ("Pineapple", 0.5, "whole"),
        ("Corn Tortillas", 12, "whole"), ("Onion", 1, "whole"),
        ("Cilantro", 0.5, "bunch"), ("Lime", 2, "whole"),
        ("Chipotle Peppers", 3, "whole"), ("Achiote Paste", 2, "tbsp"),
    ],
    "Chicken Curry": [
        ("Chicken Breast", 1.5, "lbs"), ("Coconut Milk", 400, "ml"),
        ("Curry Paste", 3, "tbsp"), ("Onion", 1, "whole"),
        ("Garlic", 3, "cloves"), ("Ginger", 1, "inch"),
        ("Tomatoes", 2, "whole"), ("Cilantro", 0.25, "bunch"),
    ],
    "Mushroom Risotto": [
        ("Arborio Rice", 1.5, "cups"), ("Mixed Mushrooms", 400, "g"),
        ("Chicken Broth", 4, "cups"), ("White Wine", 0.5, "cup"),
        ("Shallots", 2, "whole"), ("Garlic", 2, "cloves"),
        ("Parmesan", 60, "g"), ("Butter", 4, "tbsp"),
        ("Thyme", 1, "tsp"),
    ],
    "Greek Salad": [
        ("Tomatoes", 3, "whole"), ("Cucumber", 1, "whole"),
        ("Red Onion", 0.5, "whole"), ("Kalamata Olives", 0.5, "cup"),
        ("Feta Cheese", 150, "g"), ("Olive Oil", 3, "tbsp"),
        ("Oregano", 1, "tsp"), ("Salt", 0.5, "tsp"),
    ],
    "Apple Pie": [
        ("Apples", 6, "whole"), ("Pie Crust", 2, "sheets"),
        ("Sugar", 0.75, "cup"), ("Cinnamon", 2, "tsp"),
        ("Nutmeg", 0.25, "tsp"), ("Butter", 2, "tbsp"),
        ("Lemon Juice", 1, "tbsp"),
    ],
    "Eggs Benedict": [
        ("English Muffins", 2, "whole"), ("Canadian Bacon", 4, "slices"),
        ("Eggs", 4, "whole"), ("Butter", 0.5, "cup"),
        ("Egg Yolks", 3, "whole"), ("Lemon Juice", 1, "tbsp"),
        ("White Vinegar", 1, "tbsp"),
    ],
    "Pho Soup": [
        ("Beef Bones", 2, "lbs"), ("Rice Noodles", 400, "g"),
        ("Beef Sirloin", 0.5, "lbs"), ("Star Anise", 4, "whole"),
        ("Cinnamon Stick", 2, "whole"), ("Fish Sauce", 3, "tbsp"),
        ("Bean Sprouts", 2, "cups"), ("Thai Basil", 0.5, "bunch"),
        ("Lime", 2, "whole"),
    ],
    "Vegetable Stir Fry": [
        ("Broccoli", 2, "cups"), ("Bell Peppers", 2, "whole"),
        ("Carrots", 2, "whole"), ("Snow Peas", 1, "cup"),
        ("Soy Sauce", 3, "tbsp"), ("Sesame Oil", 1, "tbsp"),
        ("Garlic", 3, "cloves"), ("Ginger", 1, "tsp"),
        ("Cornstarch", 1, "tbsp"),
    ],
    "Cheesecake": [
        ("Cream Cheese", 900, "g"), ("Sugar", 1, "cup"),
        ("Eggs", 3, "whole"), ("Sour Cream", 0.5, "cup"),
        ("Vanilla Extract", 2, "tsp"), ("Graham Crackers", 200, "g"),
        ("Butter", 6, "tbsp"),
    ],
    "BBQ Ribs": [
        ("Pork Ribs", 3, "lbs"), ("BBQ Sauce", 1, "cup"),
        ("Brown Sugar", 0.25, "cup"), ("Smoked Paprika", 2, "tbsp"),
        ("Garlic Powder", 1, "tsp"), ("Onion Powder", 1, "tsp"),
        ("Black Pepper", 1, "tsp"), ("Salt", 2, "tsp"),
    ],
    "Smoothie Bowl": [
        ("Frozen Acai", 200, "g"), ("Banana", 1, "whole"),
        ("Mixed Berries", 1, "cup"), ("Almond Milk", 0.5, "cup"),
        ("Granola", 0.5, "cup"), ("Honey", 1, "tbsp"),
        ("Chia Seeds", 1, "tbsp"), ("Coconut Flakes", 2, "tbsp"),
    ],
}

async def fix_ingredients():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Recipe))
        recipes = result.scalars().all()
        
        fixed = 0
        for recipe in recipes:
            ingredients = REAL_INGREDIENTS.get(recipe.title)
            if not ingredients:
                print(f"  SKIP: No data for '{recipe.title}'")
                continue
            
            # Delete old placeholder ingredients
            old = await session.execute(select(Ingredient).where(Ingredient.recipe_id == recipe.id))
            for ing in old.scalars().all():
                await session.delete(ing)
            
            # Add real ingredients
            for (name, qty, unit) in ingredients:
                session.add(Ingredient(
                    recipe_id=recipe.id,
                    name=name,
                    quantity=float(qty),
                    unit=unit
                ))
            fixed += 1
            print(f"  OK: Updated '{recipe.title}' with {len(ingredients)} ingredients")
        
        await session.commit()
        print(f"\nDone! Fixed {fixed} recipes.")

if __name__ == "__main__":
    asyncio.run(fix_ingredients())
