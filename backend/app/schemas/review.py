from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=1000)

class ReviewCreate(ReviewBase):
    pass

class ReviewUpdate(ReviewBase):
    rating: Optional[int] = Field(None, ge=1, le=5)

class ReviewResponse(ReviewBase):
    id: int
    recipe_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class ReviewSummary(BaseModel):
    avg_rating: float
    review_count: int
    rating_distribution: dict
