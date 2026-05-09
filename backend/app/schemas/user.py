from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., max_length=50)
    avatar_url: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=300)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, max_length=50)
    avatar_url: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=300)

class UserPasswordUpdate(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8)

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
