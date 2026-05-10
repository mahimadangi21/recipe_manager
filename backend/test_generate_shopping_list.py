import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.user import User
from app.routers.meal_planner import generate_shopping_list

async def test():
    async with AsyncSessionLocal() as db:
        user = (await db.execute(select(User).where(User.id == 3))).scalar_one_or_none()
        if not user:
            print("User 3 not found, using first user")
            user = (await db.execute(select(User))).scalars().first()
        try:
            res = await generate_shopping_list(start_date=None, end_date=None, current_user=user, db=db)
            print("SUCCESS:", res)
        except Exception as e:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
