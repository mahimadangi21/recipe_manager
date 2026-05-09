import asyncio
import aiosqlite
from app.config import settings

async def update_db():
    # Parse SQLite path from DATABASE_URL
    # sqlite+aiosqlite:///C:/Users/Mahima/recipes.db
    db_path = settings.DATABASE_URL.split("///")[-1]
    
    async with aiosqlite.connect(db_path) as db:
        print(f"Connecting to {db_path}...")
        
        # Add columns if they don't exist
        columns_to_add = [
            ("role", "TEXT DEFAULT 'user'"),
            ("failed_login_attempts", "INTEGER DEFAULT 0"),
            ("account_locked_until", "TIMESTAMP")
        ]
        
        for col_name, col_type in columns_to_add:
            try:
                await db.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
                print(f"Added column {col_name}")
            except Exception as e:
                print(f"Column {col_name} might already exist: {e}")
        
        # Ensure at least one admin exists for testing
        # We'll promote 'admin' user if it exists, or create/update based on email
        await db.execute("UPDATE users SET role = 'admin' WHERE username = 'admin' OR email = 'admin@example.com'")
        print("Updated admin roles.")
        
        await db.commit()
    print("Database schema update complete.")

if __name__ == "__main__":
    asyncio.run(update_db())
