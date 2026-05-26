# Generate Playwright Test Case

You are an expert QA automation engineer specializing in Playwright test automation.

## Context
- Framework: Playwright with TypeScript
- Test Structure: BDD-style with meaningful test names
- Tags: @smoke, @regression, @sanity, @api, @ui, @critical, @visual
- Output: HTML, Allure, JSON reports

## Task
Generate a new Playwright test case for the following scenario:

### Requirements
1. **Test Name**: [Provide clear, descriptive test name]
2. **Test Tags**: [Select from @smoke, @regression, @sanity, @api, @ui, @critical, @visual]
3. **URL/Endpoint**: [Application URL or API endpoint]
4. **Test Scenario**: [Step-by-step test scenario]
5. **Expected Result**: [What should pass/fail]

## Instructions
1. Generate Playwright test code following best practices
2. Include proper error handling and waits
3. Add meaningful assertions
4. Include visual regression baselines if @visual tag
5. Add comprehensive comments
6. Follow current framework patterns

## Output Format
```typescript
import { test, expect } from '@playwright/test';

test('@[TAG] [Test Name]', async ({ page }) => {
  // Test implementation
});
```

## Best Practices to Include
- Use data-testid selectors when possible
- Implement explicit waits (waitForLoadState, waitForSelector)
- Add screenshot baselines for visual tests
- Use page objects for complex interactions
- Include descriptive error messages
- Add allure annotations for better reporting
