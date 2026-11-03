"""Pydantic schemas for farmer accounts and profiles."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

Language = Literal["en", "hi"]


class FarmerCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone: str | None = Field(default=None, max_length=20)
    state: str | None = Field(default=None, max_length=80)
    district: str | None = Field(default=None, max_length=80)
    preferred_language: Language = "en"

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        if value is None or value.strip() == "":
            return None
        cleaned = value.strip().replace(" ", "").replace("-", "")
        if not cleaned.lstrip("+").isdigit() or not 10 <= len(cleaned.lstrip("+")) <= 15:
            raise ValueError("Phone number must contain 10 to 15 digits")
        return cleaned


class FarmerLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class FarmerUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    phone: str | None = Field(default=None, max_length=20)
    state: str | None = Field(default=None, max_length=80)
    district: str | None = Field(default=None, max_length=80)
    preferred_language: Language | None = None


class FarmerProfileIn(BaseModel):
    primary_crop: str | None = Field(default=None, max_length=80)
    land_size: float | None = Field(default=None, ge=0, le=100000)
    land_unit: Literal["hectare", "acre", "bigha"] = "hectare"
    irrigation_type: str | None = Field(default=None, max_length=50)


class FarmerProfileOut(FarmerProfileIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


class FarmerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    phone: str | None
    state: str | None
    district: str | None
    preferred_language: str
    created_at: datetime
    profile: FarmerProfileOut | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    farmer: FarmerOut
