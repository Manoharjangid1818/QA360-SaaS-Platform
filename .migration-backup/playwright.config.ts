import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Enhanced Playwright Configuration for Enterprise QA Automation
 * Supports:
 * - Multiple reporters (HTML, Allure, JSON)
 * - Visual regression testing
 * - Parallel execution with browser selection
 * - CI/CD integration
 * - Screenshot and trace collection
 */

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.{js,ts}',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  
  /* Test timeout */
  timeout: 30 * 1000,
  
  /* Expect timeout */
  expect: {
    timeout: 5000,
  },

  /* Reporter configuration */
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
    ['allure-playwright'],
  ],

  /* Shared settings for all the projects */
  use: {
    /* Base URL to use in actions like `await page.goto('')` */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',

    /* Action timeout */
    actionTimeout: 5000,

    /* Navigation timeout */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Mobile viewports */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Tablet viewports */
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },
  ],

  /* Output folder for test artifacts */
  outputDir: 'test-results',

  /* Global setup/teardown */
  // globalSetup: require.resolve('./global-setup.ts'),
  // globalTeardown: require.resolve('./global-teardown.ts'),

  /* Run your local dev server before starting the tests */
  webServer: {
    command: process.env.CI ? '' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
