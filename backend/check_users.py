import asyncio
from app.database import engine
from app.models.user import User
from sqlalchemy.future import select

async def check():
    async with engine.connect() as conn:
        res = await conn.execute(select(User.email, User.role, User.username))
        print("Users in database:")
        for row in res.all():
            print(f"- {row.email} | Role: {row.role} | Username: {row.username}")

if __name__ == "__main__":
    asyncio.run(check())
