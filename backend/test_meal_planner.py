import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.user import User
from app.schemas.meal_plan import MealPlanItemCreate
from app.routers.meal_planner import add_plan_item

async def test():
    async with AsyncSessionLocal() as db:
        # Get user 3 (Mahima)
        user = (await db.execute(select(User).where(User.id == 3))).scalar_one()
        payload = MealPlanItemCreate(recipe_id=1, plan_date="2026-05-09", meal_type="dinner", servings=1)
        try:
            res = await add_plan_item(payload=payload, current_user=user, db=db)
            print("SUCCESS:", res)
        except Exception as e:
            print("ERROR:", type(e), str(e))
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
