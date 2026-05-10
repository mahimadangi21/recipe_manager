import asyncio
from app.database import AsyncSessionLocal
from app.models.user import User
from sqlalchemy import select, update

async def make_admin():
    async with AsyncSessionLocal() as session:
        # Check current role
        res = await session.execute(select(User).where(User.email == "patelmahima304@gmail.com"))
        user = res.scalars().first()
        if user:
            print(f"Current role for {user.email}: {user.role}")
            # Update to admin
            await session.execute(
                update(User).where(User.email == "patelmahima304@gmail.com").values(role="admin")
            )
            await session.commit()
            print("User promoted to admin.")
        else:
            print("User not found.")

if __name__ == "__main__":
    asyncio.run(make_admin())
