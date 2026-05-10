from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.notification import Notification
from app.models.user import User

async def create_notification(
    db: AsyncSession,
    user_id: int,
    title: str,
    message: str,
    type: str = "system",
    recipe_id: int = None
):
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        recipe_id=recipe_id
    )
    db.add(notification)
    await db.commit()
    return notification

async def notify_admins(
    db: AsyncSession,
    title: str,
    message: str,
    type: str = "admin_alert",
    recipe_id: int = None
):
    result = await db.execute(select(User).where(User.role == "admin"))
    admins = result.scalars().all()
    for admin in admins:
        notification = Notification(
            user_id=admin.id,
            title=title,
            message=message,
            type=type,
            recipe_id=recipe_id
        )
        db.add(notification)
    await db.commit()

async def notify_all_users(
    db: AsyncSession,
    title: str,
    message: str,
    type: str = "broadcast",
    recipe_id: int = None
):
    result = await db.execute(select(User))
    users = result.scalars().all()
    for user in users:
        notification = Notification(
            user_id=user.id,
            title=title,
            message=message,
            type=type,
            recipe_id=recipe_id
        )
        db.add(notification)
    await db.commit()
