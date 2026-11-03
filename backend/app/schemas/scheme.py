"""Pydantic schemas for government schemes."""

from typing import Literal

from pydantic import BaseModel, Field


class SchemeRecommendRequest(BaseModel):
    state: str | None = Field(default=None, max_length=80)
    district: str | None = Field(default=None, max_length=80)
    farmer_category: str | None = Field(default=None, max_length=40)
    land_size_ha: float | None = Field(default=None, ge=0, le=100000)
    crop: str | None = Field(default=None, max_length=80)
    language: Literal["en", "hi"] = "en"


class SavedSchemeRequest(BaseModel):
    scheme_id: str = Field(min_length=1, max_length=80)
