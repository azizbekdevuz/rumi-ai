"""
Database connection and session management for RUMI AI backend.
Uses SQLite for local development (no PostgreSQL needed).
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from typing import Generator

# Database URL from environment variable (set by load_dotenv in main.py)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./rumi_ai.db"
)

# SQLite needs connect_args for check_same_thread
connect_args = {}
engine_kwargs = {
    "echo": os.getenv("SQL_ECHO", "false").lower() == "true",
}

if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    **engine_kwargs,
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
