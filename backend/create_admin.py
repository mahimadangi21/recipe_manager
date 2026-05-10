import asyncio
import bcrypt
from sqlalchemy import select
from app.database import engine, AsyncSessionLocal
from app.models.user import User
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

async def create_admin():
    email = "admin@recipemanager.com"
    username = "admin_official"
    password = "Admin123!"
    hashed_pw = get_password_hash(password)
    
    async with AsyncSessionLocal() as session:
        # Check if exists
        result = await session.execute(select(User).where(User.email == email))
        db_user = result.scalars().first()
            
        if db_user:
            db_user.hashed_password = hashed_pw
            db_user.role = 'admin'
            db_user.is_active = True
            logger.info(f"Updated existing admin: {email}")
        else:
            new_admin = User(
                email=email,
                username=username,
                hashed_password=hashed_pw,
                role="admin",
                is_active=True
            )
            session.add(new_admin)
            logger.info(f"Created new admin: {email}")
            
        await session.commit()

if __name__ == "__main__":
    asyncio.run(create_admin())
