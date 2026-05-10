from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserUpdate, UserPasswordUpdate, Token
from app.services.auth_service import get_password_hash, verify_password, create_access_token, create_refresh_token
from app.middleware.auth_middleware import get_current_user, get_current_admin_user
from app.config import settings
from app.utils.responses import api_response
from app.utils.notifications import notify_admins
from app.models.otp import OTPVerification
from app.schemas.otp import OTPRequest, OTPVerify, SignupRequest, ForgotPasswordRequest, ResetPasswordRequest
from app.utils.email import send_otp_email
from datetime import datetime, timedelta, timezone
import random
import json
from typing import List

router = APIRouter(prefix="/auth", tags=["Auth"])

def set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
    )

@router.post("/send-otp")
async def send_otp(request: OTPRequest, db: AsyncSession = Depends(get_db)):
    # Check if email is already registered for signup
    if request.type == "signup":
        result = await db.execute(select(User).where(User.email == request.email))
        if result.scalars().first():
            raise HTTPException(status_code=409, detail="Email already registered")

    # Generate 6-digit OTP
    otp_code = "".join([str(random.randint(0, 9)) for _ in range(6)])
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

    # Save to DB
    otp_record = OTPVerification(
        email=request.email,
        otp=otp_code,
        type=request.type,
        expires_at=expires_at
    )
    db.add(otp_record)
    await db.commit()

    # Send email
    success, mail_msg = await send_otp_email(request.email, otp_code, request.type)
    if not success:
        raise HTTPException(status_code=500, detail=mail_msg)
    
    return api_response(True, message=f"OTP sent to {request.email}")

@router.post("/signup")
async def signup(request: SignupRequest, db: AsyncSession = Depends(get_db)):
    import logging
    logger = logging.getLogger(__name__)
    try:
        logger.info(f"SIGNUP: Request received for {request.email}")
        # Validate unique email/username
        result = await db.execute(select(User).where((User.email == request.email) | (User.username == request.username)))
        if result.scalars().first():
            logger.warning(f"SIGNUP: Email or username already registered for {request.email}")
            raise HTTPException(status_code=409, detail="Email or username already registered")

        # Generate 6-digit OTP
        otp_code = "".join([str(random.randint(0, 9)) for _ in range(6)])
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

        # Store signup data in payload
        payload = json.dumps(request.model_dump())

        # Save OTP with payload
        otp_record = OTPVerification(
            email=request.email,
            otp=otp_code,
            type="signup",
            payload=payload,
            expires_at=expires_at
        )
        db.add(otp_record)
        await db.commit()
        logger.info(f"SIGNUP: OTP saved to database for {request.email}")

        # Send email
        success, mail_msg = await send_otp_email(request.email, otp_code, "signup")
        if not success:
            logger.error(f"SIGNUP: SMTP failed during signup for {request.email}: {mail_msg}")
            raise HTTPException(status_code=500, detail=f"Failed to send verification email. Please check your SMTP settings.")
        
        logger.info(f"SIGNUP: Verification code sent successfully to {request.email}")
        return api_response(True, message="Verification code sent to your email")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"SIGNUP: Server error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.post("/verify-otp")
