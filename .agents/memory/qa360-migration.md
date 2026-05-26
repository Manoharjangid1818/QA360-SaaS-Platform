---
name: QA360 migration
description: Key decisions and patterns from the Next.js → Vite/React migration of QA360.
---

# QA360 Vite Migration

**Why:** Next.js → Replit pnpm_workspace React+Vite artifact.

## Key decisions

- `next/link` + `useRouter` → `wouter` `Link` + `useLocation`
- `process.env.NEXT_PUBLIC_*` → `import.meta.env.VITE_*`
- `supabase-server.ts` (Next.js cookies()) dropped — client-only `src/lib/supabase.ts` with `isSupabaseConfigured` guard for demo/mock mode
- `next/dynamic` (Monaco) replaced with plain import; no SSR needed in Vite
- App runs fully in mock mode without any env vars (no Supabase required)
- Dashboard layout: `DashboardLayout` wrapper component in `App.tsx` wraps all `/dashboard/*` routes with `Sidebar` + `<main>`
- CSS: `.card`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.input`, `.label`, `.badge` defined as `@layer components` in `index.css`
- Theme: all `--background: red` placeholder vars replaced with proper HSL values (gray-50 bg, white cards, blue-600 primary)

## Architecture
- `src/types/` — index, cicd, schedules, reports, codegen
- `src/lib/` — utils, mock-data, supabase, cron-utils, codegen-service
- `src/components/` — sidebar, header, stat-card (+ shadcn ui/ components from scaffold)
- `src/pages/` — login, register, dashboard, test-cases, bugs, ai-generator, schedules, ci-cd, reports, playwright-analyzer, codegen
