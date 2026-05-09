from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class OTPRequest(BaseModel):
    email: EmailStr
    type: str # 'signup' or 'reset'

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    type: str

class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str
