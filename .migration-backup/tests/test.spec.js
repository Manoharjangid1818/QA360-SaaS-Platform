import { test, expect } from '@playwright/test';
import sites from '../config/sites.json';

/**
 * Test Suite: Multi-Site Full Flow Tests
 * Tags: @regression, @sanity, @ui
 * 
 * This suite validates the complete user flow across multiple configured sites.
 * Tests ensure page navigation, title validation, and basic UI rendering.
 */

for (const site of sites) {
  test(`@regression @sanity @ui - ${site.name} - Full Flow Test`, async ({ page }) => {
    await page.goto(site.url);
    await expect(page).toHaveTitle(new RegExp(site.expectedTitle));
    
    // Capture visual baseline
    await expect(page).toHaveScreenshot(`${site.name}-homepage.png`);
  });
}