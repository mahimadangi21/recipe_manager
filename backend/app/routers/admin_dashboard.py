from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.middleware.auth_middleware import get_current_admin_user
from app.utils.responses import api_response
from app.models.collection import Collection
from app.models.comment import Comment
from app.models.recipe import Recipe, RecipeStatus, CategoryEnum, DifficultyEnum
from app.models.recipe_submission import RecipeSubmission
from app.models.review import Review
from app.models.user import User
from app.models.notification import Notification

import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin Dashboard"], dependencies=[Depends(get_current_admin_user)])

@router.get("/recipes", response_model=List[dict])
async def list_all_recipes_admin(db: AsyncSession = Depends(get_db)):
    logger.info("Admin fetching all recipes")
    result = await db.execute(select(Recipe).order_by(Recipe.created_at.desc()))
    recipes = result.scalars().all()
    from app.schemas.recipe import RecipeResponse
    data = [RecipeResponse.model_validate(r).model_dump() for r in recipes]
    logger.info(f"Admin found {len(data)} recipes")
    return api_response(True, data=data)

@router.get("/notifications")
async def list_admin_notifications(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
    )
    notifications = result.scalars().all()
    return api_response(True, data=[{
        "id": n.id,
        "title": n.title,
        "message": n.message,
        "type": n.type,
        "recipe_id": n.recipe_id,
        "is_read": n.is_read,
        "created_at": n.created_at
    } for n in notifications])

@router.get("/submissions", response_model=List[dict])
async def list_pending_submissions(db: AsyncSession = Depends(get_db)):
    logger.info("Admin fetching pending submissions")
    # Join with User to get submitter username
    from app.models.user import User
    query = (
        select(Recipe, User.username)
        .join(User, User.id == Recipe.owner_id)
        .where(Recipe.status == RecipeStatus.pending)
        .order_by(Recipe.created_at.desc())
    )
    result = await db.execute(query)
    rows = result.all()
    
    from app.schemas.recipe import RecipeResponse
    data = []
    for r, username in rows:
        dump = RecipeResponse.model_validate(r).model_dump()
        dump["submitter_name"] = username
        data.append(dump)
    
    logger.info(f"Admin found {len(data)} pending submissions")
    return api_response(True, data=data)

@router.post("/recipes/{recipe_id}/approve")
async def approve_recipe(recipe_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Recipe).where(Recipe.id == recipe_id))
    recipe = result.scalars().first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    recipe.status = RecipeStatus.approved
    await db.commit()
    
    # Notify user
    from app.utils.notifications import create_notification
    await create_notification(
        db,
        user_id=recipe.owner_id,
        title="Recipe Approved!",
        message=f"Your recipe '{recipe.title}' has been approved and is now public.",
        type="recipe_approved",
        recipe_id=recipe.id
    )
    
    return api_response(True, message="Recipe approved successfully")

@router.post("/recipes/{recipe_id}/reject")
async def reject_recipe(recipe_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Recipe).where(Recipe.id == recipe_id))
    recipe = result.scalars().first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    recipe.status = RecipeStatus.rejected
    await db.commit()
    
    # Notify user
    from app.utils.notifications import create_notification
    await create_notification(
        db,
        user_id=recipe.owner_id,
        title="Recipe Rejected",
        message=f"Your recipe '{recipe.title}' has been rejected by the admin.",
        type="recipe_rejected",
        recipe_id=recipe.id
    )
    
    return api_response(True, message="Recipe rejected successfully")

@router.get("/dashboard/analytics")
async def get_analytics(db: AsyncSession = Depends(get_db)):
    logger.info("Admin fetching analytics")
    try:
        # Run queries in parallel for better performance
        queries = [
            db.scalar(select(func.count(User.id))),
            db.scalar(select(func.count(Recipe.id))),
            db.scalar(select(func.count(Recipe.id)).where(Recipe.status == RecipeStatus.approved)),
            db.scalar(select(func.count(Recipe.id)).where(Recipe.status == RecipeStatus.rejected)),
            db.scalar(select(func.count(Recipe.id)).where(Recipe.status == RecipeStatus.pending)),
            db.scalar(select(func.count(Collection.id))),
            db.scalar(select(func.count(Review.id))),
            db.scalar(select(func.count(Comment.id)))
        ]
        
        results = await asyncio.gather(*queries)
        users, recipes_all, approved, rejected, pending, collections, reviews, comments = results
        
        # Calculate engagement more dynamically
        # (Total Interactions / Total Users) * 10
        total_interactions = (reviews or 0) + (comments or 0) + (recipes_all or 0)
        engagement_val = int((total_interactions / users * 10)) if users and users > 0 else 0
        engagement_pct = f"{min(engagement_val, 100)}%"

        analytics = {
            "totalUsers": users or 0,
            "totalRecipes": recipes_all or 0,
            "approvedRecipes": approved or 0,
            "rejectedRecipes": rejected or 0,
            "pendingSubmissions": pending or 0,
            "totalCollections": collections or 0,
            "totalReviews": reviews or 0,
            "totalComments": comments or 0,
            "engagement": engagement_pct
        }
        logger.info(f"Analytics query results: {analytics}")
        return api_response(True, data=analytics)
    except Exception as e:
        logger.error(f"Analytics query failed: {str(e)}", exc_info=True)
        return api_response(False, message=f"Database query error: {str(e)}", status_code=500)
    except Exception as e:
        logger.error(f"Analytics query failed: {str(e)}", exc_info=True)
        return api_response(False, message=f"Database query error: {str(e)}", status_code=500)

@router.get("/users")
async def list_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return api_response(True, data=[{
        "id": u.id,
        "email": u.email,
        "username": u.username,
        "role": u.role,
        "is_active": getattr(u, 'is_active', True),
        "created_at": u.created_at
    } for u in users])

@router.post("/users/{user_id}/toggle-status")
async def toggle_user_status(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = not getattr(user, 'is_active', True)
    await db.commit()
    return api_response(True, message=f"User {'activated' if user.is_active else 'blocked'}")

@router.delete("/users/{user_id}")
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    await db.commit()
    return api_response(True, message="User deleted successfully")

@router.delete("/recipes/{recipe_id}")
async def delete_recipe(recipe_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Recipe).where(Recipe.id == recipe_id))
    recipe = result.scalars().first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    owner_id = recipe.owner_id
    recipe_title = recipe.title
    await db.delete(recipe)
    await db.commit()
    
    # Notify user
    from app.utils.notifications import create_notification
    await create_notification(
        db,
        user_id=owner_id,
        title="Recipe Removed",
        message=f"Your recipe '{recipe_title}' has been removed by the administrator.",
        type="recipe_deleted"
    )
    return api_response(True, message="Recipe deleted successfully")
