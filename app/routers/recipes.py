from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import recipe as schemas
from app.services import recipe_service as service

router = APIRouter(prefix="/api/v1/recipes", tags=["Recipes"])

@router.get("/", response_model=List[schemas.Recipe])
def read_recipes(
    skip: int = 0, 
    limit: int = 10,
    search: Optional[str] = None,
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    favorites: Optional[bool] = None,
    max_cook_time: Optional[int] = None,
    db: Session = Depends(get_db)
):
    return service.get_recipes(db, skip=skip, limit=limit, search=search, 
                               category=category, difficulty=difficulty, 
                               favorites=favorites, max_cook_time=max_cook_time)

@router.post("/", response_model=schemas.Recipe, status_code=status.HTTP_201_CREATED)
def create_recipe(recipe: schemas.RecipeCreate, db: Session = Depends(get_db)):
    return service.create_recipe(db=db, recipe=recipe)

@router.get("/{recipe_id}", response_model=schemas.Recipe)
def read_recipe(recipe_id: int, db: Session = Depends(get_db)):
    db_recipe = service.get_recipe(db, recipe_id=recipe_id)
    if db_recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return db_recipe

@router.put("/{recipe_id}", response_model=schemas.Recipe)
def update_recipe(recipe_id: int, recipe: schemas.RecipeUpdate, db: Session = Depends(get_db)):
    db_recipe = service.update_recipe(db, recipe_id=recipe_id, recipe_update=recipe)
    if db_recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return db_recipe

@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    db_recipe = service.delete_recipe(db, recipe_id=recipe_id)
    if db_recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return None

@router.patch("/{recipe_id}/favorite", response_model=schemas.Recipe)
def toggle_favorite(recipe_id: int, db: Session = Depends(get_db)):
    db_recipe = service.toggle_favorite(db, recipe_id=recipe_id)
    if db_recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return db_recipe

@router.get("/{recipe_id}/scale", response_model=schemas.RecipeScaled)
def scale_recipe(recipe_id: int, servings: int = Query(..., ge=1), db: Session = Depends(get_db)):
    scaled = service.scale_recipe(db, recipe_id=recipe_id, servings=servings)
    if scaled is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return scaled
