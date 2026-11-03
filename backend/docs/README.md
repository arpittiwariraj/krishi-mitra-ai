# Krishi Mitra AI

An AI-powered, multilingual (English/Hindi) agricultural advisory platform for
Indian farmers. It combines a FastAPI backend, a React + Tailwind frontend, and
PostgreSQL for data. Crop images are analyzed with a multimodal model, and
weather, market price, and government-schemes data are wired to live Indian
government sources.

## Features

- **Crop disease detection** — upload a leaf/plant photo; a multimodal model
  classifies the symptom and merges it with a curated ICAR/agriculture knowledge
  base. No disease confidence percentages or chemical names are ever invented;
  unverified observations are flagged for expert consultation.
- **Weather advisory** — current weather, a 5-day/3-hour forecast, and a transparent
  agricultural rule engine (heat stress, heavy rain, humidity, wind, frost).
- **Market price analysis** — live mandi prices via the data.gov.in / AGMARKNET
  API, with comparison and estimated net-return. Falls back to explicitly labelled
  demonstration data when credentials are missing.
- **Government scheme finder** — search the curated central agricultural schemes by
  state, district, category, land size and crop (always verify final eligibility on
  the official portal).
- **Farmer dashboard** — authenticated profile with a personalized saved list.

## Stack

| Layer   | Technology |
|---------|------------|
| Frontend| React 19, Tailwind CSS v3, Vite, Leaflet, Recharts, i18n (EN/HI) |
| Backend | FastAPI, Uvicorn, SQLAlchemy 2, Pydantic v2, JWT (PyJWT) |
| DB      | PostgreSQL |
| AI      | OpenAI Multimodal API (crop image analysis) |
| Data    | OpenWeather, data.gov.in / AGMARKNET, government scheme KB |

## Directory layout

```
krishi-mitra-ai/
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── routes/           # API route handlers (auth, disease, weather, market, schemes, farmer)
│   │   ├── services/         # Business logic + external API clients
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── models/           # ORM models (farmer, diagnosis, advisory, market, scheme)
│   │   ├── utils/            # Validation, i18n utils, response envelopes
│   │   └── knowledge_base/   # Disease reference JSONs, schemes, demonstration market data
│   ├── tests/                # pytest suite (~56 tests, all passing)
│   ├── scripts/              # dev-setup.sh, seed.py
│   ├── docs/                 # README
│   ├── requirements.txt
│   ├── .env.example          # Template for secrets (never commit .env)
│   └── .env                  # Local secrets (gitignored)
├── frontend/                 # React + Tailwind single-page app
├── docker-compose.yml        # Local dev containers (Postgres + backend + frontend)
├── AGENTS.md, PROJECT_SPEC.md
└── .gitignore
```

## Prerequisites

- Python 3.10+ with `pip`
- Node 18+ with `npm`
- PostgreSQL 14+ running locally (or a managed DB)
- OpenAI API key, OpenWeather API key, and data.gov.in API key (optional for
  demonstration/table modes)

## Local development setup

The fastest path is the provided setup script:

```bash
# From the repository root:
bash backend/scripts/dev-setup.sh
```

This creates `backend/.venv`, installs Python dependencies, installs frontend
`npm` packages, and creates the `krishi_mitra` PostgreSQL database.

Alternatively, do it manually:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ../frontend
npm install
cd ..
# create the database (adjust user/password to your install)
createdb -h 127.0.0.1 -U postgres krishi_mitra
```

### Environment variables

Copy `.env.example` to `.env` and fill in the values. Never commit `.env`.

```dotenv
DATABASE_URL=postgresql+psycopg://postgres:postgres@127.0.0.1:5432/krishi_mitra
JWT_SECRET_KEY=<long random string>
JWT_ALGORITHM=HS256

# Optional AI / weather / market credentials
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENWEATHER_API_KEY=
DATA_GOV_IN_API_KEY=
DATA_GOV_IN_RESOURCE_ID=9ef84268-d588-465a-a308-a864a43d0070
MARKET_DEMO_MODE=false       # true to show explicitly-labelled demo data

FRONTEND_URL=http://localhost:5173
```

## Running the application

```bash
# Terminal 1 — backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Terminal 2 — frontend
cd frontend
npm run dev
```

Open http://localhost:5173. Health check: http://127.0.0.1:8000/api/health

## Running the test suite

```bash
cd backend
source .venv/bin/activate
pytest tests -v --tb=short
```

The suite uses a dedicated `krishi_mitra_test` PostgreSQL database and a real
TestClient; no third-party API credentials are required, and external services are
expected to report "not configured" (clean 503 errors) rather than being mocked.

## Docker (local development)

```bash
docker compose up --build
```

This builds a PostgreSQL database, the backend API, and the frontend dev server.
The backend reads credentials from `.env`; demo market data is available when
`MARKET_DEMO_MODE=true`.

## API overview

| Group | Path | Auth |
|-------|------|------|
| Auth | `/api/auth/register`, `/login`, `/me`, `/logout` | Public |
| Disease | `/api/disease/analyze`, `/history`, `/reference` | Optional (history requires login) |
| Weather | `/api/weather/current`, `/forecast`, `/advisory` | Optional |
| Market | `/api/market/prices`, `/compare`, `/crops` | Optional |
| Schemes | `/api/schemes`, `/recommend`, `/{scheme_id}` | Public |

All responses use a consistent envelope: `{"success": bool, "message": str, "data": obj}`.
Errors use `{"success": false, "message": str, "error_code": str}`.

## Data and disclaimers

- Market prices come from data.gov.in / AGMARKNET. When credentials are missing,
  the API returns `503` with `error_code: MARKET_NOT_CONFIGURED`. Setting
  `MARKET_DEMO_MODE=true` shows explicitly labelled demonstration data that is
  **not** live pricing.
- Weather comes from OpenWeather; the rule engine interprets the returned values
  but never invents measurements.
- Disease analysis is a multimodal visual *assessment*, never a laboratory
  diagnosis. Always confirm with a KVK or agricultural expert.
- Scheme listings are informational; final eligibility is decided by the
  implementing department.

## Known gaps (for the developer)

- No production migration runner is in place (startup uses
  `Base.metadata.create_all`). Introduce `alembic` if you need versioned
  migrations.
- The `.env` is expected to be created by the developer from `.env.example`.
- Disease detection requires a real `OPENAI_API_KEY` to classify images.
