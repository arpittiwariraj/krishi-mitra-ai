"""Application configuration loaded from environment variables."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings for Krishi Mitra AI.

    Secrets are never returned by API endpoints; the health endpoint only
    exposes whether each integration is configured.
    """

    app_name: str = "Krishi Mitra AI"
    api_prefix: str = "/api"
    environment: str = "development"

    database_url: str = (
        "postgresql+psycopg://postgres@127.0.0.1:5433/krishi_mitra_dev"
    )

    jwt_secret_key: str = "development-only-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    openweather_api_key: str = ""

    data_gov_in_api_key: str = ""
    data_gov_in_resource_id: str = "9ef84268-d588-465a-a308-a864a43d0070"
    market_demo_mode: bool = False
    default_transport_cost_per_km: float = 0.0

    frontend_url: str = "http://localhost:5173"
    enable_ai_weather_advisory: bool = False

    max_upload_size_mb: int = 10
    weather_cache_ttl_seconds: int = 600
    market_cache_ttl_seconds: int = 900

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def openai_configured(self) -> bool:
        return bool(self.openai_api_key.strip())

    @property
    def openweather_configured(self) -> bool:
        return bool(self.openweather_api_key.strip())

    @property
    def data_gov_configured(self) -> bool:
        return bool(self.data_gov_in_api_key.strip())

    @property
    def cors_origins(self) -> list[str]:
        origins = {
            self.frontend_url.strip(),
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        }
        return sorted(origin for origin in origins if origin)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
