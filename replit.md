# QA360 - Test Management Platform

A full-featured QA management platform with dashboards, test case management, bug tracking, AI test generation, scheduling, CI/CD integration, reports, and Playwright automation tools.

## Run & Operate

- `pnpm --filter @workspace/qa360 run dev` — run the frontend (port 23340, preview at `/`)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- Optional env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — Supabase auth (app works in demo/mock mode without these)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + Tailwind CSS v4 + wouter routing
- Charts: Recharts
- Auth: Supabase (optional; falls back to demo mode)
- UI: shadcn/ui components

## Where things live

- `artifacts/qa360/src/pages/` — all page components (dashboard, test-cases, bugs, ai-generator, schedules, ci-cd, reports, playwright-analyzer, codegen)
- `artifacts/qa360/src/components/` — sidebar, header, stat-card + shadcn ui/
- `artifacts/qa360/src/lib/` — utils, mock-data, supabase client, cron-utils, codegen-service
- `artifacts/qa360/src/types/` — TypeScript types (index, cicd, schedules, reports, codegen)
- `artifacts/qa360/src/index.css` — Tailwind + custom `.card`, `.btn-*`, `.input`, `.label`, `.badge` components

## Architecture decisions

- App runs fully in mock/demo mode — no backend or Supabase required. All data is local React state seeded from `src/lib/mock-data.ts`.
- Routing uses `wouter` (not React Router). Auth pages are standalone; all dashboard routes share a `DashboardLayout` wrapper with `Sidebar`.
- Supabase is opt-in: `isSupabaseConfigured` guard in `src/lib/supabase.ts` lets login/register bypass auth if env vars are absent.
- CSS uses Tailwind v4 `@layer components` for shared utility classes (`.card`, `.btn-primary`, etc.) — do not use shadcn Button for these pages.
- `next/dynamic` and Next.js `cookies()` patterns were dropped entirely — not needed in client-only Vite.

## Product

- **Dashboard** — stat cards, test case status pie chart, run history bar chart, activity feed
- **Test Suite** — CRUD for test cases with priority/status filters and search
- **Defect Tracker** — bug reporting with severity/status management, linked test cases
- **AI Test Writer** — generate positive/negative/edge test cases from requirements via `/api/ai-generate`
- **Test Scheduler** — cron-based schedule management with human-readable descriptions
- **CI/CD** — connect GitHub/GitLab/Jenkins, view pipeline status and test results
- **Reports** — build, preview, and export QA reports; scheduled delivery; branding
- **Playwright Report Analyzer** — upload and parse Playwright JSON reports
- **Code Generator** — compose Playwright test actions and export JS/TS/Python

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Supabase SSR (`@supabase/ssr`) is installed but only the browser client is used — no server-side cookie handling.
- The `cronstrue` package renders human-readable cron descriptions in the scheduler.
- Theme CSS vars (HSL values) are in `index.css` `:root` — the scaffold shipped with `red` placeholders that were replaced.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
