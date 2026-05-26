const { test, expect } = require('@playwright/test');

/**
 * Test Suite: Dynamic Website Testing
 * Tags: @smoke, @sanity, @ui
 * 
 * This suite validates dynamic website loading and basic functionality.
 * Tests use environment variables for flexible URL configuration.
 */

test('@smoke @sanity @ui - Dynamic Website Test', async ({ page }) => {
  const url = process.env.TEST_URL || 'https://example.com';

  console.log('Testing URL:', url);

  await page.goto(url, { timeout: 30000 });

  await expect(page).toHaveTitle(/.*/);

  console.log('Test Passed for:', url);
});

/**
 * @critical - API Endpoint Verification
 * Validates that critical endpoints are accessible
 */
test('@critical @api - API Endpoint Health Check', async ({ request }) => {
  const url = process.env.API_URL || 'https://api.example.com';
  
  const response = await request.get(`${url}/health`);
  expect(response.status()).toBeLessThan(400);
  
  console.log('✅ API health check passed');
});

/**
 * @visual - Visual Regression Baseline
 * Captures screenshots for visual regression testing
 */
test('@visual - Homepage Visual Baseline', async ({ page }) => {
  const url = process.env.TEST_URL || 'https://example.com';
  
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  
  await expect(page).toHaveScreenshot('homepage-baseline.png');
  
  console.log('📸 Visual baseline captured');
});
