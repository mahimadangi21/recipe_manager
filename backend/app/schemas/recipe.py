from pydantic import BaseModel, Field, conint
from typing import List, Optional
from datetime import datetime
from app.models.recipe import CategoryEnum, DifficultyEnum

class IngredientBase(BaseModel):
    name: str
    quantity: float
    unit: str
    notes: Optional[str] = None

class IngredientCreate(IngredientBase):
    pass

class IngredientResponse(IngredientBase):
    id: int
    recipe_id: int

    model_config = {"from_attributes": True}

class RecipeImageResponse(BaseModel):
    id: int
    url: str
    is_primary: bool
    order: int
    uploaded_at: datetime

    model_config = {"from_attributes": True}

class RecipeBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    instructions: str
    servings: int = Field(4, ge=1)
    prep_time_minutes: Optional[int] = None
    cook_time_minutes: Optional[int] = None
    category: CategoryEnum = CategoryEnum.other
    difficulty: DifficultyEnum = DifficultyEnum.medium
    is_public: bool = True

class RecipeCreate(RecipeBase):
    ingredients: List[IngredientCreate]

class RecipeUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    instructions: Optional[str] = None
    servings: Optional[int] = Field(None, ge=1)
    prep_time_minutes: Optional[int] = None
    cook_time_minutes: Optional[int] = None
    category: Optional[CategoryEnum] = None
    difficulty: Optional[DifficultyEnum] = None
    is_public: Optional[bool] = None
    ingredients: Optional[List[IngredientCreate]] = None

class RecipeResponse(RecipeBase):
    id: int
    is_favorite: bool = False
    share_token: str
    owner_id: Optional[int] = None
    copied_from_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    ingredients: List[IngredientResponse]
    images: List[RecipeImageResponse]
    avg_rating: Optional[float] = 0.0
    review_count: Optional[int] = 0
    rating_distribution: Optional[dict] = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}

    model_config = {"from_attributes": True}
