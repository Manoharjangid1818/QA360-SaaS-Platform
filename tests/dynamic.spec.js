import { test, expect } from '@playwright/test';
import sites from '../config/sites.json';

for (const site of sites) {
    test(`${site.name} test`, async ({ page }) => {
        try {
            await page.goto(site.url);
            await expect(page).toHaveTitle(new RegExp(site.expectedTitle));
        } catch (error) {
            await page.screenshot({ path: `reports/${site.name}.png` });
            throw error;
        }
    });
}