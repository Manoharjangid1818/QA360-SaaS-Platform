import { test, expect } from '@playwright/test';
import sites from '../config/sites.json';

for (const site of sites) {
  test(`${site.name} - Full Flow Test`, async ({ page }) => {
    await page.goto(site.url);
    await expect(page).toHaveTitle(new RegExp(site.expectedTitle));
  });
}