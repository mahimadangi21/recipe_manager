from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.utils.responses import api_response
from app.models.ingredient import Ingredient
from app.models.meal_plan import MealPlanItem
from app.models.recipe import Recipe
from app.models.user import User
from app.schemas.meal_plan import MealPlanItemCreate, MealPlanItemResponse

router = APIRouter(prefix="/meal-planner", tags=["Meal Planner"])


@router.get("/", response_model=List[MealPlanItemResponse])
async def list_plan(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(MealPlanItem).where(MealPlanItem.user_id == current_user.id).options(selectinload(MealPlanItem.recipe).selectinload(Recipe.images)).order_by(MealPlanItem.plan_date.asc())
    if start_date:
        query = query.where(MealPlanItem.plan_date >= start_date)
    if end_date:
        query = query.where(MealPlanItem.plan_date <= end_date)
    result = await db.execute(query)
    items = result.scalars().all()
    return api_response(True, data=[MealPlanItemResponse.model_validate(i).model_dump() for i in items])


@router.post("/", response_model=MealPlanItemResponse, status_code=status.HTTP_201_CREATED)
async def add_plan_item(
    payload: MealPlanItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    recipe = (await db.execute(select(Recipe).where(Recipe.id == payload.recipe_id))).scalar_one_or_none()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    item = MealPlanItem(
        user_id=current_user.id,
        recipe_id=payload.recipe_id,
        plan_date=payload.plan_date,
        meal_type=payload.meal_type,
        servings=payload.servings,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    # Reload with recipe
    item = (await db.execute(select(MealPlanItem).where(MealPlanItem.id == item.id).options(selectinload(MealPlanItem.recipe).selectinload(Recipe.images)))).scalar_one()
    return api_response(True, data=MealPlanItemResponse.model_validate(item).model_dump(), message="Added to meal plan", status_code=201)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_plan_item(
    item_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    item = (
        await db.execute(select(MealPlanItem).where(MealPlanItem.id == item_id, MealPlanItem.user_id == current_user.id))
    ).scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Meal plan item not found")
    await db.delete(item)
    await db.commit()
    return api_response(True, message="Removed from meal plan")


@router.get("/shopping-list")
async def generate_shopping_list(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(MealPlanItem).where(MealPlanItem.user_id == current_user.id)
    if start_date:
        query = query.where(MealPlanItem.plan_date >= start_date)
    if end_date:
        query = query.where(MealPlanItem.plan_date <= end_date)
    plan_items = (await db.execute(query)).scalars().all()

    ingredient_totals: dict[str, dict] = {}
    for item in plan_items:
        ingredients = (
            await db.execute(select(Ingredient).where(Ingredient.recipe_id == item.recipe_id))
        ).scalars().all()
        for ing in ingredients:
            key = f"{ing.name.lower()}::{ing.unit.lower()}"
            existing = ingredient_totals.get(key)
            qty = (ing.quantity or 0) * item.servings
            if existing:
                existing["quantity"] += qty
            else:
                ingredient_totals[key] = {"name": ing.name, "unit": ing.unit, "quantity": qty}

    return api_response(True, data={
        "items": sorted(ingredient_totals.values(), key=lambda x: x["name"].lower()),
        "count": len(ingredient_totals),
    })
