"""
User schemas for API request/response models
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, validator


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    name: str
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    """User creation schema"""
    password: str
    
    @validator("password")
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v


class UserUpdate(BaseModel):
    """User update schema"""
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    email: Optional[EmailStr] = None


class UserLogin(BaseModel):
    """User login schema"""
    email: EmailStr
    password: str


class UserResponse(UserBase):
    """User response schema"""
    id: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None
    photo_count: Optional[int] = 0
    person_count: Optional[int] = 0

    class Config:
        from_attributes = True


class UserInDB(UserResponse):
    """User schema as stored in database"""
    password_hash: str
