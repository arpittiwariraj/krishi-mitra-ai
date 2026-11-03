"""Tests for domain services (rule engine, matching, parsing, market demo)."""

import pytest
from unittest.mock import patch

from app.schemas.disease import AIObservation
from app.services import disease_service, market_service, weather_service


class TestWeatherServiceError:
    def test_error_attributes(self):
        exc = weather_service.WeatherServiceError("boom", "TEST_ERROR", status_code=418)
        assert exc.message == "boom"
        assert exc.error_code == "TEST_ERROR"
        assert exc.status_code == 418


class TestWeatherAdvisoryBuild:
    """The rule engine only interprets live measurements; it never invents them."""

    def _forecast(self, *, max_temp=None, avg_humidity=None, rain_probability=None, total_rain=0.0, entries=None):
        daily = [{
            "date": "2026-11-04",
            "min_temp_c": 20.0,
            "max_temp_c": max_temp if max_temp is not None else 29.0,
            "max_rain_probability": rain_probability if rain_probability is not None else 0.1,
            "total_rain_mm": total_rain,
            "avg_humidity_percent": avg_humidity if avg_humidity is not None else 50.0,
            "max_wind_kmh": 8.0,
            "dominant_condition": "clear",
        }]
        base_entries = [
            {
                "dt_txt": "2026-11-03 06:00",
                "dt": 1762130400,
                "main": {"temp": 30.0},
                "humidity": 55,
                "wind": {"speed": 8, "deg": 0},
                "rain_probability": 0.1,
                "rain_3h_mm": 0.0,
            }
        ]
        if entries:
            base_entries = entries
        return {"daily": daily, "entries": base_entries, "source_timestamp": None, "location": {}, "forecast_generated_at": None}

    def _current(self, temperature_c=28.0, main="Clear", desc="clear sky"):
        return {
            "temperature_c": temperature_c,
            "condition": {"main": main, "description": desc, "icon": "01d"},
            "humidity_percent": 55,
            "wind_speed_kmh": 8,
            "observed_at": "2026-11-03T06:00:00+00:00",
            "location": {"name": "Pune", "state": "Maharashtra"},
        }

    def test_heat_stress_triggered_at_38C(self):
        advisory = weather_service.build_advisory(
            self._current(temperature_c=30.0),
            self._forecast(max_temp=38.5),
            crop=None,
            growth_stage=None,
            language="en",
        )
        codes = [a["code"] for a in advisory["advisories"]]
        assert "heat_stress" in codes

    def test_warm_weather_triggered_at_35C(self):
        advisory = weather_service.build_advisory(
            self._current(temperature_c=30.0),
            self._forecast(max_temp=35.0),
            crop=None,
            growth_stage=None,
            language="en",
        )
        codes = [a["code"] for a in advisory["advisories"]]
        assert "warm_weather" in codes
        assert "heat_stress" not in codes

    def test_normal_when_nothing_triggered(self):
        advisory = weather_service.build_advisory(
            self._current(temperature_c=28.0),
            self._forecast(),
            crop=None,
            growth_stage=None,
            language="en",
        )
        codes = [a["code"] for a in advisory["advisories"]]
        assert "normal" in codes
        assert len([c for c in codes if c != "normal"]) == 0

    def test_wheat_crop_note_appended_when_high_humidity(self):
        advisory = weather_service.build_advisory(
            self._current(temperature_c=30.0),
            self._forecast(avg_humidity=85.0, max_temp=29.0),
            crop="Wheat",
            growth_stage="flowering",
            language="en",
        )
        codes = [a["code"] for a in advisory["advisories"]]
        assert "high_humidity" in codes
        assert any(a["code"] == "wheat_humidity" for a in advisory["advisories"])

    def test_summary_fields_derived_from_forecast(self):
        advisory = weather_service.build_advisory(
            self._current(temperature_c=30.0),
            self._forecast(max_temp=29.0, rain_probability=0.1, total_rain=0.0),
            crop=None,
            growth_stage=None,
            language="en",
        )
        summary = advisory["summary"]
        assert summary["max_temp_next_3d_c"] == 29.0
        assert summary["rain_probability_next_24h"] == 0.1
        assert summary["rain_next_3d_mm"] == 0.0


