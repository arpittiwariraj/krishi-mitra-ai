"""Seed the Krishi Mitra AI database with demonstration market records.

Run from the repository root:

    source backend/.venv/bin/activate
    DATABASE_URL=postgresql+psycopg://postgres@127.0.0.1:5432/krishi_mitra \
        python backend/scripts/seed.py

Market demo records are inserted as MarketSearch rows. Government schemes are
loaded directly from the bundled knowledge-base JSON at runtime, so no scheme
rows are inserted by this script.
"""

import json
import os
import sys
from pathlib import Path

_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_DIR.parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.database import Base, engine  # noqa: F401  (ensures DB metadata import)
from app.models.market import MarketSearch
from app.services.market_service import _parse_date

# Ensure the local database schema exists (matches app startup).
Base.metadata.create_all(bind=engine)

DEMO_DIR = _DIR.parent / "app" / "knowledge_base"
DEMO_PATH = DEMO_DIR / "market_demo_data.json"


def main() -> int:
    if not DEMO_PATH.exists():
        print(f"[seed] demonstration data not found at {DEMO_PATH}", file=sys.stderr)
        return 1

    database_url = os.environ.get("DATABASE_URL", settings.database_url)
    engine = create_engine(database_url)
    Session = sessionmaker(bind=engine)
    session = Session()

    with DEMO_PATH.open(encoding="utf-8") as handle:
        payload = json.load(handle)

    records = payload.get("records", [])
    inserted = 0
    for item in records:
        market = MarketSearch(
            farmer_id=None,
            crop_name=item.get("commodity", "Unknown"),
            location=f"{item.get('district', '')} {item.get('state', '')}".strip(),
            selected_market=item.get("market") or None,
            market_data_date=_parse_date(item.get("arrival_date")),
        )
        exists = (
            session.query(MarketSearch)
            .filter_by(
                crop_name=market.crop_name,
                location=market.location,
                selected_market=market.selected_market,
                market_data_date=market.market_data_date,
            )
            .first()
        )
        if not exists:
            session.add(market)
            inserted += 1

    session.commit()
    print(f"[seed] inserted {inserted} market demo records into {database_url}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())