from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationResponse, NotificationUpdate
from app.middleware.auth_middleware import get_current_user
from app.utils.responses import api_response

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/", response_model=List[NotificationResponse])
async def list_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
    )
    notifications = result.scalars().all()
    return notifications

@router.patch("/{notification_id}/read")
async def mark_as_read(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id, Notification.user_id == current_user.id)
    )
    notification = result.scalars().first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    await db.commit()
    return api_response(True, message="Notification marked as read")

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id, Notification.user_id == current_user.id)
    )
    notification = result.scalars().first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    await db.delete(notification)
    await db.commit()
    return api_response(True, message="Notification deleted")

@router.post("/clear-all")
async def clear_all_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await db.execute(
        delete(Notification).where(Notification.user_id == current_user.id)
    )
    await db.commit()
    return api_response(True, message="All notifications cleared")
