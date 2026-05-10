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


@router.get("/", response_model=List[dict])
async def list_plan(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(MealPlanItem).where(MealPlanItem.user_id == current_user.id).options(selectinload(MealPlanItem.recipe).selectinload(Recipe.images)).order_by(MealPlanItem.planned_date.asc())
    if start_date:
        query = query.where(MealPlanItem.planned_date >= start_date)
    if end_date:
        query = query.where(MealPlanItem.planned_date <= end_date)
    result = await db.execute(query)
    items = result.scalars().all()
    return api_response(True, data=[MealPlanItemResponse.model_validate(i).model_dump() for i in items])


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def add_plan_item(
    payload: MealPlanItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    import logging
    logger = logging.getLogger(__name__)
    try:
        logger.info(f"MEAL_PLAN: Adding plan item for user {current_user.id}, recipe {payload.recipe_id}")
        # Use explicit SELECT for validation
        recipe = (await db.execute(select(Recipe).where(Recipe.id == payload.recipe_id))).scalar_one_or_none()
        if not recipe:
            logger.warning(f"MEAL_PLAN: Recipe {payload.recipe_id} not found")
            raise HTTPException(status_code=404, detail="Recipe not found")

        item = MealPlanItem(
            user_id=current_user.id,
            recipe_id=payload.recipe_id,
            planned_date=payload.planned_date,
            meal_type=payload.meal_type,
            servings=payload.servings,
        )
        db.add(item)
        await db.commit()
        await db.refresh(item)
        
        # Reload with recipe images
        stmt = select(MealPlanItem).where(MealPlanItem.id == item.id).options(selectinload(MealPlanItem.recipe).selectinload(Recipe.images))
        item = (await db.execute(stmt)).scalar_one()
        logger.info(f"MEAL_PLAN: Added successfully item {item.id}")
        return api_response(True, data=MealPlanItemResponse.model_validate(item).model_dump(), message="Added to meal plan", status_code=201)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"MEAL_PLAN: Server error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@router.delete("/{item_id}")
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


@router.get("/shopping-list", response_model=List[dict])
async def get_shopping_list(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models.meal_plan import ShoppingListItem
    from app.schemas.meal_plan import ShoppingListItemResponse
    
    result = await db.execute(
        select(ShoppingListItem)
        .where(ShoppingListItem.user_id == current_user.id)
        .options(selectinload(ShoppingListItem.recipe))
        .order_by(ShoppingListItem.created_at.desc())
    )
    items = result.scalars().all()
    return api_response(True, data=[ShoppingListItemResponse.model_validate(i).model_dump() for i in items])


@router.post("/shopping-list/generate")
async def generate_shopping_list(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models.meal_plan import ShoppingListItem
    
    # Get plan items
    query = select(MealPlanItem).where(MealPlanItem.user_id == current_user.id)
    if start_date:
        query = query.where(MealPlanItem.planned_date >= start_date)
    if end_date:
        query = query.where(MealPlanItem.planned_date <= end_date)
    plan_items = (await db.execute(query)).scalars().all()

    # Aggregate ingredients
    ingredient_totals: dict[str, dict] = {}
    for item in plan_items:
        # Get recipe base servings to scale correctly
        recipe_stmt = select(Recipe.servings).where(Recipe.id == item.recipe_id)
        recipe_servings = (await db.execute(recipe_stmt)).scalar() or 1
        scale_factor = item.servings / recipe_servings

        ingredients = (
            await db.execute(select(Ingredient).where(Ingredient.recipe_id == item.recipe_id))
        ).scalars().all()
        for ing in ingredients:
            key = f"{ing.name.lower()}::{ing.unit.lower()}"
            existing = ingredient_totals.get(key)
            qty_val = (ing.quantity or 0) * scale_factor
            if existing:
                existing["quantity_num"] += qty_val
                # Keep one recipe_id for reference (optional)
            else:
                ingredient_totals[key] = {
                    "name": ing.name, 
                    "unit": ing.unit, 
                    "quantity_num": qty_val,
                    "recipe_id": item.recipe_id
                }

    # Clear existing list (optional, but usually desired for a fresh start)
    from sqlalchemy import delete
    await db.execute(delete(ShoppingListItem).where(ShoppingListItem.user_id == current_user.id))

    # Save to DB
    new_items = []
    for data in ingredient_totals.values():
        qty_num = round(data["quantity_num"], 2)
        # Format nicely: remove trailing zeros (1.50 -> 1.5, 2.00 -> 2)
        qty_str = f"{qty_num:g} {data['unit'].lower()}"
        new_item = ShoppingListItem(
            user_id=current_user.id,
            recipe_id=data["recipe_id"],
            ingredient_name=data["name"],
            quantity=qty_str,
            checked=False
        )
        db.add(new_item)
        new_items.append(new_item)
    
    await db.commit()
    return api_response(True, message=f"Generated {len(new_items)} items in shopping list")


@router.put("/shopping-list/{item_id}")
async def update_shopping_item(
    item_id: int,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.models.meal_plan import ShoppingListItem
    item = (await db.execute(select(ShoppingListItem).where(ShoppingListItem.id == item_id, ShoppingListItem.user_id == current_user.id))).scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if "checked" in payload:
        item.checked = payload["checked"]
        
    await db.commit()
    return api_response(True, message="Updated successfully")


@router.delete("/shopping-list/{item_id}")
async def delete_shopping_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.models.meal_plan import ShoppingListItem
    item = (await db.execute(select(ShoppingListItem).where(ShoppingListItem.id == item_id, ShoppingListItem.user_id == current_user.id))).scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    await db.delete(item)
    await db.commit()
    return api_response(True, message="Deleted successfully")
