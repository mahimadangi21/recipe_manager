from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timezone, timedelta
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.services.auth_service import verify_password, create_access_token
from app.config import settings
from app.utils.responses import api_response
from app.middleware.auth_middleware import get_current_admin_user

router = APIRouter(prefix="/admin", tags=["Admin Auth"])

LOGIN_ATTEMPT_LIMIT = 5
LOCK_TIME_MINUTES = 15

@router.post("/login")
async def admin_login(response: Response, login_data: dict, db: AsyncSession = Depends(get_db)):
    email = login_data.get("email")
    password = login_data.get("password")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()

    if not user:
        # Generic error to prevent email enumeration
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    # 1. Check if account is locked
    if user.account_locked_until and user.account_locked_until > datetime.now(timezone.utc):
        time_left = (user.account_locked_until - datetime.now(timezone.utc)).seconds // 60
        raise HTTPException(
            status_code=423, 
            detail=f"Account locked due to too many failed attempts. Try again in {time_left + 1} minutes."
        )

    # 2. Check Role (Strict)
    # Note: Using role field added in previous step
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admin privileges required.")

    # 3. Verify Password
    if not verify_password(password, user.hashed_password):
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        if user.failed_login_attempts >= LOGIN_ATTEMPT_LIMIT:
            user.account_locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCK_TIME_MINUTES)
            user.failed_login_attempts = 0 # Reset for next cycle after lock
            await db.commit()
            raise HTTPException(status_code=423, detail="Too many failed attempts. Account locked.")
        
        await db.commit()
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    # 4. Success: Reset failed attempts
    user.failed_login_attempts = 0
    user.account_locked_until = None
    await db.commit()

    # 5. Create Admin-Specific Token
    access_token = create_access_token(data={"email": user.email, "role": "admin"})
    
    # 6. Set HTTP-only Cookie for security
    response.set_cookie(
        key="admin_access_token",
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="Strict",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/api/v1/admin"
    )

    return {
        "success": True,
        "token": access_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role
        }
    }

@router.post("/logout")
async def admin_logout(response: Response):
    response.delete_cookie(key="admin_access_token", path="/api/v1/admin")
    return api_response(True, message="Admin logged out successfully")

@router.get("/profile")
async def get_admin_profile(current_admin: User = Depends(get_current_admin_user)):
    return {
        "success": True,
        "data": {
            "id": current_admin.id,
            "email": current_admin.email,
            "role": current_admin.role,
            "created_at": current_admin.created_at
        }
    }
