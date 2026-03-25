const { test, expect } = require("@playwright/test");

test("Dynamic Website Test", async ({ page }) => {
  const url = process.env.TEST_URL || "https://example.com";

  console.log("Testing URL:", url);

  await page.goto(url, { timeout: 30000 });

  await expect(page).toHaveTitle(/.*/);

  await page.screenshot({ path: "screenshots/result.png" });

  console.log("Test Passed for:", url);
});