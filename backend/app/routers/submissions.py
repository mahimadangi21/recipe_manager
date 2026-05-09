from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth_middleware import get_current_user, get_current_admin_user
from app.utils.responses import api_response
from app.utils.notifications import create_notification, notify_admins
from app.models.ingredient import Ingredient
from app.models.recipe import Recipe
from app.models.recipe_submission import RecipeSubmission
from app.models.user import User
from app.schemas.recipe_submission import (
    RecipeSubmissionCreate,
    RecipeSubmissionResponse,
    RecipeSubmissionReview,
)

router = APIRouter(prefix="/submissions", tags=["Recipe Submissions"])
admin_router = APIRouter(prefix="/admin/submissions", tags=["Admin Submissions"])


@router.get("/", response_model=List[RecipeSubmissionResponse])
async def list_my_submissions(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(RecipeSubmission).where(RecipeSubmission.submitter_id == current_user.id).order_by(RecipeSubmission.created_at.desc())
    )
    submissions = result.scalars().all()
    return api_response(True, data=[RecipeSubmissionResponse.model_validate(s).model_dump() for s in submissions])


@router.post("/", response_model=RecipeSubmissionResponse, status_code=status.HTTP_201_CREATED)
async def submit_recipe(
    payload: RecipeSubmissionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    submission = RecipeSubmission(
        submitter_id=current_user.id,
        title=payload.title,
        payload=payload.payload,
        status="pending",
    )
    db.add(submission)
    await db.commit()
    await db.refresh(submission)
    
    # Notify admins
    await notify_admins(
        db,
        title="New Recipe Submission",
        message=f"User {current_user.username} submitted a new recipe: {submission.title}",
        type="submission"
    )
    
    return api_response(True, data=RecipeSubmissionResponse.model_validate(submission).model_dump(), message="Recipe submitted for review", status_code=201)


@admin_router.get("/", response_model=List[RecipeSubmissionResponse])
async def list_all_submissions(
    status_filter: str | None = None,
    admin_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    _ = admin_user
    query = select(RecipeSubmission).order_by(RecipeSubmission.created_at.desc())
    if status_filter:
        query = query.where(RecipeSubmission.status == status_filter)
    result = await db.execute(query)
    submissions = result.scalars().all()
    return api_response(True, data=[RecipeSubmissionResponse.model_validate(s).model_dump() for s in submissions])


@admin_router.post("/{submission_id}/review", response_model=RecipeSubmissionResponse)
async def review_submission(
    submission_id: int,
    payload: RecipeSubmissionReview,
    admin_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    submission = (
        await db.execute(select(RecipeSubmission).where(RecipeSubmission.id == submission_id))
    ).scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission.status != "pending":
        raise HTTPException(status_code=409, detail="Submission already reviewed")

    submission.status = "approved" if payload.approved else "rejected"
    submission.admin_notes = payload.admin_notes
    submission.reviewed_by = admin_user.id
    submission.reviewed_at = datetime.now(timezone.utc)

    if payload.approved:
        data = submission.payload or {}
        recipe = Recipe(
            title=data.get("title", submission.title),
            description=data.get("description"),
            instructions=data.get("instructions", ""),
            servings=data.get("servings", 4),
            prep_time_minutes=data.get("prep_time_minutes"),
            cook_time_minutes=data.get("cook_time_minutes"),
            category=data.get("category", "other"),
            difficulty=data.get("difficulty", "medium"),
            is_public=bool(data.get("is_public", True)),
            owner_id=submission.submitter_id,
        )
        for ing in data.get("ingredients", []):
            recipe.ingredients.append(
                Ingredient(
                    name=ing.get("name", ""),
                    quantity=float(ing.get("quantity", 0)),
                    unit=ing.get("unit", "unit"),
                    notes=ing.get("notes"),
                )
            )
        db.add(recipe)

    await db.commit()
    await db.refresh(submission)
    
    # Notify user
    status_text = "approved" if payload.approved else "rejected"
    await create_notification(
        db,
        user_id=submission.submitter_id,
        title=f"Recipe {status_text.capitalize()}",
        message=f"Your recipe submission '{submission.title}' has been {status_text}.",
        type="submission_review"
    )
    
    return api_response(True, data=RecipeSubmissionResponse.model_validate(submission).model_dump(), message=f"Submission {'approved' if payload.approved else 'rejected'}")
