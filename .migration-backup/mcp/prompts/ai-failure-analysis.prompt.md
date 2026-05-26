# AI Failure Analysis Workflow

You are an expert AI-assisted QA automation engineer working with Cursor MCP integrations.

## Context
- Tool: Cursor AI with MCP (Model Context Protocol) support
- Framework: Playwright automation with enterprise features
- Objective: Enable AI-assisted failure analysis and test debugging

## Workflow Steps

### Step 1: Gather Test Artifacts
```bash
# Files to analyze:
- playwright-report/index.html (test results and failures)
- allure-results/ (detailed failure information)
- test-results/junit.xml (test metrics)
- test-results/results.json (raw test data)
- playwright-report/trace.zip (execution traces for failed tests)
```

### Step 2: Request AI Analysis
Use these prompts in Cursor:

**Basic Analysis**:
```
Analyze the latest Playwright test failures in playwright-report/index.html
and provide:
1. List of failed tests with error messages
2. Root cause for each failure
3. Stable locator recommendations
4. Code fixes for the most critical failures
```

**Detailed Analysis**:
```
Review allure-results/ directory and identify:
1. Patterns in test failures
2. Flaky tests (inconsistent failures)
3. Tests affected by same root cause
4. Recommended test stabilization order
5. Infrastructure or configuration issues
```

**Locator Analysis**:
```
Examine failed selectors in playwright-report/
and suggest improvements:
1. More stable locator patterns
2. Data-testid recommendations
3. Role-based selector improvements
4. CSS selector optimization
```

### Step 3: Trace Analysis
```
Analyze trace files in test-results/ to:
1. Identify timing-related failures
2. Network request issues
3. Element state problems
4. Navigation timing conflicts
```

### Step 4: Generate Fixes
```
Based on analyzed failures, generate:
1. Updated test code with fixes
2. New helper functions for stability
3. Configuration updates
4. Test data adjustments
```

### Step 5: Validation
```
After applying fixes:
1. Re-run affected tests
2. Compare results with baseline
3. Verify no new failures introduced
4. Document changes in commit message
```

## MCP Integration Points

### Reading Test Reports
```
@mcp-tool read-directory path:playwright-report/
@mcp-tool read-file path:allure-results/categories.json
```

### Analyzing Traces
```
@mcp-tool read-file path:test-results/trace.zip
(Extract and analyze trace events)
```

### Suggesting Fixes
```
@mcp-tool generate-code-fixes based-on:test-failures
@mcp-tool suggest-refactoring for:brittle-selectors
```

## Advanced Workflows

### Automated Root Cause Analysis
```
1. Parse all failed test reports
2. Group failures by error type
3. Identify common patterns
4. Suggest systemic fixes
5. Prioritize by impact
```

### Flaky Test Detection
```
1. Analyze test execution history
2. Identify inconsistent failures
3. Suggest stabilization strategies
4. Propose test refactoring
5. Monitor for regression
```

### Cross-browser Issue Analysis
```
1. Compare failures across browsers
2. Identify browser-specific issues
3. Suggest compatible solutions
4. Update browser support matrix
```

## Output Expectations

From AI analysis, expect:
- ✅ Specific root causes with evidence
- ✅ Actionable fix recommendations
- ✅ Code examples with explanation
- ✅ Impact assessment (scope of fix)
- ✅ Priority ranking
- ✅ Prevention strategies

## Security and Best Practices
- ⚠️  Don't expose credentials in analyzed files
- ⚠️  Sanitize URLs in reports
- ⚠️  Validate AI suggestions before applying
- ⚠️  Maintain audit trail of AI-generated fixes
