"""SQLAlchemy engine, session factory and database health helper."""

import logging
from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

logger = logging.getLogger(__name__)

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_recycle=1800,
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a scoped database session."""

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> tuple[bool, str]:
    """Return database connectivity without leaking credentials."""

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True, "connected"
    except Exception as exc:  # pragma: no cover - depends on environment
        logger.warning("Database connection check failed: %s", exc.__class__.__name__)
        return False, "unavailable"


def create_tables() -> bool:
    """Create tables if the database is reachable.

    Startup must not crash when PostgreSQL is temporarily unavailable; the
    health endpoint reports the problem and routes return a structured error.
    """

    try:
        from app import models  # noqa: F401  (register models with Base)

        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified")
        return True
    except Exception as exc:  # pragma: no cover - depends on environment
        logger.warning("Could not create database tables: %s", exc.__class__.__name__)
        return False
