# QA360 — AI-Powered Test Management Platform

## Overview
QA360 is a full-stack SaaS web application for QA/Test Management built with **Next.js App Router**, **Tailwind CSS**, **Supabase** (auth + database), and **OpenAI** for AI-powered test case generation.

## Tech Stack
- **Frontend + Backend**: Next.js 15 (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase (optional — app works with mock data if not configured)
- **AI**: OpenAI via Replit AI Integrations (no API key needed on Replit)
- **Charts**: Recharts

## Features
1. **Dashboard** — Stats, charts (pie + bar), recent activity, test run history
2. **Test Cases** — Full CRUD: create, read, update, delete with priority/status filters
3. **Bug Tracker** — Bug reporting linked to test cases, severity/status management
4. **AI Generator** — Generate positive, negative, and edge test cases from requirements
5. **Playwright Integration** — Upload JSON reports, parse results, view suite details

## Project Structure
```
/app
  /(auth)/login        # Login page
  /(auth)/register     # Registration page
  /(dashboard)/
    dashboard/         # Main dashboard with charts
    test-cases/        # Test case CRUD
    bugs/              # Bug tracker
    ai-generator/      # AI test case generator
    playwright/        # Playwright report upload
  /api/
    ai-generate/       # POST - Generate test cases with OpenAI
    test-cases/        # GET/POST test cases
    bugs/              # GET/POST bugs
    test-runs/         # GET/POST test runs
/components
  sidebar.tsx          # Navigation sidebar
  header.tsx           # Page header with actions
  stat-card.tsx        # Dashboard stat card
/lib
  supabase.ts          # Browser Supabase client
  supabase-server.ts   # Server Supabase client (Server Components only)
  openai.ts            # OpenAI client (Replit AI Integrations)
  mock-data.ts         # Fallback data when Supabase not configured
  utils.ts             # Utility functions, cn(), formatDate()
/types/index.ts        # TypeScript interfaces
middleware.ts          # Auth protection for dashboard routes
supabase-schema.sql    # Run in Supabase to create tables
```

## Environment Variables
Create `.env.local` (copy from `.env.local.example`):
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-your-key  # Only needed for local dev outside Replit
```

On Replit, `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` are set automatically — no API key management needed.

## Supabase Setup (Optional)
1. Create a project at https://app.supabase.com
2. Run `supabase-schema.sql` in the SQL Editor
3. Add your URL and anon key to `.env.local`
4. Without Supabase, the app runs in mock data mode

## Running Locally (VS Code)
```bash
npm install
cp .env.local.example .env.local
# Fill in Supabase keys in .env.local (or leave empty for mock mode)
npm run dev
# Open http://localhost:3000
```

## Development Port
- Runs on port **5000** in Replit (configured in `package.json` dev script)
- Runs on port **3000** by default locally (use `npm run dev` without port flag)
