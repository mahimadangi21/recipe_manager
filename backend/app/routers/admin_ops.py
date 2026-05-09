from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.recipe import Recipe
from app.models.review import Review
from app.middleware.auth_middleware import get_current_admin_user
from app.utils.responses import api_response

router = APIRouter(prefix="/admin/ops", tags=["Admin Operations"], dependencies=[Depends(get_current_admin_user)])

# --- DASHBOARD ANALYTICS ---
@router.get("/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    # Total counts
    users_count = (await db.execute(select(func.count(User.id)))).scalar()
    recipes_count = (await db.execute(select(func.count(Recipe.id)))).scalar()
    reviews_count = (await db.execute(select(func.count(Review.id)))).scalar()
    
    # We can calculate "pending" if there's an is_approved field, 
    # for now we'll return total recipes as a placeholder for approved
    
    return {
        "success": True,
        "stats": {
            "totalUsers": users_count,
            "totalRecipes": recipes_count,
            "totalReviews": reviews_count,
            "engagement": f"{reviews_count * 10}%" if users_count > 0 else "0%"
        }
    }

# --- USER MANAGEMENT ---
@router.get("/users")
async def list_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return {
        "success": True,
        "users": [{
            "id": u.id,
            "email": u.email,
            "username": u.username,
            "role": u.role,
            "is_active": getattr(u, 'is_active', True),
            "created_at": u.created_at
        } for u in users]
    }

@router.delete("/users/{user_id}")
async def delete_user_admin(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.delete(user)
    await db.commit()
    return api_response(True, message="User removed successfully")

# --- RECIPE MANAGEMENT ---
@router.get("/recipes")
async def list_all_recipes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Recipe).order_by(Recipe.created_at.desc()))
    recipes = result.scalars().all()
    return {
        "success": True,
        "recipes": [{
            "id": r.id,
            "title": r.title,
            "author_id": r.user_id,
            "created_at": r.created_at,
            "is_public": getattr(r, 'is_public', True)
        } for r in recipes]
    }

@router.delete("/recipes/{recipe_id}")
async def delete_recipe_admin(recipe_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Recipe).where(Recipe.id == recipe_id))
    recipe = result.scalars().first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    await db.delete(recipe)
    await db.commit()
    return api_response(True, message="Recipe deleted by admin")
