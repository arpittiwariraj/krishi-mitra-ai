"""Market price and mandi comparison endpoints."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_optional_farmer
from app.models.farmer import Farmer
from app.models.market import MarketSearch
from app.ratelimit import limiter
from app.schemas.market import MarketCompareRequest
from app.services import market_service
from app.utils.language_utils import normalize_language
from app.utils.responses import success

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/market", tags=["Market Analysis"])


def _raise_market_error(exc: market_service.MarketServiceError):
    raise HTTPException(
        status_code=exc.status_code,
        detail={"error_code": exc.error_code, "message": exc.message},
    )


@router.get("/crops")
def list_crops():
    return success(market_service.CROPS, "Market crop reference loaded")


@router.get("/prices")
@limiter.limit("30/minute")
async def market_prices(
    request: Request,
    crop: str = Query(min_length=2, max_length=80),
    state: str = Query(min_length=2, max_length=80),
    district: str = Query(min_length=2, max_length=80),
):
    try:
        records, source, is_demo = await market_service.fetch_prices(crop, state, district)
    except market_service.MarketServiceError as exc:
        _raise_market_error(exc)
    records.sort(key=lambda item: item.get("modal_price") or 0, reverse=True)
    return success(
        {
            "crop": crop,
            "state": state,
            "district": district,
            "records": records,
            "data_source": source,
            "is_demo": is_demo,
            "notification": (
                "Demonstration records are shown. They are not live mandi prices."
                if is_demo
                else None
            ),
        },
        "Market prices retrieved" if records else "No recent market records found",
    )


@router.post("/compare")
@limiter.limit("20/minute")
async def compare_markets(
    request: Request,
    payload: MarketCompareRequest,
    db: Session = Depends(get_db),
    farmer: Farmer | None = Depends(get_optional_farmer),
):
    try:
        result = await market_service.compare_markets(
            payload.crop,
            payload.state,
            payload.district,
            payload.transport_cost_per_km_quintal,
            payload.latitude,
            payload.longitude,
            payload.language,
        )
    except market_service.MarketServiceError as exc:
        _raise_market_error(exc)

    if farmer is not None and result.get("records"):
        try:
            newest_date = result.get("last_updated")
            saved = MarketSearch(
                farmer_id=farmer.id,
                crop_name=payload.crop,
                location=f"{payload.district}, {payload.state}",
                selected_market=result.get("recommended_market"),
                market_data_date=newest_date,
            )
            db.add(saved)
            db.commit()
        except Exception as exc:
            db.rollback()
            logger.warning("Could not save market search: %s", exc.__class__.__name__)

    return success(result, "Market comparison completed")
