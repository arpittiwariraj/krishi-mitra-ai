"""Weather current/forecast endpoints and agricultural advisory."""

import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_optional_farmer
from app.models.advisory import WeatherAdvisory
from app.models.farmer import Farmer
from app.ratelimit import limiter
from app.schemas.weather import WeatherAdvisoryRequest
from app.services import weather_service
from app.utils.language_utils import normalize_language
from app.utils.responses import success

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/weather", tags=["Weather Advisory"])


def _raise_weather_error(exc: weather_service.WeatherServiceError):
    raise HTTPException(
        status_code=exc.status_code,
        detail={"error_code": exc.error_code, "message": exc.message},
    )


@router.get("/current")
@limiter.limit("30/minute")
async def current_weather(
    request: Request,
    state: str | None = Query(default=None),
    district: str | None = Query(default=None),
    latitude: float | None = Query(default=None, ge=-90, le=90),
    longitude: float | None = Query(default=None, ge=-180, le=180),
):
    try:
        data = await weather_service.get_current(state, district, latitude, longitude)
    except weather_service.WeatherServiceError as exc:
        _raise_weather_error(exc)
    return success(data, "Current weather retrieved")


@router.get("/forecast")
@limiter.limit("30/minute")
async def forecast_weather(
    request: Request,
    state: str | None = Query(default=None),
    district: str | None = Query(default=None),
    latitude: float | None = Query(default=None, ge=-90, le=90),
    longitude: float | None = Query(default=None, ge=-180, le=180),
):
    try:
        data = await weather_service.get_forecast(state, district, latitude, longitude)
    except weather_service.WeatherServiceError as exc:
        _raise_weather_error(exc)
    return success(data, "Weather forecast retrieved")


@router.post("/advisory")
@limiter.limit("20/minute")
async def weather_advisory(
    request: Request,
    payload: WeatherAdvisoryRequest,
    db: Session = Depends(get_db),
    farmer: Farmer | None = Depends(get_optional_farmer),
):
    language = normalize_language(payload.language)
    try:
        current, forecast = await asyncio.gather(
            weather_service.get_current(
                payload.state, payload.district, payload.latitude, payload.longitude
            ),
            weather_service.get_forecast(
                payload.state, payload.district, payload.latitude, payload.longitude
            ),
        )
    except weather_service.WeatherServiceError as exc:
        _raise_weather_error(exc)

    advisory = weather_service.build_advisory(
        current, forecast, payload.crop, payload.growth_stage, language
    )
    advisory["current"] = current
    advisory["forecast_daily"] = forecast.get("daily", [])[:5]

    if farmer is not None:
        try:
            saved = WeatherAdvisory(
                farmer_id=farmer.id,
                location=current.get("location", {}).get("name") or "Selected location",
                crop_name=payload.crop,
                weather_summary=current,
                advisory=advisory,
            )
            db.add(saved)
            db.commit()
        except Exception as exc:
            db.rollback()
            logger.warning("Could not save weather advisory: %s", exc.__class__.__name__)

    return success(advisory, "Weather advisory generated")
