# GitHub MCP Workflow Integration

You are an expert GitHub and DevOps automation engineer working with MCP (Model Context Protocol) integrations.

## Context
- Platform: GitHub Enterprise
- Framework: Playwright automation with full CI/CD
- Integration: Cursor MCP with GitHub APIs
- Objective: Enable AI-assisted GitHub workflow optimization

## GitHub-aware AI Prompts

### 1. Repository Analysis
```
@mcp-tool github-list-actions path:.github/workflows/
@mcp-tool github-read-file path:.github/workflows/playwright.yml

Analyze the repository structure and provide:
1. Current workflow efficiency
2. Test execution patterns
3. Artifact management strategy
4. Deployment pipeline review
5. Security and compliance gaps
```

### 2. Workflow Optimization
```
Review GitHub Actions workflows in .github/workflows/ and suggest:
1. Parallel job optimization opportunities
2. Caching strategies for faster runs
3. Container reuse for consistency
4. Artifact cleanup policies
5. Cost optimization recommendations
```

### 3. CI/CD Pipeline Review
```
Analyze Jenkinsfile and GitHub workflows to:
1. Identify bottlenecks in execution
2. Suggest stage reordering for speed
3. Implement better error handling
4. Add automated rollback procedures
5. Enhance monitoring and alerting
```

### 4. Pull Request Analysis
```
@mcp-tool github-get-pr path:#<PR_NUMBER>

Analyze PR for:
1. Code quality issues
2. Test coverage gaps
3. Framework compliance
4. Breaking changes detection
5. Documentation completeness
```

### 5. Commit Message Generation
```
@mcp-tool git-log-recent count:5

Generate professional commit messages for:
1. Framework enhancements
2. Bug fixes
3. Test additions
4. CI/CD improvements
5. Documentation updates

Format: type(scope): description
Types: feat|fix|test|docs|refactor|chore|ci
```

### 6. Framework Architecture Review
```
Analyze Playwright framework codebase and provide:
1. Architecture assessment
2. Scalability evaluation
3. Maintainability improvements
4. Best practices compliance
5. Technical debt identification
```

## MCP Tool Usage

### Reading GitHub Workflows
```
@mcp-tool read-directory path:.github/workflows/
@mcp-tool read-file path:.github/workflows/playwright.yml
@mcp-tool read-file path:Jenkinsfile
```

### Accessing Repository Data
```
@mcp-tool github-list-branches
@mcp-tool github-get-pr path:#123
@mcp-tool github-list-issues status:open
```

### Creating and Updating Workflows
```
@mcp-tool github-create-file path:.github/workflows/new-workflow.yml
@mcp-tool github-update-file path:.github/workflows/playwright.yml
```

### Analyzing Code
```
@mcp-tool read-file path:tests/**.spec.ts
@mcp-tool read-file path:lib/**.ts
@mcp-tool read-file path:playwright.config.ts
```

## Workflow Examples

### Automated Workflow Generation
```
Generate a GitHub Actions workflow for:
- Trigger: On push to develop
- Jobs:
  1. Lint framework code
  2. Run smoke tests
  3. Run regression tests in parallel
  4. Generate Allure reports
  5. Post results to Slack
  6. Create release artifacts
```

### Performance Analysis
```
Compare workflow execution times across 10 recent runs:
1. Identify slowest stages
2. Calculate average duration
3. Suggest optimization order
4. Estimate time savings
5. Create optimization plan
```

### Quality Gate Implementation
```
Design quality gates for:
1. Test coverage threshold (>80%)
2. Test pass rate requirement (100%)
3. Performance metrics (< 5 min execution)
4. Code linting (zero failures)
5. Security scanning (no critical vulnerabilities)
```

## Advanced Automation

### GitOps Integration
```
Implement GitOps workflow:
1. Configuration as code
2. Automated deployment on PR merge
3. Rollback procedures
4. Environment promotion pipeline
5. Audit logging
```

### Intelligent Notifications
```
Smart notification system:
- Alert only on critical failures
- Group similar failures
- Include relevant logs
- Link to related PRs
- Suggest fixes
```

### Continuous Improvement
```
Metrics tracking and optimization:
1. Track workflow execution time trends
2. Monitor test pass rates
3. Measure cycle time reduction
4. Identify recurring failures
5. Auto-suggest improvements
```

## Security Considerations
- ⚠️  Protect secrets in GitHub Actions
- ⚠️  Use branch protection rules
- ⚠️  Implement approval workflows
- ⚠️  Audit workflow changes
- ⚠️  Rotate credentials regularly

## Integration Points
1. GitHub API for workflow management
2. GitHub Packages for artifact storage
3. GitHub Deployments for CD
4. GitHub Environments for multi-stage deployment
5. GitHub Projects for workflow tracking
