#!/usr/bin/env bash
set -e

# Railway sometimes deploys from repo root; this wrapper ensures the backend
# runs correctly from ./backend.
cd backend

if [ "$(uname -s)" = "Linux" ] && command -v apt-get >/dev/null 2>&1; then
  # Chromium (Playwright) needs various system libraries.
  export DEBIAN_FRONTEND=noninteractive
  apt-get update
  apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libxkbcommon0 \
    libfontconfig1 \
    libasound2
fi

if [ ! -d "node_modules" ]; then
  npm install
fi

npm start

