"""
Security utilities for authentication and authorization
"""

from datetime import datetime, timedelta
from typing import Any, Union, Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Bearer token scheme
security = HTTPBearer()


def create_access_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create JWT access token
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create JWT refresh token
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
    
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def verify_token(token: str, token_type: str = "access") -> Optional[str]:
    """
    Verify JWT token and return subject
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        token_type_claim: str = payload.get("type")
        
        if user_id is None or token_type_claim != token_type:
            return None
        
        return user_id
    except JWTError:
        return None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password against hash
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Generate password hash
    """
    return pwd_context.hash(password)


async def get_current_user_id(credentials: HTTPAuthorizationCredentials) -> str:
    """
    Get current user ID from JWT token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    user_id = verify_token(credentials.credentials, "access")
    if user_id is None:
        raise credentials_exception
    
    return user_id


def create_token_data_response(
    access_token: str, refresh_token: str, token_type: str = "bearer"
) -> dict:
    """
    Create token response data
    """
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": token_type,
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


def validate_file_extension(filename: str) -> bool:
    """
    Validate file extension against allowed extensions
    """
    if not filename:
        return False
    
    extension = filename.lower().split(".")[-1]
    return extension in settings.ALLOWED_EXTENSIONS


def validate_file_size(file_size: int) -> bool:
    """
    Validate file size against maximum allowed size
    """
    return file_size <= settings.MAX_FILE_SIZE
