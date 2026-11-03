"""Mandi price data access and market comparison.

Live records come from the data.gov.in AGMARKNET resource. When credentials
are missing the service returns a structured configuration error rather than
inventing live prices. Explicitly labelled demonstration data is available only
when MARKET_DEMO_MODE=true.
"""

import asyncio
import json
import logging
import math
import re
import time
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import quote

import httpx

from app.config import settings
from app.utils.language_utils import pick

logger = logging.getLogger(__name__)

DEMO_PATH = Path(__file__).resolve().parent.parent / "knowledge_base" / "market_demo_data.json"
DATA_GOV_BASE = "https://api.data.gov.in/resource"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
_cache: dict[str, tuple[float, list[dict]]] = {}
_geo_cache: dict[str, dict | None] = {}

CROPS = [
    {"name": "Tomato", "name_hi": "टमाटर"},
    {"name": "Onion", "name_hi": "प्याज"},
    {"name": "Wheat", "name_hi": "गेहूं"},
    {"name": "Rice", "name_hi": "धान"},
    {"name": "Maize", "name_hi": "मक्का"},
    {"name": "Potato", "name_hi": "आलू"},
    {"name": "Cotton", "name_hi": "कपास"},
    {"name": "Soybean", "name_hi": "सोयाबीन"},
    {"name": "Sugarcane", "name_hi": "गन्ना"},
    {"name": "Chilli", "name_hi": "मिर्च"},
    {"name": "Mustard", "name_hi": "सरसों"},
    {"name": "Groundnut", "name_hi": "मूंगफली"},
]


