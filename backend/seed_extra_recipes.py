import asyncio
import random
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal, engine
from app.models.recipe import Recipe
from app.models.ingredient import Ingredient
from app.models.image import RecipeImage
from app.models.user import User
from sqlalchemy import select

REAL_RECIPES = [
    {
        "title": "Classic Italian Lasagna",
        "category": "dinner",
        "difficulty": "hard",
        "image": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=800",
        "desc": "Layers of pasta, rich bolognese sauce, creamy béchamel, and melted mozzarella.",
        "instructions": "1. Sauté beef and aromatics for bolognese.\n2. Prepare béchamel sauce with butter, flour, and milk.\n3. Layer pasta sheets, bolognese, and béchamel.\n4. Top with mozzarella and bake at 180°C for 45 mins.",
        "ing": [("Lasagna Sheets", 250, "g"), ("Ground Beef", 500, "g"), ("Tomato Sauce", 400, "ml"), ("Milk", 500, "ml"), ("Mozzarella", 200, "g")]
    },
    {
        "title": "Fresh Berry Pancakes",
        "category": "breakfast",
        "difficulty": "easy",
        "image": "https://images.unsplash.com/photo-1506084868730-342b1f8183b7?auto=format&fit=crop&q=80&w=800",
        "desc": "Fluffy buttermilk pancakes topped with fresh blueberries, strawberries, and maple syrup.",
        "instructions": "1. Mix dry ingredients (flour, sugar, baking powder).\n2. Whisk in buttermilk, egg, and melted butter.\n3. Ladle onto a hot griddle and add berries.\n4. Flip when bubbles form and serve with syrup.",
        "ing": [("Flour", 200, "g"), ("Buttermilk", 250, "ml"), ("Egg", 1, "pc"), ("Blueberries", 100, "g"), ("Maple Syrup", 50, "ml")]
    },
    {
        "title": "Thai Green Curry",
        "category": "dinner",
        "difficulty": "medium",
        "image": "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&q=80&w=800",
        "desc": "Fragrant and spicy curry with coconut milk, bamboo shoots, and Thai basil.",
        "instructions": "1. Fry green curry paste in coconut cream until fragrant.\n2. Add chicken or tofu and vegetables.\n3. Pour in coconut milk and simmer until cooked.\n4. Stir in fish sauce, sugar, and Thai basil before serving.",
        "ing": [("Green Curry Paste", 2, "tbsp"), ("Coconut Milk", 400, "ml"), ("Chicken Breast", 400, "g"), ("Bamboo Shoots", 100, "g"), ("Thai Basil", 1, "handful")]
    },
    {
        "title": "Grilled Salmon with Asparagus",
        "category": "lunch",
        "difficulty": "medium",
        "image": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=800",
        "desc": "Light and healthy grilled salmon fillet served with lemon-butter asparagus.",
        "instructions": "1. Season salmon with salt, pepper, and lemon zest.\n2. Grill for 4-5 mins per side until flaky.\n3. Sauté asparagus in butter and garlic for 5 mins.\n4. Serve salmon over asparagus with fresh lemon wedges.",
        "ing": [("Salmon Fillet", 200, "g"), ("Asparagus", 150, "g"), ("Butter", 20, "g"), ("Lemon", 0.5, "pc"), ("Garlic", 1, "clove")]
    },
    {
        "title": "Mushroom Truffle Risotto",
        "category": "dinner",
        "difficulty": "hard",
        "image": "https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&q=80&w=800",
        "desc": "Creamy Arborio rice slowly cooked with wild mushrooms and finished with truffle oil.",
        "instructions": "1. Sauté mushrooms and shallots until golden.\n2. Add Arborio rice and toast slightly.\n3. Add warm broth one ladle at a time, stirring constantly.\n4. Finish with parmesan, butter, and a drizzle of truffle oil.",
        "ing": [("Arborio Rice", 300, "g"), ("Wild Mushrooms", 200, "g"), ("Vegetable Broth", 1, "L"), ("Parmesan", 50, "g"), ("Truffle Oil", 1, "tsp")]
    },
    {
        "title": "Mediterranean Mezze Platter",
        "category": "snack",
        "difficulty": "easy",
        "image": "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&q=80&w=800",
        "desc": "A vibrant spread of hummus, falafel, olives, pita, and fresh vegetables.",
        "instructions": "1. Arrange hummus and baba ganoush in small bowls.\n2. Place warm pita bread and falafel on the platter.\n3. Garnish with olives, cucumber, and cherry tomatoes.\n4. Drizzle olive oil and sprinkle za'atar over the dip.",
        "ing": [("Hummus", 200, "g"), ("Pita Bread", 2, "pcs"), ("Falafel", 6, "pcs"), ("Kalamata Olives", 50, "g"), ("Cucumber", 0.5, "pc")]
    },
    {
        "title": "Japanese Tonkotsu Ramen",
        "category": "dinner",
        "difficulty": "hard",
        "image": "https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&q=80&w=800",
        "desc": "Deeply flavorful pork bone broth served with chashu pork, egg, and noodles.",
        "instructions": "1. Boil pork bones for 12 hours to create a creamy broth.\n2. Prepare chashu by braising pork belly in soy and ginger.\n3. Cook ramen noodles until al dente.\n4. Assemble bowl with broth, noodles, chashu, and ajitsuke tamago.",
        "ing": [("Ramen Noodles", 150, "g"), ("Pork Bones", 1, "kg"), ("Pork Belly", 200, "g"), ("Soy Sauce", 50, "ml"), ("Ajitsuke Tamago", 1, "pc")]
    },
    {
        "title": "Mexican Street Tacos",
        "category": "lunch",
        "difficulty": "medium",
        "image": "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&q=80&w=800",
        "desc": "Soft corn tortillas filled with carne asada, cilantro, and onion.",
        "instructions": "1. Marinate steak in lime and spices, then grill and slice.\n2. Warm corn tortillas on a flat top grill.\n3. Fill with steak and top with finely chopped onion and cilantro.\n4. Serve with lime wedges and spicy salsa verde.",
        "ing": [("Corn Tortillas", 3, "pcs"), ("Skirt Steak", 250, "g"), ("White Onion", 0.5, "pc"), ("Cilantro", 1, "bunch"), ("Lime", 1, "pc")]
    },
    {
        "title": "French Onion Soup",
        "category": "lunch",
        "difficulty": "medium",
        "image": "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=800",
        "desc": "Caramelized onions in a rich beef broth, topped with cheesy baguette.",
        "instructions": "1. Slowly caramelize onions in butter for 45 mins.\n2. Add beef broth, thyme, and bay leaf; simmer for 20 mins.\n3. Ladle into crocks and top with a slice of toasted baguette.\n4. Cover with Gruyère and broil until bubbly and brown.",
        "ing": [("Yellow Onions", 4, "large"), ("Beef Broth", 1, "L"), ("Baguette", 1, "slice"), ("Gruyère Cheese", 50, "g"), ("Butter", 50, "g")]
    },
    {
        "title": "Matcha Green Tea Latte",
        "category": "beverage",
        "difficulty": "easy",
        "image": "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&q=80&w=800",
        "desc": "Smooth and earthy ceremonial grade matcha whisked with creamy steamed milk.",
        "instructions": "1. Sift matcha powder into a bowl to remove lumps.\n2. Add a small amount of hot water and whisk into a paste.\n3. Steam milk until frothy and pour over the matcha paste.\n4. Sweeten with honey or agave if desired.",
        "ing": [("Matcha Powder", 1, "tsp"), ("Milk", 200, "ml"), ("Hot Water", 30, "ml"), ("Honey", 1, "tsp")]
    }
]

