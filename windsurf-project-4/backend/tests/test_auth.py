"""
Authentication tests
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.models.user import User


class TestAuth:
    """Test authentication endpoints"""
    
    async def test_register_user_success(self, client: AsyncClient, db: AsyncSession):
        """Test successful user registration"""
        user_data = {
            "email": "test@example.com",
            "password": "testpassword123",
            "name": "Test User"
        }
        
        response = await client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["name"] == user_data["name"]
        assert "id" in data
        assert "password_hash" not in data
    
    async def test_register_duplicate_email(self, client: AsyncClient, db: AsyncSession):
        """Test registration with duplicate email"""
        # Create existing user
        existing_user = User(
            email="test@example.com",
            name="Existing User",
            password_hash=get_password_hash("password123")
        )
        db.add(existing_user)
        await db.commit()
        
        user_data = {
            "email": "test@example.com",
            "password": "testpassword123",
            "name": "Test User"
        }
        
        response = await client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]
    
    async def test_login_success(self, client: AsyncClient, db: AsyncSession):
        """Test successful login"""
        # Create user
        user = User(
            email="test@example.com",
            name="Test User",
            password_hash=get_password_hash("testpassword123")
        )
        db.add(user)
        await db.commit()
        
        login_data = {
            "email": "test@example.com",
            "password": "testpassword123"
        }
        
        response = await client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_in" in data
    
    async def test_login_invalid_credentials(self, client: AsyncClient):
        """Test login with invalid credentials"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        
        response = await client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 401
        assert "Incorrect email or password" in response.json()["detail"]
    
    async def test_get_current_user(self, client: AsyncClient, db: AsyncSession):
        """Test getting current user information"""
        # Create and login user
        user = User(
            email="test@example.com",
            name="Test User",
            password_hash=get_password_hash("testpassword123")
        )
        db.add(user)
        await db.commit()
        
        # Login to get token
        login_response = await client.post("/api/v1/auth/login", json={
            "email": "test@example.com",
            "password": "testpassword123"
        })
        token = login_response.json()["access_token"]
        
        # Get current user
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["name"] == "Test User"
    
    async def test_get_current_user_invalid_token(self, client: AsyncClient):
        """Test getting current user with invalid token"""
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        
        assert response.status_code == 401
    
    async def test_logout(self, client: AsyncClient, db: AsyncSession):
        """Test logout"""
        # Create and login user
        user = User(
            email="test@example.com",
            name="Test User",
            password_hash=get_password_hash("testpassword123")
        )
        db.add(user)
        await db.commit()
        
        # Login to get token
        login_response = await client.post("/api/v1/auth/login", json={
            "email": "test@example.com",
            "password": "testpassword123"
        })
        token = login_response.json()["access_token"]
        
        # Logout
        response = await client.post(
            "/api/v1/auth/logout",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        assert response.json()["message"] == "Successfully logged out"
