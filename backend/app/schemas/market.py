"""Pydantic schemas for market price comparison."""

from typing import Literal

from pydantic import BaseModel, Field, model_validator


class MarketCompareRequest(BaseModel):
    crop: str = Field(min_length=2, max_length=80)
    state: str = Field(min_length=2, max_length=80)
    district: str = Field(min_length=2, max_length=80)
    transport_cost_per_km_quintal: float = Field(default=0, ge=0, le=10000)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    language: Literal["en", "hi"] = "en"

    @model_validator(mode="after")
    def validate_transport(self) -> "MarketCompareRequest":
        if self.transport_cost_per_km_quintal < 0:
            raise ValueError("Transport cost cannot be negative")
        return self


class MarketQuery(BaseModel):
    crop: str = Field(min_length=2, max_length=80)
    state: str = Field(min_length=2, max_length=80)
    district: str = Field(min_length=2, max_length=80)


class MarketRecord(BaseModel):
    market: str
    state: str
    district: str
    commodity: str
    variety: str | None = None
    min_price: float | None = None
    max_price: float | None = None
    modal_price: float | None = None
    arrival_quantity: float | None = None
    price_date: str | None = None
    unit: str = "INR/quintal"
    latitude: float | None = None
    longitude: float | None = None
    distance_km: float | None = None
    estimated_net_return: float | None = None
    source: str | None = None


class MarketComparisonResponse(BaseModel):
    crop: str
    state: str
    district: str
    records: list[MarketRecord]
    highest_modal_market: str | None = None
    recommended_market: str | None = None
    recommendation_reason: str | None = None
    transport_cost_used: float | None = None
    data_source: str
    is_demo: bool = False
    last_updated: str | None = None
    notification: str | None = None


class MarketCrop(BaseModel):
    name: str
    name_hi: str | None = None
