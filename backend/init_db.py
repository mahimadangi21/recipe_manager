import asyncio
from app.database import engine, Base

# Import all models to ensure they are registered with Base.metadata
from app.models import user, recipe, ingredient, image, review, collection

async def init_models():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created successfully!")

if __name__ == "__main__":
    asyncio.run(init_models())
