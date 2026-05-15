# QA360 — AI-Powered Test Management Platform

A full-stack SaaS platform for QA engineering teams. Generate AI test cases, track bugs, schedule test runs, monitor CI/CD pipelines, and export enterprise-grade reports.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Backend | Express.js, Node.js |
| Database | Supabase (PostgreSQL) — optional, mock-data mode available |
| AI | OpenAI GPT-4 (via `OPENAI_API_KEY`) |
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

### 3. Start the React frontend

```bash
cd dashboard
npm start    # Runs on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Start the Express backend

The Express backend provides Playwright-based website testing, visual regression, and automated scheduling.

```bash
cd backend
npm install
npm run dev      # Hot-reload via node --watch
```

Backend runs on `http://localhost:3001` by default (see `backend/.env` for configuration).

---

## Production Deployment

**For complete step-by-step deployment instructions with troubleshooting, see [README_DEPLOYMENT.md](README_DEPLOYMENT.md)**

### Quick Summary

#### Frontend (React CRA) → Vercel

1. Push your repo to GitHub
2. Import `dashboard/` folder in [Vercel](https://vercel.com/new)
3. Set environment variable: `REACT_APP_API_URL=https://your-railway-backend.app`
4. Deploy

#### Backend (Express) → Railway

1. Create project in [Railway](https://railway.app)
2. Connect GitHub repo, point to `backend/` directory
3. Set required environment variables (see [README_DEPLOYMENT.md](README_DEPLOYMENT.md))
4. Deploy

#### Database → Supabase

1. Create project at [supabase.com](https://app.supabase.com)
2. Get API keys from Project Settings → API
3. Set in backend environment variables

---

## Environment Variables Reference

See `.env.example` for a complete, annotated list of every variable.

---

## Project Structure

```
/dashboard              # React CRA Frontend (Deploy to Vercel)
  src/
    App.js              # Main app component
  public/
  package.json
  .env.example          # Copy to .env.local

/backend                # Express Backend (Deploy to Railway)
  app.js                # Express app — routes, middleware, error handling
  server.js             # Entry point — port binding, graceful shutdown
  services/             # Playwright scheduler, automation
  utils/                # Shared utilities
  package.json
  .env.example          # Copy to .env

/lib                    # Shared utilities
/types                  # TypeScript types
.env.example            # Root environment variables
README_DEPLOYMENT.md    # Production deployment guide
supabase-schema.sql     # Database schema (optional)
```

---

## Scripts Reference

### React CRA Frontend (dashboard/)
```bash
npm install      # Install dependencies
npm start        # Development server (port 3000)
npm run build    # Production build
npm run test     # Run tests
```

### Express Backend (backend/)
```bash
npm install      # Install dependencies (triggers Playwright install)
npm run dev      # Development server with hot-reload (port 3001)
npm start        # Production server
npm run build    # Build if applicable
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
