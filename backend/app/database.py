"""
Database connection and session management for RUMI AI backend.
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from typing import Generator

# Database URL from environment variable (set by load_dotenv in main.py)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://rumi_user:rumi_password@localhost:5432/rumi_ai"
)

# Create SQLAlchemy engine
# Use a standard connection pool instead of NullPool so that connections
# are reused across requests and lazy-loaded attributes still work after
# session operations like commit / flush.
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    echo=os.getenv("DEBUG", "False").lower() == "true"
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()


def get_db() -> Generator:
    """
    Dependency function to get database session.
    Yields a database session and ensures it's closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
