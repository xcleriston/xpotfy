from typing import Generator
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from .base import SessionLocal

def get_db() -> Generator[Session, None, None]:
    """
    Dependency function that yields database sessions.
    Handles session lifecycle and ensures proper cleanup.
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except SQLAlchemyError as e:
        db.rollback()
        print(f"Database error: {e}")
        raise
    finally:
        db.close()
