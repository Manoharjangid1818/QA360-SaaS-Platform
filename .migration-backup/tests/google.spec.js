import { test, expect } from '@playwright/test'

/**
 * Test Suite: Google Search Tests
 * Tags: @smoke, @regression, @ui
 * 
 * Validates Google Search page loads and title verification
 */

test("@smoke @regression @ui - Verify Google Application Title", async function({page}){
    await page.goto("https://google.com/")

    const url = await page.url()
    console.log("URL is: " + url)

    const title = await page.title()
    console.log("Title is: " + title)

    await expect(page).toHaveTitle("Google")
    
    // Visual regression baseline
    await expect(page).toHaveScreenshot('google-homepage.png')
})