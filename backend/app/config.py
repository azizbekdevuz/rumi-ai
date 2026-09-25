"""
Configuration management for RUMI AI backend.
All env vars are loaded via pydantic-settings from the .env file.
Do NOT use os.getenv() elsewhere — always use `settings.<FIELD>`.
"""
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import ConfigDict, field_validator, model_validator


_DEV_ENVS = {"development", "dev", "local"}
_INSECURE_SECRETS = {
    "your-secret-key-here",
    "your-secret-key-change-in-production",
    "your-secret-key-here-change-in-production",
    "changeme",
    "secret",
    "password",
}


class Settings(BaseSettings):
    """Application settings loaded from .env file via pydantic-settings."""
    
    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra='ignore'  # Ignore extra fields from .env file
    )
    
    # Application
    APP_NAME: str = "RUMI AI Backend"
    APP_VERSION: str = "0.1.0"
    # development (default) keeps local fallbacks. production refuses insecure defaults.
    APP_ENV: str = "development"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = "postgresql://rumi_user:rumi_password@localhost:5432/rumi_ai"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALLOWED_HOSTS: str = "localhost,127.0.0.1"
    # When true, rate limiting uses the single X-Forwarded-For value sent by the
    # Next.js BFF from a private/loopback peer. Enable only when the API port is
    # not published, as in docker-compose.prod.yml.
    TRUST_PROXY: bool = False
    
    # File Storage
    MEDIA_DIR: str = "/app/media"
    MAX_FILE_SIZE: int = 104857600  # 100MB default
    
    def get_allowed_origins(self) -> List[str]:
        """Get CORS allowed origins as a list of URLs."""
        hosts = self.ALLOWED_HOSTS
        raw = [h.strip() for h in hosts.split(",")]
        # Build proper CORS origins (http://host:port)
        origins = []
        for host in raw:
            if host.startswith("http://") or host.startswith("https://"):
                origins.append(host)
            else:
                # Add common dev ports for non-URL hosts
                origins.append(f"http://{host}")
                origins.append(f"http://{host}:3000")
                origins.append(f"http://{host}:3003")
                origins.append(f"http://{host}:8000")
        return origins
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    
    # Redis (for caching and rate limiting)
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # LLM Configuration
    LLM_API_KEY: str = ""
    LLM_API_URL: str = "https://api.openai.com/v1/chat/completions"
    LLM_MODEL: str = "gpt-4"
    USE_MOCK: bool = False
    
    # JWT Configuration
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60  # seconds
    
    # Vector DB (for embeddings)
    VECTOR_DB_URL: str = ""
    
    # ElasticSearch (for full-text search)
    ELASTICSEARCH_URL: str = "http://localhost:9200"

    # RAG / Ollama embedding configuration
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    EMBED_MODEL: str = "nomic-embed-text-v2-moe:latest"
    BOOK_VERSE_DIR: str = ""
    
    # Kakao OAuth Configuration
    KAKAO_REST_API_KEY: str = ""
    KAKAO_CLIENT_SECRET: Optional[str] = None
    KAKAO_REDIRECT_URI: str = ""

    # Google OAuth Configuration
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = ""

    @field_validator("APP_ENV", mode="before")
    @classmethod
    def normalize_app_env(cls, value: object) -> str:
        if value is None:
            return "development"
        normalized = str(value).strip().lower()
        if normalized == "" or normalized in _DEV_ENVS:
            return "development"
        if normalized in {"production", "prod"}:
            return "production"
        return normalized

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @model_validator(mode="after")
    def validate_production_safety(self) -> "Settings":
        """Refuse to boot production with placeholder secrets or debug flags."""
        if not self.is_production:
            return self

        problems: List[str] = []
        secret = self.SECRET_KEY.strip()
        lowered = secret.lower()
        if (
            len(secret) < 32
            or lowered in _INSECURE_SECRETS
            or lowered.startswith("replace-with")
            or "change-in-production" in lowered
            or "changeme" in lowered
        ):
            problems.append(
                "SECRET_KEY must be a unique random value of at least 32 characters"
            )

        database_url = self.DATABASE_URL.lower()
        if (
            not self.DATABASE_URL.strip()
            or "rumi_password" in database_url
            or "replace-with" in database_url
        ):
            problems.append(
                "DATABASE_URL must be set to a non-default production database URL"
            )

        if self.DEBUG:
            problems.append("DEBUG must be false in production")
        if self.USE_MOCK:
            problems.append("USE_MOCK must be false in production")
        if not any(origin.startswith("https://") for origin in self.get_allowed_origins()):
            problems.append(
                "ALLOWED_HOSTS must include the public https origin, for example https://example.com"
            )
        if self.GOOGLE_CLIENT_ID and not self.GOOGLE_REDIRECT_URI.startswith("https://"):
            problems.append(
                "GOOGLE_REDIRECT_URI must be an https URL when Google login is enabled"
            )
        if self.KAKAO_REST_API_KEY and not self.KAKAO_REDIRECT_URI.startswith("https://"):
            problems.append(
                "KAKAO_REDIRECT_URI must be an https URL when Kakao login is enabled"
            )

        if problems:
            detail = "\n- ".join(problems)
            raise ValueError(
                "Refusing to start with unsafe production configuration:\n- " + detail
            )
        return self


settings = Settings()
