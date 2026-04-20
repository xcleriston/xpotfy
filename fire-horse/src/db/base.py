from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from pathlib import Path

# Ensure the database directory exists
DB_DIR = Path("C:/Users/Ivan Xavier/CascadeProjects/fire-horse/data")
os.makedirs(DB_DIR, exist_ok=True)

# Update database URL for Windows
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_DIR}/fire_horse.db"

# Create SQLAlchemy engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=True  # Enable SQL query logging
)

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False
)

Base = declarative_base()
