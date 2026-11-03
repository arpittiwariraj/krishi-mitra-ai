"""Pydantic schemas for weather advisory requests."""

from typing import Literal

from pydantic import BaseModel, Field, model_validator

Language = Literal["en", "hi"]


class WeatherLocationQuery(BaseModel):
    state: str | None = Field(default=None, max_length=80)
    district: str | None = Field(default=None, max_length=80)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)

    @model_validator(mode="after")
    def require_location(self) -> "WeatherLocationQuery":
        has_coords = self.latitude is not None and self.longitude is not None
        has_place = bool(self.district and self.state)
        if not has_coords and not has_place:
            raise ValueError("Provide either state and district or valid coordinates")
        return self


class WeatherAdvisoryRequest(WeatherLocationQuery):
    crop: str | None = Field(default=None, max_length=80)
    growth_stage: str | None = Field(default=None, max_length=80)
    language: Language = "en"
