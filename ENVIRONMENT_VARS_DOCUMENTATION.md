# QA360 Environment Variables (Sources + Where to Set)

This file maps the environment variables used by the QA360 repo to:
- **Where they are read** (frontend vs backend vs shared)
- **How the app uses them**
- **Where to source them** (Supabase/OpenAI/Railway/Vercel)

> Note: The repo supports **mock-data mode** if Supabase/OpenAI keys are not set.

---

## 1) Frontend (Vercel / Next.js or CRA dashboard)

### `REACT_APP_API_URL` *(required for dashboard UI)*
- **Used by:** `dashboard/src/App.js` (CRA dashboard)
- **Purpose:** Base URL for frontend → Express backend API
- **Where to set:** **Vercel dashboard** env vars for the `dashboard/` app
- **Value:** Your Railway backend public URL (example: `https://qa360-backend-prod.railway.app`)
- **Example:**
  - `REACT_APP_API_URL=https://your-backend.railway.app`

### `NEXT_PUBLIC_SUPABASE_URL` *(optional – used by browser-side Supabase client)*
- **Used by:** `lib/supabase.ts`, `middleware.ts`
- **Purpose:** Supabase project URL exposed to the browser
- **Where to set:** `.env.local` / Next.js runtime env (browser-exposed)
- **Source:** Supabase → Project Settings → API → **Project URL**
- **Example:** `NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co`

### `NEXT_PUBLIC_SUPABASE_ANON_KEY` *(optional – used by browser-side Supabase client)*
- **Used by:** `lib/supabase.ts`, `middleware.ts`
- **Purpose:** Supabase anon public key exposed to the browser
- **Where to set:** `.env.local` / Next.js runtime env (browser-exposed)
- **Source:** Supabase → Project Settings → API → **anon public**
- **Example:** `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...`

---

## 2) Backend (Railway / Express)

### `PORT`
- **Used by:** `backend/server.js` (Express start)
- **Purpose:** Server listen port (Railway typically sets this)
- **Where to set:** Railway service variables (or leave to Railway)

### `CORS_ORIGINS`
- **Used by:** `backend/app.js`
- **Purpose:** Comma-separated list of allowed CORS origins.
- **Where to set:** Railway env vars for the backend
- **Default behavior:** If unset, code falls back to `*` (allow all)
- **Recommended value:** include your Vercel frontend URLs
- **Example:**
  - `CORS_ORIGINS=https://qa360-frontend.vercel.app,https://qa360.yourcompany.com`

### `OPENAI_API_KEY`
- **Used by:** `lib/openai.ts` and Next API route `app/api/ai-generate/route.ts`
- **Purpose:** Enables AI-generated test cases
- **Where to set:** Railway backend env vars (server-side) and/or Next server env (if used there)
- **Source:** https://platform.openai.com/api-keys
- **Example:** `OPENAI_API_KEY=sk-...`

### Supabase credentials

#### `SUPABASE_URL`
- **Used by:** Supabase server-side utilities (docs + backend configuration)
- **Purpose:** Supabase project URL (server-side)
- **Where to set:** Railway backend env vars
- **Source:** Supabase → Project Settings → API → **Project URL**

#### `SUPABASE_ANON_KEY`
- **Used by:** Supabase server-side utilities (docs + backend configuration)
- **Purpose:** Supabase anon key
- **Where to set:** Railway backend env vars
- **Source:** Supabase → Project Settings → API → **anon public**

#### `SUPABASE_SERVICE_ROLE_KEY`
- **Used by:** Supabase server-side operations (e.g., privileged DB actions). Documented as required for certain features.
- **Purpose:** Elevated admin access for backend
- **Where to set:** Railway backend env vars
- **Source:** Supabase → Project Settings → API → **service_role secret**

> Security note: `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the browser.

### `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` *(optional)*
- **Used by:** `backend/app.js`, `backend/services/scheduler.js`, Next route `app/api/codegen/start/route.ts`
- **Purpose:** Path to Chromium executable when running in restricted environments
- **Where to set:** Railway env vars (optional)
- **Typical value on Railway:** leave empty so Playwright uses its bundled browser

### Playwright + HTTPS
- Backend uses Playwright launch options with HTTPS errors ignored (see `backend/app.js`), so no separate env var is required for that.

### Email notifications (SMTP) *(optional)*

#### `SMTP_HOST`
- **Used by:** `lib/notification-service.ts`
- **Purpose:** SMTP server hostname

#### `SMTP_PORT`
- **Used by:** `lib/notification-service.ts`
- **Purpose:** SMTP port (defaults to `587` in code)

#### `SMTP_USER`
- **Used by:** `lib/notification-service.ts`
- **Purpose:** SMTP username

#### `SMTP_PASS`
- **Used by:** `lib/notification-service.ts`
- **Purpose:** SMTP password

#### `SMTP_FROM`
- **Used by:** `lib/notification-service.ts`
- **Purpose:** Sender email address (defaults to `noreply@qa360.app` if not set)

**Behavior:** If SMTP variables are missing, the notification service logs a warning and returns (no email).

### Slack / Teams notifications *(optional)*

#### `SLACK_WEBHOOK_URL`
- **Documented in:** `README_DEPLOYMENT.md`
- **Purpose:** Incoming webhook for Slack notifications

#### `TEAMS_WEBHOOK_URL`
- **Documented in:** `README_DEPLOYMENT.md`
- **Purpose:** Incoming webhook for Microsoft Teams notifications

---

## 3) Next.js / shared environment (if running Next app)

### `NEXT_PUBLIC_BACKEND_URL`
- **Status in this repo:** Not found by code search in the current tree.
- **In your provided template:** It’s a recommended variable, but the repo’s active config relies on `REACT_APP_API_URL` (dashboard) and backend-relative env vars.
- **Action:** Prefer the repo-supported variables (`REACT_APP_API_URL`, CORS settings, etc.)

---

## 4) Where to get each credential (quick lookup)

### Supabase
- `SUPABASE_URL` → Supabase Project Settings → API → **Project URL**
- `SUPABASE_ANON_KEY` → Supabase Project Settings → API → **anon public**
- `SUPABASE_SERVICE_ROLE_KEY` → Supabase Project Settings → API → **service_role secret**
- Browser exposure (optional):
  - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### OpenAI
- `OPENAI_API_KEY` → https://platform.openai.com/api-keys

### Railway
- `PORT` typically set by Railway runtime
- `CORS_ORIGINS`, `OPENAI_API_KEY`, `SUPABASE_*`, `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`, SMTP + webhooks set in Railway **backend service Variables**
- `Public Networking` URL becomes your backend base URL for frontend (`REACT_APP_API_URL`)

### Vercel
- `REACT_APP_API_URL` set in Vercel for the `dashboard/` app
- Frontend domain(s) must be allowed in backend `CORS_ORIGINS`

---

## 5) Minimal “production-ready” set (typical)

Backend (Railway):
- `OPENAI_API_KEY`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ORIGINS`

Frontend (Vercel):
- `REACT_APP_API_URL`

Optional:
- `SMTP_*`, `SMTP_FROM`
- `SLACK_WEBHOOK_URL`, `TEAMS_WEBHOOK_URL`
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` (usually empty)

