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

### QA360 Platform Features
- **Dashboard** — stats, charts, recent activity, test run history
- **Test Cases** — full CRUD with priority and status filters
- **Bug Tracker** — bug reporting linked to test cases, severity management
- **AI Generator** — generate positive, negative, and edge test cases from requirements
- **Playwright Integration** — upload JSON reports, parse results, view suite details
- **Reports** — enterprise PDF/CSV/Excel reports with scheduling and branding
- **CI/CD** — GitHub, GitLab, and Jenkins integration
- **Scheduler** — cron-based automated test scheduling with Slack/Teams/email notifications

### Enterprise-Grade Playwright Automation Framework
- **Test Tagging System** — @smoke, @regression, @api, @ui, @critical, @visual, @sanity tags with selective execution
- **Git Hooks (Husky)** — Pre-commit validation, commit message enforcement, pre-push critical tests
- **Docker Support** — Multi-stage Dockerfile, docker-compose orchestration, containerized execution
- **Visual Regression Testing** — Screenshot baselines, cross-browser UI comparison, pixel-perfect validation
- **Slack/Discord Notifications** — Real-time test result notifications, failure alerts, report links
- **GitHub Actions Workflows** — Smoke tests, regression suite, API testing, Docker builds
- **AI-Assisted Workflows** — MCP prompt library, intelligent failure analysis, root cause detection
- **Comprehensive Reporting** — HTML, Allure, JUnit XML, and JSON reports with full history

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

## Playwright Automation Framework

QA360 includes an enterprise-grade Playwright automation framework with advanced testing capabilities.

### Quick Start

```bash
# Install dependencies
npm install
npx playwright install

# Initialize Git hooks
npm run prepare

# Run tests by tag
npm run test:smoke          # Smoke tests
npm run test:regression     # Full regression
npm run test:api            # API tests
npm run test:critical       # Critical path tests
npm run test:visual         # Visual regression tests

# View reports
npm run test:report         # Open HTML report
npm run test:debug          # Debug mode
```

### Documentation

Complete automation framework documentation:

- **[README_AUTOMATION_FRAMEWORK.md](README_AUTOMATION_FRAMEWORK.md)** — Main guide covering all features, setup, and advanced usage
- **[PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)** — Technical deep dive into architecture, configuration, and implementation
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** — Command reference guide and troubleshooting
- **[SETUP_VALIDATION_CHECKLIST.md](SETUP_VALIDATION_CHECKLIST.md)** — Step-by-step verification checklist
- **[IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)** — Feature summary and deployment checklist

### Key Features

✅ **Test Tagging** — Organize tests with @smoke, @regression, @api, @ui, @critical, @visual, @sanity tags
✅ **Git Hooks** — Automated pre-commit validation, conventional commit enforcement, pre-push checks
✅ **Docker Support** — Multi-stage builds, docker-compose orchestration, production-ready images
✅ **Visual Testing** — Screenshot baselines, cross-browser comparison, pixel-perfect validation
✅ **Notifications** — Slack/Discord integration with real-time test result alerts
✅ **CI/CD Ready** — GitHub Actions workflows for smoke, regression, API, and Docker build tests
✅ **MCP Integration** — AI-assisted debugging with failure analysis and root cause detection
✅ **Professional Reporting** — HTML, Allure, JUnit XML, JSON reports with historical trends

### Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Key automation variables:
TEST_URL=https://example.com              # Target test URL
API_URL=https://api.example.com          # API endpoint
SLACK_WEBHOOK=https://hooks.slack.com... # Slack notifications (optional)
DISCORD_WEBHOOK=https://discord.com...   # Discord notifications (optional)
```

### Docker Execution

```bash
# Build image
docker build -t qa360-framework:latest .

# Run tests in container
docker run qa360-framework:latest

