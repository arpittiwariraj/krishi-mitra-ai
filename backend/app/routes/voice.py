"""Voice / text advisory endpoint driven by the Gemini AI backend.

This endpoint lets a farmer speak (or type) a question in Hindi and receive a
short, practical advisory answer in Hindi. It never fabricates disease
confidence percentages, market prices or weather readings.
"""

import logging
import time
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.config import settings
from app.database import get_db
from app.dependencies import get_optional_farmer
from app.services import gemini_service
from app.utils.responses import success

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice", tags=["Voice / Text Advisory"])


@router.post("/advisory")
async def advisory(
    text: str = Form(..., description="Farmer's question (Hindi recommended)"),
    crop: str = Form(default=""),
    location: str = Form(default=""),
    language: str = Form(default="hi"),
    growth_stage: str = Form(default=""),
    diagnosis: str = Form(default=""),
    image: UploadFile = File(default=None, description="Optional crop photo for the model to analyse"),
    db: object = Depends(lambda: get_db()),
    farmer: object = Depends(get_optional_farmer),
):
    """Generate a farmer advisory in the requested language (default Hindi).

    The Gemini call is the only slow step; weather/market lookups are skipped
    so the response is fast. The model prompt instructs it that live reference
    data is unavailable when context is missing.
    """
    image_bytes = None
    if image is not None:
        image_bytes = await image.read(settings.max_upload_size_mb * 1024 * 1024 + 1)

    for attempt in range(3):
        try:
            result = gemini_service.generate_advisory(
                prompt=text,
                language=language,
                crop=crop or None,
                location=location or None,
                growth_stage=growth_stage or None,
                diagnosis=diagnosis or None,
                weather=None,
                market=None,
                image_bytes=image_bytes,
            )
            return success(
                {
                    "text": result["text"],
                    "language": result["language"],
                    "source": result["source"],
                    "confidence": result["confidence"],
                    "crop": crop,
                    "location": location,
                    "language_requested": language,
                },
                "Voice advisory generated",
            )
        except gemini_service.AIServiceError as exc:
            # Retry only on transient AI errors (502/503); fail fast otherwise.
            if exc.status_code in {502, 503} and attempt < 2:
                time.sleep(1.5 * (attempt + 1))
                continue
            raise HTTPException(
                status_code=exc.status_code,
                detail={"error_code": exc.error_code, "message": exc.message},
            ) from exc
