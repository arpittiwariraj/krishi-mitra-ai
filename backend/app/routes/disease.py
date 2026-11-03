"""Multimodal crop disease detection endpoints."""

import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_farmer, get_optional_farmer
from app.models.diagnosis import DiseaseReport
from app.models.farmer import Farmer
from app.ratelimit import limiter
from app.services import disease_service, openai_service
from app.services.knowledge_base_service import load_disease_information
from app.utils.image_validation import ImageValidationError, validate_and_prepare_image
from app.utils.language_utils import normalize_language
from app.utils.responses import success

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/disease", tags=["Crop Disease Detection"])


@router.post("/analyze")
@limiter.limit("8/minute")
async def analyze_image(
    request: Request,
    image: UploadFile = File(...),
    crop_name: str | None = Form(default=None),
    location: str | None = Form(default=None),
    language: str = Form(default="en"),
    db: Session = Depends(get_db),
    farmer: Farmer | None = Depends(get_optional_farmer),
):
    language = normalize_language(language)
    raw = await image.read(settings.max_upload_size_mb * 1024 * 1024 + 1)
    try:
        prepared, mime_type, image_info = validate_and_prepare_image(
            raw, image.content_type, image.filename, settings.max_upload_size_mb
        )
    except ImageValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error_code": exc.error_code, "message": exc.message},
        ) from exc

    try:
        observation = await openai_service.analyze_crop_image(
            prepared, mime_type, crop_name, location, language
        )
        report = await disease_service.build_report(
            observation, language, image_info, location
        )
    except openai_service.AIServiceError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail={"error_code": exc.error_code, "message": exc.message},
        ) from exc

    if farmer is not None:
        try:
            saved = DiseaseReport(
                farmer_id=farmer.id,
                crop_name=report.get("crop_name") or "Unclear",
                possible_disease=report.get("possible_disease") or "Unclear",
                certainty_level=report.get("certainty_level") or "Not assessable",
                visual_observations=report.get("visual_observations", []),
                recommendations=report,
            )
            db.add(saved)
            db.commit()
            db.refresh(saved)
            report["report_id"] = saved.id
        except Exception as exc:  # Saving history must not break analysis
            db.rollback()
            logger.warning("Could not save diagnosis: %s", exc.__class__.__name__)

    return success(report, "Image analysis completed")


@router.get("/history")
def diagnosis_history(
    limit: int = 10,
    db: Session = Depends(get_db),
    farmer: Farmer = Depends(get_current_farmer),
):
    limit = max(1, min(limit, 50))
    reports = (
        db.query(DiseaseReport)
        .filter(DiseaseReport.farmer_id == farmer.id)
        .order_by(DiseaseReport.created_at.desc())
        .limit(limit)
        .all()
    )
    data = [
        {
            "id": report.id,
            "crop_name": report.crop_name,
            "possible_disease": report.possible_disease,
            "certainty_level": report.certainty_level,
            "visual_observations": report.visual_observations,
            "recommendations": report.recommendations,
            "created_at": report.created_at.isoformat(),
        }
        for report in reports
    ]
    return success(data)


@router.get("/reference")
def disease_reference():
    payload = load_disease_information()
    entries = [
        {
            "id": item["id"],
            "crop_name": item["crop_name"],
            "disease_name": item["disease_name"],
            "last_verified": item["last_verified"],
        }
        for item in payload.get("diseases", [])
    ]
    return success(
        {"entries": entries, "metadata": payload.get("metadata", {})},
        "Verified disease reference loaded",
    )
