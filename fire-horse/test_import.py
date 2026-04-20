print("Testing imports...")
try:
    from src.db.base import Base, engine, SessionLocal
    from src.db.session import get_db
    from src.models.user import User
    from src.models.account import Account
    from src.models.strategy import Strategy
    print("All imports successful!")
except Exception as e:
    print(f"Import error: {e}")
    raise
