"""Authenticated farmer profile, history and saved-data endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_farmer
from app.models.advisory import WeatherAdvisory
from app.models.diagnosis import DiseaseReport
from app.models.farmer import Farmer, FarmerProfile
from app.models.market import MarketSearch
from app.models.scheme import SavedScheme
from app.schemas.farmer import FarmerOut, FarmerProfileIn, FarmerUpdate
from app.schemas.scheme import SavedSchemeRequest
from app.services import scheme_service
from app.utils.responses import success

router = APIRouter(prefix="/farmer", tags=["Farmer Profile"])


@router.get("/profile")
def get_profile(farmer: Farmer = Depends(get_current_farmer)):
    return success(FarmerOut.model_validate(farmer).model_dump(mode="json"))


@router.put("/profile")
def update_profile(
    payload: FarmerUpdate,
    db: Session = Depends(get_db),
    farmer: Farmer = Depends(get_current_farmer),
):
    for field in ("full_name", "phone", "state", "district", "preferred_language"):
        value = getattr(payload, field)
        if value is not None:
            setattr(farmer, field, value)
    db.commit()
    db.refresh(farmer)
    return success(FarmerOut.model_validate(farmer).model_dump(mode="json"), "Profile updated")


@router.put("/profile/details")
def update_farmer_details(
    payload: FarmerProfileIn,
    db: Session = Depends(get_db),
    farmer: Farmer = Depends(get_current_farmer),
):
    profile = farmer.profile
    if profile is None:
        profile = FarmerProfile(farmer_id=farmer.id)
        db.add(profile)
    profile.primary_crop = payload.primary_crop
    profile.land_size = payload.land_size
    profile.land_unit = payload.land_unit
    profile.irrigation_type = payload.irrigation_type
    db.commit()
    db.refresh(farmer)
    return success(FarmerOut.model_validate(farmer).model_dump(mode="json"), "Farm details updated")


@router.get("/dashboard")
def dashboard(
    db: Session = Depends(get_db),
    farmer: Farmer = Depends(get_current_farmer),
):
    reports = (
        db.query(DiseaseReport)
        .filter(DiseaseReport.farmer_id == farmer.id)
        .order_by(DiseaseReport.created_at.desc())
        .limit(5)
        .all()
    )
    advisories = (
        db.query(WeatherAdvisory)
        .filter(WeatherAdvisory.farmer_id == farmer.id)
        .order_by(WeatherAdvisory.created_at.desc())
        .limit(3)
        .all()
    )
    market_searches = (
        db.query(MarketSearch)
        .filter(MarketSearch.farmer_id == farmer.id)
        .order_by(MarketSearch.created_at.desc())
        .limit(3)
        .all()
    )
    saved = (
        db.query(SavedScheme)
        .filter(SavedScheme.farmer_id == farmer.id)
        .order_by(SavedScheme.saved_at.desc())
        .all()
    )
    saved_schemes = []
    for item in saved:
        scheme = scheme_service.get_scheme(item.scheme_id, farmer.preferred_language)
        if scheme:
            scheme["saved_at"] = item.saved_at.isoformat()
            saved_schemes.append(scheme)

    profile = farmer.profile
    recommendations = scheme_service.recommend_schemes(
        farmer.state,
        farmer.district,
        None,
        float(profile.land_size) if profile and profile.land_size is not None else None,
        profile.primary_crop if profile else None,
        farmer.preferred_language,
    )[:4]

    return success(
        {
            "farmer": FarmerOut.model_validate(farmer).model_dump(mode="json"),
            "recent_diagnoses": [
                {
                    "id": report.id,
                    "crop_name": report.crop_name,
                    "possible_disease": report.possible_disease,
                    "certainty_level": report.certainty_level,
                    "created_at": report.created_at.isoformat(),
                }
                for report in reports
            ],
            "recent_advisories": [
                {
                    "id": item.id,
                    "location": item.location,
                    "crop_name": item.crop_name,
                    "created_at": item.created_at.isoformat(),
                }
                for item in advisories
            ],
            "recent_market_searches": [
                {
                    "id": item.id,
                    "crop_name": item.crop_name,
                    "location": item.location,
                    "selected_market": item.selected_market,
                    "market_data_date": item.market_data_date.isoformat()
                    if item.market_data_date
                    else None,
                    "created_at": item.created_at.isoformat(),
                }
                for item in market_searches
            ],
            "saved_schemes": saved_schemes,
            "recommended_schemes": recommendations,
        }
    )


@router.get("/saved-schemes")
def list_saved_schemes(
    db: Session = Depends(get_db), farmer: Farmer = Depends(get_current_farmer)
):
    saved = (
        db.query(SavedScheme)
        .filter(SavedScheme.farmer_id == farmer.id)
        .order_by(SavedScheme.saved_at.desc())
        .all()
    )
    results = []
    for item in saved:
        scheme = scheme_service.get_scheme(item.scheme_id, farmer.preferred_language)
        if scheme:
            scheme["saved_at"] = item.saved_at.isoformat()
            results.append(scheme)
    return success(results)


@router.post("/saved-schemes")
def save_scheme(
    payload: SavedSchemeRequest,
    db: Session = Depends(get_db),
    farmer: Farmer = Depends(get_current_farmer),
):
    scheme = scheme_service.get_scheme(payload.scheme_id)
    if scheme is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "SCHEME_NOT_FOUND", "message": "Scheme not found"},
        )
    existing = (
        db.query(SavedScheme)
        .filter(
            SavedScheme.farmer_id == farmer.id,
            SavedScheme.scheme_id == payload.scheme_id,
        )
        .first()
    )
    if existing:
        return success({"scheme_id": payload.scheme_id}, "Scheme already saved")
    saved = SavedScheme(farmer_id=farmer.id, scheme_id=payload.scheme_id)
    db.add(saved)
    db.commit()
    return success({"scheme_id": payload.scheme_id}, "Scheme saved")


@router.delete("/saved-schemes/{scheme_id}")
def unsave_scheme(
    scheme_id: str,
    db: Session = Depends(get_db),
    farmer: Farmer = Depends(get_current_farmer),
):
    saved = (
        db.query(SavedScheme)
        .filter(SavedScheme.farmer_id == farmer.id, SavedScheme.scheme_id == scheme_id)
        .first()
    )
    if saved is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "SAVED_SCHEME_NOT_FOUND", "message": "Saved scheme not found"},
        )
    db.delete(saved)
    db.commit()
    return success({"scheme_id": scheme_id}, "Scheme removed")
