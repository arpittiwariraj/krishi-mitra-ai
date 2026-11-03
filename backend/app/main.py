"""Krishi Mitra AI FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager
from datetime import UTC, datetime

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi import _rate_limit_exceeded_handler

from app.config import settings
from app.database import check_database_connection, create_tables
from app.ratelimit import limiter
from app.routes import auth, disease, farmer, market, schemes, voice, weather
from app.utils.responses import error, success

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s", settings.app_name)
    created = create_tables()
    if not created:
        logger.warning(
            "Database unavailable at startup. Health endpoint will report the failure."
        )
    yield
    logger.info("Shutting down %s", settings.app_name)


app = FastAPI(
    title="Krishi Mitra AI API",
    description="AI-powered agricultural advisory API for crop health, weather, markets and schemes.",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, dict):
        message = detail.get("message", "Unable to process request")
        error_code = detail.get("error_code", "HTTP_ERROR")
        details = detail.get("details")
    else:
        message = str(detail)
        error_code = "HTTP_ERROR"
        details = None
    return JSONResponse(
        status_code=exc.status_code,
        content=error(message, error_code, details),
        headers=getattr(exc, "headers", None),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    details = []
    for item in exc.errors():
        details.append(
            {
                "field": ".".join(str(part) for part in item.get("loc", [])),
                "message": item.get("msg", "Invalid value"),
            }
        )
    return JSONResponse(
        status_code=422,
        content=error("Some input values are invalid. Please check the form.", "VALIDATION_ERROR", details),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content=error("An unexpected server error occurred.", "INTERNAL_SERVER_ERROR"),
    )


@app.get("/")
def root():
    return success(
        {
            "name": settings.app_name,
            "version": app.version,
            "docs": "/docs",
            "health": f"{settings.api_prefix}/health",
        },
        "Krishi Mitra AI API is running",
    )


@app.get(f"{settings.api_prefix}/health")
def health():
    db_ok, db_status = check_database_connection()
    return success(
        {
            "status": "ok",
            "backend": "running",
            "database": {"connected": db_ok, "status": db_status},
            "services": {
                "ai": {
                    "configured": (
                        settings.openai_configured
                        or settings.openrouter_configured
                        or settings.gemini_configured
                    ),
                    "method": (
                        "Gemini"
                        if settings.gemini_configured
                        else (
                            "OpenRouter"
                            if settings.openrouter_configured
                            else ("OpenAI" if settings.openai_configured else "not configured")
                        )
                    ),
                    "model": (
                        settings.gemini_model
                        if settings.gemini_configured
                        else (
                            settings.openrouter_model
                            if settings.openrouter_configured
                            else (settings.openai_model if settings.openai_configured else None)
                        )
                    ),
                    "openai_api_key_configured": settings.openai_configured,
                    "openrouter_configured": settings.openrouter_configured,
                    "gemini_configured": settings.gemini_configured,
                },
                "openweather": {"configured": settings.openweather_configured},
                "market": {
                    "data_gov_in": {"configured": settings.data_gov_configured},
                    "demo_mode": settings.market_demo_mode,
                },
            },
            "timestamp": datetime.now(UTC).isoformat(),
        },
        "Health check completed",
    )


app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(disease.router, prefix=settings.api_prefix)
app.include_router(weather.router, prefix=settings.api_prefix)
app.include_router(market.router, prefix=settings.api_prefix)
app.include_router(schemes.router, prefix=settings.api_prefix)
app.include_router(farmer.router, prefix=settings.api_prefix)
app.include_router(voice.router, prefix=settings.api_prefix)
