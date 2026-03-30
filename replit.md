# QA360 - Smart QA Monitoring Tool

## Overview
QA360 is a full-stack website testing and monitoring tool. Users can run on-demand QA tests against any URL and get back performance metrics, screenshots, console error logs, and visual regression comparisons.

## Architecture
- **Frontend**: React (Create React App) in `dashboard/` — serves on port 5000 in dev
- **Backend**: Express.js API in `backend/` — serves on port 3001 in dev
- **Browser Automation**: Playwright (Chromium headless)
- **Lighthouse**: Performance/SEO/accessibility scores
- **Visual Regression**: Pixelmatch + PNGjs for screenshot diffing
- **Scheduler**: node-cron for recurring test jobs
- **PDF Reports**: PDFKit

## Dev Setup
Both services are started together via `start-dev.sh`:
- Backend starts on port 3001 (`PORT=3001 node backend/scripts/start.js`)
- Frontend starts on port 5000 with CRA proxy to backend (`npm start` in `dashboard/`)

The CRA dev server proxies API calls (`/api/test`, `/scheduler/*`, etc.) to `http://localhost:3001`.

## Production Setup
Build the React app first (`cd dashboard && npm run build`), then start the Express backend which serves the built `dashboard/build` statically alongside the API on port 5000.

## Key Files
- `backend/app.js` — Express app with all API routes
- `backend/server.js` — HTTP server (defaults port 8080, overridden to 3001 in dev, 5000 in prod)
- `backend/scripts/start.js` — Startup script that also installs Playwright browser deps on Linux
- `backend/services/scheduler.js` — Cron-based scheduler logic
- `backend/utils/saveTestResult.js` — Persist test results for PDF reports
- `dashboard/src/App.js` — Main React UI
- `dashboard/package.json` — Frontend deps with `proxy` pointing to `http://localhost:3001`
- `config/sites.json` — Default sites for scheduled monitoring
- `start-dev.sh` — Combined dev startup script

## Ports
- Frontend (dev): 5000
- Backend (dev): 3001
- Backend (production): 5000 (serves frontend build statically)

## Workflow
The "Start application" workflow runs `bash start-dev.sh` and waits for port 5000.
