#!/usr/bin/env bash
set -e

# Railway may run this on a Linux container.
# Install dependencies only if they are missing to keep startup fast.
if [ "$(uname -s)" = "Linux" ] && command -v apt-get >/dev/null 2>&1; then
  # Chromium (Playwright) needs various system libraries.
  # Install the common set so Railway's minimal image can launch headless Chromium.
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

