const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');
const { chromium } = require('playwright');
const { saveTestResult } = require('../utils/saveTestResult.js');

let cronJob = null;
let currentFrequency = 'disabled';
let isRunning = false;

const SITES_PATH = path.join(__dirname, '../../config/sites.json');
const TEST_RESULTS_DIR = path.join(__dirname, '../test-results');

const cronPatterns = {
  '5min': '*/5 * * * *',
  '15min': '*/15 * * * *',
  'hourly': '0 * * * *',
  'daily': '0 0 * * *'
};

async function loadSites() {
  try {
    const data = await fs.readFile(SITES_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load sites:', error.message);
    return [];
  }
}

async function runSingleTest(site) {
  const logs = [];
  const errors = [];
  const startTime = Date.now();

  let browser, context, page;
  try {
    logs.push(`Testing ${site.url}`);
    const launchOpts = { headless: true };
    if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
      launchOpts.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
    }
    browser = await chromium.launch(launchOpts);
    context = await browser.newContext();
    page = await context.newPage();

    const response = await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const statusCode = response?.status() ?? 'unknown';
    const title = await page.title();

    const screenshot = await page.screenshot();
    
    const performance = {
      totalMs: Date.now() - startTime,
      testedAt: new Date().toISOString()
    };

    const success = statusCode < 400 && title.trim();
    
    const result = {
      site: site.name,
      url: site.url,
      success,
      title,
      statusCode,
      performance,
      logs,
      errors: errors.length ? errors : null,
      screenshot: screenshot.toString('base64')
    };

    await saveTestResult(result);
    logs.push(`✓ ${site.name} completed in ${performance.totalMs}ms`);
    return result;
  } catch (error) {
    errors.push(error.message);
    console.error(`Test failed for ${site.url}:`, error.message);
    return { site: site.name, success: false, errors };
  } finally {
    await page?.close();
    await context?.close();
    await browser?.close();
  }
}

async function runAllSites() {
  if (isRunning) {
    console.log('Scheduler already running...');
    return;
  }
  
  isRunning = true;
  console.log('⏱️ Running scheduled tests for all sites...');
  
  try {
    const sites = await loadSites();
    const results = [];
    
    for (const site of sites) {
      const result = await runSingleTest(site);
      results.push(result);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(`✅ Scheduled tests completed: ${results.filter(r => r.success).length}/${sites.length} passed`);
  } catch (error) {
    console.error('Scheduler error:', error);
  } finally {
    isRunning = false;
  }
}

function startScheduler(frequency) {
  if (!cronPatterns[frequency]) {
    throw new Error(`Invalid frequency: ${frequency}`);
  }
  
  stopScheduler();
  
  cronJob = cron.schedule(cronPatterns[frequency], runAllSites);
  currentFrequency = frequency;
  
  console.log(`Scheduler started with ${frequency} frequency`);
  const nextRun = cronJob.getNextRun ? cronJob.getNextRun().toISOString() : null;
  return { success: true, frequency, nextRun };
}

function stopScheduler() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
  }
  const prevFreq = currentFrequency;
  currentFrequency = 'disabled';
  console.log(`Scheduler stopped (was ${prevFreq})`);
  return { success: true, frequency: 'disabled' };
}

function setFrequency(frequency) {
  currentFrequency = frequency;
  if (cronJob) {
    // Restart with new pattern
    const result = startScheduler(frequency);
    return result;
  }
  return { success: true, frequency, message: 'Scheduler not running' };
}

function getStatus() {
  let nextRun = null;
  let running = false;
  if (cronJob) {
    try {
      nextRun = cronJob.getNextRun ? cronJob.getNextRun().toISOString() : null;
    } catch (_) {}
    const status = cronJob.getStatus ? cronJob.getStatus() : null;
    running = status === 'scheduled' || status === 'running';
  }
  return {
    running,
    frequency: currentFrequency,
    nextRun,
    sitesPath: SITES_PATH
  };
}

module.exports = {
  startScheduler,
  stopScheduler,
  setFrequency,
  getStatus,
  runAllSites,
  cronJob // for external access if needed
};