async def verify_otp(request: OTPVerify, db: AsyncSession = Depends(get_db)):
    import logging
    logger = logging.getLogger(__name__)
    try:
        logger.info(f"VERIFY_OTP: Request received for {request.email}, type: {request.type}")
        from sqlalchemy import func
        result = await db.execute(
            select(OTPVerification)
            .where(
                OTPVerification.email == request.email, 
                OTPVerification.type == request.type, 
                OTPVerification.is_verified == False
            )
            .order_by(OTPVerification.created_at.desc())
        )
        otp_record = result.scalars().first()

        if not otp_record:
            logger.warning(f"VERIFY_OTP: No active verification code found for {request.email}")
            raise HTTPException(status_code=404, detail="No active verification code found")

        # Use database-native comparison or ensure Python comparison is robust
        # We already have the record, let's check its expiry against DB time if possible, 
        # or just use a very safe Python comparison.
        now = datetime.now(timezone.utc)
        
        # Ensure otp_record.expires_at is aware
        expiry = otp_record.expires_at
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        
        if now > expiry:
            # Check if it's within a small grace period (e.g. 30 seconds) to handle clock drift
            if (now - expiry).total_seconds() > 30:
                logger.warning(f"VERIFY_OTP: OTP expired for {request.email}")
                raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")

        if otp_record.too_many_attempts:
            logger.warning(f"VERIFY_OTP: Too many failed attempts for {request.email}")
            raise HTTPException(status_code=400, detail="Too many failed attempts. Please request a new OTP.")

        if otp_record.otp != request.otp.strip():
            otp_record.attempts += 1
            await db.commit()
            logger.warning(f"VERIFY_OTP: Invalid OTP provided for {request.email}")
            raise HTTPException(status_code=400, detail=f"Invalid OTP. {5 - otp_record.attempts} attempts remaining.")

        # OTP is correct
        logger.info(f"VERIFY_OTP: OTP successfully verified for {request.email}")
        otp_record.is_verified = True
        
        # If it's a signup flow, create the user now
        user_data = None
        if request.type == "signup" and otp_record.payload:
            data = json.loads(otp_record.payload)
            hashed_password = get_password_hash(data['password'])
            new_user = User(
                email=data['email'],
                username=data['username'],
                hashed_password=hashed_password,
                avatar_url=data.get('avatar_url'),
                bio=data.get('bio')
            )
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
            logger.info(f"VERIFY_OTP: New user created with ID {new_user.id}")

            # Notify admins
            from app.utils.notifications import notify_admins
            await notify_admins(
                db,
                title="New User Registered",
                message=f"User {new_user.username} has just joined the platform.",
                type="registration"
            )
            await db.refresh(new_user)
            user_data = {"id": new_user.id, "email": new_user.email, "username": new_user.username}

        await db.commit()
        return api_response(True, data=user_data, message="Verification successful")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"VERIFY_OTP: Server error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    import logging
    logger = logging.getLogger(__name__)
    try:
        logger.info(f"FORGOT_PASSWORD: Email received: {request.email}")
        result = await db.execute(select(User).where(User.email == request.email))
        user = result.scalars().first()
        if not user:
            logger.warning(f"FORGOT_PASSWORD: User not found for {request.email}")
            raise HTTPException(status_code=404, detail="User not found")

        # Generate reset OTP
        otp_code = "".join([str(random.randint(0, 9)) for _ in range(6)])
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
        logger.info(f"FORGOT_PASSWORD: OTP generated for {request.email}")

        otp_record = OTPVerification(
            email=request.email,
            otp=otp_code,
            type="reset",
            expires_at=expires_at
        )
        db.add(otp_record)
        await db.commit()
        logger.info(f"FORGOT_PASSWORD: OTP saved to database for {request.email}")

        success, mail_msg = await send_otp_email(request.email, otp_code, "reset")
        if not success:
            logger.error(f"FORGOT_PASSWORD: SMTP failed during password reset for {request.email}: {mail_msg}")
            raise HTTPException(status_code=500, detail=f"Email delivery failed: {mail_msg}")
            
        logger.info(f"FORGOT_PASSWORD: OTP email sent successfully for {request.email}")
        return api_response(True, message="OTP sent to your email")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"FORGOT_PASSWORD: Server error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Server error: {str(e)}")

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    import logging
    logger = logging.getLogger(__name__)
    try:
        logger.info(f"RESET_PASSWORD: Request received for {request.email}")
        # Verify OTP again to be sure (stateless-ish)
        result = await db.execute(
            select(OTPVerification)
            .where(OTPVerification.email == request.email, OTPVerification.type == "reset", OTPVerification.is_verified == True)
            .order_by(OTPVerification.created_at.desc())
        )
        otp_record = result.scalars().first()

        if not otp_record or (datetime.now(timezone.utc) - otp_record.created_at).total_seconds() > 600:
            logger.warning(f"RESET_PASSWORD: Session expired or not verified for {request.email}")
            raise HTTPException(status_code=400, detail="Session expired. Please verify OTP again.")

        # Update password
        result = await db.execute(select(User).where(User.email == request.email))
        user = result.scalars().first()
        if not user:
            logger.warning(f"RESET_PASSWORD: User not found for {request.email}")
            raise HTTPException(status_code=404, detail="User not found")

        user.hashed_password = get_password_hash(request.new_password)
        logger.info(f"RESET_PASSWORD: Password updated successfully for {request.email}")
        
        # Mark OTP as deleted/fully used so it can't be used again
        await db.delete(otp_record)
        
        await db.commit()
        
        return api_response(True, message="Password reset successfully")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"RESET_PASSWORD: Server error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

