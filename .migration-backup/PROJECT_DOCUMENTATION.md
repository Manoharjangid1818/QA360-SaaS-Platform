# QA360 Playwright Framework - Complete Project Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Installation & Setup](#installation--setup)
3. [Architecture & Design](#architecture--design)
4. [Test Organization](#test-organization)
5. [CI/CD Pipelines](#cicd-pipelines)
6. [Docker & Containers](#docker--containers)
7. [Git Hooks & Validation](#git-hooks--validation)
8. [Reporting & Analysis](#reporting--analysis)
9. [AI-Assisted Workflows](#ai-assisted-workflows)
10. [Troubleshooting & FAQs](#troubleshooting--faqs)
11. [Production Deployment](#production-deployment)

---

## System Overview

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    QA360 Platform                            │
├─────────────────────────────────────────────────────────────┤
│  Front End (Next.js)      │      Backend (Node.js/Express)   │
├─────────────────────────────────────────────────────────────┤
│           Playwright Automation Framework                     │
├─────────────────────────────────────────────────────────────┤
│  Test Execution Engine                                        │
│  ├─ Test Runner (Playwright Test)                            │
│  ├─ Report Generators (HTML, Allure, JUnit)                 │
│  ├─ Notification Service (Slack, Discord)                   │
│  └─ CI/CD Integrations (GitHub, Jenkins, GitLab)            │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure                                              │
│  ├─ Docker (Multi-stage containerization)                   │
│  ├─ Docker Compose (Local orchestration)                    │
│  ├─ Kubernetes (Production deployment)                      │
│  └─ Git Hooks (Quality gates)                               │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| Playwright | 1.60.0 | Browser automation |
| Node.js | 18+ LTS | Runtime environment |
| TypeScript | 5.7.3 | Type-safe scripting |
| Next.js | 15.1.6 | Frontend framework |
| Express | 4.18.2 | Backend API |
| Docker | Latest | Containerization |
| Allure | 2.21.0 | Test reporting |
| Husky | 9.0.11 | Git hooks |

---

## Installation & Setup

### Step 1: Prerequisites

```bash
# Verify Node.js version
node --version  # Should be 18.0.0 or higher

# Verify npm version
npm --version   # Should be 9.0.0 or higher

# Install Git (if not installed)
# https://git-scm.com/downloads

# Install Docker (optional, for containerized execution)
# https://www.docker.com/products/docker-desktop
```

### Step 2: Clone Repository

```bash
# Clone from GitHub
git clone https://github.com/Manoharjangid1818/QA360-SaaS-Platform.git
cd QA360-SaaS-Platform

# Verify clone
git log --oneline -1
```

### Step 3: Install Dependencies

```bash
# Install all npm packages
npm install

# Verify Playwright installation
npm ls @playwright/test

# Check if all dependencies resolved
npm audit  # Review for vulnerabilities
```

### Step 4: Initialize Git Hooks

```bash
# Install Husky hooks
npm run prepare

# Verify hooks are installed
ls -la .husky/

# Expected files:
# - pre-commit
# - commit-msg
# - pre-push
```

### Step 5: Install Playwright Browsers

```bash
# Install all browsers
npx playwright install

# Or install specific browser
npx playwright install chromium

# Verify installation
npx playwright install-deps  # Install OS dependencies

# Check installed browsers
npx playwright install --list
```

### Step 6: Environment Configuration

```bash
# Create .env.local file
cat > .env.local << EOF
# Test URLs
TEST_URL=http://localhost:3000
BASE_URL=http://localhost:3000
API_URL=http://localhost:5000

# Notifications (optional)
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
DISCORD_WEBHOOK=https://discord.com/api/webhooks/YOUR/WEBHOOK/ID

# Timeouts (milliseconds)
TEST_TIMEOUT=30000
EXPECT_TIMEOUT=5000

# CI/CD Settings
CI=false
NODE_ENV=test
EOF

# Verify environment file
cat .env.local
```

### Step 7: Verify Installation

```bash
# Run a simple test
npm run test:smoke

# View HTML report
npm run test:report

# Expected output:
# ✅ All tests passed
# 📊 Report generated in playwright-report/
```

---

## Architecture & Design

### Design Principles

1. **Scalability**: Support growing test suite
2. **Maintainability**: Clear code organization
3. **Reliability**: Stable selectors and waits
4. **Performance**: Parallel execution
5. **Observability**: Comprehensive reporting

### Directory Structure

```
qa360-saas-platform/
│
├── .husky/                          # Git hooks
│   ├── pre-commit                   # Pre-commit validation
│   ├── commit-msg                   # Commit message validation
│   └── pre-push                     # Pre-push checks
│
├── .github/
│   └── workflows/                   # GitHub Actions workflows
│       ├── smoke-tests.yml          # Smoke test pipeline
│       ├── regression-tests.yml     # Regression pipeline
│       ├── api-tests.yml            # API test pipeline
│       └── docker-build.yml         # Docker build pipeline
│
├── mcp/
│   └── prompts/                     # MCP prompt library
│       ├── generate-test.prompt.md
│       ├── analyze-failure.prompt.md
│       ├── refactor-framework.prompt.md
│       ├── ci-cd-review.prompt.md
│       ├── ai-failure-analysis.prompt.md
│       └── github-mcp-workflow.prompt.md
│
├── tests/                           # Test files
│   ├── test.spec.js                 # Multi-site tests (@regression, @sanity, @ui)
│   ├── dynamic.spec.js              # Dynamic site tests (@smoke, @critical, @api)
│   ├── google.spec.js               # Google tests (@smoke, @regression, @ui)
│   ├── Sample.spec.js               # Sample unit tests (@sanity, @critical)
│   └── config/
│       └── sites.json               # Test configuration
│
├── lib/                             # Utility libraries
│   ├── notification-config.ts       # Slack/Discord integration
│   ├── jenkins-pipelines.ts         # Jenkins pipeline examples
│   ├── notification-service.ts      # Notification service (existing)
│   └── [other utilities]
│
├── config/                          # Configuration
│   └── sites.json                   # Site configuration
│
├── app/                             # Next.js application
├── backend/                         # Backend services
├── components/                      # React components
│
├── playwright.config.ts             # Playwright configuration
├── Dockerfile                       # Docker image definition
├── docker-compose.yml               # Docker Compose setup
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
└── README_AUTOMATION_FRAMEWORK.md   # Main documentation
```

### Configuration Files

#### playwright.config.ts
```typescript
// Key configurations:
// - testDir: './tests' - Where tests are located
// - fullyParallel: true - Run tests in parallel
// - retries: 2 - Retry failed tests in CI
// - workers: 4 - Parallel execution workers
// - reporters: [html, json, junit, allure] - Multiple report formats
// - projects: [chromium, firefox, webkit] - Browsers to test
```

#### package.json
```json
{
  "scripts": {
    "test": "playwright test",
    "test:smoke": "playwright test --grep @smoke",
    "test:regression": "playwright test --grep @regression",
    "test:api": "playwright test --grep @api",
    "test:critical": "playwright test --grep @critical",
    "test:visual": "playwright test --grep @visual"
  }
}
```

---

## Test Organization

### Test Tagging Strategy

Tests are organized using tags for selective execution:

| Tag | Description | Frequency | Duration | Examples |
|-----|-------------|-----------|----------|----------|
| @smoke | Quick health checks | Every commit | 2-5 min | Login, home page load |
| @regression | Full feature testing | Nightly | 30-60 min | Complete user flows |
| @sanity | Core functionality | After deploy | 5-10 min | Critical paths |
| @api | API endpoint testing | Every 4 hours | 5-15 min | REST/GraphQL calls |
| @ui | UI component testing | Per branch | 10-20 min | UI interactions |
| @critical | Business-critical paths | Pre-release | 10-15 min | Payment, auth |
| @visual | Visual regression | On UI changes | 5-10 min | Screenshot diffs |

### Tagging Best Practices

```typescript
// ✅ Good: Clear, descriptive test name with tag
test('@smoke @ui - Login with valid credentials', async ({ page }) => {
  // Test implementation
});

// ✅ Good: Multiple tags for cross-categorization
test('@smoke @regression @critical - User registration flow', async ({ page }) => {
  // Test implementation
});

// ✅ Good: Organized test sections
/**
 * Test Suite: Authentication
 * Tags: @smoke, @critical, @ui
 * Validates user login and registration
 */
test('@smoke @critical @ui - Valid login', async ({ page }) => {});

// ❌ Avoid: No tags (not categorized)
test('Login test', async ({ page }) => {});

// ❌ Avoid: Unclear names
test('@ui - Test 1', async ({ page }) => {});
```

### Test File Organization

```javascript
import { test, expect } from '@playwright/test';

/**
 * Test Suite: [Feature Name]
 * Tags: @smoke, @regression, @ui
 * Description: [What this suite tests]
 */

// Group 1: Basic functionality
test('@smoke - Feature basic functionality', async ({ page }) => {
  // Basic test
});

test('@regression - Feature advanced scenario', async ({ page }) => {
  // Advanced test
});

// Group 2: Edge cases
test('@regression - Feature edge case 1', async ({ page }) => {
  // Edge case test
});

// Group 3: API integration
test('@api - Feature API endpoint', async ({ request }) => {
  // API test
});

// Group 4: Visual testing
test('@visual - Feature visual baseline', async ({ page }) => {
  await expect(page).toHaveScreenshot('feature-screenshot.png');
});
```

---

## CI/CD Pipelines

### GitHub Actions Workflows

#### 1. Smoke Tests (smoke-tests.yml)
```yaml
Trigger: Push/PR to main, develop
Schedule: Every 6 hours
Duration: ~5-10 minutes
Purpose: Quick health check
Notifications: Slack, Discord, PR comments
```

**Configuration:**
- Runs on: ubuntu-latest
- Node version: 18
- Parallel jobs: 4 shards (optional)
- Report upload: 30-day retention

**Manual trigger:**
```bash
gh workflow run smoke-tests.yml
```

#### 2. Regression Tests (regression-tests.yml)
```yaml
Trigger: Push to main
Schedule: Nightly (2 AM UTC)
Duration: ~60-90 minutes
Purpose: Full feature testing
Parallel: Multiple browsers + sharding
```

**Configuration:**
- Matrix: 4 shards × 3 browsers = 12 parallel jobs
- Report: Merged Allure report
- Artifact retention: 30 days

#### 3. API Tests (api-tests.yml)
```yaml
Trigger: Push to main, develop
Schedule: Every 4 hours
Duration: ~10-15 minutes
Purpose: API endpoint validation
Services: Mocked API server
```

#### 4. Docker Build (docker-build.yml)
```yaml
Trigger: Push to main, develop
Purpose: Build and push Docker image
Registry: GitHub Container Registry (ghcr.io)
```

### Jenkins Pipeline Examples

See `lib/jenkins-pipelines.ts` for example configurations:

```groovy
// Example: Smoke Test Pipeline
pipeline {
    agent any
    stages {
        stage('Checkout') { /* ... */ }
        stage('Setup') { /* ... */ }
        stage('Run Smoke Tests') { /* ... */ }
        stage('Generate Report') { /* ... */ }
    }
    post {
        always { /* Archive artifacts */ }
        success { /* Slack notification */ }
        failure { /* Alert DevOps */ }
    }
}
```

### GitLab CI/CD

Create `.gitlab-ci.yml`:

```yaml
stages:
  - test
  - report

smoke_tests:
  stage: test
  image: mcr.microsoft.com/playwright:v1.53.0-jammy
  script:
    - npm install
    - npm run test:smoke
  artifacts:
    paths:
      - playwright-report/
    expire_in: 30 days

regression_tests:
  stage: test
  image: mcr.microsoft.com/playwright:v1.53.0-jammy
  script:
    - npm install
    - npm run test:regression
  artifacts:
    paths:
      - allure-report/
    expire_in: 30 days
```

---

## Docker & Containers

### Docker Image Layers

```dockerfile
# Stage 1: Base image with Playwright
FROM mcr.microsoft.com/playwright:v1.53.0-jammy AS base

# Stage 2: Install dependencies
FROM base AS dependencies
RUN npm ci --omit=dev

# Stage 3: Build and validate
FROM dependencies AS builder
COPY . .
RUN npm ci  # dev dependencies

# Stage 4: Run tests
FROM builder AS tester
RUN npm test

# Stage 5: Final production image
FROM base AS final
COPY --from=tester /app ./
```

### Building and Running

```bash
# Build image
docker build -t qa360-framework:latest .

# Build specific stage
docker build --target tester -t qa360-framework:test .

# Run tests
docker run qa360-framework:latest

# Run with environment variables
docker run \
  -e TEST_URL=http://localhost:3000 \
  -e SLACK_WEBHOOK=$SLACK_WEBHOOK \
  -v $(pwd)/test-results:/app/test-results \
  qa360-framework:latest

# Run with Compose
docker-compose up
docker-compose up --abort-on-container-exit
docker-compose down

# View Allure report (Compose)
# http://localhost:4040
```

### Multi-stage Build Benefits

- ✅ Smaller final image size
- ✅ Separate build and runtime concerns
- ✅ Better caching for CI/CD
- ✅ Security isolation
- ✅ Faster deployment cycles

---

## Git Hooks & Validation

### Hook Configuration

#### .husky/pre-commit
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run linting
npm run lint || exit 1

# Run tests
npm test || exit 1

# Visual regression checks
npm run test:visual || echo "⚠️  Visual warning"
```

**Runs on:** Every `git commit`

**Fails if:**
- Linting errors found
- Tests fail
- Framework validation fails

#### .husky/commit-msg
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Validate commit message format
# Pattern: type(scope): description
# Types: feat, fix, test, docs, refactor, chore, ci
```

**Runs on:** Before commit message is saved

**Examples:**
```bash
✅ git commit -m "feat: add visual testing"
✅ git commit -m "fix(login): update selector"
❌ git commit -m "update code"  # No type prefix
```

#### .husky/pre-push
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run comprehensive validation
npm test
npm run lint
npm run test:critical
```

**Runs on:** `git push` before sending to remote

**Blocks push if:** Tests or critical validations fail

### Bypassing Hooks

```bash
# Skip pre-commit hook (not recommended)
git commit --no-verify

# Skip pre-push hook
git push --no-verify

# Temporarily disable all hooks
HUSKY=0 git commit -m "message"
```

### Hook Troubleshooting

```bash
# Reinstall hooks
npm run prepare

# Debug hook execution
bash -x .husky/pre-commit

# Check hook permissions
ls -la .husky/

# Verify hook content
cat .husky/pre-commit
```

---

## Reporting & Analysis

### Report Types

#### 1. HTML Report (Playwright Native)
```bash
# Generate automatically on test run
# Location: playwright-report/index.html

# View report
npm run test:report

# Features:
# - Test results and traces
# - Screenshot comparisons
# - Video recordings
# - Full execution timeline
```

#### 2. Allure Report
```bash
# Generate Allure report
npx allure generate allure-results --clean -o allure-report

# View report
npx allure open allure-report

# Features:
# - Beautiful dashboards
# - Historical trends
# - Test categorization
# - Failure analysis
# - Timeline view
```

#### 3. JUnit XML
```bash
# Generated automatically
# Location: test-results/junit.xml

# Used for:
# - Jenkins integration
# - CI/CD dashboards
# - Test metrics
# - Programmatic access
```

#### 4. JSON Results
```bash
# Generated automatically
# Location: test-results/results.json

# Contains:
# - Complete test data
# - Error stack traces
# - Timing information
# - Test metadata
```

### Report Archiving

```bash
# GitHub Actions automatically archives
# - artifacts: 30-day retention
# - logs: 90-day retention

# Docker Compose volumes
volumes:
  - ./playwright-report:/app/playwright-report
  - ./allure-report:/app/allure-report
  - ./test-results:/app/test-results

# Manual backup
tar -czf reports-backup-$(date +%Y%m%d).tar.gz playwright-report/ allure-report/
```

---

## AI-Assisted Workflows

### MCP Prompts Library

Located in `mcp/prompts/`:

#### 1. generate-test.prompt.md
Used to generate new Playwright tests with AI assistance.

```bash
# Use in Cursor:
cat mcp/prompts/generate-test.prompt.md
# Copy content and provide context:
# - Feature to test
# - User scenarios
# - Expected outcomes
```

#### 2. analyze-failure.prompt.md
AI root cause analysis for failed tests.

```bash
# Workflow:
1. Get latest playwright-report/index.html
2. Paste into Cursor with this prompt
3. AI analyzes failures and suggests fixes
4. Apply recommendations to fix flaky tests
```

#### 3. refactor-framework.prompt.md
Framework optimization and best practices.

```bash
# Use for:
- Code quality improvements
- Architecture review
- Maintainability assessment
- Performance optimization
```

#### 4. ci-cd-review.prompt.md
CI/CD pipeline optimization.

```bash
# Analyze:
- Pipeline execution time
- Resource utilization
- Reliability improvements
- Cost optimization
```

### AI-Assisted Debugging Workflow

```
Step 1: Run tests and collect failures
  └─ npm test

Step 2: Review reports
  └─ playwright-report/index.html
  └─ allure-report/index.html

Step 3: Use AI analysis prompt
  └─ Copy analyze-failure.prompt.md
  └─ Paste in Cursor AI
  └─ Provide test failure context

Step 4: Apply AI recommendations
  └─ Update selectors
  └─ Fix timing issues
  └─ Refactor test code

Step 5: Validate fixes
  └─ npm test:smoke
  └─ Review improved reports

Step 6: Commit changes
  └─ git commit -m "fix: stabilize flaky tests"
```

### Cursor MCP Integration

```typescript
// Use @-mentions in Cursor to reference:
@mcp-tool read-file path:playwright-report/index.html
@mcp-tool read-directory path:allure-results/
@mcp-tool suggest-code-fix based-on:test-failures
```

---

## Troubleshooting & FAQs

### Common Issues

#### Issue: Tests fail locally but pass in CI
**Causes:**
- Environment variables not set
- Base URL mismatch
- Browser version difference

**Solution:**
```bash
# Check environment
cat .env.local

# Verify base URL
echo $BASE_URL

# Match CI browser versions
npx playwright --version

# Run with CI settings
CI=true npm test
```

#### Issue: Husky hooks not running
**Causes:**
- Hooks not installed
- File permissions issue
- Git not using Node

**Solution:**
```bash
# Reinstall
npm install
npm run prepare

# Fix permissions
chmod +x .husky/*

# Verify installation
ls -la .husky/
```

#### Issue: Docker build fails
**Causes:**
- Invalid Dockerfile syntax
- Missing files
- Permission issues

**Solution:**
```bash
# Build with verbose output
docker build -t qa360-framework:latest . --progress=plain

# Check Dockerfile
docker build --file Dockerfile .

# Clean build (no cache)
docker build --no-cache -t qa360-framework:latest .
```

#### Issue: Timeouts in tests
**Causes:**
- Network latency
- Slow selector matching
- Insufficient wait time

**Solution:**
```typescript
// Increase timeout
test.setTimeout(60000);  // 60 seconds

// Add explicit wait
await page.waitForLoadState('networkidle');

// Use waitForSelector with timeout
await page.waitForSelector('[data-testid="element"]', { timeout: 10000 });
```

### FAQ

**Q: How do I run tests in parallel?**
A: Configure workers in playwright.config.ts:
```typescript
workers: 4  // Run 4 tests concurrently
```

**Q: Can I run only specific tests?**
A: Use grep to filter:
```bash
npm test -- --grep "Login"
npm test -- --grep "@smoke|@critical"
```

**Q: How do I disable Git hooks?**
A: Temporarily set HUSKY=0:
```bash
HUSKY=0 git commit -m "message"
```

**Q: How are reports stored?**
A: Multiple locations:
- HTML: `playwright-report/`
- Allure: `allure-report/`
- JUnit: `test-results/junit.xml`
- JSON: `test-results/results.json`

**Q: How do I integrate with Slack?**
A: Set webhook URL:
```bash
export SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK
npm test  # Notifications sent automatically
```

---

## Production Deployment

### Pre-deployment Checklist

- [ ] All tests passing locally
- [ ] Git hooks passing (npm run prepare)
- [ ] Docker image builds successfully
- [ ] Environment variables configured
- [ ] Slack/Discord webhooks set
- [ ] Deployment branch protected
- [ ] CI/CD pipelines passing
- [ ] Code reviewed and approved

### Deployment Steps

```bash
# 1. Create release branch
git checkout -b release/v1.0.0

# 2. Update version
npm version patch

# 3. Run full test suite
npm test
npm run test:critical

# 4. Generate reports
npx allure generate allure-results --clean -o allure-report

# 5. Commit changes
git commit -m "chore: release v1.0.0"

# 6. Push and create PR
git push origin release/v1.0.0
gh pr create --title "Release v1.0.0" --base main

# 7. Merge after approval
gh pr merge --squash

# 8. Tag release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# 9. Deploy Docker image
docker build -t qa360-framework:v1.0.0 .
docker tag qa360-framework:v1.0.0 ghcr.io/your-org/qa360:latest
docker push ghcr.io/your-org/qa360:latest
```

### Monitoring Post-Deployment

```bash
# Monitor test execution
watch "npm run test:smoke"

# Check notification channels
# - Slack channel for alerts
# - Discord server for updates

# Review reports
# - playwright-report/
# - allure-report/ on localhost:4040

# Monitor logs
docker logs qa360-framework
docker-compose logs -f
```

---

## Support & Resources

- 📖 [Playwright Documentation](https://playwright.dev)
- 📊 [Allure Reports](https://docs.qameta.io/allure/)
- 🚀 [GitHub Actions](https://docs.github.com/actions)
- 🐳 [Docker Docs](https://docs.docker.com)
- 🪝 [Husky Git Hooks](https://typicode.github.io/husky)
- 💬 [GitHub Issues](https://github.com/Manoharjangid1818/QA360-SaaS-Platform/issues)

---

**Last Updated**: May 2026  
**Version**: 1.0.0  
**Maintainer**: Manohar Jangid  
**Status**: Production Ready ✅
