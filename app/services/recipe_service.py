from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.recipe import Recipe, Ingredient
from app.schemas.recipe import RecipeCreate, RecipeUpdate, IngredientCreate, IngredientUpdate, RecipeScaled, IngredientBase
from fastapi import HTTPException, status

def get_recipes(db: Session, skip: int = 0, limit: int = 10, 
                search: str = None, category: str = None, 
                difficulty: str = None, favorites: bool = None,
                max_cook_time: int = None):
    query = db.query(Recipe)
    
    if search:
        query = query.filter(or_(
            Recipe.title.ilike(f"%{search}%"),
            Recipe.description.ilike(f"%{search}%")
        ))
    
    if category:
        query = query.filter(Recipe.category == category)
        
    if difficulty:
        query = query.filter(Recipe.difficulty == difficulty)
        
    if favorites is not None:
        query = query.filter(Recipe.is_favorite == favorites)
        
    if max_cook_time is not None:
        query = query.filter(Recipe.cook_time_minutes <= max_cook_time)
        
    return query.offset(skip).limit(limit).all()

def get_recipe(db: Session, recipe_id: int):
    return db.query(Recipe).filter(Recipe.id == recipe_id).first()

def create_recipe(db: Session, recipe: RecipeCreate):
    # Check for unique title
    existing = db.query(Recipe).filter(Recipe.title.ilike(recipe.title)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Recipe with title '{recipe.title}' already exists"
        )
    
    db_recipe = Recipe(
        title=recipe.title,
        description=recipe.description,
        instructions=recipe.instructions,
        servings=recipe.servings,
        prep_time_minutes=recipe.prep_time_minutes,
        cook_time_minutes=recipe.cook_time_minutes,
        category=recipe.category,
        difficulty=recipe.difficulty,
        image_url=recipe.image_url,
        is_favorite=recipe.is_favorite
    )
    db.add(db_recipe)
    db.flush() # To get the id
    
    for ing in recipe.ingredients:
        db_ing = Ingredient(**ing.dict(), recipe_id=db_recipe.id)
        db.add(db_ing)
    
    db.commit()
    db.refresh(db_recipe)
    return db_recipe

def update_recipe(db: Session, recipe_id: int, recipe_update: RecipeUpdate):
    db_recipe = get_recipe(db, recipe_id)
    if not db_recipe:
        return None
    
    update_data = recipe_update.dict(exclude_unset=True)
    
    if "title" in update_data:
        existing = db.query(Recipe).filter(
            Recipe.title.ilike(update_data["title"]), 
            Recipe.id != recipe_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Recipe with title '{update_data['title']}' already exists"
            )

    for key, value in update_data.items():
        setattr(db_recipe, key, value)
        
    db.commit()
    db.refresh(db_recipe)
    return db_recipe

def delete_recipe(db: Session, recipe_id: int):
    db_recipe = get_recipe(db, recipe_id)
    if not db_recipe:
        return None
    db.delete(db_recipe)
    db.commit()
    return db_recipe

def toggle_favorite(db: Session, recipe_id: int):
    db_recipe = get_recipe(db, recipe_id)
    if not db_recipe:
        return None
    db_recipe.is_favorite = not db_recipe.is_favorite
    db.commit()
    db.refresh(db_recipe)
    return db_recipe

def scale_recipe(db: Session, recipe_id: int, servings: int):
    db_recipe = get_recipe(db, recipe_id)
    if not db_recipe:
        return None
    
    scale_factor = servings / db_recipe.servings
    scaled_ingredients = []
    
    for ing in db_recipe.ingredients:
        scaled_ingredients.append(IngredientBase(
            name=ing.name,
            quantity=round(ing.quantity * scale_factor, 2),
            unit=ing.unit,
            notes=ing.notes
        ))
        
    return RecipeScaled(
        id=db_recipe.id,
        title=db_recipe.title,
        original_servings=db_recipe.servings,
        scaled_servings=servings,
        scale_factor=scale_factor,
        ingredients=scaled_ingredients
    )

# Ingredient specific services
def add_ingredient(db: Session, recipe_id: int, ingredient: IngredientCreate):
    db_recipe = get_recipe(db, recipe_id)
    if not db_recipe:
        return None
    db_ing = Ingredient(**ingredient.dict(), recipe_id=recipe_id)
    db.add(db_ing)
    db.commit()
    db.refresh(db_ing)
    return db_ing

def update_ingredient(db: Session, recipe_id: int, ing_id: int, ingredient_update: IngredientUpdate):
    db_ing = db.query(Ingredient).filter(Ingredient.id == ing_id, Ingredient.recipe_id == recipe_id).first()
    if not db_ing:
        return None
    
    update_data = ingredient_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_ing, key, value)
        
    db.commit()
    db.refresh(db_ing)
    return db_ing

def delete_ingredient(db: Session, recipe_id: int, ing_id: int):
    db_ing = db.query(Ingredient).filter(Ingredient.id == ing_id, Ingredient.recipe_id == recipe_id).first()
    if not db_ing:
        return None
    db.delete(db_ing)
    db.commit()
    return db_ing
