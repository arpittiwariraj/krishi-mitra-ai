"""Tests for application configuration and settings."""

from app.config import Settings


class TestSettings:
    def test_defaults(self):
        s = Settings()
        assert s.app_name == "Krishi Mitra AI"
        assert s.api_prefix == "/api"
        assert s.environment == "development"

    def test_database_url_present(self):
        s = Settings()
        assert s.database_url.startswith("postgresql")

    def test_openai_not_configured_by_default(self):
        assert not Settings().openai_configured

    def test_openweather_not_configured_by_default(self):
        assert not Settings().openweather_configured

    def test_data_gov_not_configured_by_default(self):
        assert not Settings().data_gov_configured

    def test_cors_origins(self):
        s = Settings(frontend_url="http://localhost:5173")
        origins = s.cors_origins
        assert "http://localhost:5173" in origins
