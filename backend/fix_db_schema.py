import asyncio
from app.database import AsyncSessionLocal
from sqlalchemy import text

async def fix_schema():
    async with AsyncSessionLocal() as session:
        # Create shopping_list table
        try:
            create_sql = """
            CREATE TABLE IF NOT EXISTS shopping_list (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                recipe_id INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
                ingredient_name VARCHAR(255) NOT NULL,
                quantity VARCHAR(100),
                checked BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            """
            await session.execute(text(create_sql))
            print("Created shopping_list table")
        except Exception as e:
            print("Could not create shopping_list:", e)

        # Create index
        try:
            index_sql = "CREATE INDEX IF NOT EXISTS ix_shopping_list_user_id ON shopping_list(user_id);"
            await session.execute(text(index_sql))
            print("Created index")
        except Exception as e:
            print("Could not create index:", e)

        # Rename meal_plan_items table if it hasn't been renamed
        try:
            await session.execute(text("ALTER TABLE meal_plan_items RENAME TO meal_plans;"))
            print("Renamed table to meal_plans")
        except Exception as e:
            print("Could not rename table (maybe already renamed):", str(e).splitlines()[0])
            
        # Rename column if it hasn't been renamed
        try:
            await session.execute(text("ALTER TABLE meal_plans RENAME COLUMN plan_date TO planned_date;"))
            print("Renamed column to planned_date")
        except Exception as e:
            print("Could not rename column:", str(e).splitlines()[0])

        await session.commit()

if __name__ == "__main__":
    asyncio.run(fix_schema())