class TestMarketServiceParsing:
    def test_parse_number(self):
        assert market_service._parse_number("1,200") == 1200.0
        assert market_service._parse_number("1,200.50") == 1200.5
        assert market_service._parse_number("na") is None
        assert market_service._parse_number("—") is None
        assert market_service._parse_number(None) is None
        assert market_service._parse_number("approx 500") == 500.0

    def test_parse_date(self):
        assert market_service._parse_date("02/11/2026") == "2026-11-02"
        assert market_service._parse_date("2026-11-02") == "2026-11-02"
        assert market_service._parse_date(None) is None

    def test_normalise_live_record(self):
        record = {
            "market": "Pune Market Yard",
            "state": "Maharashtra",
            "district": "Pune",
            "commodity": "Tomato",
            "variety": "Local",
            "min_price": "1100",
            "max_price": "1650",
            "modal_price": "1400",
            "arrival_quantity": "820",
            "arrival_date": "02/11/2026",
            "latitude": "18.5204",
            "longitude": "73.8567",
        }
        normalised = market_service._normalise_live_record(record)
        assert normalised["market"] == "Pune Market Yard"
        assert normalised["modal_price"] == 1400.0
        assert normalised["price_date"] == "2026-11-02"
        assert normalised["source"] == "data.gov.in / AGMARKNET"


class TestDiseaseMatch:
    def test_find_disease_match(self):
        from app.services.knowledge_base_service import find_disease_match

        entry = find_disease_match(crop_name="Tomato", possible_disease="Early Blight")
        assert entry is not None
        assert entry["disease_name"] == "Early Blight"

    def test_find_disease_match_no_match(self):
        from app.services.knowledge_base_service import find_disease_match

        assert find_disease_match(crop_name="Rice", possible_disease="Unknown") is None


class TestDiseaseReport:
    @pytest.mark.asyncio
    async def test_build_report_merges_knowledge_base(self):
        observation = AIObservation(
            crop_name="Tomato",
            possible_disease="Early Blight",
            visual_observations=["dark concentric spots on older leaves"],
        )
        with patch.object(disease_service, "find_disease_match", return_value={
            "disease_name": "Early Blight",
            "symptoms": ["dark rings"],
            "possible_causes": ["fungus"],
            "treatment_guidance": ["remove leaves"],
            "prevention": ["rotate crops"],
            "reference_source": "ICAR and state agricultural university extension guidance on Alternaria leaf blight",
            "last_verified": "2025-06-30",
        }):
            report = await disease_service.build_report(observation, language="en", image_info={})
        assert report["knowledge_base_match"] is True
        assert report["knowledge_source"] is not None
        assert report["possible_disease"] == "Early Blight"
        assert report["crop_name"] == "Tomato"
        assert "recommended_actions" in report


class TestMarketDemo:
    @pytest.mark.asyncio
    async def test_demo_mode_returns_labelled_records(self, monkeypatch):
        import app.services.market_service as ms

        monkeypatch.setattr(ms.settings, "market_demo_mode", True)
        records, source, is_demo = await ms.fetch_prices("Tomato", "Maharashtra", "Pune")
        assert is_demo is True
        assert source.startswith("DEMONSTRATION DATA")
        assert len(records) > 0
        assert records[0]["source"].startswith("DEMONSTRATION DATA")

    @pytest.mark.asyncio
    async def test_not_configured_raises_structured_error(self):
        import app.services.market_service as ms

        # Make sure demo mode is off so the not-configured path is taken,
        # regardless of other tests' temporary monkeypatching.
        ms.settings.market_demo_mode = False

        with pytest.raises(ms.MarketServiceError) as excinfo:
            await ms.fetch_prices("Tomato", "Maharashtra", "Pune")
        assert excinfo.value.error_code == "MARKET_NOT_CONFIGURED"
        assert excinfo.value.status_code == 503


class TestWeatherNotConfigured:
    def test_no_key_raises_structured_error(self):
        with pytest.raises(weather_service.WeatherServiceError) as excinfo:
            weather_service._require_key()
        assert excinfo.value.error_code == "WEATHER_NOT_CONFIGURED"
        assert excinfo.value.status_code == 503
