print("Testing direct imports...")

# Test base imports
try:
    import sys
    import os
    from pathlib import Path
    
    # Add src to Python path
    src_path = str(Path(__file__).parent / 'src')
    if src_path not in sys.path:
        sys.path.insert(0, src_path)
    
    # Try to import base
    from db.base import Base, engine, SessionLocal
    print("Base imports successful!")
    
    # Try to create a session
    db = SessionLocal()
    db.close()
    print("Session creation successful!")
    
    # Try to import User model
    from models.user import User
    print("User model import successful!")
    
    print("All imports successful!")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
