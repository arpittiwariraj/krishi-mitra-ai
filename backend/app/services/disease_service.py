"""Orchestrate image triage, knowledge lookup and farmer-facing reports."""

from datetime import UTC, datetime

from app.schemas.disease import AIObservation
from app.services import openai_service
from app.services.knowledge_base_service import find_disease_match
from app.utils.language_utils import normalize_language


GENERIC_GUIDANCE = {
    "en": {
        "symptoms": ["Visible damage was noted, but the image does not confirm a specific disease."],
        "causes": ["Cause cannot be confirmed from a single photograph."],
        "actions": [
            "Upload a clear close-up of the affected leaf in natural daylight.",
            "Consult your local Krishi Vigyan Kendra (KVK) or agricultural extension officer for confirmation.",
            "Isolate severely affected plants where practical to limit possible spread.",
        ],
        "prevention": [
            "Use healthy planting material and maintain field hygiene.",
            "Avoid overhead irrigation and keep good airflow between plants.",
            "Monitor the crop regularly and record changes.",
        ],
        "disclaimer": (
            "This is an AI-assisted visual assessment, not a laboratory diagnosis. "
            "Always confirm with a qualified agricultural expert before applying any treatment."
        ),
    },
    "hi": {
        "symptoms": ["पत्ती पर कुछ क्षति दिखाई देती है, लेकिन तस्वीर से किसी विशेष रोग की पुष्टि नहीं होती।"],
        "causes": ["केवल एक तस्वीर से कारण की पुष्टि नहीं की जा सकती।"],
        "actions": [
            "प्रभावित पत्ती की स्पष्ट क्लोज-अप तस्वीर प्राकृतिक रोशनी में अपलोड करें।",
            "पुष्टि के लिए अपने निकटतम कृषि विज्ञान केंद्र (KVK) या कृषि विस्तार अधिकारी से सलाह लें।",
            "संभावित फैलाव रोकने के लिए गंभीर रूप से प्रभावित पौधों को अलग करें।",
        ],
        "prevention": [
            "स्वस्थ रोपण सामग्री का उपयोग करें और खेत में स्वच्छता रखें।",
            "ऊपर से सिंचाई से बचें और पौधों के बीच हवा का आवागमन रखें।",
            "फसल की नियमित निगरानी करें और बदलाव दर्ज करें।",
        ],
        "disclaimer": (
            "यह एआई-आधारित दृश्य मूल्यांकन है, प्रयोगशाला निदान नहीं। "
            "कोई भी उपचार लागू करने से पहले योग्य कृषि विशेषज्ञ से पुष्टि करें।"
        ),
    },
}


def _dedupe(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        clean = value.strip()
        key = clean.lower()
        if clean and key not in seen:
            seen.add(key)
            result.append(clean)
    return result


async def build_report(
    observation: AIObservation,
    language: str,
    image_info: dict,
    location: str | None = None,
) -> dict:
    language = normalize_language(language)
    generic = GENERIC_GUIDANCE[language]
    entry = find_disease_match(observation.crop_name, observation.possible_disease)

    report = observation.model_dump()
    report["confidence_score"] = None

    if entry:
        report["symptoms"] = _dedupe(entry.get("symptoms", []))
        report["possible_causes"] = _dedupe(entry.get("possible_causes", []))
        report["recommended_actions"] = _dedupe(entry.get("treatment_guidance", []))
        report["prevention"] = _dedupe(entry.get("prevention", []))
        report["knowledge_base_match"] = True
        report["knowledge_source"] = entry.get("reference_source")
        report["knowledge_last_verified"] = entry.get("last_verified")
        report["possible_disease"] = entry.get("disease_name", observation.possible_disease)
        report["crop_name"] = entry.get("crop_name", observation.crop_name)
        report["disclaimer"] = generic["disclaimer"]
    else:
        report["symptoms"] = generic["symptoms"] if not observation.visual_observations else [
            "Visual observations only; no confirmed disease reference matched."
        ]
        report["possible_causes"] = generic["causes"]
        report["recommended_actions"] = generic["actions"]
        report["prevention"] = generic["prevention"]
        report["knowledge_base_match"] = False
        report["knowledge_source"] = None
        report["knowledge_last_verified"] = None
        report["disclaimer"] = generic["disclaimer"]

    if observation.diagnostic_status in {"Insufficient image quality", "No clear disease visible"}:
        report["recommended_actions"] = _dedupe(
            generic["actions"] + report.get("recommended_actions", [])
        )
        report["possible_disease"] = observation.possible_disease

    report["expert_consultation"] = True
    report["image_info"] = image_info
    report["location"] = location
    report["language"] = language
    report["analyzed_at"] = datetime.now(UTC).isoformat()

    if language == "hi" and report.get("visual_observations"):
        translated = await openai_service.translate_result_to_hindi(report)
        translated["confidence_score"] = None
        translated["knowledge_base_match"] = report["knowledge_base_match"]
        translated["knowledge_source"] = report["knowledge_source"]
        translated["knowledge_last_verified"] = report["knowledge_last_verified"]
        translated["image_info"] = image_info
        translated["language"] = "hi"
        translated["analyzed_at"] = report["analyzed_at"]
        report = translated

    return report
