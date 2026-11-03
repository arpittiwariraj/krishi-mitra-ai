"""SQLAlchemy model registry."""

from app.models.advisory import WeatherAdvisory
from app.models.diagnosis import DiseaseReport
from app.models.farmer import Farmer, FarmerProfile
from app.models.market import MarketSearch
from app.models.scheme import SavedScheme

__all__ = [
    "Farmer",
    "FarmerProfile",
    "DiseaseReport",
    "WeatherAdvisory",
    "MarketSearch",
    "SavedScheme",
]
