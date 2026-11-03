"""OpenAI multimodal integration for crop image analysis.

The model is only allowed to describe visible symptoms and suggest possible
conditions. The backend separately merges verified knowledge-base treatment
content, so the model cannot invent pesticide dosages or confirmed diagnoses.
"""

import base64
import json
import logging

from openai import AsyncOpenAI, OpenAIError
from pydantic import ValidationError

from app.config import settings
from app.schemas.disease import AIObservation

logger = logging.getLogger(__name__)


class AIServiceError(Exception):
    def __init__(self, message: str, error_code: str, status_code: int = 503):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.status_code = status_code


_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    # AI is not configured at all -> clear configuration error (503).
    if not settings.openai_configured and not settings.openrouter_configured:
        raise AIServiceError(
            "AI image analysis is not configured. Add OPENAI_API_KEY or OPENROUTER_API_KEY to backend/.env.",
            "AI_NOT_CONFIGURED",
            503,
        )
    if _client is None:
        openrouter = settings.openrouter_configured
        _client = AsyncOpenAI(
            api_key=settings.openrouter_api_key or settings.openai_api_key,
            base_url=settings.openrouter_base_url if openrouter else None,
            timeout=60.0,
            default_headers=(
                {
                    "HTTP-Referer": settings.openrouter_http_referer,
                    "X-Title": settings.openrouter_title,
                }
                if openrouter
                else {}
            ),
        )
    return _client


SYSTEM_PROMPT = """You are a careful agricultural image triage assistant for Indian farmers.
You inspect a single crop/leaf photograph and describe ONLY what is visually
observable. You must follow these rules strictly:

1. Never state a confirmed laboratory diagnosis. Use phrases such as "possible
   match" and clearly communicate uncertainty.
2. Never provide a numerical confidence percentage or score. confidence_score
   must always be null.
3. Never invent pesticide, insecticide or fungicide names or dosages. Leave
   recommended_actions, prevention and treatment fields empty; the backend
   fills them from a verified reference.
4. If the photograph is blurry, too dark, does not clearly show a plant, or is
   unsuitable, set image_quality to Poor or Fair, diagnostic_status to
   "Insufficient image quality" or "No clear disease visible", and explain what
   photograph would help.
5. Consider common alternative possibilities when the visual evidence is not
   specific.
6. Do not identify a crop unless it is visually plausible; otherwise use
   "Unclear".
7. Return ONLY a JSON object matching the requested schema. No markdown fences.
"""

USER_PROMPT_TEMPLATE = """Analyse this crop photograph.

Farmer-provided crop: {crop}
Farmer-provided location: {location}
Preferred language for descriptions: {language_name}

Return JSON with exactly these keys:
{{
  "crop_name": "string",
  "possible_disease": "string",
  "diagnostic_status": "Possible match | Uncertain | Insufficient image quality | No clear disease visible",
  "certainty_level": "Low | Moderate | High | Not assessable",
  "confidence_score": null,
  "image_quality": "Poor | Fair | Good | Excellent",
  "visual_observations": ["observable symptom only"],
  "alternative_possibilities": ["other plausible condition"],
  "symptoms": [],
  "possible_causes": [],
  "recommended_actions": [],
  "prevention": [],
  "expert_consultation": true,
  "disclaimer": "short advisory disclaimer in the requested language"
}}

Remember: no treatment, chemical names, dosages, or numeric confidence."""


def _data_url(image_bytes: bytes, mime_type: str) -> str:
    encoded = base64.b64encode(image_bytes).decode("ascii")
    return f"data:{mime_type};base64,{encoded}"


async def analyze_crop_image(
    image_bytes: bytes,
    mime_type: str,
    crop_name: str | None = None,
    location: str | None = None,
    language: str = "en",
) -> AIObservation:
    """Send an image to the configured multimodal model and validate the JSON."""

    client = _get_client()
    language_name = "Hindi (Devanagari script)" if language == "hi" else "English"
    prompt = USER_PROMPT_TEMPLATE.format(
        crop=crop_name or "Not provided",
        location=location or "Not provided",
        language_name=language_name,
    )

    try:
        response = await client.chat.completions.create(
            model=settings.openai_model,
            temperature=0.1,
            max_tokens=1200,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": _data_url(image_bytes, mime_type), "detail": "high"},
                        },
                    ],
                },
            ],
        )
    except OpenAIError as exc:
        logger.warning("OpenAI request failed: %s", exc.__class__.__name__)
        raise AIServiceError(
            "The AI analysis service is temporarily unavailable. Please try again.",
            "AI_SERVICE_UNAVAILABLE",
            502,
        ) from exc
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Unexpected OpenAI error")
        raise AIServiceError(
            "The AI analysis service could not process this image. Please retry.",
            "AI_SERVICE_ERROR",
            502,
        ) from exc

    content = response.choices[0].message.content if response.choices else None
    if not content:
        raise AIServiceError(
            "The AI service returned an empty result. Please retry with another photo.",
            "AI_EMPTY_RESPONSE",
            502,
        )

    try:
        payload = json.loads(content)
        payload["confidence_score"] = None
        payload["symptoms"] = []
        payload["possible_causes"] = []
        payload["recommended_actions"] = []
        payload["prevention"] = []
        payload["expert_consultation"] = True
        return AIObservation.model_validate(payload)
    except (json.JSONDecodeError, ValidationError, TypeError) as exc:
        logger.warning("Invalid AI JSON structure: %s", exc.__class__.__name__)
        raise AIServiceError(
            "The AI response could not be validated. Please retry.",
            "AI_INVALID_RESPONSE",
            502,
        ) from exc


async def translate_result_to_hindi(result: dict) -> dict:
    """Faithfully translate generated advisory text; never add new advice."""

    client = _get_client()
    prompt = (
        "Translate the human-readable string values of this agricultural JSON "
        "into simple Hindi (Devanagari). Translate faithfully. Do not add, "
        "remove, or change any advice, diagnosis, number or fact. Keep JSON keys, "
        "null values, booleans and the confidence_score field unchanged. Return "
        "only the JSON object.\n\n"
        + json.dumps(result, ensure_ascii=False)
    )
    try:
        response = await client.chat.completions.create(
            model=settings.openai_model,
            temperature=0,
            max_tokens=1600,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": "You are a precise translator for farmer-facing agricultural content.",
                },
                {"role": "user", "content": prompt},
            ],
        )
        content = response.choices[0].message.content if response.choices else None
        if not content:
            return result
        translated = json.loads(content)
        if not isinstance(translated, dict):
            return result
        translated["confidence_score"] = None
        return translated
    except Exception as exc:  # Translation failure must not break analysis
        logger.warning("Hindi translation failed: %s", exc.__class__.__name__)
        return result
