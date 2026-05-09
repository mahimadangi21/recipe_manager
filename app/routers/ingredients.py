from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import recipe as schemas
from app.services import recipe_service as service

router = APIRouter(prefix="/api/v1/recipes", tags=["Ingredients"])

@router.post("/{recipe_id}/ingredients", response_model=schemas.Ingredient, status_code=status.HTTP_201_CREATED)
def add_ingredient(recipe_id: int, ingredient: schemas.IngredientCreate, db: Session = Depends(get_db)):
    db_ing = service.add_ingredient(db, recipe_id=recipe_id, ingredient=ingredient)
    if db_ing is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return db_ing

@router.put("/{recipe_id}/ingredients/{ing_id}", response_model=schemas.Ingredient)
def update_ingredient(recipe_id: int, ing_id: int, ingredient: schemas.IngredientUpdate, db: Session = Depends(get_db)):
    db_ing = service.update_ingredient(db, recipe_id=recipe_id, ing_id=ing_id, ingredient_update=ingredient)
    if db_ing is None:
        raise HTTPException(status_code=404, detail="Ingredient or Recipe not found")
    return db_ing

@router.delete("/{recipe_id}/ingredients/{ing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ingredient(recipe_id: int, ing_id: int, db: Session = Depends(get_db)):
    db_ing = service.delete_ingredient(db, recipe_id=recipe_id, ing_id=ing_id)
    if db_ing is None:
        raise HTTPException(status_code=404, detail="Ingredient or Recipe not found")
    return None
