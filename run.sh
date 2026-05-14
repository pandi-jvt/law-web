#!/usr/bin/env bash
# Run the Case Management Frontend dev server (standalone).
# Requires backend API to be running; set VITE_API_BASE_URL in .env (e.g. http://localhost:9000).

set -e
cd "$(dirname "$0")"

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  echo "No .env found. Copying .env.example to .env..."
  cp .env.example .env
  echo "Edit .env and set VITE_API_BASE_URL to your backend URL (e.g. http://localhost:9000), then run ./run.sh again."
  exit 1
fi

echo "Installing dependencies (if needed) and starting dev server..."
npm install
exec npm run dev
