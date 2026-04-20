"""
Test configuration and fixtures
"""

import pytest
import asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import get_db, Base
from app.core.config import settings


# Test database URL
TEST_DATABASE_URL = "postgresql://postgres:postgres123@localhost:5432/test_face_recognition"

# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    future=True,
)

# Create test session factory
TestSessionLocal = sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def setup_database():
    """Setup test database"""
    # Create all tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield
    
    # Drop all tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session(setup_database):
    """Create a fresh database session for each test"""
    async with TestSessionLocal() as session:
        yield session
        await session.close()


@pytest.fixture
async def client(db_session):
    """Create test client with database dependency override"""
    # Override database dependency
    app.dependency_overrides[get_db] = lambda: db_session
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    # Clear overrides
    app.dependency_overrides.clear()


@pytest.fixture
async def authenticated_client(client: AsyncClient, db_session: AsyncSession):
    """Create authenticated client"""
    from app.core.security import get_password_hash
    from app.models.user import User
    
    # Create test user
    user = User(
        email="test@example.com",
        name="Test User",
        password_hash=get_password_hash("testpassword123")
    )
    db_session.add(user)
    await db_session.commit()
    
    # Login to get token
    login_response = await client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "testpassword123"
    })
    token = login_response.json()["access_token"]
    
    # Return client with token
    client.headers.update({"Authorization": f"Bearer {token}"})
    yield client
    
    # Remove token
    client.headers.pop("Authorization", None)
