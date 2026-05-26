# QA360 Playwright Framework - Quick Reference Guide

## 🚀 Getting Started (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers
npx playwright install

# 3. Initialize Git hooks
npm run prepare

# 4. Run your first test
npm run test:smoke

# 5. View report
npm run test:report
```

---

## 🧪 Running Tests

### By Tag
```bash
npm run test:smoke          # Quick health checks
npm run test:regression     # Full test suite
npm run test:sanity         # Core functionality
npm run test:api            # API tests
npm run test:critical       # Critical paths
npm run test:visual         # Visual regression tests
```

### All Tests
```bash
npm test                    # Run all tests
npm run test:ui             # UI mode (interactive)
npm run test:debug          # Debug mode (step through)
npm run test:headed         # Headed mode (see browser)
```

### Specific Tests
```bash
npm test -- --grep "Login"           # Tests matching "Login"
npm test -- --grep "@smoke|@api"     # Smoke OR API tests
npm test -- --project=chromium       # Only Chromium
npm test -- --project=firefox        # Only Firefox
npm test -- tests/test.spec.js       # Specific file
```

---

## 📊 Reports

### View Reports
```bash
npm run test:report                  # HTML report
npx allure open allure-report        # Allure report
```

### Generate Reports
```bash
# After tests run automatically, but can regenerate
npx allure generate allure-results --clean -o allure-report
```

### Report Locations
- **HTML**: `playwright-report/index.html`
- **Allure**: `allure-report/index.html`
- **JUnit**: `test-results/junit.xml`
- **JSON**: `test-results/results.json`

---

## 🐳 Docker

### Build & Run
```bash
# Build image
docker build -t qa360-framework:latest .

# Run tests
docker run qa360-framework:latest

# With environment variables
docker run \
  -e TEST_URL=http://example.com \
  -v $(pwd)/test-results:/app/test-results \
  qa360-framework:latest

# Using Docker Compose
docker-compose up                    # Start all services
docker-compose up qa360-framework    # Only framework
docker-compose down                  # Stop services

# View Allure report (Compose)
open http://localhost:4040
```

---

## 🪝 Git Hooks

### Commit Workflow
```bash
# Normal commit (hooks run automatically)
git commit -m "feat: add new test"

# Skip hooks if needed
git commit --no-verify -m "message"

# Commit message format
feat(scope): description              # New feature
fix(scope): description               # Bug fix
test(scope): description              # New test
docs(scope): description              # Documentation
refactor(scope): description          # Code refactor
chore(scope): description             # Maintenance
ci(scope): description                # CI/CD update
```

---

## 🔔 Notifications

### Setup Slack
```bash
export SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
npm test  # Notifications sent automatically
```

### Setup Discord
```bash
export DISCORD_WEBHOOK="https://discord.com/api/webhooks/YOUR/WEBHOOK"
npm test  # Notifications sent automatically
```

---

## 🔧 Configuration

### Environment Variables
```bash
# Create .env.local
cp .env.example .env.local

# Edit with your values
nano .env.local

# Key variables:
TEST_URL=http://localhost:3000
API_URL=http://localhost:5000
TEST_TIMEOUT=30000
SLACK_WEBHOOK=...
DISCORD_WEBHOOK=...
```

### Playwright Config
- File: `playwright.config.ts`
- Modify:
  - `baseURL` - Test URL
  - `workers` - Parallel execution
  - `retries` - Retry failed tests
  - `timeout` - Test timeout
  - `reporters` - Report types

---

## 📈 CI/CD

### GitHub Actions
Automatically runs on:
- Push to main/develop
- Pull requests
- Scheduled (nightly/hourly)

View results:
```bash
gh workflow list
gh run list
gh run view <run-id>
```

### Manual Trigger
```bash
gh workflow run smoke-tests.yml
gh workflow run regression-tests.yml
```

---

## 🤖 AI-Assisted Workflows

### Using MCP Prompts

1. **Generate Test**
   ```bash
   cat mcp/prompts/generate-test.prompt.md
   # Copy into Cursor AI
   # Provide feature context
   ```

2. **Analyze Failures**
   ```bash
   cat mcp/prompts/analyze-failure.prompt.md
   # Copy into Cursor AI
   # Provide test failure details
   ```

3. **Refactor Framework**
   ```bash
   cat mcp/prompts/refactor-framework.prompt.md
   # Copy into Cursor AI for recommendations
   ```

4. **Review CI/CD**
   ```bash
   cat mcp/prompts/ci-cd-review.prompt.md
   # Copy into Cursor AI for pipeline optimization
   ```

---

## 🆘 Troubleshooting

### Tests Fail Locally
```bash
# Check configuration
cat .env.local

# Verify app running
curl http://localhost:3000

# Run with debugging
npm run test:debug

# Check browser installation
npx playwright install

# Clear cache
rm -rf .playwright
npm test
```

### Hooks Not Running
```bash
# Reinstall
npm run prepare

# Fix permissions
chmod +x .husky/*

# Verify
ls -la .husky/
```

### Docker Fails
```bash
# Check Docker running
docker ps

# Build verbose
docker build -t qa360:test . --progress=plain

# Clean build
docker build --no-cache -t qa360:test .

# Check logs
docker logs <container-id>
```

### Reports Missing
```bash
# Check directories exist
ls -la playwright-report/
ls -la allure-report/
ls -la test-results/

# Generate manually
npx allure generate allure-results --clean -o allure-report

# Verify Allure installed
npm list allure-commandline
```

---

## 📚 Documentation

- **README_AUTOMATION_FRAMEWORK.md** - Main documentation
- **PROJECT_DOCUMENTATION.md** - Detailed setup guide
- **SETUP_VALIDATION_CHECKLIST.md** - Verification checklist
- **mcp/prompts/** - AI prompt templates

---

## 🔗 Resources

- [Playwright Docs](https://playwright.dev)
- [Allure Reports](https://docs.qameta.io/allure/)
- [GitHub Actions](https://docs.github.com/actions)
- [Docker Docs](https://docs.docker.com)

---

## 💡 Pro Tips

1. **Use Data Attributes**
   - Add `data-testid` to elements
   - More stable selectors

2. **Parallel Execution**
   - Increases speed significantly
   - Configure `workers` in config

3. **Visual Regression**
   - Capture screenshots for UI changes
   - Run with `npm run test:visual`

4. **Debug Mode**
   - Step through tests: `npm run test:debug`
   - Inspect elements in browser
   - View network requests

5. **Performance**
   - Run on CI only: tests + retries
   - Limit retries locally
   - Use headless mode in CI

---

**Quick Command Reference**

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm test` | Run all tests |
| `npm run test:smoke` | Run smoke tests |
| `npm run test:report` | View HTML report |
| `docker build -t qa360 .` | Build Docker image |
| `docker-compose up` | Start services |
| `npm run prepare` | Initialize Git hooks |
| `npm run test:debug` | Debug tests |

---

**Last Updated**: May 2026  
**Version**: 1.0.0
