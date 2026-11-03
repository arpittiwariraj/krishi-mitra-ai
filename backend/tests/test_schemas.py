"""Tests for Pydantic request/response schemas."""

import pytest

from app.schemas.disease import (
    AIObservation,
    DiseaseAnalysisResult,
    DiseaseHistoryItem,
)
from app.schemas.farmer import (
    FarmerCreate,
    FarmerLogin,
    FarmerProfileIn,
    FarmerProfileOut,
    FarmerUpdate,
)
from app.schemas.market import (
    MarketCompareRequest,
    MarketComparisonResponse,
    MarketCrop,
    MarketQuery,
)
from app.schemas.scheme import SchemeRecommendRequest
from app.schemas.weather import (
    WeatherAdvisoryRequest,
    WeatherLocationQuery,
)


class TestDiseaseSchemas:
    def test_aiobsrvation_defaults(self):
        payload = {
            "crop_name": "Tomato",
            "possible_disease": "Early Blight",
            "diagnostic_status": "Possible match",
            "certainty_level": "High",
            "confidence_score": None,
            "image_quality": "Good",
            "visual_observations": ["dark spots"],
            "alternative_possibilities": [],
            "symptoms": [],
            "possible_causes": [],
            "recommended_actions": [],
            "prevention": [],
            "expert_consultation": True,
            "disclaimer": "be careful",
        }
        obs = AIObservation(**payload)
        assert obs.crop_name == "Tomato"
        assert obs.confidence_score is None

    def test_aiobsrvation_missing_keys_use_defaults(self):
        obs = AIObservation.model_validate({"crop_name": "Rice"})
        assert obs.possible_disease == "Unclear"
        assert obs.diagnostic_status == "Uncertain"
        assert obs.confidence_score is None
        assert obs.image_quality == "Fair"

    def test_disease_history_item(self):
        item = DiseaseHistoryItem(
            id=1,
            crop_name="Tomato",
            possible_disease="Early Blight",
            certainty_level="High",
            visual_observations=["spots"],
            recommendations={},
            created_at="2026-11-03T00:00:00+00:00",
        )
        assert item.id == 1

    def test_disease_analysis_result_extra_fields(self):
        result = DiseaseAnalysisResult(
            crop_name="Wheat",
            possible_disease="Rust",
            knowledge_base_match=True,
            knowledge_source="ICAR",
            image_info={},
        )
        assert result.knowledge_base_match is True


class TestFarmerSchemas:
    def test_farmer_create(self):
        data = {
            "full_name": "Ramesh",
            "email": "ramesh@example.com",
            "password": "Password123",
            "phone": "+919876543210",
            "state": "Maharashtra",
            "district": "Pune",
            "preferred_language": "en",
        }
        farmer = FarmerCreate(**data)
        assert farmer.email == "ramesh@example.com"

    def test_farmer_login(self):
        login = FarmerLogin(email="a@b.com", password="x")
        assert login.email == "a@b.com"

    def test_profile_input(self):
        profile = FarmerProfileIn(primary_crop="Tomato", land_size=2.5, land_unit="hectare")
        assert profile.land_size == 2.5


class TestWeatherSchemas:
    def test_location_query_requires_coords_or_place(self):
        with pytest.raises(ValueError):
            WeatherLocationQuery()
        WeatherLocationQuery(state="Maharashtra", district="Pune")
        WeatherLocationQuery(latitude=18.5, longitude=73.8)

    def test_weather_advisory_request(self):
        req = WeatherAdvisoryRequest(
            state="Maharashtra",
            district="Pune",
            crop="Tomato",
            growth_stage="flowering",
            language="en",
        )
        assert req.crop == "Tomato"


class TestMarketSchemas:
    def test_compare_request(self):
        payload = MarketCompareRequest(
            crop="Tomato",
            state="Maharashtra",
            district="Pune",
            transport_cost_per_km_quintal=2.5,
            latitude=18.5,
            longitude=73.8,
            language="en",
        )
        assert payload.transport_cost_per_km_quintal == 2.5

    def test_compare_request_negative_transport_rejected(self):
        with pytest.raises(ValueError):
            MarketCompareRequest(
                crop="Tomato",
                state="Maharashtra",
                district="Pune",
                transport_cost_per_km_quintal=-1,
            )

    def test_market_crop(self):
        crop = MarketCrop(name="Tomato", name_hi="टमाटर")
        assert crop.name_hi == "टमाटर"


class TestSchemeSchemas:
    def test_recommend_request(self):
        req = SchemeRecommendRequest(
            state="Maharashtra",
            district="Pune",
            farmer_category="all",
            land_size_ha=1.5,
            crop="Tomato",
            language="en",
        )
        assert req.land_size_ha == 1.5
