"""Production configuration must fail closed. Local defaults stay usable."""
import pytest
from pydantic import ValidationError

from app.config import Settings


_CLEARED = (
    "APP_ENV",
    "SECRET_KEY",
    "DATABASE_URL",
    "DEBUG",
    "USE_MOCK",
    "ALLOWED_HOSTS",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REDIRECT_URI",
    "KAKAO_REST_API_KEY",
    "KAKAO_CLIENT_SECRET",
    "KAKAO_REDIRECT_URI",
    "TRUST_PROXY",
)


@pytest.fixture
def clean_env(monkeypatch):
    for key in _CLEARED:
        monkeypatch.delenv(key, raising=False)
    return monkeypatch


def test_development_keeps_local_defaults(clean_env):
    clean_env.setenv("APP_ENV", "development")
    settings = Settings(_env_file=None)
    assert settings.APP_ENV == "development"
    assert settings.is_production is False


def test_production_rejects_default_secret(clean_env):
    clean_env.setenv("APP_ENV", "production")
    clean_env.setenv("DATABASE_URL", "postgresql://rumi:not-the-default@db:5432/rumi_ai")
    clean_env.setenv("ALLOWED_HOSTS", "https://rumi.example")
    clean_env.setenv("DEBUG", "false")
    clean_env.setenv("USE_MOCK", "false")
    with pytest.raises(ValidationError, match="SECRET_KEY"):
        Settings(_env_file=None)


def test_production_rejects_default_database_password(clean_env):
    clean_env.setenv("APP_ENV", "production")
    clean_env.setenv("SECRET_KEY", "a" * 48)
    clean_env.setenv(
        "DATABASE_URL",
        "postgresql://rumi_user:rumi_password@db:5432/rumi_ai",
    )
    clean_env.setenv("ALLOWED_HOSTS", "https://rumi.example")
    clean_env.setenv("DEBUG", "false")
    clean_env.setenv("USE_MOCK", "false")
    with pytest.raises(ValidationError, match="DATABASE_URL"):
        Settings(_env_file=None)


def test_production_accepts_explicit_configuration(clean_env):
    clean_env.setenv("APP_ENV", "production")
    clean_env.setenv("SECRET_KEY", "a" * 48)
    clean_env.setenv("DATABASE_URL", "postgresql://rumi:not-the-default@db:5432/rumi_ai")
    clean_env.setenv("ALLOWED_HOSTS", "https://rumi.example")
    clean_env.setenv("DEBUG", "false")
    clean_env.setenv("USE_MOCK", "false")
    clean_env.setenv("GOOGLE_CLIENT_ID", "google-client")
    clean_env.setenv(
        "GOOGLE_REDIRECT_URI",
        "https://rumi.example/api/auth/google/callback",
    )
    settings = Settings(_env_file=None)
    assert settings.is_production is True
    assert settings.get_allowed_origins() == ["https://rumi.example"]