# Use docker-compose for full orchestration
docker-compose up
```

### Validation

Run the setup validation script to verify all components:

```bash
bash validate-setup.sh
```

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
  notification-config.ts     # Slack/Discord integration
  jenkins-pipelines.ts       # Jenkins pipeline examples
  *.ts                       # Framework utilities

/types                  # TypeScript types
/tests                  # Playwright test specifications
  *.spec.js             # Tagged test files with @smoke, @regression, @api, @ui, @critical, @visual
/mcp/prompts            # MCP prompt templates for AI integration
  generate-test.prompt.md
  analyze-failure.prompt.md
  refactor-framework.prompt.md
  ci-cd-review.prompt.md
  ai-failure-analysis.prompt.md
  github-mcp-workflow.prompt.md

/.github/workflows      # GitHub Actions CI/CD pipelines
  smoke-tests.yml       # Smoke test workflow
  regression-tests.yml  # Regression suite workflow
  api-tests.yml         # API testing workflow
  docker-build.yml      # Docker image build and push

/.husky                 # Git hooks (Husky)
  pre-commit            # Pre-commit validation
  commit-msg            # Conventional commit enforcement
  pre-push              # Pre-push critical tests

.env.example            # Root environment variables
Dockerfile              # Multi-stage Docker build
docker-compose.yml      # Docker Compose orchestration
playwright.config.ts    # Playwright configuration
validate-setup.sh       # Setup validation script

# Documentation
README.md                           # This file
README_AUTOMATION_FRAMEWORK.md      # Main automation framework guide
PROJECT_DOCUMENTATION.md            # Technical documentation
QUICK_REFERENCE.md                  # Command reference
SETUP_VALIDATION_CHECKLIST.md       # Verification checklist
IMPLEMENTATION_COMPLETE.md          # Feature summary
README_DEPLOYMENT.md                # Production deployment guide
supabase-schema.sql                 # Database schema (optional)
```

---

## Scripts Reference

### Root (Playwright Automation Framework)
```bash
npm install              # Install all dependencies
npm test                 # Run all tests
npm run test:smoke       # Smoke tests only (@smoke)
npm run test:regression  # Full regression (@regression)
npm run test:sanity      # Sanity tests (@sanity)
npm run test:api         # API tests (@api)
npm run test:ui          # UI tests (@ui)
npm run test:critical    # Critical tests (@critical)
npm run test:visual      # Visual tests (@visual)
npm run test:debug       # Debug mode with headed browser
npm run test:report      # Open HTML test report
npm run lint             # Run linting
npm run prepare          # Initialize Husky git hooks
```

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

## GitHub Actions & CI/CD

### Automation Framework Workflows

QA360 includes 4 GitHub Actions workflows for comprehensive automated testing:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **Smoke Tests** | Push, PR, Schedule (6h) | Quick validation of critical paths with Slack/Discord notifications |
| **Regression Tests** | Nightly | Full test suite across Chromium, Firefox, WebKit with Allure reporting |
| **API Tests** | Every 4 hours | API endpoint validation with performance analysis |
| **Docker Build** | Push to main | Build, test, and push Docker image to registry |

All workflows post results as PR comments and send notifications to Slack/Discord.

### Deployment Workflows (Platform)

To enable automatic deployments on push to `main`, add these secrets in **GitHub → Settings → Secrets**:

| Secret | Description |
|--------|-------------|
| `RAILWAY_TOKEN` | Railway API token |
| `VERCEL_TOKEN` | Vercel token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |

---

## Support & Resources

### Documentation

- **Framework Setup** — [README_AUTOMATION_FRAMEWORK.md](README_AUTOMATION_FRAMEWORK.md)
- **Technical Details** — [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)
- **Quick Start** — [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
- **Validation** — [SETUP_VALIDATION_CHECKLIST.md](SETUP_VALIDATION_CHECKLIST.md)
- **Implementation** — [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)
- **Deployment** — [README_DEPLOYMENT.md](README_DEPLOYMENT.md)

### Need Help?

1. **Run validation script** — `bash validate-setup.sh`
2. **Check quick reference** — See [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
3. **Review logs** — Check `test-results/` and `playwright-report/`
4. **Debug mode** — Run `npm run test:debug` for headed browser testing

### Key Configuration Files

- `.env.example` — Environment variables template
- `playwright.config.ts` — Playwright framework configuration
- `.github/workflows/` — GitHub Actions CI/CD pipelines
- `.husky/` — Git hooks for quality enforcement
- `Dockerfile` — Production-ready container image

---

## License

This project is part of QA360 SaaS Platform.

---

**Ready to get started?** 🚀

1. Run `npm install && npm run prepare` to initialize the framework
2. Read [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for command reference
3. Execute `npm run test:smoke` to validate setup
4. Review [README_AUTOMATION_FRAMEWORK.md](README_AUTOMATION_FRAMEWORK.md) for advanced features
