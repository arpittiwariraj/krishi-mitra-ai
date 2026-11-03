"""Farmer account and farmer profile ORM models."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Farmer(Base):
    __tablename__ = "farmers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    state: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    district: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    preferred_language: Mapped[str] = mapped_column(String(5), default="en", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    profile: Mapped["FarmerProfile | None"] = relationship(
        back_populates="farmer", cascade="all, delete-orphan", uselist=False
    )
    disease_reports: Mapped[list["DiseaseReport"]] = relationship(  # noqa: F821
        back_populates="farmer", cascade="all, delete-orphan"
    )
    saved_schemes: Mapped[list["SavedScheme"]] = relationship(  # noqa: F821
        back_populates="farmer", cascade="all, delete-orphan"
    )


class FarmerProfile(Base):
    __tablename__ = "farmer_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    farmer_id: Mapped[int] = mapped_column(
        ForeignKey("farmers.id", ondelete="CASCADE"), unique=True, index=True, nullable=False
    )
    primary_crop: Mapped[str | None] = mapped_column(String(80), nullable=True)
    land_size: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    land_unit: Mapped[str] = mapped_column(String(20), default="hectare", nullable=False)
    irrigation_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    farmer: Mapped[Farmer] = relationship(back_populates="profile")
