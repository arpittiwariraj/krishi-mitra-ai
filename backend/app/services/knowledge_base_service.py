"""Load and search the curated agricultural knowledge bases."""

import json
from difflib import SequenceMatcher
from functools import lru_cache
from pathlib import Path

KNOWLEDGE_DIR = Path(__file__).resolve().parent.parent / "knowledge_base"


@lru_cache
def load_disease_information() -> dict:
    path = KNOWLEDGE_DIR / "disease_information.json"
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


@lru_cache
def load_government_schemes() -> list[dict]:
    path = KNOWLEDGE_DIR / "government_schemes.json"
    with path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    return payload.get("schemes", [])


def _normalize(value: str | None) -> str:
    return " ".join((value or "").lower().replace("_", " ").replace("-", " ").split())


def _similarity(left: str, right: str) -> float:
    return SequenceMatcher(None, _normalize(left), _normalize(right)).ratio()


def find_disease_match(
    crop_name: str | None, possible_disease: str | None
) -> dict | None:
    """Return the best knowledge-base entry for an AI suggestion.

    Matching combines crop agreement with fuzzy matching of the disease name
    and its aliases. Low-scoring matches are deliberately rejected so the
    system does not attach unverified treatment guidance.
    """

    crop = _normalize(crop_name)
    disease = _normalize(possible_disease)
    if not disease or disease in {"unclear", "none", "unknown", "not sure"}:
        return None

    best_entry: dict | None = None
    best_score = 0.0

    for entry in load_disease_information().get("diseases", []):
        entry_crop = _normalize(entry.get("crop_name"))
        candidates = [entry.get("disease_name", ""), *entry.get("aliases", [])]
        name_score = max((_similarity(disease, item) for item in candidates), default=0.0)
        if disease in _normalize(entry.get("disease_name")):
            name_score = max(name_score, 0.9)

        crop_bonus = 0.0
        if crop and crop != "unclear":
            if crop == entry_crop or crop in entry_crop or entry_crop in crop:
                crop_bonus = 0.2
            elif _similarity(crop, entry_crop) > 0.75:
                crop_bonus = 0.1

        score = name_score + crop_bonus
        if score > best_score:
            best_score = score
            best_entry = entry

    if best_entry is None or best_score < 0.58:
        return None
    return best_entry