class MarketServiceError(Exception):
    def __init__(self, message: str, error_code: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.status_code = status_code


def _parse_number(value) -> float | None:
    if value is None:
        return None
    text = str(value).strip().replace(",", "")
    if text.lower() in {"", "na", "n/a", "not available", "none", "-"}:
        return None
    try:
        return float(text)
    except ValueError:
        match = re.search(r"-?\d+(?:\.\d+)?", text)
        return float(match.group()) if match else None


def _parse_date(value: str | None) -> str | None:
    if not value:
        return None
    text = str(value).strip()
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d %b %Y", "%d %B %Y"):
        try:
            return datetime.strptime(text, fmt).date().isoformat()
        except ValueError:
            continue
    return text


def _normalise_live_record(record: dict) -> dict:
    return {
        "market": record.get("market") or record.get("market_name") or "Unknown market",
        "state": record.get("state") or "",
        "district": record.get("district") or "",
        "commodity": record.get("commodity") or "",
        "variety": record.get("variety") or None,
        "min_price": _parse_number(record.get("min_price")),
        "max_price": _parse_number(record.get("max_price")),
        "modal_price": _parse_number(record.get("modal_price")),
        "arrival_quantity": _parse_number(
            record.get("arrival_quantity")
            or record.get("arrivals_in_qtl")
            or record.get("arrival_qty")
        ),
        "price_date": _parse_date(
            record.get("arrival_date")
            or record.get("price_date")
            or record.get("reported_date")
        ),
        "unit": "INR/quintal",
        "latitude": _parse_number(record.get("latitude") or record.get("lat")),
        "longitude": _parse_number(record.get("longitude") or record.get("lon") or record.get("lng")),
        "source": "data.gov.in / AGMARKNET",
    }


def _load_hardcoded_records(crop: str, state: str, district: str, nearby: bool = False) -> list[dict]:
    """Load reference market prices from the hardcoded knowledge-base file."""
    data_path = Path(__file__).resolve().parent.parent / "knowledge_base" / "market_hardcoded_data.json"
    with data_path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    records = []
    for item in payload.get("records", []):
        commodity = item.get("commodity") or ""
        if crop.lower() not in commodity.lower():
            continue
        if state and item.get("state") and item["state"].strip().lower() != state.strip().lower():
            continue
        # A nearby search matches crop+state only; the offline reference file
        # does not apply an API district filter, so district is honoured when
        # searching an exact district.
        if not nearby and district and item.get("district"):
            if district.strip().lower() not in item["district"].strip().lower():
                continue
        records.append(item)
    return records


def _load_demo_records() -> list[dict]:
    with DEMO_PATH.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    records = []
    for item in payload.get("records", []):
        record = _normalise_live_record(item)
        record["source"] = "DEMONSTRATION DATA - NOT LIVE"
        records.append(record)
    return records


async def fetch_prices(
    crop: str, state: str, district: str, nearby: bool = False
) -> tuple[list[dict], str, bool]:
    """Return matching latest price records, source label and demo flag."""

    cache_key = f"{state.lower()}|{'nearby' if nearby else district.lower()}|{crop.lower()}"

    if settings.market_demo_mode:
        records = [
            record
            for record in _load_demo_records()
            if record["commodity"].lower() == crop.lower()
            and record["state"].lower() == state.lower()
            and (nearby or record["district"].lower() == district.lower())
        ]
        _cache[cache_key] = (time.time() + settings.market_cache_ttl_seconds, records)
        return records, "DEMONSTRATION DATA - NOT LIVE", True

    if settings.market_data_mode == "api":
        params = {
            "api-key": settings.data_gov_in_api_key,
            "format": "json",
            "limit": 1000 if nearby else 500,
        }
        if not nearby:
            params["filters[district]"] = district
        if not settings.data_gov_in_api_key.strip():
            raise MarketServiceError(
                "Live market data is not configured. Set MARKET_DATA_MODE=hardcoded "
                "or add DATA_GOV_IN_API_KEY to backend/.env, or enable labelled "
                "demonstration mode for offline demos.",
                "MARKET_NOT_CONFIGURED",
                503,
            )
        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                response = await client.get(
                    f"{DATA_GOV_BASE}/{quote(settings.data_gov_in_resource_id)}",
                    params=params,
                )
        except httpx.HTTPError as exc:
            logger.warning("data.gov.in network error: %s", exc.__class__.__name__)
            raise MarketServiceError(
                "Market price information is temporarily unavailable. Please retry.",
                "MARKET_SERVICE_UNAVAILABLE",
                502,
            ) from exc

        if response.status_code in {401, 403}:
            raise MarketServiceError(
                "The market data credentials were rejected. Check DATA_GOV_IN_API_KEY.",
                "MARKET_AUTH_FAILED",
                503,
            )
        if response.status_code >= 400:
            logger.warning("data.gov.in returned HTTP %s", response.status_code)
            raise MarketServiceError(
                "Market price information is temporarily unavailable. Please retry.",
                "MARKET_SERVICE_ERROR",
                502,
            )

        try:
            payload = response.json()
        except ValueError as exc:
            raise MarketServiceError(
                "The market data source returned an unreadable response.",
                "MARKET_INVALID_RESPONSE",
                502,
            ) from exc

        if payload.get("status") == "error" or payload.get("message"):
            logger.warning("data.gov.in returned an error: %s", payload.get("message"))
            return [], "data.gov.in / AGMARKNET", False

        raw_records = payload.get("records") or []
        records = []
        for raw in raw_records:
            record = _normalise_live_record(raw)
            commodity = record.get("commodity") or ""
            if crop.lower() not in commodity.lower():
                continue
            if state and record.get("state") and record["state"].strip().lower() != state.strip().lower():
                continue
            if not nearby and district and record.get("district") and district.strip().lower() not in record["district"].strip().lower():
                continue
            records.append(record)

        latest: dict[str, dict] = {}
        for record in records:
            key = record.get("market") or "unknown"
            current = latest.get(key)
            if current is None or (record.get("price_date") or "") >= (current.get("price_date") or ""):
                latest[key] = record
        records = list(latest.values())

        _cache[cache_key] = (time.time() + settings.market_cache_ttl_seconds, records)
        return records, "data.gov.in / AGMARKNET", False

    # Default ("hardcoded"): reference market prices loaded from
    # knowledge_base/market_hardcoded_data.json — no live API key required.
    records = _load_hardcoded_records(crop, state, district, nearby=nearby)
    _cache[cache_key] = (time.time() + settings.market_cache_ttl_seconds, records)
    return records, "data.gov.in / AGMARKNET (reference dataset)", False


async def _nominatim_geocode(query: str) -> dict | None:
    key = query.lower()
    if key in _geo_cache:
        return _geo_cache[key]
    try:
        async with httpx.AsyncClient(
            timeout=12.0,
            headers={"User-Agent": "KrishiMitraAI/1.0 (farmer advisory demo; contact: local)"},
        ) as client:
            response = await client.get(
                NOMINATIM_URL,
                params={"q": query, "format": "json", "limit": 1, "countrycodes": "in"},
            )
        if response.status_code == 200:
            results = response.json()
            if results:
                geo = {
                    "latitude": float(results[0]["lat"]),
                    "longitude": float(results[0]["lon"]),
                }
                _geo_cache[key] = geo
                return geo
    except Exception as exc:  # pragma: no cover - network dependent
        logger.info("Nominatim geocoding failed: %s", exc.__class__.__name__)
    _geo_cache[key] = None
    return None


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371.0088
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(a))


