from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.orm import Session
from .models import User, get_db
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Security constants
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Token models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Authentication functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate a password hash"""
    return pwd_context.hash(password)

def get_user(db: Session, username: str) -> Optional[User]:
    """Get a user by username"""
    return db.query(User).filter(User.username == username).first()

def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Authenticate a user"""
    user = get_user(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Get the current authenticated user from the token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
        
    user = get_user(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get the current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Password validation
def validate_password_strength(password: str) -> dict:
    """Validate password strength"""
    if len(password) < 8:
        return {"valid": False, "message": "Password must be at least 8 characters long"}
    if not any(char.isdigit() for char in password):
        return {"valid": False, "message": "Password must contain at least one number"}
    if not any(char.isupper() for char in password):
        return {"valid": False, "message": "Password must contain at least one uppercase letter"}
    if not any(char.islower() for char in password):
        return {"valid": False, "message": "Password must contain at least one lowercase letter"}
    return {"valid": True, "message": "Password is strong"}

# User management functions
def create_user(db: Session, username: str, email: str, password: str) -> User:
    """Create a new user""
    # Check if user already exists
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate password strength
    password_validation = validate_password_strength(password)
    if not password_validation["valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=password_validation["message"]
        )
    
    # Hash the password
    hashed_password = get_password_hash(password)
    
    # Create the user
    db_user = User(
        username=username,
        email=email,
        hashed_password=hashed_password,
        is_active=True
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

def update_user(
    db: Session, 
    user_id: int, 
    username: Optional[str] = None, 
    email: Optional[str] = None, 
    password: Optional[str] = None,
    is_active: Optional[bool] = None
) -> User:
    """Update user information"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if username is not None and username != user.username:
        # Check if new username is already taken
        if db.query(User).filter(User.username == username, User.id != user_id).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already in use"
            )
        user.username = username
    
    if email is not None and email != user.email:
        # Check if new email is already in use
        if db.query(User).filter(User.email == email, User.id != user_id).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        user.email = email
    
    if password is not None:
        # Validate new password strength
        password_validation = validate_password_strength(password)
        if not password_validation["valid"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=password_validation["message"]
            )
        user.hashed_password = get_password_hash(password)
    
    if is_active is not None:
        user.is_active = is_active
    
    user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(user)
    
    return user

def delete_user(db: Session, user_id: int) -> bool:
    """Delete a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.delete(user)
    db.commit()
    
    return True
