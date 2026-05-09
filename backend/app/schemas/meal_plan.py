from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class MealPlanItemCreate(BaseModel):
    recipe_id: int
    plan_date: date
    meal_type: str = Field(default="dinner", max_length=20)
    servings: int = Field(default=1, ge=1, le=50)


class MealPlanRecipeImage(BaseModel):
    url: str
    is_primary: bool
    
    model_config = {"from_attributes": True}

class MealPlanRecipe(BaseModel):
    id: int
    title: str
    images: List[MealPlanRecipeImage] = []
    
    model_config = {"from_attributes": True}

class MealPlanItemResponse(BaseModel):
    id: int
    user_id: int
    recipe_id: int
    plan_date: date
    meal_type: str
    servings: int
    created_at: datetime
    recipe: Optional[MealPlanRecipe] = None

    model_config = {"from_attributes": True}
