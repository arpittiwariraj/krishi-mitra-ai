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

    # OpenRouter (unified multi-provider router) — used instead of direct
    # api.openai.com when an OpenRouter API key is supplied.
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_api_key: str = ""
    openrouter_model: str = "openai/gpt-4o-mini"
    openrouter_http_referer: str = "https://krishimitra.example"
    openrouter_title: str = "Krishi Mitra AI"

    # Gemini (Google AI) — alternative AI backend for Hindi voice and text
    # advisory. When a Gemini API key is supplied it is preferred over the
    # older direct OpenAI client.
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    gemini_http_referer: str = "https://krishimitra.example"
    gemini_title: str = "Krishi Mitra AI"

    openweather_api_key: str = ""

    data_gov_in_api_key: str = ""
    data_gov_in_resource_id: str = "9ef84268-d588-465a-a308-a864a43d0070"
    # How the market-price service obtains mandi data. "hardcoded" (default) uses
    # the reference data in knowledge_base/market_hardcoded_data.json so the app
    # works with no live API key; "api" calls data.gov.in / AGMARKNET (needs
    # DATA_GOV_IN_API_KEY); "demo" returns the labelled demonstration file.
    market_data_mode: str = "hardcoded"
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
    def openrouter_configured(self) -> bool:
        return bool(self.openrouter_api_key.strip())

    @property
    def openweather_configured(self) -> bool:
        return bool(self.openweather_api_key.strip())

    @property
    def gemini_configured(self) -> bool:
        return bool(self.gemini_api_key.strip())

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
