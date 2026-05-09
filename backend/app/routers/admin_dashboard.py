from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.middleware.auth_middleware import get_current_admin_user
from app.utils.responses import api_response
from app.models.collection import Collection
from app.models.comment import Comment
from app.models.recipe import Recipe
from app.models.recipe_submission import RecipeSubmission
from app.models.review import Review
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"], dependencies=[Depends(get_current_admin_user)])

@router.get("/recipes", response_model=List[dict])
async def list_all_recipes_admin(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Recipe).order_by(Recipe.created_at.desc()))
    recipes = result.scalars().all()
    from app.schemas.recipe import RecipeResponse
    return api_response(True, data=[RecipeResponse.model_validate(r).model_dump() for r in recipes])

@router.get("/dashboard/analytics")
async def get_analytics(db: AsyncSession = Depends(get_db)):
    users = await db.scalar(select(func.count(User.id)))
    recipes = await db.scalar(select(func.count(Recipe.id)))
    collections = await db.scalar(select(func.count(Collection.id)))
    reviews = await db.scalar(select(func.count(Review.id)))
    comments = await db.scalar(select(func.count(Comment.id)))
    pending_submissions = await db.scalar(
        select(func.count(RecipeSubmission.id)).where(RecipeSubmission.status == "pending")
    )
    return api_response(True, data={
        "totalUsers": users or 0,
        "totalRecipes": recipes or 0,
        "totalCollections": collections or 0,
        "totalReviews": reviews or 0,
        "totalComments": comments or 0,
        "pendingReviews": pending_submissions or 0,
        "engagement": f"{((reviews or 0) + (comments or 0)) * 5}%" if users else "0%"
    })

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
    await db.delete(recipe)
    await db.commit()
    return api_response(True, message="Recipe deleted successfully")
