"""Government scheme search, filtering and eligibility matching."""

from app.services.knowledge_base_service import load_government_schemes
from app.utils.language_utils import normalize_language


def _localized(scheme: dict, language: str) -> dict:
    item = {**scheme}
    if normalize_language(language) == "hi":
        item["name_display"] = scheme.get("name_hi") or scheme.get("name")
        item["description_display"] = scheme.get("description_hi") or scheme.get("description")
    else:
        item["name_display"] = scheme.get("name")
        item["description_display"] = scheme.get("description")
    item["eligibility_note"] = (
        "Listing does not guarantee approval. Final eligibility is decided by the implementing department."
    )
    return item


def _state_matches(scheme: dict, state: str | None) -> bool:
    applicability = [item.lower() for item in scheme.get("state_applicability", [])]
    if "all india" in applicability or not state:
        return True
    return state.lower() in applicability


def _category_matches(scheme: dict, category: str | None) -> bool:
    if not category:
        return True
    categories = [item.lower() for item in scheme.get("farmer_categories", [])]
    return "all" in categories or category.lower() in categories


def _crop_matches(scheme: dict, crop: str | None) -> bool:
    if not crop:
        return True
    crops = [item.lower() for item in scheme.get("crops", [])]
    return "all" in crops or crop.lower() in crops


def _land_matches(scheme: dict, land_size_ha: float | None) -> bool:
    if land_size_ha is None:
        return True
    minimum = scheme.get("landholding_min_ha")
    maximum = scheme.get("landholding_max_ha")
    if minimum is not None and land_size_ha < minimum:
        return False
    if maximum is not None and land_size_ha > maximum:
        return False
    return True


def search_schemes(
    query: str | None = None,
    state: str | None = None,
    district: str | None = None,
    farmer_category: str | None = None,
    land_size_ha: float | None = None,
    crop: str | None = None,
    language: str = "en",
) -> list[dict]:
    schemes = load_government_schemes()
    text = (query or "").strip().lower()
    results = []
    for scheme in schemes:
        if state and not _state_matches(scheme, state):
            continue
        if farmer_category and not _category_matches(scheme, farmer_category):
            continue
        if crop and not _crop_matches(scheme, crop):
            continue
        if land_size_ha is not None and not _land_matches(scheme, land_size_ha):
            continue
        if text:
            haystack = " ".join(
                str(scheme.get(field, ""))
                for field in ("name", "name_hi", "description", "description_hi", "department")
            ).lower()
            if text not in haystack:
                continue
        results.append(_localized(scheme, language))
    return results


def get_scheme(scheme_id: str, language: str = "en") -> dict | None:
    for scheme in load_government_schemes():
        if scheme.get("id") == scheme_id:
            return _localized(scheme, language)
    return None


def recommend_schemes(
    state: str | None,
    district: str | None,
    farmer_category: str | None,
    land_size_ha: float | None,
    crop: str | None,
    language: str = "en",
) -> list[dict]:
    schemes = load_government_schemes()
    recommendations = []
    for scheme in schemes:
        reasons = []
        score = 0
        if _state_matches(scheme, state):
            score += 2
            if state and any(
                item.lower() == state.lower() for item in scheme.get("state_applicability", [])
            ):
                reasons.append(f"Specifically applicable to {state}")
            else:
                reasons.append("Available across India")
        else:
            continue

        if _category_matches(scheme, farmer_category):
            score += 1
            categories = scheme.get("farmer_categories", [])
            if farmer_category and "all" not in [item.lower() for item in categories]:
                reasons.append(f"Matches farmer category: {farmer_category}")
        else:
            continue

        if _land_matches(scheme, land_size_ha):
            score += 1
            maximum = scheme.get("landholding_max_ha")
            if land_size_ha is not None and maximum is not None:
                reasons.append(f"Land size within the scheme's {maximum} hectare limit")
            elif land_size_ha is not None:
                reasons.append("No maximum landholding limit recorded for this scheme")
        else:
            continue

        if _crop_matches(scheme, crop):
            score += 1
            crops = scheme.get("crops", [])
            if crop and "all" not in [item.lower() for item in crops]:
                reasons.append(f"Supports crop: {crop}")
        else:
            continue

        item = _localized(scheme, language)
        item["match_score"] = score
        item["match_reasons"] = reasons or ["General agricultural scheme"]
        item["district_note"] = (
            f"District {district} is noted, but scheme implementation is usually administered at state or national level."
            if district
            else None
        )
        recommendations.append(item)

    recommendations.sort(key=lambda item: item["match_score"], reverse=True)
    return recommendations
