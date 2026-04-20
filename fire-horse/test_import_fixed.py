print("Testing imports...")

# Test base imports
try:
    from src.db.base import Base, engine, SessionLocal
    print("Base imports successful!")
except Exception as e:
    print(f"Base import error: {e}")
    raise

# Test session import
try:
    from src.db.session import get_db
    print("Session import successful!")
except Exception as e:
    print(f"Session import error: {e}")
    raise

# Test model imports
try:
    from src.models.user import User
    print("User model import successful!")
except Exception as e:
    print(f"User model import error: {e}")
    raise

print("All imports successful!")
