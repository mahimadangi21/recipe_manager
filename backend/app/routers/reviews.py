from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.recipe import Recipe as RecipeModel
from app.models.review import Review as ReviewModel
from app.schemas.review import ReviewCreate, ReviewUpdate, ReviewResponse, ReviewSummary
from app.middleware.auth_middleware import get_current_user
from app.utils.responses import api_response

router = APIRouter(prefix="/recipes/{recipe_id}/reviews", tags=["Reviews"])

@router.get("/", response_model=List[ReviewResponse])
async def list_reviews(recipe_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ReviewModel).where(ReviewModel.recipe_id == recipe_id))
    reviews = result.scalars().all()
    return api_response(True, data=[ReviewResponse.model_validate(r).model_dump() for r in reviews])

@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(recipe_id: int, review: ReviewCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RecipeModel).where(RecipeModel.id == recipe_id))
    recipe = result.scalar_one_or_none()
    
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
        
    if recipe.owner_id == current_user.id:
        raise HTTPException(status_code=403, detail="Cannot review your own recipe")
        
    # Check if already reviewed
    check = await db.execute(select(ReviewModel).where(ReviewModel.recipe_id == recipe_id, ReviewModel.user_id == current_user.id))
    if check.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="You have already reviewed this recipe")
        
    db_review = ReviewModel(
        recipe_id=recipe_id,
        user_id=current_user.id,
        rating=review.rating,
        comment=review.comment
    )
    db.add(db_review)
    await db.commit()
    await db.refresh(db_review)
    return api_response(True, data=ReviewResponse.model_validate(db_review).model_dump(), message="Review posted", status_code=201)

@router.put("/{review_id}", response_model=ReviewResponse)
async def update_review(recipe_id: int, review_id: int, review: ReviewUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ReviewModel).where(ReviewModel.id == review_id, ReviewModel.recipe_id == recipe_id))
    db_review = result.scalar_one_or_none()
    
    if not db_review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    if db_review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this review")
        
    if review.rating is not None:
        db_review.rating = review.rating
    if review.comment is not None:
        db_review.comment = review.comment
        
    await db.commit()
    await db.refresh(db_review)
    return api_response(True, data=ReviewResponse.model_validate(db_review).model_dump(), message="Review updated")

@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(recipe_id: int, review_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ReviewModel).where(ReviewModel.id == review_id, ReviewModel.recipe_id == recipe_id))
    db_review = result.scalar_one_or_none()
    
    if not db_review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    if not current_user.is_admin and db_review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this review")
        
    await db.delete(db_review)
    await db.commit()
    return api_response(True, message="Review deleted")

@router.get("/summary", response_model=ReviewSummary)
async def get_review_summary(recipe_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ReviewModel).where(ReviewModel.recipe_id == recipe_id))
    reviews = result.scalars().all()
    
    count = len(reviews)
    if count == 0:
        return ReviewSummary(avg_rating=0.0, review_count=0, rating_distribution={"1": 0, "2": 0, "3": 0, "4": 0, "5": 0})
        
    avg = sum(r.rating for r in reviews) / count
    dist = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
    for r in reviews:
        dist[str(r.rating)] += 1
        
    return api_response(True, data={
        "avg_rating": round(avg, 1),
        "review_count": count,
        "rating_distribution": dist
    })
