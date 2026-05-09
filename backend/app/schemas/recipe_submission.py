from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class RecipeSubmissionCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    payload: Dict[str, Any]


class RecipeSubmissionReview(BaseModel):
    approved: bool
    admin_notes: Optional[str] = Field(default=None, max_length=500)


class RecipeSubmissionResponse(BaseModel):
    id: int
    submitter_id: int
    title: str
    payload: Dict[str, Any]
    status: str
    admin_notes: Optional[str] = None
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}
