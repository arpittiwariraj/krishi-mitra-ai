"""Saved crop diagnosis reports."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DiseaseReport(Base):
    __tablename__ = "disease_reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    farmer_id: Mapped[int | None] = mapped_column(
        ForeignKey("farmers.id", ondelete="CASCADE"), index=True, nullable=True
    )
    crop_name: Mapped[str] = mapped_column(String(80), nullable=False)
    possible_disease: Mapped[str] = mapped_column(String(160), nullable=False)
    certainty_level: Mapped[str] = mapped_column(String(40), nullable=False)
    visual_observations: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    recommendations: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    farmer: Mapped["Farmer | None"] = relationship(  # noqa: F821
        back_populates="disease_reports"
    )
