"""
Configuration management for RUMI AI backend.
"""
import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    """Application settings."""
    
    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra='ignore'  # Ignore extra fields from .env file
    )
    
    # Application
    APP_NAME: str = "RUMI AI Backend"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://rumi_user:rumi_password@localhost:5432/rumi_ai"
    )
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    _allowed_hosts: str = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1")
    
    # File Storage
    MEDIA_DIR: str = os.getenv("MEDIA_DIR", "/app/media")
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", "104857600"))  # 100MB default
    
    @property
    def ALLOWED_HOSTS(self) -> List[str]:
        """Get ALLOWED_HOSTS as a list."""
        hosts = self._allowed_hosts
        return [h.strip() for h in hosts.split(",")]
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    
    # Redis (for caching and rate limiting)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # LLM Configuration
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_API_URL: str = os.getenv("LLM_API_URL", "https://api.openai.com/v1/chat/completions")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4")
    
    # JWT Configuration
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
    RATE_LIMIT_WINDOW: int = int(os.getenv("RATE_LIMIT_WINDOW", "60"))  # seconds
    
    # Vector DB (for embeddings)
    VECTOR_DB_URL: str = os.getenv("VECTOR_DB_URL", "")
    
    # ElasticSearch (for full-text search)
    ELASTICSEARCH_URL: str = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")


settings = Settings()
