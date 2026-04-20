"""
Token schemas for authentication
"""

from pydantic import BaseModel


class Token(BaseModel):
    """Token response schema"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenRefresh(BaseModel):
    """Token refresh request schema"""
    refresh_token: str


class TokenData(BaseModel):
    """Token data schema"""
    user_id: str = None
    token_type: str = None
