#!/usr/bin/env bash
# dev-setup.sh — one-time local development setup for Krishi Mitra AI.
set -euo pipefail

echo "==> Creating Python virtualenv (backend/.venv) ..."
cd "$(dirname "$0")/.."

if [ ! -x backend/.venv/bin/python ]; then
  python3 -m venv backend/.venv
fi

# shellcheck source=/dev/null
. backend/.venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt

echo "==> Installing frontend dependencies ..."
cd frontend
npm install
cd ..

echo "==> Creating the local PostgreSQL database (if not already present) ..."
# Requires a running local PostgreSQL (the .env DATABASE_URL points here).
if ! psql -h 127.0.0.1 -U postgres -lqt 2>/dev/null | cut -d'|' -f1 | grep -qx "krishi_mitra"; then
  createdb -h 127.0.0.1 -U postgres krishi_mitra
  echo "  (created database krishi_mitra)"
else
  echo "  (database krishi_mitra already exists)"
fi

echo ""
echo "==> Setup complete."
echo "    Start the backend:  source backend/.venv/bin/activate && cd backend && uvicorn app.main:app --reload"
echo "    Start the frontend: cd frontend && npm run dev"
