from datetime import datetime
from pydantic import BaseModel, Field


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)


class CommentResponse(BaseModel):
    id: int
    recipe_id: int
    user_id: int
    content: str
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
