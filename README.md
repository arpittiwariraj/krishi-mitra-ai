# Krishi Mitra AI

AI-powered full-stack platform for [agriculture / farmer assistance — confirm the actual domain] with a Python backend and a React + Tailwind front end.

## Repo layout
```
krishi-mitra-ai/
├── PROJECT_SPEC.md      # Master development prompt / full spec
├── AGENTS.md            # Agent instructions for this workspace
├── Dockerfile           # Container for the stack
├── docker-compose.yml   # Local orchestration
├── backend/             # Python backend (FastAPI/Flask, DB layer, routes)
├── frontend/            # React + Vite + Tailwind UI
└── README.md
```

## Getting started
1. Clone this repository:
   ```bash
   git clone https://github.com/arpittiwariraj/krishi-mitra-ai.git
   cd krishi-mitra-ai
   ```
2. Backend:
   ```bash
   cd backend
   cp .env.example .env    # fill in your secrets
   pip install -r requirements.txt
   ```
3. Frontend:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
4. (Optional) Full stack via Compose:
   ```bash
   docker compose up --build
   ```

## Documentation
- `PROJECT_SPEC.md` — the complete build specification and milestone plan.
- `AGENTS.md` — how this repository is meant to be worked on.
- `backend/README` (if present) / `backend/app` — runtime entry points.

## Notes
- Keep secrets out of version control; reference `backend/.env.example` for required variables.

## License
MIT — see [LICENSE](LICENSE) (or add one before public sharing).