async def compare_markets(
    crop: str,
    state: str,
    district: str,
    transport_cost_per_km_quintal: float,
    latitude: float | None = None,
    longitude: float | None = None,
    language: str = "en",
) -> dict:
    records, source, is_demo = await fetch_prices(crop, state, district, nearby=True)
    if not records:
        return {
            "crop": crop,
            "state": state,
            "district": district,
            "records": [],
            "highest_modal_market": None,
            "recommended_market": None,
            "recommendation_reason": pick(
                language,
                "No recent market records were found for this crop and district.",
                "इस फसल और जिले के लिए हाल के बाजार रिकॉर्ड नहीं मिले।",
            ),
            "transport_cost_used": transport_cost_per_km_quintal,
            "data_source": source,
            "is_demo": is_demo,
            "last_updated": None,
            "notification": (
                "Demonstration records are shown. They are not live mandi prices."
                if is_demo
                else "No live records were returned by the market data source."
            ),
        }

    origin = None
    if latitude is not None and longitude is not None:
        origin = {"latitude": latitude, "longitude": longitude}
    else:
        geo = await _nominatim_geocode(f"{district}, {state}, India")
        if geo:
            origin = geo

    # Prefer markets that are geographically closest when coordinates exist.
    if origin:
        for record in records:
            if record.get("latitude") is not None and record.get("longitude") is not None:
                record["distance_km"] = round(
                    haversine_km(
                        origin["latitude"],
                        origin["longitude"],
                        record["latitude"],
                        record["longitude"],
                    ),
                    1,
                )
        with_distance = [item for item in records if item.get("distance_km") is not None]
        without_distance = [item for item in records if item.get("distance_km") is None]
        with_distance.sort(key=lambda item: item["distance_km"])
        without_distance.sort(key=lambda item: item.get("modal_price") or 0, reverse=True)
        records = (with_distance + without_distance)[:4]
    else:
        records = sorted(records, key=lambda item: item.get("modal_price") or 0, reverse=True)[:4]

    for record in records:
        if (
            record.get("distance_km") is None
            and record.get("latitude") is not None
            and record.get("longitude") is not None
            and origin
        ):
            record["distance_km"] = round(
                haversine_km(
                    origin["latitude"], origin["longitude"], record["latitude"], record["longitude"]
                ),
                1,
            )
        elif origin and record.get("distance_km") is None:
            # Geocode at most the selected comparison markets and respect
            # Nominatim's public rate policy.
            geo = await _nominatim_geocode(
                f"{record['market']}, {record['district']}, {record['state']}, India"
            )
            await asyncio.sleep(1.05)
            if geo:
                record["latitude"] = geo["latitude"]
                record["longitude"] = geo["longitude"]
                record["distance_km"] = round(
                    haversine_km(
                        origin["latitude"], origin["longitude"], geo["latitude"], geo["longitude"]
                    ),
                    1,
                )
        if (
            transport_cost_per_km_quintal > 0
            and record.get("distance_km") is not None
            and record.get("modal_price") is not None
        ):
            record["estimated_net_return"] = round(
                record["modal_price"]
                - (2 * record["distance_km"] * transport_cost_per_km_quintal),
                2,
            )

    highest_modal = max(records, key=lambda item: item.get("modal_price") or 0)
    net_candidates = [item for item in records if item.get("estimated_net_return") is not None]
    if net_candidates:
        recommended = max(net_candidates, key=lambda item: item.get("estimated_net_return") or 0)
        reason = pick(
            language,
            f"{recommended['market']} has the best estimated net return after the configured "
            f"transport cost (₹{recommended['estimated_net_return']:.0f}/quintal). "
            "This is an estimate, not a guaranteed sale price.",
            f"निर्धारित परिवहन लागत के बाद {recommended['market']} का अनुमानित शुद्ध रिटर्न सबसे अच्छा है "
            f"(₹{recommended['estimated_net_return']:.0f}/क्विंटल)। यह अनुमान है, बिक्री मूल्य की गारंटी नहीं।",
        )
    else:
        recommended = highest_modal
        reason = pick(
            language,
            f"{highest_modal['market']} has the highest reported modal price. Net return was not "
            "estimated because transport cost and/or market distance was not available.",
            f"{highest_modal['market']} का reported modal price सबसे अधिक है। परिवहन लागत और/या बाजार की दूरी "
            "उपलब्ध न होने के कारण शुद्ध रिटर्न का अनुमान नहीं लगाया गया।",
        )

    price_dates = [record.get("price_date") for record in records if record.get("price_date")]
    notification = None
    if is_demo:
        notification = "Demonstration records are shown. They are not live mandi prices."

    return {
        "crop": crop,
        "state": state,
        "district": district,
        "records": records,
        "highest_modal_market": highest_modal.get("market"),
        "recommended_market": recommended.get("market"),
        "recommendation_reason": reason,
        "transport_cost_used": transport_cost_per_km_quintal,
        "data_source": source,
        "is_demo": is_demo,
        "last_updated": max(price_dates) if price_dates else None,
        "notification": notification,
        "generated_at": datetime.now(UTC).isoformat(),
    }
