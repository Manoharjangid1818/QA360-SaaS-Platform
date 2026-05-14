# QA360 — AI-Powered Test Management Platform

A full-stack SaaS platform for QA engineering teams. Generate AI test cases, track bugs, schedule test runs, monitor CI/CD pipelines, and export enterprise-grade reports.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Backend | Express.js, Node.js |
| Database | Supabase (PostgreSQL) — optional, mock-data mode available |
| AI | OpenAI GPT-4 (via Replit AI Integration or `OPENAI_API_KEY`) |
| Testing | Playwright |
| Charts | Recharts |
| Exports | PDFKit, xlsx |

## Features

- **Dashboard** — stats, charts, recent activity, test run history
- **Test Cases** — full CRUD with priority and status filters
- **Bug Tracker** — bug reporting linked to test cases, severity management
- **AI Generator** — generate positive, negative, and edge test cases from requirements
- **Playwright Integration** — upload JSON reports, parse results, view suite details
- **Reports** — enterprise PDF/CSV/Excel reports with scheduling and branding
- **CI/CD** — GitHub, GitLab, and Jenkins integration
- **Scheduler** — cron-based automated test scheduling with Slack/Teams/email notifications

---

## Local Development

### Prerequisites

- Node.js 18+
- npm 9+

### 1. Clone and install

```bash
git clone https://github.com/your-org/qa360.git
cd qa360
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
# Edit .env.local and fill in your values
```

See `.env.example` for a full description of every available variable.

### 3. Start the Next.js frontend

```bash
npm run dev:local    # Port 3000 (local development)
npm run dev          # Port 5000 (Replit)
```

Open [http://localhost:3000](http://localhost:3000).

> The app works **without any environment variables** — it runs in mock-data mode with sample data when Supabase is not configured.

### 4. Start the Express backend (optional)

The Next.js app has its own API routes and works without the Express backend. The backend adds Playwright-based website testing, visual regression, and automated scheduling.

```bash
npm run backend:dev      # Hot-reload via node --watch
# or
cd backend && npm install && npm run dev
```

Backend runs on `http://localhost:8080` by default.

---

## Production Deployment

### Frontend → Vercel

1. Push your repo to GitHub.
2. Import the repo in [Vercel](https://vercel.com/new).
3. Vercel auto-detects Next.js — **no framework config needed**.
4. Set environment variables in **Vercel → Project → Settings → Environment Variables**:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Recommended | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Recommended | Supabase anon key |
| `OPENAI_API_KEY` | Yes (AI features) | OpenAI API key from [platform.openai.com](https://platform.openai.com/api-keys) |
| `NEXT_PUBLIC_BACKEND_URL` | Optional | Your Railway backend URL |

5. Deploy. `vercel.json` at the repo root handles the rest.

> Without Supabase keys the app runs in **mock-data mode** — all features remain usable.

---

### Backend → Railway

1. Create a new project in [Railway](https://railway.app).
2. Connect the same GitHub repo.
3. Railway uses `railway.json` at the repo root:
   - **Build**: Nixpacks
   - **Start**: `bash start.sh` (installs Chromium system libs, then starts Express)
   - **Health check**: `GET /health`
4. Set environment variables in Railway:

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Auto-set | Railway injects this automatically |
| `CORS_ORIGINS` | Yes | Your Vercel URL, e.g. `https://qa360.vercel.app` |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` | Optional | Custom Chromium binary path |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | Optional | Email notifications |

5. Copy the Railway public URL and set it as `NEXT_PUBLIC_BACKEND_URL` in Vercel.

---

## Supabase Setup (Optional)

1. Create a project at [supabase.com](https://app.supabase.com).
2. Open the **SQL Editor** and run `supabase-schema.sql`.
3. Copy your **Project URL** and **anon key** from Project Settings → API.
4. Add them to `.env.local` (local) or Vercel environment variables (production).

---

## Environment Variables Reference

See `.env.example` for a complete, annotated list of every variable.

---

## Project Structure

```
/app
  /(auth)/login          # Login page
  /(auth)/register       # Registration page
  /(dashboard)/
    dashboard/           # Main dashboard with charts
    test-cases/          # Test case CRUD
    bugs/                # Bug tracker
    ai-generator/        # AI test case generator
    playwright/          # Playwright report upload
    reports/             # Enterprise reports (PDF/CSV/Excel)
    schedules/           # Test scheduling
    cicd/                # CI/CD integration
  /api/                  # Next.js API routes (serverless on Vercel)
/backend                 # Express server (Railway deployment)
  app.js                 # Express app — routes, middleware, error handling
  server.js              # Entry point — port binding, graceful shutdown
  services/              # Playwright scheduler, automation
  scripts/               # Railway start/postinstall scripts
  utils/                 # Shared backend utilities
/components              # Shared React components
/lib                     # Utilities — Supabase client, OpenAI, generators, stores
/types                   # TypeScript interfaces
middleware.ts            # Auth middleware (Supabase auth or mock bypass)
next.config.js           # Next.js configuration
vercel.json              # Vercel deployment configuration
railway.json             # Railway deployment configuration
supabase-schema.sql      # Database schema — run once in Supabase SQL Editor
.env.example             # All environment variables documented
.env.local.example       # Template for local development
```

---

## Scripts Reference

```bash
# ── Next.js Frontend ─────────────────────────────────────────────────────────
npm run dev           # Development server on port 5000 (Replit default)
npm run dev:local     # Development server on port 3000 (local VS Code)
npm run build         # Production build
npm run start         # Production server on port 5000
npm run start:prod    # Production server using $PORT (Vercel/Railway)
npm run lint          # ESLint

# ── Express Backend ──────────────────────────────────────────────────────────
npm run backend:dev     # Backend with hot-reload (node --watch)
npm run backend:start   # Backend production mode
cd backend && npm run dev    # Same as backend:dev from backend directory
```

---

## GitHub Actions (Optional)

To enable automatic deployments on push to `main`, add these secrets in **GitHub → Settings → Secrets**:

| Secret | Description |
|--------|-------------|
| `RAILWAY_TOKEN` | Railway API token |
| `VERCEL_TOKEN` | Vercel token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
