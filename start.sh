#!/usr/bin/env bash
set -e

# Railway sometimes deploys from repo root; this wrapper ensures the backend
# runs correctly from ./backend.
cd backend

if [ ! -d "node_modules" ]; then
  npm install
fi

npm start

