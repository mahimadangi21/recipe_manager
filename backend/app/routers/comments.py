from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth_middleware import get_current_user, get_current_admin_user
from app.utils.responses import api_response
from app.models.comment import Comment
from app.models.recipe import Recipe
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentResponse

router = APIRouter(prefix="/recipes/{recipe_id}/comments", tags=["Comments"])
admin_router = APIRouter(prefix="/admin/comments", tags=["Admin Comments"])


@router.get("/", response_model=List[CommentResponse])
async def list_comments(recipe_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Comment).where(Comment.recipe_id == recipe_id, Comment.is_deleted == False).order_by(Comment.created_at.desc())
    )
    comments = result.scalars().all()
    return api_response(True, data=[CommentResponse.model_validate(c).model_dump() for c in comments])


@router.post("/", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    recipe_id: int,
    payload: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    recipe = (await db.execute(select(Recipe).where(Recipe.id == recipe_id))).scalar_one_or_none()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    comment = Comment(recipe_id=recipe_id, user_id=current_user.id, content=payload.content)
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return api_response(True, data=CommentResponse.model_validate(comment).model_dump(), message="Comment posted", status_code=201)


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    recipe_id: int,
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    comment = (
        await db.execute(select(Comment).where(Comment.id == comment_id, Comment.recipe_id == recipe_id))
    ).scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
    comment.is_deleted = True
    await db.commit()
    return api_response(True, message="Comment deleted")


@admin_router.get("/", response_model=List[CommentResponse])
async def list_all_comments(
    admin_user: User = Depends(get_current_admin_user), db: AsyncSession = Depends(get_db)
):
    _ = admin_user
    result = await db.execute(select(Comment).order_by(Comment.created_at.desc()))
    comments = result.scalars().all()
    return api_response(True, data=[CommentResponse.model_validate(c).model_dump() for c in comments])
