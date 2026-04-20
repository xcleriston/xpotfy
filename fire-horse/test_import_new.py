print("Testing imports from base_new...")
try:
    from src.db.base_new import Base, engine, SessionLocal
    print("Base import successful!")
    
    # Test creating a session
    db = SessionLocal()
    db.close()
    print("Session creation successful!")
    
except Exception as e:
    print(f"Import error: {e}")
    raise
