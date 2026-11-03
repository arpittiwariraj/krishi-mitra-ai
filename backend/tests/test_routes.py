"""Integration tests for the FastAPI routes (TestClient + real test DB)."""

import io
import pytest
from fastapi.testclient import TestClient

from app.config import settings


class TestHealth:
    def test_health_reports_configuration(self, client):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["database"]["connected"] is True  # test DB is live
        services = data["services"]
        # Test env carries no AI keys: AI service is "not configured".
        assert services["ai"]["configured"] is False
        assert services["ai"]["method"] == "not configured"
        assert services["ai"]["openai_api_key_configured"] is False
        assert services["ai"]["openrouter_configured"] is False
        assert services["openweather"]["configured"] is False
        assert services["market"]["data_gov_in"]["configured"] is False


class TestAuth:
    def test_register_sanitizes_phone(self, client):
        resp = client.post(
            "/api/auth/register",
            json={
                "full_name": "Ramesh Patel",
                "email": "ramesh@example.com",
                "password": "Password123",
                "phone": "+919876543210",
                "state": "Maharashtra",
                "district": "Pune",
                "preferred_language": "en",
            },
        )
        assert resp.status_code == 201
        body = resp.json()["data"]
        # The validator strips spaces/dashes and keeps the leading '+'.
        assert body["farmer"]["phone"] == "+919876543210"

    def test_register_duplicate_email_rejected(self, client):
        client.post(
            "/api/auth/register",
            json={
                "full_name": "Duplicate",
                "email": "dup@example.com",
                "password": "Password123",
                "phone": "+919876543210",
                "state": "Maharashtra",
                "district": "Pune",
                "preferred_language": "en",
            },
        )
        resp = client.post(
            "/api/auth/register",
            json={
                "full_name": "Duplicate",
                "email": "dup@example.com",
                "password": "Password123",
                "phone": "+919876543210",
                "state": "Maharashtra",
                "district": "Pune",
                "preferred_language": "en",
            },
        )
        assert resp.status_code == 409

    def test_register_missing_fields(self, client):
        resp = client.post("/api/auth/register", json={"full_name": "X"})
        assert resp.status_code == 422

    def test_login(self, client, authenticated_client):
        resp = client.post(
            "/api/auth/login",
            json={"email": "farmer.test+autotest@example.com", "password": "AutotestPass123"},
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["access_token"]  # not None
        assert resp.json()["data"]["farmer"]["email"] == "farmer.test+autotest@example.com"

    def test_login_wrong_password(self, client):
        client.post(
            "/api/auth/register",
            json={
                "full_name": "X",
                "email": "x@example.com",
                "password": "Password123",
                "phone": "+919876543210",
                "state": "Maharashtra",
                "district": "Pune",
                "preferred_language": "en",
            },
        )
        resp = client.post("/api/auth/login", json={"email": "x@example.com", "password": "Wrong"})
        assert resp.status_code == 401

    def test_logout(self, client, authenticated_client):
        resp = client.post("/api/auth/logout")
        assert resp.status_code == 200

    def test_requires_auth(self, client):
        # Public routes still work...
        pub = client.get("/api/schemes")
        assert pub.status_code == 200
        # ...but a route that uses get_current_farmer rejects anonymous users.
        protected = client.get("/api/auth/me")
        assert protected.status_code == 401

    def test_profile(self, client, authenticated_client):
        resp = client.get("/api/farmer/profile")
        assert resp.status_code == 200
        assert resp.json()["data"]["email"] == "farmer.test+autotest@example.com"


class TestSchemes:
    def test_list_schemes(self, client):
        resp = client.get("/api/schemes")
        assert resp.status_code == 200
        body = resp.json()["data"]
        assert body["count"] > 0

    def test_filter_by_state(self, client):
        resp = client.get("/api/schemes?state=All+India")
        assert resp.status_code == 200
        body = resp.json()["data"]
        assert body["count"] >= 10


class TestMarketDemo:
    def _enable_demo_mode(self, monkeypatch):
        # Shared test DB is driven by the lru_cached Settings singleton.
        # Use monkeypatch (auto-restores) so this test class cannot leak
        # market_demo_mode=True into later tests.
        monkeypatch.setattr(settings, "market_demo_mode", True)

    def test_demo_prices(self, client, monkeypatch):
        self._enable_demo_mode(monkeypatch)
        resp = client.get("/api/market/prices?crop=Tomato&state=Maharashtra&district=Pune")
        assert resp.status_code == 200
        body = resp.json()["data"]
        assert body["is_demo"] is True
        assert body["data_source"].startswith("DEMONSTRATION DATA")
        assert len(body["records"]) > 0

    def test_demo_compare(self, client, monkeypatch):
        self._enable_demo_mode(monkeypatch)
        resp = client.post(
            "/api/market/compare",
            json={
                "crop": "Tomato",
                "state": "Maharashtra",
                "district": "Pune",
                "transport_cost_per_km_quintal": 2.5,
                "latitude": 18.5,
                "longitude": 73.8,
            },
        )
        assert resp.status_code == 200
        body = resp.json()["data"]
        assert body["is_demo"] is True
        assert len(body["records"]) > 0
        assert body["recommendation_reason"]


class TestWeatherNotConfigured:
    def test_weather_not_configured(self, client):
        resp = client.get("/api/weather/current?state=Maharashtra&district=Pune")
        assert resp.status_code == 503
        # Error responses use the success=False envelope (no "data" key).
        assert resp.json()["error_code"] == "WEATHER_NOT_CONFIGURED"

    def test_weather_advisory_not_configured(self, client):
        resp = client.post(
            "/api/weather/advisory",
            json={"state": "Maharashtra", "district": "Pune", "crop": "Wheat", "growth_stage": "flowering"},
        )
        assert resp.status_code == 503
        assert resp.json()["error_code"] == "WEATHER_NOT_CONFIGURED"


class TestDiseaseNotConfigured:
    def test_disease_analyze_not_configured(self, client):
        # A valid image passes image validation; the AI layer then reports
        # that no multimodal credential is configured (503), before anything
        # else is executed.
        from PIL import Image

        buf = io.BytesIO()
        Image.new("RGB", (240, 240), "red").save(buf, format="PNG")
        resp = client.post(
            "/api/disease/analyze",
            files={"image": ("sample.png", buf.getvalue(), "image/png")},
        )
        assert resp.status_code == 503
        assert resp.json()["error_code"] == "AI_NOT_CONFIGURED"
