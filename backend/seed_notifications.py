import asyncio
from app.database import AsyncSessionLocal
from app.models.user import User
from app.models.recipe_submission import RecipeSubmission
from app.utils.notifications import notify_admins
from app.services.auth_service import get_password_hash
from sqlalchemy.future import select

async def seed_notifications_demo():
    async with AsyncSessionLocal() as session:
        # 1. Create a demo user
        result = await session.execute(select(User).filter_by(username="chef_miguel"))
        user = result.scalars().first()
        
        if not user:
            user = User(
                username="chef_miguel",
                email="miguel@example.com",
                hashed_password=get_password_hash("password123"),
                role="user"
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            print(f"Created user {user.username}")
            
            # Notify admin about new registration
            await notify_admins(
                session,
                title="New User Registered",
                message=f"User {user.username} (miguel@example.com) has just joined the platform.",
                type="registration"
            )
        
        # 2. Create a recipe submission
        submission = RecipeSubmission(
            submitter_id=user.id,
            title="Spicy Garlic Shrimp",
            payload={
                "title": "Spicy Garlic Shrimp",
                "description": "Succulent shrimp tossed in a spicy garlic butter sauce.",
                "instructions": "1. Sauté garlic in butter.\n2. Add shrimp and chili flakes.\n3. Cook until pink.\n4. Serve with parsley.",
                "ingredients": [
                    {"name": "Shrimp", "quantity": 500, "unit": "g"},
                    {"name": "Garlic", "quantity": 4, "unit": "cloves"},
                    {"name": "Butter", "quantity": 2, "unit": "tbsp"}
                ],
                "category": "dinner",
                "difficulty": "easy"
            },
            status="pending"
        )
        session.add(submission)
        await session.commit()
        print(f"Created submission for {submission.title}")
        
        # Notify admins about submission
        await notify_admins(
            session,
            title="New Recipe Submission",
            message=f"User {user.username} submitted a new recipe: {submission.title}",
            type="submission"
        )
        
        print("Successfully seeded notification demo data!")

if __name__ == "__main__":
    asyncio.run(seed_notifications_demo())
