import asyncio
import logging
from sqlalchemy.ext.asyncio import create_async_engine
from app.models.user import User
from app.models.recipe import Recipe
from app.models.ingredient import Ingredient
from app.models.image import RecipeImage
from app.models.review import Review
from app.models.collection import Collection
from app.models.comment import Comment
from app.models.recipe_submission import RecipeSubmission
from app.models.meal_plan import MealPlanItem
from app.models.notification import Notification
from app.database import Base, engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def init_db():
    logger.info("Initializing remote database...")
    try:
        async with engine.begin() as conn:
            # This will create all tables defined in models
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")

if __name__ == "__main__":
    asyncio.run(init_db())
