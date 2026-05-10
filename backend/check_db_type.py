import asyncio
from app.database import engine
from sqlalchemy import text

async def check():
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'status'"))
        print(f"RECIPES.STATUS: {res.all()}")
        
        # Also check if the type 'recipestatus' exists
        res = await conn.execute(text("SELECT typname FROM pg_type WHERE typname = 'recipestatus'"))
        print(f"ENUM TYPE 'recipestatus': {res.all()}")

if __name__ == "__main__":
    asyncio.run(check())
