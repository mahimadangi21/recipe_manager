import asyncio
import aiosqlite
import bcrypt
from app.config import settings

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

async def create_admin():
    db_path = settings.DATABASE_URL.split("///")[-1]
    email = "admin@recipemanager.com"
    username = "admin_official"
    password = "Admin123!"
    hashed_pw = get_password_hash(password)
    
    async with aiosqlite.connect(db_path) as db:
        # Check if exists
        async with db.execute("SELECT id FROM users WHERE email = ?", (email,)) as cursor:
            user = await cursor.fetchone()
            
        if user:
            await db.execute(
                "UPDATE users SET hashed_password = ?, role = 'admin', is_active = 1 WHERE email = ?",
                (hashed_pw, email)
            )
            print(f"Updated existing admin: {email}")
        else:
            await db.execute(
                "INSERT INTO users (email, username, hashed_password, role, is_active) VALUES (?, ?, ?, ?, 1)",
                (email, username, hashed_pw, "admin")
            )
            print(f"Created new admin: {email}")
            
        await db.commit()

if __name__ == "__main__":
    asyncio.run(create_admin())
