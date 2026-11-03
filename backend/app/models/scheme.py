"""Farmer-saved government schemes."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SavedScheme(Base):
    __tablename__ = "saved_schemes"
    __table_args__ = (UniqueConstraint("farmer_id", "scheme_id", name="uq_farmer_scheme"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    farmer_id: Mapped[int] = mapped_column(
        ForeignKey("farmers.id", ondelete="CASCADE"), index=True, nullable=False
    )
    scheme_id: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    saved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    farmer: Mapped["Farmer"] = relationship(back_populates="saved_schemes")  # noqa: F821
