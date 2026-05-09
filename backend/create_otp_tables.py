import asyncio
from app.database import engine, Base
from app.models.otp import OTPVerification

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("OTP tables created successfully.")

if __name__ == "__main__":
    asyncio.run(create_tables())
