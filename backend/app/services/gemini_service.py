"""Gemini (Google AI) advisory service for Krishi Mitra AI.

Provides Hindi (and English) voice/text farmer advisory. A single-language
caller-friendly function that asks the model to answer in the requested
language (default Hindi) and never fabricates disease confidence percentages,
market prices or weather readings.

The Gemini backend is used for the voice advisory endpoint:
    POST /api/voice/advisory
"""

import logging

from fastapi import HTTPException

from app.services.knowledge_base_service import find_disease_match, load_government_schemes
from app.config import settings
from app.utils.responses import error

logger = logging.getLogger(__name__)

# Structured error codes returned to the UI.
AI_NOT_CONFIGURED = "AI_NOT_CONFIGURED"
AI_SERVICE_ERROR = "AI_SERVICE_ERROR"
AI_BAD_REQUEST = "AI_BAD_REQUEST"


class AIServiceError(Exception):
    """Structured AI service error, transportable as an HTTPException."""

    def __init__(self, message: str, error_code: str, status_code: int = 503):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.status_code = status_code


# Farmer-friendly system instructions. The `language` variable controls the
# output language the caller requests (default Hindi for farmers).
SYSTEM_INSTRUCTION = """You are Krishi Mitra AI, a friendly agricultural advisory assistant for Indian farmers.
- Answer in a short, clear, practical paragraph in the requested language.
- Do NOT fabricate disease confidence percentages, market prices or weather readings. If unsure, say it is unknown.
- When advising on a crop problem, ask for a clear photo if none is provided and never claim a laboratory-confirmed diagnosis.
- Always end with a reminder to consult a qualified local agricultural expert (Krishi Vigyan Kendra / KVK) before treating a crop.
- Use the reference context below if available. Keep the advice short and actionable."""


def _get_key():
    """Return the configured Gemini API key, raising a structured error if absent."""
    key = settings.gemini_api_key
    if not key or not key.strip():
        raise AIServiceError(
            "AI service is not configured. Add GEMINI_API_KEY to the backend environment.",
            AI_NOT_CONFIGURED,
            503,
        )
    return key.strip()


def _build_prompt(
    user_text: str,
    language: str,
    crop: str | None = "",
    location: str | None = "",
    growth_stage: str | None = "",
    diagnosis: str | None = "",
    weather: str | None = "",
    market: str | None = "",
) -> str:
    """Assemble the system instruction + user message for the Gemini client."""
    # Language label for the caller's requested output language.
    if language and any(ch in language.lower() for ch in ("hi", "ह", "न्द", "hindi")):
        lang_label = "HINDI"
    else:
        lang_label = "ENGLISH"

    # Gathered context (each block is human-readable, never numeric confidence).
    crop = crop or ""
    location = location or ""
    growth_stage = growth_stage or ""
    diagnosis = diagnosis or ""
    weather = weather or ""
    market = market or ""
    disease_ref = find_disease_match(crop, diagnosis)
    schemes = [scheme.get("scheme_name", "") for scheme in load_government_schemes()]

    context_lines = []
    if diagnosis:
        context_lines.append(f"Recent visual diagnosis: {diagnosis}")
    if weather:
        context_lines.append(f"Current weather / forecast: {weather}")
    if market:
        context_lines.append(f"Market data: {market}")
    if disease_ref:
        context_lines.append(f"Knowledge base: {disease_ref}")
    if schemes:
        context_lines.append(f"Potential schemes: {schemes}")

    context_block = "\n".join(context_lines) if context_lines else "No live reference data available at this time."

    return f"""
System instruction (follow exactly):
- Reply directly and only in the requested language ({lang_label}).
- Keep the first paragraph short and plain; then add 2-4 short numbered tips.
- Never state a disease, price, or weather value as certain unless you are 100% sure.
- If the farmer's photo cannot be assessed, say so and ask for a clear close-up in natural daylight.
- Always include the expert-consultation reminder before any treatment recommendation.

Reference context:
{context_block}

Farmer question:
{user_text}
""".strip()


def generate_advisory(
    prompt: str,
    language: str = "hi",
    *,
    crop: str | None = "",
    location: str | None = "",
    growth_stage: str | None = "",
    diagnosis: str | None = "",
    weather: str | None = "",
    market: str | None = "",
    image_bytes: bytes | None = None,
) -> dict:
    """Call the Gemini advisory backend and return a structured result.

    Returns a dict with keys: text, language, source, confidence.
    Never returns a fabricated numeric confidence score; when the model
    cannot assess, confidence is null and the text says so.
    """
    source = "gemini"

    if not prompt or not prompt.strip():
        raise AIServiceError("Please provide a question for the farmer.", AI_BAD_REQUEST, 400)

    key = _get_key()

    system_instruction = _build_prompt(
        prompt, language, crop, location, growth_stage, diagnosis, weather, market
    )
    user_text = f"{system_instruction}\n\n{prompt}\n".strip()

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=key)
        model = settings.gemini_model or "gemini-2.0-flash"

        # Build multi-part user content: text + optional inline crop photo.
        parts = []
        if image_bytes:
            if len(image_bytes) <= 120_000:
                try:
                    parts.append(types.Part.from_bytes(data=image_bytes, mime_type="image/png"))
                except Exception:
                    pass
            else:
                logger.warning("Image too large (%d bytes); Gemini advisory ignores it.", len(image_bytes))

        if parts:
            user_content = types.Content(
                role="user",
                parts=[types.Part.from_text(text=user_text)] + parts,
            )
        else:
            user_content = user_text

        config = types.GenerateContentConfig(temperature=0.4, top_p=0.9)
        response = client.models.generate_content(
            model=model,
            contents=user_content,
            config=config,
        )

        text = response.text or ""
        if not text or not text.strip():
            raise AIServiceError(
                "Gemini returned an empty response. The advisory might be unavailable right now; please retry.",
                AI_SERVICE_ERROR,
                502,
            )

        return {"text": text.strip(), "language": "hi", "source": source, "confidence": None}

    except AIServiceError:
        raise
    except Exception as exc:
        # Preserve the original HTTP status code so the route can retry on
        # transient Google API failures (503 untempo, 429 overloaded).
        status_code = 502
        if hasattr(exc, "status_code"):
            status_code = int(exc.status_code)
        elif hasattr(exc, "code"):
            status_code = int(exc.code)
        logger.exception("Gemini advisory call failed")
        raise AIServiceError(
            f"AI service is temporarily unavailable: {exc}",
            AI_SERVICE_ERROR,
            status_code,
        ) from exc
