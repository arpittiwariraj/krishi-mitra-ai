"""Saved market comparison searches."""

from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class MarketSearch(Base):
    __tablename__ = "market_searches"

    id: Mapped[int] = mapped_column(primary_key=True)
    farmer_id: Mapped[int | None] = mapped_column(
        ForeignKey("farmers.id", ondelete="CASCADE"), index=True, nullable=True
    )
    crop_name: Mapped[str] = mapped_column(String(80), nullable=False)
    location: Mapped[str] = mapped_column(String(160), nullable=False)
    selected_market: Mapped[str | None] = mapped_column(String(160), nullable=True)
    market_data_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
