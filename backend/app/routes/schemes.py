"""Government scheme search, details and recommendation endpoints."""

from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.scheme import SchemeRecommendRequest
from app.services import scheme_service
from app.utils.language_utils import normalize_language
from app.utils.responses import success

router = APIRouter(prefix="/schemes", tags=["Government Schemes"])


@router.get("")
def list_schemes(
    q: str | None = Query(default=None, max_length=120),
    state: str | None = Query(default=None, max_length=80),
    district: str | None = Query(default=None, max_length=80),
    farmer_category: str | None = Query(default=None, max_length=40),
    land_size_ha: float | None = Query(default=None, ge=0, le=100000),
    crop: str | None = Query(default=None, max_length=80),
    language: str = Query(default="en"),
):
    results = scheme_service.search_schemes(
        q, state, district, farmer_category, land_size_ha, crop, normalize_language(language)
    )
    return success(
        {
            "schemes": results,
            "count": len(results),
            "disclaimer": (
                "Listing does not guarantee approval. Confirm eligibility on the official portal."
            ),
        },
        "Schemes retrieved",
    )


@router.post("/recommend")
def recommend_schemes(payload: SchemeRecommendRequest):
    results = scheme_service.recommend_schemes(
        payload.state,
        payload.district,
        payload.farmer_category,
        payload.land_size_ha,
        payload.crop,
        normalize_language(payload.language),
    )
    return success(
        {
            "schemes": results,
            "count": len(results),
            "disclaimer": (
                "These are potentially relevant schemes, not an official approval. "
                "Final eligibility is decided by the implementing department."
            ),
        },
        "Scheme recommendations generated",
    )


@router.get("/{scheme_id}")
def scheme_details(scheme_id: str, language: str = Query(default="en")):
    scheme = scheme_service.get_scheme(scheme_id, normalize_language(language))
    if scheme is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "SCHEME_NOT_FOUND", "message": "Scheme not found"},
        )
    return success(scheme, "Scheme details retrieved")