# Random generic ones to fill up
GENERIC_TITLES = [
    "Quinoa Buddha Bowl", "Beef & Broccoli Stir-fry", "Shrimp Scampi", "Chicken Enchiladas",
    "Vegetable Tempura", "Grilled Cheese & Tomato Soup", "Beef Carpaccio", "Tiramisu",
    "Mango Sticky Rice", "Falafel Burger", "Spinach Artichoke Dip", "Pulled Pork Slider",
    "Caprese Salad", "Minestrone", "Eggplant Moussaka", "Fish Tacos", "Butter Chicken",
    "Pesto Pasta", "Chicken Wings", "Greek Salad", "Cauliflower Steak", "Zucchini Noodles",
    "Apple Crumble", "Chocolate Mousse", "Smoothie Bowl", "Hummus Wrap", "Steak Salad",
    "Margarita Pizza", "Clam Chowder", "Chicken Alfredo"
]

IMAGE_POOL = [
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1473093226795-af9932fe5855?auto=format&fit=crop&q=80&w=800"
]

async def seed():
    async with AsyncSessionLocal() as db:
        user = (await db.execute(select(User).limit(1))).scalar_one_or_none()
        if not user: return

        from sqlalchemy import delete
        await db.execute(delete(Recipe)) # Clear existing recipes to avoid duplicates/clutter
        
        for r in REAL_RECIPES:
            recipe = Recipe(
                title=r["title"],
                description=r["desc"],
                instructions=r["instructions"],
                servings=4,
                prep_time_minutes=random.randint(15, 30),
                cook_time_minutes=random.randint(20, 60),
                category=r["category"],
                difficulty=r["difficulty"],
                owner_id=user.id,
                is_public=True
            )
            for name, qty, unit in r["ing"]:
                recipe.ingredients.append(Ingredient(name=name, quantity=float(qty), unit=unit))
            recipe.images.append(RecipeImage(url=r["image"], is_primary=True, order=0))
            db.add(recipe)

        GENERIC_IMAGES = {
            "Quinoa Buddha Bowl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800",
            "Beef & Broccoli Stir-fry": "https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&q=80&w=800",
            "Shrimp Scampi": "https://images.unsplash.com/photo-1625943555419-56a2cb596640?auto=format&fit=crop&q=80&w=800",
            "Chicken Enchiladas": "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&q=80&w=800",
            "Vegetable Tempura": "https://images.unsplash.com/photo-1615486171434-2e998797f3b5?auto=format&fit=crop&q=80&w=800",
            "Grilled Cheese & Tomato Soup": "https://images.unsplash.com/photo-1528736235302-52922df5c122?auto=format&fit=crop&q=80&w=800",
            "Beef Carpaccio": "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&q=80&w=800",
            "Tiramisu": "https://images.unsplash.com/photo-1571115177098-24de8c6e268f?auto=format&fit=crop&q=80&w=800",
            "Mango Sticky Rice": "https://images.unsplash.com/photo-1605333396914-2321453abeb9?auto=format&fit=crop&q=80&w=800",
            "Falafel Burger": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=800",
            "Spinach Artichoke Dip": "https://images.unsplash.com/photo-1574782091218-f21396f4abdd?auto=format&fit=crop&q=80&w=800",
            "Pulled Pork Slider": "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&q=80&w=800",
            "Caprese Salad": "https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?auto=format&fit=crop&q=80&w=800",
            "Minestrone": "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=800",
            "Eggplant Moussaka": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&q=80&w=800",
            "Fish Tacos": "https://images.unsplash.com/photo-1512832871239-2cebfa8a7c2b?auto=format&fit=crop&q=80&w=800",
            "Butter Chicken": "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&q=80&w=800",
            "Pesto Pasta": "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&q=80&w=800",
            "Chicken Wings": "https://images.unsplash.com/photo-1524114664604-cd8133cd67ad?auto=format&fit=crop&q=80&w=800",
            "Greek Salad": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=800",
            "Cauliflower Steak": "https://images.unsplash.com/photo-1593457186084-5f2bc8bdfec8?auto=format&fit=crop&q=80&w=800",
            "Zucchini Noodles": "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&q=80&w=800",
            "Apple Crumble": "https://images.unsplash.com/photo-1621308399587-8ea31f510bd6?auto=format&fit=crop&q=80&w=800",
            "Chocolate Mousse": "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&q=80&w=800",
            "Smoothie Bowl": "https://images.unsplash.com/photo-1494597564530-871f2b93ac55?auto=format&fit=crop&q=80&w=800",
            "Hummus Wrap": "https://images.unsplash.com/photo-1509315811345-672d83ef2fbc?auto=format&fit=crop&q=80&w=800",
            "Steak Salad": "https://images.unsplash.com/photo-1550507992-eb63ffee0224?auto=format&fit=crop&q=80&w=800",
            "Margarita Pizza": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=800",
            "Clam Chowder": "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=800",
            "Chicken Alfredo": "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&q=80&w=800"
        }

        for title in GENERIC_TITLES:
            recipe = Recipe(
                title=title,
                description=f"A delicious and easy-to-make {title} that your whole family will love.",
                instructions="1. Prepare all ingredients.\n2. Cook the main components according to basic techniques.\n3. Season with salt, pepper, and herbs.\n4. Plate beautifully and serve warm.",
                servings=random.randint(2, 6),
                prep_time_minutes=random.randint(10, 25),
                cook_time_minutes=random.randint(15, 45),
                category=random.choice(["breakfast", "lunch", "dinner", "dessert", "snack", "beverage"]),
                difficulty=random.choice(["easy", "medium", "hard"]),
                owner_id=user.id,
                is_public=True
            )
            recipe.ingredients.append(Ingredient(name="Main Ingredient", quantity=1.0, unit="unit"))
            recipe.ingredients.append(Ingredient(name="Seasoning", quantity=1.0, unit="tsp"))
            image_url = GENERIC_IMAGES.get(title, "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=800")
            recipe.images.append(RecipeImage(url=image_url, is_primary=True, order=0))
            db.add(recipe)


        await db.commit()
        print("Database seeded with highly relevant and detailed recipes.")

if __name__ == "__main__":
    asyncio.run(seed())