# Keep the original register for legacy/compatibility if needed, 
# but we'll likely switch frontend to /signup
@router.post("/register", response_model=UserResponse)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    pass # Legacy register, please use /signup flow

@router.post("/login")
async def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    import logging
    logger = logging.getLogger(__name__)
    try:
        logger.info(f"LOGIN: Attempt for username/email: {form_data.username}")
        # Check both email and username
        result = await db.execute(
            select(User).where((User.email == form_data.username) | (User.username == form_data.username))
        )
        user = result.scalars().first()
        logger.info(f"LOGIN: DB response user found: {user is not None}")
        
        if not user:
            logger.warning(f"LOGIN: User not found for {form_data.username}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
            
        password_match = verify_password(form_data.password, user.hashed_password)
        logger.info(f"LOGIN: bcrypt compare result: {password_match}")
        
        if not password_match:
            logger.warning(f"LOGIN: Invalid password for {form_data.username}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password")
            
        access_token = create_access_token(data={"email": user.email})
        refresh_token = create_refresh_token(data={"email": user.email})
        logger.info("LOGIN: JWT generated successfully")
        
        set_refresh_cookie(response, refresh_token)
        
        return {
            "success": True,
            "token": access_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "role": user.role
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"LOGIN: Server error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Server error: {str(e)}")

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        key="refresh_token",
        domain=settings.COOKIE_DOMAIN,
        path="/",
        samesite=settings.COOKIE_SAMESITE,
    )
    return api_response(True, message="Successfully logged out")

@router.post("/refresh")
async def refresh(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token is missing")
        
    from jose import JWTError, jwt
    try:
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("email")
        if email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
        
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        
    access_token = create_access_token(data={"email": user.email})
    new_refresh_token = create_refresh_token(data={"email": user.email})
    set_refresh_cookie(response, new_refresh_token)
    return api_response(True, data={"access_token": access_token, "token_type": "bearer"}, message="Token refreshed")

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return api_response(True, data=current_user)

@router.put("/me", response_model=UserResponse)
async def update_me(user_update: UserUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user_update.username:
        # check if username exists
        result = await db.execute(select(User).where(User.username == user_update.username, User.id != current_user.id))
        if result.scalars().first():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken")
        current_user.username = user_update.username
    if user_update.avatar_url is not None:
        current_user.avatar_url = user_update.avatar_url
    if user_update.bio is not None:
        current_user.bio = user_update.bio
        
    await db.commit()
    await db.refresh(current_user)
    return api_response(True, data=current_user, message="Profile updated")

@router.put("/me/password")
async def update_password(pw_update: UserPasswordUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not verify_password(pw_update.old_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect old password")
        
    current_user.hashed_password = get_password_hash(pw_update.new_password)
    await db.commit()
    return api_response(True, message="Password updated successfully")

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(admin_user: User = Depends(get_current_admin_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    users = result.scalars().all()
    return api_response(True, data=[UserResponse.model_validate(u).model_dump() for u in users])

@router.get("/stats")
async def get_system_stats(admin_user: User = Depends(get_current_admin_user), db: AsyncSession = Depends(get_db)):
    from app.models.recipe import Recipe
    from app.models.collection import Collection
    
    users_count = await db.scalar(select(func.count(User.id)))
    recipes_count = await db.scalar(select(func.count(Recipe.id)))
    collections_count = await db.scalar(select(func.count(Collection.id)))
    
    return api_response(True, data={
        "users": users_count,
        "recipes": recipes_count,
        "collections": collections_count
    })

@router.put("/users/{user_id}/role")
async def update_user_role(user_id: int, role_data: dict, admin_user: User = Depends(get_current_admin_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
        
    if role_data.get("is_admin") is True:
        user.role = "admin"
    elif role_data.get("is_admin") is False:
        user.role = "user"
        
    await db.commit()
    return api_response(True, message="User role updated")

@router.put("/users/{user_id}/status")
async def update_user_status(user_id: int, status_data: dict, admin_user: User = Depends(get_current_admin_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
        
    user.is_active = status_data.get("is_active", user.is_active)
    await db.commit()
    return api_response(True, message="User status updated")
