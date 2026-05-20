# QA360 - Enterprise-Grade Playwright Automation Framework

> A production-ready, enterprise-level QA automation platform built on Playwright with advanced capabilities for CI/CD integration, visual regression testing, and AI-assisted failure analysis.

[![Tests](https://github.com/Manoharjangid1818/QA360-SaaS-Platform/workflows/Playwright%20Tests/badge.svg)](https://github.com/Manoharjangid1818/QA360-SaaS-Platform/actions)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](./Dockerfile)
[![Node](https://img.shields.io/badge/node-18%2B-brightgreen)](https://nodejs.org)
[![Playwright](https://img.shields.io/badge/playwright-1.60.0-brightgreen)](https://playwright.dev)

## 🚀 Features

### Core Capabilities
- ✅ **Playwright Automation** - Modern browser automation with TypeScript support
- ✅ **Test Tagging System** - Organize tests by @smoke, @regression, @api, @ui, @sanity, @critical, @visual
- ✅ **Multi-browser Support** - Chromium, Firefox, WebKit, and mobile viewports
- ✅ **Visual Regression Testing** - Screenshot-based UI testing with baselines
- ✅ **Cross-platform Execution** - Desktop and mobile device testing

### Enterprise Features
- ✅ **Git Hooks (Husky)** - Automatic pre-commit and pre-push validation
- ✅ **Docker Support** - Containerized test execution with multi-stage builds
- ✅ **Allure Reports** - Beautiful, detailed test reporting with history tracking
- ✅ **CI/CD Integration** - GitHub Actions, Jenkins, and GitLab CI/CD pipelines
- ✅ **Notifications** - Slack and Discord integration for test results
- ✅ **AI-Assisted Debugging** - MCP integration for intelligent failure analysis

### DevOps Ready
- ✅ **Infrastructure as Code** - Docker Compose and Kubernetes ready
- ✅ **Environment Management** - Multi-environment support with secure secrets
- ✅ **Parallel Execution** - Efficient distributed test execution
- ✅ **Report Archiving** - Automatic artifact management and cleanup

## 📋 Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or yarn
- Git with Husky support
- Docker (optional, for containerized execution)

### Installation

```bash
# Clone repository
git clone https://github.com/Manoharjangid1818/QA360-SaaS-Platform.git
cd QA360-SaaS-Platform

# Install dependencies
npm install

# Initialize Git hooks
npm run prepare

# Install Playwright browsers
npx playwright install

# Run smoke tests
npm run test:smoke
```

### First Test Run

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:regression

# Run with UI
npm run test:ui

# Debug specific test
npm run test:debug
```

## 🏷️ Test Tagging & Execution

### Available Tags

| Tag | Purpose | Use Case |
|-----|---------|----------|
| `@smoke` | Quick health checks | Pre-deployment validation |
| `@regression` | Full test suite | Nightly builds |
| `@sanity` | Core functionality | After deployments |
| `@api` | API endpoint testing | Backend validation |
| `@ui` | User interface testing | Frontend regression |
| `@critical` | Business-critical paths | Pre-release gates |
| `@visual` | Visual regression | UI consistency |

### Running Tagged Tests

```bash
# Run smoke tests only
npm run test:smoke

# Run regression suite
npm run test:regression

# Run API tests
npm run test:api

# Run critical tests
npm run test:critical

# Run visual regression tests
npm run test:visual

# Run multiple tags
npm test -- --grep "@smoke|@critical"
```

## 🐳 Docker Execution

### Build and Run

```bash
# Build Docker image
docker build -t qa360-framework:latest .

# Run tests in container
docker run qa360-framework:latest

# Run with custom environment
docker run \
  -e TEST_URL=http://example.com \
  -e SLACK_WEBHOOK=$SLACK_WEBHOOK \
  -v $(pwd)/test-results:/app/test-results \
  qa360-framework:latest

# Run with Docker Compose
docker-compose up --abort-on-container-exit
```

### Docker Compose Services

```bash
# Start all services (framework + Allure reporter)
docker-compose up

# View Allure report
# Navigate to http://localhost:4040

# Run specific service
docker-compose up qa360-framework
```

## 🔗 Git Hooks (Husky)

### Pre-commit Validation

Automatically runs before each commit:
- ✅ Code linting
- ✅ Unit tests
- ✅ Visual regression checks (if modified)

```bash
# Skip hooks if needed (not recommended)
git commit --no-verify
```

### Commit Message Format

Follow conventional commits:
```
feat(feature-name): add new feature
fix(bug-name): fix bug
test(test-name): add tests
docs(section): update documentation
refactor(module): refactor code
chore(task): maintenance
ci(pipeline): CI/CD updates
```

### Hook Configuration

Hooks are configured in `.husky/`:
- `pre-commit` - Runs lint and tests
- `commit-msg` - Validates message format
- `pre-push` - Final validation before push

## 📊 Reporting

### HTML Reports

```bash
# Generate and view report
npm run test:report

# Output location: playwright-report/index.html
```

### Allure Reports

```bash
# Generate Allure report
npx allure generate allure-results --clean -o allure-report

# View report
npx allure open allure-report
```

### Report Artifacts

- **Playwright Report**: Full test results with traces
- **Allure Report**: Detailed metrics and history
- **JUnit XML**: CI/CD integration format
- **JSON Results**: Programmatic access

## 🚀 CI/CD Integration

### GitHub Actions

```yaml
# Automatically runs on push/PR
- Smoke tests on every commit
- Regression tests nightly
- API tests on schedule
- Docker builds on main branch
```

See `.github/workflows/` for pipeline definitions.

### Jenkins Integration

See `lib/jenkins-pipelines.ts` for example Jenkinsfile configurations:
- Smoke test pipeline
- Regression test pipeline
- API test pipeline
- Docker-based pipeline
- Critical tests pre-deployment

### GitLab CI/CD

Configuration support via environment variables and custom scripts.

## 🔔 Notifications

### Slack Integration

```bash
# Set webhook URL
export SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Notifications automatically sent on:
# - Test completion (success/failure)
# - Failed tests with error details
# - Report links for quick access
```

### Discord Integration

```bash
# Set webhook URL
export DISCORD_WEBHOOK=https://discord.com/api/webhooks/YOUR/WEBHOOK

# Same features as Slack
```

## 🤖 AI-Assisted Testing

### MCP Prompts Library

Located in `mcp/prompts/`:

1. **generate-test.prompt.md** - Generate new test cases
2. **analyze-failure.prompt.md** - AI failure analysis and root cause detection
3. **refactor-framework.prompt.md** - Framework optimization suggestions
4. **ci-cd-review.prompt.md** - CI/CD pipeline improvements
5. **ai-failure-analysis.prompt.md** - Comprehensive debugging workflow
6. **github-mcp-workflow.prompt.md** - GitHub automation workflows

### Using AI Prompts with Cursor

```bash
# Copy prompt file content
cat mcp/prompts/analyze-failure.prompt.md

# Paste into Cursor and provide context:
# - Playwright report
# - Failed test details
# - Error traces
```

## 📚 Documentation

- [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) - Comprehensive setup guide
- [QUICKSTART.md](./QUICKSTART.md) - Quick reference
- [TEST_TAGGING_GUIDE.md](./docs/test-tagging-guide.md) - Tagging strategy
- [DOCKER_GUIDE.md](./docs/docker-guide.md) - Docker setup
- [CI_CD_SETUP.md](./docs/ci-cd-setup.md) - Pipeline configuration
- [MCP_WORKFLOW.md](./docs/mcp-workflow.md) - AI automation workflows

## 📦 Project Structure

```
qa360-saas-platform/
├── .husky/                    # Git hooks configuration
├── .github/workflows/         # GitHub Actions workflows
├── mcp/prompts/              # MCP prompt library
├── tests/                     # Test files with tags
├── lib/                       # Utility and service libraries
├── config/                    # Configuration files
├── playwright-report/         # Test reports (generated)
├── allure-results/           # Allure results (generated)
├── playwright.config.ts       # Main Playwright configuration
├── Dockerfile                 # Docker image definition
├── docker-compose.yml         # Docker Compose setup
└── package.json              # Dependencies and scripts
```

## ⚙️ Configuration

### Environment Variables

```bash
# Test configuration
TEST_URL=http://localhost:3000
BASE_URL=http://localhost:3000
API_URL=http://localhost:5000

# Notifications
SLACK_WEBHOOK=https://hooks.slack.com/services/...
DISCORD_WEBHOOK=https://discord.com/api/webhooks/...

# CI/CD
CI=true              # Set in CI environment
NODE_ENV=test        # Test environment

# Timeout settings
TEST_TIMEOUT=30000
EXPECT_TIMEOUT=5000
```

### Playwright Configuration

Edit `playwright.config.ts` to:
- Change base URL
- Adjust timeouts
- Add/remove browsers
- Configure reporters
- Customize test directories

## 🧪 Advanced Features

### Visual Regression Testing

```typescript
// Take screenshot baseline
await expect(page).toHaveScreenshot('homepage.png');

// Supports visual diff reporting
// Failed visuals show in allure-report/
```

### Cross-browser Testing

```bash
# Run specific browser
npm test -- --project=chromium
npm test -- --project=firefox
npm test -- --project=webkit

# Mobile testing
npm test -- --project="Mobile Chrome"
npm test -- --project="iPhone 12"
```

### Parallel Execution

```bash
# Configure in playwright.config.ts
workers: 4  # Run 4 tests in parallel

# Docker execution with sharding
docker-compose up --scale qa360-framework=4
```

## 🔐 Security

### Best Practices

- ✅ Use environment variables for secrets
- ✅ Never commit `.env` files
- ✅ Rotate webhook URLs regularly
- ✅ Use GitHub Actions secrets for credentials
- ✅ Enable branch protection rules
- ✅ Review commit messages before push

### Secrets Management

```bash
# GitHub Actions - set in repository secrets
Settings > Secrets and variables > Actions

# Local development - use .env.local
TEST_URL=http://localhost:3000
SLACK_WEBHOOK=*** (never commit)
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feat/feature-name`
3. Make changes and ensure tests pass
4. Commit with conventional format: `git commit -m "feat: add feature"`
5. Push and create Pull Request

## 📈 Monitoring & Analytics

### Test Metrics

- Total tests run
- Pass/fail rates
- Flaky test detection
- Execution time trends
- Coverage metrics

### Reports Dashboard

- 📊 Allure Reports: `http://localhost:4040` (Docker Compose)
- 📈 GitHub Actions: Repository > Actions tab
- 🔍 Jenkins: Jenkins dashboard

## 🐛 Troubleshooting

### Common Issues

**Tests fail locally but pass in CI:**
- Check environment variables
- Verify base URL configuration
- Review browser version compatibility

**Docker build fails:**
- Ensure Docker daemon is running
- Check Dockerfile for syntax
- Verify multi-stage build stages

**Husky hooks not running:**
- Reinstall dependencies: `npm install`
- Reinitialize hooks: `npm run prepare`
- Check `.git/hooks` permissions

**Reports not generating:**
- Install allure-commandline: `npm install -g allure-commandline`
- Check write permissions for allure-results/
- Verify test files produce results

## 📞 Support & Resources

- 🎓 [Playwright Docs](https://playwright.dev)
- 🔧 [Allure Reports](https://docs.qameta.io/allure/)
- 🚀 [GitHub Actions](https://docs.github.com/actions)
- 🐳 [Docker Documentation](https://docs.docker.com)
- 💬 [Community Issues](https://github.com/Manoharjangid1818/QA360-SaaS-Platform/issues)

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

## 👥 Authors

- **Manohar Jangid** - QA Automation Architect
- Community Contributors

## 🙏 Acknowledgments

- Playwright team for exceptional tooling
- Allure team for beautiful reporting
- Community for feedback and improvements

---

**Last Updated**: May 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅

