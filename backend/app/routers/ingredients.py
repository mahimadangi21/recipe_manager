from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.utils.responses import api_response
from app.models.recipe import Ingredient as IngredientModel
from app.schemas.recipe import Ingredient as IngredientSchema, IngredientCreate

router = APIRouter(prefix="/recipes/{recipe_id}/ingredients", tags=["Ingredients"])

@router.post("/", response_model=IngredientSchema, status_code=status.HTTP_201_CREATED)
async def add_ingredient(recipe_id: int, ingredient: IngredientCreate, db: AsyncSession = Depends(get_db)):
    db_ing = IngredientModel(**ingredient.model_dump(), recipe_id=recipe_id)
    db.add(db_ing)
    await db.commit()
    await db.refresh(db_ing)
    return api_response(True, data=IngredientSchema.model_validate(db_ing).model_dump(), message="Ingredient added", status_code=201)

@router.put("/{ing_id}", response_model=IngredientSchema)
async def update_ingredient(recipe_id: int, ing_id: int, ingredient: IngredientCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(IngredientModel).where(IngredientModel.id == ing_id, IngredientModel.recipe_id == recipe_id))
    db_ing = result.scalar_one_or_none()
    if not db_ing:
        raise HTTPException(status_code=404, detail="Ingredient not found")
        
    for key, value in ingredient.model_dump().items():
        setattr(db_ing, key, value)
        
    await db.commit()
    await db.refresh(db_ing)
    return api_response(True, data=IngredientSchema.model_validate(db_ing).model_dump(), message="Ingredient updated")

@router.delete("/{ing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ingredient(recipe_id: int, ing_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(IngredientModel).where(IngredientModel.id == ing_id, IngredientModel.recipe_id == recipe_id))
    db_ing = result.scalar_one_or_none()
    if not db_ing:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    await db.delete(db_ing)
    await db.commit()
    return api_response(True, message="Ingredient deleted")
