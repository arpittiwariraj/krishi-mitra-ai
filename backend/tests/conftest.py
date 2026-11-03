"""pytest configuration for the Krishi Mitra AI backend.

Run with:

    cd /home/arpit/projects/krishi-mitra-ai
    source backend/.venv/bin/activate
    pytest backend/tests -v --tb=short
"""

import os
import sys

# ---------------------------------------------------------------------------
# Test credentials and database MUST be set BEFORE the app modules are
# imported. Settings() is cached per-process, so importing config early
# would freeze these values.
#
# Note: NO third-party API keys are set. Every external integration must
# therefore report "not configured" and return a clean, deterministic
# structured error (503) instead of making a network call.
# ---------------------------------------------------------------------------
os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://postgres@127.0.0.1:5433/krishi_mitra_test")
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("FRONTEND_URL", "http://localhost:5173")
# Explicitly disable demo mode so the test DB behaves deterministically even
# if the project-local .env enables it.
os.environ["MARKET_DEMO_MODE"] = "false"

# Make the `backend` dir (which holds the `app` package) importable.
_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

import pytest  # noqa: E402  (imported after env vars are set)

# Domain model registration: import every model before creating tables.
import app.models  # noqa: F401, E402

from app.config import settings  # noqa: E402
from app.database import Base, SessionLocal, engine, get_db  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _register_models():
    import app.models  # noqa: F401
    return None


@pytest.fixture()
def client():
    """Test client backed by the test database (Postgres test DB)."""
    from app import main as app_module

    # Fresh schema for the session.
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    def _get_test_db():
        session = SessionLocal()
        try:
            yield session
        finally:
            session.close()

    app_module.app.dependency_overrides[get_db] = _get_test_db

    with TestClient(app_module.app) as test_client:
        yield test_client

    app_module.app.dependency_overrides.clear()


@pytest.fixture()
def authenticated_client(client):
    """A registered farmer plus a valid JWT for protected-route tests."""
    from app.security import hash_password

    resp = client.post(
        "/api/auth/register",
        json={
            "full_name": "Test Farmer",
            "email": "farmer.test+autotest@example.com",
            "password": "AutotestPass123",
            "phone": "+919876543210",
            "state": "Maharashtra",
            "district": "Pune",
            "preferred_language": "en",
        },
    )
    assert resp.status_code == 201, resp.text
    token = resp.json()["data"]["access_token"]
    client.headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }
    return client
