"""OpenWeather integration, caching and agricultural rule engine.

All weather values displayed to farmers come from OpenWeather responses. The
rule engine only interprets those values; it never invents measurements.
"""

import asyncio
import logging
import time
from datetime import UTC, datetime

import httpx

from app.config import settings
from app.utils.language_utils import normalize_language, pick

logger = logging.getLogger(__name__)

OPENWEATHER_BASE = "https://api.openweathermap.org"
_cache: dict[str, tuple[float, dict]] = {}
_lock = asyncio.Lock()


class WeatherServiceError(Exception):
    def __init__(self, message: str, error_code: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.status_code = status_code


def _require_key() -> str:
    if not settings.openweather_configured:
        raise WeatherServiceError(
            "Weather information is not configured. Add OPENWEATHER_API_KEY to backend/.env.",
            "WEATHER_NOT_CONFIGURED",
            503,
        )
    return settings.openweather_api_key


def _cache_get(key: str) -> dict | None:
    item = _cache.get(key)
    if item and item[0] > time.time():
        return item[1]
    _cache.pop(key, None)
    return None


def _cache_set(key: str, value: dict, ttl: int | None = None) -> None:
    _cache[key] = (time.time() + (ttl or settings.weather_cache_ttl_seconds), value)


async def _get_json(path: str, params: dict) -> dict:
    key = _require_key()
    params = {**params, "appid": key, "units": "metric"}
    cache_key = path + ":" + ":".join(f"{k}={v}" for k, v in sorted(params.items()) if k != "appid")
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(f"{OPENWEATHER_BASE}{path}", params=params)
    except httpx.HTTPError as exc:
        logger.warning("OpenWeather network error: %s", exc.__class__.__name__)
        raise WeatherServiceError(
            "Weather information is temporarily unavailable. Please retry.",
            "WEATHER_SERVICE_UNAVAILABLE",
            502,
        ) from exc

    if response.status_code == 401:
        raise WeatherServiceError(
            "The weather service credentials were rejected. Check OPENWEATHER_API_KEY.",
            "WEATHER_AUTH_FAILED",
            503,
        )
    if response.status_code == 404:
        raise WeatherServiceError(
            "Location was not found by the weather service. Check the district or coordinates.",
            "WEATHER_LOCATION_NOT_FOUND",
            404,
        )
    if response.status_code >= 400:
        logger.warning("OpenWeather returned HTTP %s", response.status_code)
        raise WeatherServiceError(
            "Weather information is temporarily unavailable. Please retry.",
            "WEATHER_SERVICE_ERROR",
            502,
        )
    payload = response.json()
    _cache_set(cache_key, payload)
    return payload


async def geocode_location(state: str, district: str) -> dict:
    query = f"{district},{state},IN"
    cache_key = f"geo:{query.lower()}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached
    results = await _get_json("/geo/1.0/direct", {"q": query, "limit": 1})
    if not results:
        raise WeatherServiceError(
            "Location was not found. Select a valid state and district.",
            "WEATHER_LOCATION_NOT_FOUND",
            404,
        )
    item = results[0]
    location = {
        "name": item.get("name") or district,
        "state": item.get("state") or state,
        "district": district,
        "latitude": item.get("lat"),
        "longitude": item.get("lon"),
        "country": item.get("country"),
    }
    _cache_set(cache_key, location, ttl=86400)
    return location


async def resolve_location(
    state: str | None,
    district: str | None,
    latitude: float | None = None,
    longitude: float | None = None,
) -> dict:
    if latitude is not None and longitude is not None:
        return {
            "name": district or "Selected location",
            "state": state or "",
            "district": district or "",
            "latitude": latitude,
            "longitude": longitude,
            "country": "IN",
        }
    if not state or not district:
        raise WeatherServiceError(
            "Provide a state and district, or valid latitude and longitude.",
            "WEATHER_LOCATION_REQUIRED",
            422,
        )
    return await geocode_location(state, district)


def _condition(data: dict) -> dict:
    weather = (data.get("weather") or [{}])[0]
    return {
        "main": weather.get("main", "Unknown"),
        "description": weather.get("description", ""),
        "icon": weather.get("icon", "01d"),
    }


def _process_current(payload: dict, location: dict) -> dict:
    main = payload.get("main", {})
    wind = payload.get("wind", {})
    clouds = payload.get("clouds", {})
    rain = payload.get("rain", {})
    return {
        "location": location,
        "observed_at": datetime.fromtimestamp(payload.get("dt", 0), tz=UTC).isoformat()
        if payload.get("dt")
        else None,
        "temperature_c": main.get("temp"),
        "feels_like_c": main.get("feels_like"),
        "humidity_percent": main.get("humidity"),
        "pressure_hpa": main.get("pressure"),
        "condition": _condition(payload),
        "wind_speed_kmh": round((wind.get("speed") or 0) * 3.6, 1),
        "wind_direction_deg": wind.get("deg"),
        "clouds_percent": clouds.get("all"),
        "rain_1h_mm": rain.get("1h"),
        "rain_3h_mm": rain.get("3h"),
        "visibility_m": payload.get("visibility"),
        "timezone_offset_seconds": payload.get("timezone", 0),
        "source": "OpenWeather",
    }


def _process_forecast(payload: dict) -> dict:
    city = payload.get("city", {})
    entries = []
    daily: dict[str, dict] = {}
    for item in payload.get("list", []):
        main = item.get("main", {})
        wind = item.get("wind", {})
        rain = item.get("rain", {})
        pop = item.get("pop")
        entry = {
            "time": item.get("dt_txt"),
            "timestamp": datetime.fromtimestamp(item.get("dt", 0), tz=UTC).isoformat(),
            "temperature_c": main.get("temp"),
            "feels_like_c": main.get("feels_like"),
            "humidity_percent": main.get("humidity"),
            "rain_probability": pop,
            "rain_3h_mm": rain.get("3h"),
            "wind_speed_kmh": round((wind.get("speed") or 0) * 3.6, 1),
            "condition": _condition(item),
        }
        entries.append(entry)

        day = (item.get("dt_txt") or "")[:10]
        if not day:
            continue
        bucket = daily.setdefault(
            day,
            {
                "date": day,
                "min_temp_c": main.get("temp"),
                "max_temp_c": main.get("temp"),
                "max_rain_probability": pop or 0,
                "total_rain_mm": 0.0,
                "humidity_values": [],
                "max_wind_kmh": 0.0,
                "conditions": {},
            },
        )
        bucket["min_temp_c"] = min(bucket["min_temp_c"], main.get("temp") or 0)
        bucket["max_temp_c"] = max(bucket["max_temp_c"], main.get("temp") or 0)
        bucket["max_rain_probability"] = max(bucket["max_rain_probability"], pop or 0)
        bucket["total_rain_mm"] += rain.get("3h") or 0
        bucket["humidity_values"].append(main.get("humidity") or 0)
        bucket["max_wind_kmh"] = max(bucket["max_wind_kmh"], entry["wind_speed_kmh"])
        condition = entry["condition"]["description"]
        bucket["conditions"][condition] = bucket["conditions"].get(condition, 0) + 1

    daily_summary = []
    for bucket in daily.values():
        dominant = max(bucket["conditions"], key=bucket["conditions"].get) if bucket["conditions"] else ""
        daily_summary.append(
            {
                "date": bucket["date"],
                "min_temp_c": round(bucket["min_temp_c"], 1),
                "max_temp_c": round(bucket["max_temp_c"], 1),
                "max_rain_probability": round(bucket["max_rain_probability"], 2),
                "total_rain_mm": round(bucket["total_rain_mm"], 1),
                "avg_humidity_percent": round(
                    sum(bucket["humidity_values"]) / max(len(bucket["humidity_values"]), 1), 1
                ),
                "max_wind_kmh": round(bucket["max_wind_kmh"], 1),
                "dominant_condition": dominant,
            }
        )

    return {
        "city": {
            "name": city.get("name"),
            "country": city.get("country"),
            "timezone_offset_seconds": city.get("timezone", 0),
        },
        "forecast_generated_at": datetime.now(UTC).isoformat(),
        "source_timestamp": entries[0]["timestamp"] if entries else None,
        "entries": entries,
        "daily": daily_summary,
        "source": "OpenWeather 5-day / 3-hour forecast",
    }


async def get_current(
    state: str | None,
    district: str | None,
    latitude: float | None = None,
    longitude: float | None = None,
) -> dict:
    location = await resolve_location(state, district, latitude, longitude)
    params = {"lat": location["latitude"], "lon": location["longitude"]}
    payload = await _get_json("/data/2.5/weather", params)
    return _process_current(payload, location)


async def get_forecast(
    state: str | None,
    district: str | None,
    latitude: float | None = None,
    longitude: float | None = None,
) -> dict:
    location = await resolve_location(state, district, latitude, longitude)
    params = {"lat": location["latitude"], "lon": location["longitude"]}
    payload = await _get_json("/data/2.5/forecast", params)
    result = _process_forecast(payload)
    result["location"] = location
    return result


def build_advisory(
    current: dict,
    forecast: dict,
    crop: str | None,
    growth_stage: str | None,
    language: str,
) -> dict:
    """Evaluate measured weather against transparent agricultural rules."""

    language = normalize_language(language)
    next_days = forecast.get("daily", [])[:3]
    next_24h = forecast.get("entries", [])[:8]
    rain_24h = sum((entry.get("rain_3h_mm") or 0) for entry in next_24h)
    max_pop = max((entry.get("rain_probability") or 0) for entry in next_24h) if next_24h else 0
    max_temp = max((day.get("max_temp_c") or -999) for day in next_days) if next_days else (
        current.get("temperature_c") or 0
    )
    min_temp = min((day.get("min_temp_c") or 999) for day in next_days) if next_days else (
        current.get("temperature_c") or 0
    )
    avg_humidity = (
        sum((day.get("avg_humidity_percent") or 0) for day in next_days) / len(next_days)
        if next_days
        else (current.get("humidity_percent") or 0)
    )
    max_wind = max((day.get("max_wind_kmh") or 0) for day in next_days) if next_days else (
        current.get("wind_speed_kmh") or 0
    )
    total_rain_3d = sum((day.get("total_rain_mm") or 0) for day in next_days)
    condition_main = (current.get("condition") or {}).get("main", "")

    advisories: list[dict] = []

    def add(code: str, severity: str, title_en: str, title_hi: str, detail_en: str, detail_hi: str):
        advisories.append(
            {
                "code": code,
                "severity": severity,
                "title": pick(language, title_en, title_hi),
                "detail": pick(language, detail_en, detail_hi),
            }
        )

    if max_pop >= 0.7 or rain_24h >= 20:
        add(
            "heavy_rain",
            "high",
            "Heavy rain likely",
            "भारी बारिश की संभावना",
            f"Forecast rain probability reaches {round(max_pop * 100)}% with about {round(rain_24h, 1)} mm in the next 24 hours. Delay irrigation and check field drainage.",
            f"अगले 24 घंटों में बारिश की संभावना {round(max_pop * 100)}% और लगभग {round(rain_24h, 1)} मिमी वर्षा है। सिंचाई टालें और खेत में जल निकासी जांचें।",
        )
    elif max_pop >= 0.4 or rain_24h >= 5:
        add(
            "moderate_rain",
            "medium",
            "Rain possible",
            "बारिश संभव",
            f"Rain probability reaches {round(max_pop * 100)}% in the next 24 hours. Avoid irrigation if soil moisture is already adequate.",
            f"अगले 24 घंटों में बारिश की संभावना {round(max_pop * 100)}% है। यदि मिट्टी में पर्याप्त नमी है तो सिंचाई न करें।",
        )

    if max_temp >= 38:
        add(
            "heat_stress",
            "high",
            "Heat stress risk",
            "गर्मी का तनाव",
            f"Maximum temperature may reach {round(max_temp, 1)}°C. Irrigate in the early morning or evening, monitor soil moisture and watch for wilting.",
            f"अधिकतम तापमान {round(max_temp, 1)}°C तक पहुंच सकता है। सुबह या शाम सिंचाई करें, मिट्टी की नमी देखें और मुरझाने पर ध्यान दें।",
        )
    elif max_temp >= 35:
        add(
            "warm_weather",
            "medium",
            "Warm conditions",
            "गर्म मौसम",
            f"Maximum temperature may reach {round(max_temp, 1)}°C. Monitor soil moisture and avoid mid-day field operations where possible.",
            f"अधिकतम तापमान {round(max_temp, 1)}°C तक पहुंच सकता है। मिट्टी की नमी पर नजर रखें और दोपहर में खेत के काम से बचें।",
        )

    if avg_humidity >= 80:
        add(
            "high_humidity",
            "medium",
            "High humidity",
            "अधिक आर्द्रता",
            f"Average humidity is about {round(avg_humidity)}%. Prolonged leaf wetness can favour fungal disease. Monitor leaves closely and avoid overhead irrigation.",
            f"औसत आर्द्रता लगभग {round(avg_humidity)}% है। लंबे समय तक पत्तियों पर नमी फंगल रोग बढ़ा सकती है। पत्तियों की निगरानी करें और ऊपर से सिंचाई से बचें।",
        )

    if max_wind >= 30:
        add(
            "strong_wind",
            "high",
            "Strong wind",
            "तेज हवा",
            f"Wind speed may reach {round(max_wind, 1)} km/h. Avoid spraying and secure lightweight structures.",
            f"हवा की गति {round(max_wind, 1)} किमी/घंटा तक पहुंच सकती है। छिड़काव न करें और हल्की संरचनाएं सुरक्षित करें।",
        )
    elif max_wind >= 20:
        add(
            "windy",
            "low",
            "Windy conditions",
            "हवा चलने की स्थिति",
            f"Wind speed may reach {round(max_wind, 1)} km/h. Spray only when wind is within the product label's safe range.",
            f"हवा की गति {round(max_wind, 1)} किमी/घंटा तक पहुंच सकती है। छिड़काव तभी करें जब हवा उत्पाद लेबल की सुरक्षित सीमा में हो।",
        )

    if min_temp <= 5:
        add(
            "cold_wave",
            "high",
            "Cold / frost risk",
            "ठंड / पाला",
            f"Minimum temperature may fall to {round(min_temp, 1)}°C. Protect sensitive nurseries and young plants where possible.",
            f"न्यूनतम तापमान {round(min_temp, 1)}°C तक गिर सकता है। संवेदनशील नर्सरी और छोटे पौधों को जहां संभव हो सुरक्षित रखें।",
        )

    if total_rain_3d < 1 and max_temp >= 32:
        add(
            "dry_spell",
            "medium",
            "Dry spell",
            "सूखा दौर",
            f"Only about {round(total_rain_3d, 1)} mm rain is expected in the next three days with warm temperatures. Check soil moisture before irrigating; do not over-irrigate.",
            f"अगले तीन दिनों में लगभग {round(total_rain_3d, 1)} मिमी वर्षा और गर्म तापमान की संभावना है। सिंचाई से पहले मिट्टी की नमी जांचें; अधिक सिंचाई न करें।",
        )

    if condition_main in {"Thunderstorm", "Squall", "Tornado"}:
        add(
            "storm",
            "high",
            "Storm conditions",
            "तूफानी मौसम",
            "Thunderstorm conditions are reported. Avoid open-field work and do not shelter under isolated trees.",
            "तूफान की स्थिति दर्ज की गई है। खुले खेत में काम से बचें और अकेले पेड़ के नीचे आश्रय न लें।",
        )

    crop_key = (crop or "").strip().lower()
    crop_rules = {
        "rice": (
            "rice_water", "Rice crop note", "धान फसल सलाह",
            "If heavy rain occurs, ensure field drainage and avoid unnecessary standing water beyond the crop's recommended stage.",
            "भारी बारिश होने पर खेत में जल निकासी सुनिश्चित करें और फसल की अनुशंसित अवस्था से अधिक पानी न रखें।",
            "heavy_rain",
        ),
        "paddy": (
            "rice_water", "Rice crop note", "धान फसल सलाह",
            "If heavy rain occurs, ensure field drainage and avoid unnecessary standing water beyond the crop's recommended stage.",
            "भारी बारिश होने पर खेत में जल निकासी सुनिश्चित करें और फसल की अनुशंसित अवस्था से अधिक पानी न रखें।",
            "heavy_rain",
        ),
        "wheat": (
            "wheat_humidity", "Wheat crop note", "गेहूं फसल सलाह",
            "Warm, humid weather can favour rust and other foliar diseases. Inspect leaves regularly and report unusual symptoms.",
            "गर्म और नम मौसम रतुआ जैसे पत्ती रोगों के लिए अनुकूल हो सकता है। पत्तियों की नियमित जांच करें और असामान्य लक्षण की सूचना दें।",
            "high_humidity",
        ),
        "tomato": (
            "tomato_blight", "Tomato crop note", "टमाटर फसल सलाह",
            "High humidity with warm days can favour blight diseases. Improve airflow and avoid overhead watering.",
            "अधिक आर्द्रता और गर्म दिन झुलसा रोग के लिए अनुकूल हो सकते हैं। हवा का आवागमन बढ़ाएं और ऊपर से पानी देने से बचें।",
            "high_humidity",
        ),
        "potato": (
            "potato_blight", "Potato crop note", "आलू फसल सलाह",
            "Cool, wet conditions can favour late blight. Inspect leaves and remove severely affected plants.",
            "ठंडा और नम मौसम पछेती झुलसा के लिए अनुकूल हो सकता है। पत्तियों की जांच करें और गंभीर प्रभावित पौधे हटाएं।",
            "high_humidity",
        ),
        "cotton": (
            "cotton_humidity", "Cotton crop note", "कपास फसल सलाह",
            "Monitor whitefly and leaf health during humid spells. Avoid unnecessary insecticide use.",
            "नम दौर में सफेद मक्खी और पत्तियों की सेहत पर नजर रखें। अनावश्यक कीटनाशक का उपयोग न करें।",
            "high_humidity",
        ),
        "maize": (
            "maize_wind", "Maize crop note", "मक्का फसल सलाह",
            "Strong wind can cause lodging in tall maize. Avoid irrigation just before expected high wind.",
            "तेज हवा लंबी मक्का को गिरा सकती है। तेज हवा की संभावना से ठीक पहले सिंचाई न करें।",
            "strong_wind",
        ),
        "sugarcane": (
            "sugarcane_water", "Sugarcane crop note", "गन्ना फसल सलाह",
            "Heavy rain may cause waterlogging. Check drainage channels around the field.",
            "भारी बारिश से जलभराव हो सकता है। खेत के चारों ओर जल निकासी नालियां जांचें।",
            "heavy_rain",
        ),
    }
    crop_rule = crop_rules.get(crop_key)
    if crop_rule and any(item["code"] == crop_rule[5] for item in advisories):
        add(
            crop_rule[0], "medium", crop_rule[1], crop_rule[2],
            crop_rule[3] + (f" Growth stage: {growth_stage}." if growth_stage else ""),
            crop_rule[4] + (f" वृद्धि अवस्था: {growth_stage}।" if growth_stage else ""),
        )

    if not advisories:
        add(
            "normal",
            "low",
            "No major weather alert",
            "कोई बड़ी मौसम चेतावनी नहीं",
            "Forecast conditions do not trigger a major agricultural alert. Continue routine crop monitoring.",
            "पूर्वानुमानित मौसम से कोई बड़ी कृषि चेतावनी नहीं है। फसल की सामान्य निगरानी जारी रखें।",
        )

    return {
        "location": current.get("location"),
        "crop": crop,
        "growth_stage": growth_stage,
        "generated_at": datetime.now(UTC).isoformat(),
        "weather_observed_at": current.get("observed_at"),
        "forecast_source_timestamp": forecast.get("source_timestamp"),
        "summary": {
            "temperature_c": current.get("temperature_c"),
            "humidity_percent": current.get("humidity_percent"),
            "wind_speed_kmh": current.get("wind_speed_kmh"),
            "condition": current.get("condition"),
            "rain_probability_next_24h": round(max_pop, 2),
            "rain_24h_mm": round(rain_24h, 1),
            "max_temp_next_3d_c": round(max_temp, 1),
            "min_temp_next_3d_c": round(min_temp, 1),
            "avg_humidity_next_3d_percent": round(avg_humidity, 1),
            "max_wind_next_3d_kmh": round(max_wind, 1),
            "rain_next_3d_mm": round(total_rain_3d, 1),
        },
        "advisories": advisories,
        "source": "OpenWeather + Krishi Mitra rule engine",
        "language": language,
        "disclaimer": pick(
            language,
            "Weather advice is based on the forecast shown and may change. Always follow local official warnings.",
            "मौसम सलाह दिखाए गए पूर्वानुमान पर आधारित है और बदल सकती है। स्थानीय आधिकारिक चेतावनियों का पालन करें।",
        ),
    }
