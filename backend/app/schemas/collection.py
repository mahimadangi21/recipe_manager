from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.schemas.recipe import RecipeResponse

class CollectionBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    is_public: bool = False

class CollectionCreate(CollectionBase):
    pass

class CollectionUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    is_public: Optional[bool] = None

class CollectionResponse(CollectionBase):
    id: int
    owner_id: int
    created_at: datetime
    recipes: List[RecipeResponse] = []

    model_config = {"from_attributes": True}
