import asyncio
from app.database import SessionLocal
from app.models.user import User
from sqlalchemy import select

async def check():
    async with SessionLocal() as db:
        res = await db.execute(select(User).where(User.email == 'mahimadangi78@gmail.com'))
        user = res.scalars().first()
        print(f"User exists: {user is not None}")
        if user:
            print(f"Username: {user.username}")

if __name__ == "__main__":
    asyncio.run(check())
