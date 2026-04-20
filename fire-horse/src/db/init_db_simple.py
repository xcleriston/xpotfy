import os
import sys
import logging
from pathlib import Path

from sqlalchemy.orm import Session

from .base import Base, engine, SessionLocal
from ..models.user import User

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def init_db(db: Session) -> None:
    """Initialize the database with default data."""
    try:
        # Create all tables
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise

if __name__ == "__main__":
    # Create database directory if it doesn't exist
    db_dir = Path("C:/Users/Ivan Xavier/CascadeProjects/fire-horse/data")
    os.makedirs(db_dir, exist_ok=True)
    
    # Initialize the database
    db = SessionLocal()
    try:
        init_db(db)
        logger.info("Database initialization completed successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        sys.exit(1)
    finally:
        db.close()
