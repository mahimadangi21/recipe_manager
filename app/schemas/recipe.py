from typing import List, Optional
from pydantic import BaseModel, Field, validator, ConfigDict
from datetime import datetime
from app.models.recipe import CategoryEnum, DifficultyEnum

# --- Ingredient Schemas ---

class IngredientBase(BaseModel):
    name: str
    quantity: float = Field(gt=0)
    unit: str
    notes: Optional[str] = None

class IngredientCreate(IngredientBase):
    pass

class IngredientUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[float] = Field(None, gt=0)
    unit: Optional[str] = None
    notes: Optional[str] = None

class Ingredient(IngredientBase):
    id: int
    recipe_id: int
    
    model_config = ConfigDict(from_attributes=True)

# --- Recipe Schemas ---

class RecipeBase(BaseModel):
    title: str = Field(max_length=200)
    description: Optional[str] = None
    instructions: str
    servings: int = Field(default=4, ge=1)
    prep_time_minutes: Optional[int] = Field(None, ge=0)
    cook_time_minutes: Optional[int] = Field(None, ge=0)
    category: CategoryEnum
    difficulty: DifficultyEnum
    image_url: Optional[str] = None
    is_favorite: bool = False

class RecipeCreate(RecipeBase):
    ingredients: List[IngredientCreate] = []

class RecipeUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    instructions: Optional[str] = None
    servings: Optional[int] = Field(None, ge=1)
    prep_time_minutes: Optional[int] = Field(None, ge=0)
    cook_time_minutes: Optional[int] = Field(None, ge=0)
    category: Optional[CategoryEnum] = None
    difficulty: Optional[DifficultyEnum] = None
    image_url: Optional[str] = None
    is_favorite: Optional[bool] = None

class Recipe(RecipeBase):
    id: int
    created_at: datetime
    updated_at: datetime
    ingredients: List[Ingredient] = []
    total_time_minutes: Optional[int] = None

    @validator("total_time_minutes", always=True)
    def calculate_total_time(cls, v, values):
        prep = values.get("prep_time_minutes") or 0
        cook = values.get("cook_time_minutes") or 0
        return prep + cook

    model_config = ConfigDict(from_attributes=True)

class RecipeScaled(BaseModel):
    id: int
    title: str
    original_servings: int
    scaled_servings: int
    scale_factor: float
    ingredients: List[IngredientBase]
