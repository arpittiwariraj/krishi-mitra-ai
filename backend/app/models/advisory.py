"""Saved weather advisory records."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class WeatherAdvisory(Base):
    __tablename__ = "weather_advisories"

    id: Mapped[int] = mapped_column(primary_key=True)
    farmer_id: Mapped[int | None] = mapped_column(
        ForeignKey("farmers.id", ondelete="CASCADE"), index=True, nullable=True
    )
    location: Mapped[str] = mapped_column(String(160), nullable=False)
    crop_name: Mapped[str | None] = mapped_column(String(80), nullable=True)
    weather_summary: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    advisory: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
