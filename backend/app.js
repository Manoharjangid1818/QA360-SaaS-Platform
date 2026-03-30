const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { chromium } = require("playwright");
const PDFDocument = require('pdfkit');
const scheduler = require('./services/scheduler.js');
const { getLatestResultForSite } = require('./utils/saveTestResult.js');
const fs = require('fs').promises;
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

function classifyError(text) {
  const t = text.toLowerCase();
  // Critical
  if (t.includes('failed') || t.includes('error') || t.includes('exception') || 
      t.includes('net::err_') || (t.includes('fetch') && t.includes('fail')) ||
      t.includes('uncaught') || t.includes('runtimeerror')) {
    return { message: text, type: 'critical' };
  }
  // Warning
  if (t.includes('warning') || t.includes('deprecated') || t.includes('deprecation') ||
      t.includes('slow') || t.includes('perf') || t.includes('[violation]') ||
      t.includes('api removed') || t.includes('deprecated api')) {
    return { message: text, type: 'warning' };
  }
  // Ignore
  if (t.includes('webgl') || t.includes('gpu') || t.includes('gl driver') ||
      t.includes('err_name_not_resolved') || t.includes('summary is not defined') ||
      t.includes('gpu stall') || t.includes('readpixels')) {
    return { message: text, type: 'ignore' };
  }
  return { message: text, type: 'warning' };
}

const app = express();

app.set('trust proxy', 1);

const REPORTS_DIR = path.join(__dirname, '../../reports');

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
  : "*";

app.use(
  cors({
    origin: corsOrigins,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(express.static('../dashboard/build'));

app.get("/", (_req, res) => {
  res.send("QA360 backend is running at / but frontend served from /");
});


app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

async function runTestHandler(req, res) {
  const inputUrl = (req.body?.url || "").trim();

  if (!inputUrl) {
    return res.status(400).json({
      success: false,
      status: "failed",
      message: "URL is required.",
      testedUrl: "",
      time: "?",
      output: "",
      logs: [],
      errors: ["URL is required."],
      performance: {},
    });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(inputUrl);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Invalid protocol");
    }
  } catch {
    return res.status(400).json({
      success: false,
      status: "failed",
      message: "Please provide a valid http/https URL.",
      testedUrl: inputUrl,
      time: "?",
      output: "",
      logs: [],
      errors: ["Please provide a valid http/https URL."],
      performance: {},
    });
  }

  const logs = [];
  const warnings = [];
  const classifiedErrors = [];
  const errors = []; // backward compat
  const startTime = Date.now();
  let browser;
  let context;
  let page;

  try {
    logs.push("Launching Chromium in headless mode...");
    browser = await chromium.launch({ 
      headless: true,
      ignoreHTTPSErrors: true 
    });
    context = await browser.newContext({
      bypassCSP: true
    });
    page = await context.newPage();
    page.setDefaultTimeout(30000);

    page.on("console", (msg) => {
      const text = msg.text();
      const entry = `[console:${msg.type()}] ${text}`;
      logs.push(entry);
      
      if (msg.type() === "error") {
        const classified = classifyError(text);
        classifiedErrors.push(classified);
        if (classified.type !== 'ignore') {
          const entryClassified = `${entry} [${classified.type.toUpperCase()}]`;
          if (classified.type === 'critical') {
            errors.push(entryClassified);
          } else {
            warnings.push(entryClassified);
          }
        }
      }
    });

    page.on("pageerror", (err) => {
      const text = err.message;
      const classified = classifyError(text);
      classifiedErrors.push(classified);
      if (classified.type === 'critical') {
        errors.push(`[pageerror] ${text} [CRITICAL]`);
      } else if (classified.type === 'warning') {
        warnings.push(`[pageerror] ${text} [WARNING]`);
      }
    });

    const targetUrl = parsedUrl.toString();
    logs.push(`Navigating to ${targetUrl}`);
    const navigationStart = Date.now();
    const response = await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    const navigationMs = Date.now() - navigationStart;

    const statusCode = response?.status() ?? null;
    logs.push(`Navigation completed in ${navigationMs}ms`);
    if (statusCode) {
      logs.push(`Response status: ${statusCode}`);
    } else {
      logs.push("No response status available.");
    }

    const title = (await page.title()).trim();
    if (!title) {
      errors.push("Page title is empty.");
    } else {
      logs.push(`Page title: ${title}`);
    }

    logs.push("Capturing screenshot...");
    await page.setViewportSize({ width: 1280, height: 720 });
    const screenshotBuffer = await page.screenshot({ fullPage: false });
    const screenshotBase64 = screenshotBuffer.toString("base64");

    // Visual regression
    const siteKey = targetUrl.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '_');
    const baselinesDir = path.join(__dirname, '../../test-results/baselines');
    const currentDir = path.join(__dirname, '../../test-results/current');
    const baselinePath = path.join(baselinesDir, `${siteKey}.png`);
    const currentPath = path.join(currentDir, `${siteKey}.png`);
    const diffPath = path.join(currentDir, `${siteKey}_diff.png`);

    await fs.mkdir(baselinesDir, { recursive: true });
    await fs.mkdir(currentDir, { recursive: true });

    const currentPNG = PNG.sync.read(screenshotBuffer);
    let visual = { changed: false, diffPercent: 0 };

    try {
      const baselineBuffer = await fs.readFile(baselinePath);
      const baselinePNG = PNG.sync.read(baselineBuffer);
      const diffPNG = new PNG({ width: baselinePNG.width, height: baselinePNG.height });
      const numDiffPixels = pixelmatch(baselinePNG.data, currentPNG.data, diffPNG.data, baselinePNG.width, baselinePNG.height, { threshold: 0.1 });
      const totalPixels = baselinePNG.width * baselinePNG.height;
      visual.diffPercent = (numDiffPixels / totalPixels) * 100;
      visual.changed = visual.diffPercent > 0.5;

      // Save diff
      await fs.writeFile(diffPath, PNG.sync.write(diffPNG));
      logs.push(`Visual diff: ${visual.diffPercent.toFixed(2)}% (${visual.changed ? 'CHANGED' : 'OK'})`);
    } catch (e) {
      // No baseline, create it
      await fs.writeFile(baselinePath, screenshotBuffer);
      logs.push('No baseline found, created new baseline');
    }

    // Save current
    await fs.writeFile(currentPath, screenshotBuffer);

    // Base64 for response
    const baselineBuffer = await fs.readFile(baselinePath);
    visual.baselineBase64 = baselineBuffer.toString('base64');
    visual.currentBase64 = screenshotBase64;
    if (visual.changed) {
      const diffBuffer = await fs.readFile(diffPath);
      visual.diffBase64 = diffBuffer.toString('base64');
    }

    const performance = {
      totalMs: Date.now() - startTime,
      navigationMs,
      responseStatus: statusCode,
      testedAt: new Date().toISOString(),
    };

    const hasTitle = title && title.length > 0;
    const isHttpSuccess = statusCode === null || statusCode < 400;
    const success = isHttpSuccess && hasTitle;
    const output = logs.join("\n");
    const testedUrl = targetUrl;
    const time = typeof performance.totalMs === "number" ? `${performance.totalMs}ms` : "?";
    const status = success ? "passed" : "failed";

    const criticalCount = classifiedErrors.filter(e => e.type === 'critical').length;
    const warningCount = classifiedErrors.filter(e => e.type === 'warning').length;
    const ignoreCount = classifiedErrors.length - criticalCount - warningCount;
    
    const dynamicSummary = success 
      ? `Website test passed. Errors: ${criticalCount} critical, ${warningCount} warnings, ${ignoreCount} ignored.`
      : `Test issues. Errors: ${criticalCount} critical, ${warningCount} warnings.`;

    return res.status(success ? 200 : 422).json({
      success,
      status,
      message: dynamicSummary,
      testedUrl,
      time,
      output,
      logs,
      errors, // compat
      warnings,
      performance,
      summary: dynamicSummary,
      data: {
        url: targetUrl,
        title,
        screenshotBase64,
        visual
      },
      classifiedErrors,
      errorStats: { critical: criticalCount, warning: warningCount, ignore: ignoreCount },
      visual  // top level for easy UI access
    });
  } catch (error) {
    errors.push(error.message || "Unexpected error during test execution.");

    return res.status(500).json({
      success: false,
      status: "failed",
      message: "Website test failed due to server error.",
      testedUrl: req.body?.url?.trim?.() || "",
      time: "?",
      output: logs.join("\n"),
      logs,
      errors,
      performance: {
        totalMs: Date.now() - startTime,
        testedAt: new Date().toISOString(),
      },
      summary: "Website test failed due to server error.",
    });
  } finally {
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}

// Primary endpoint (new)
app.post("/api/test", runTestHandler);

// Backward-compatible alias (older frontend may call this)
app.post("/run-test", runTestHandler);

app.post('/test/lighthouse', express.json(), async (req, res) => {
  const inputUrl = (req.body?.url || "").trim();
  if (!inputUrl) {
    return res.status(400).json({ error: "URL is required." });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(inputUrl);
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  const ChromeLauncher = require('chrome-launcher');
  const lighthouse = require('lighthouse');
  const chromeFlags = ['--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'];

  let chrome;
  try {
    chrome = await ChromeLauncher.launch({ chromeFlags });
    const options = { logLevel: 'info', output: 'json', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] };
    const runnerResult = await lighthouse(parsedUrl.href, options, undefined, chrome.port);
    
    const categories = runnerResult.lhr.categories;
    const scores = {
      performance: Math.round(categories.performance?.score * 100 || 0),
      seo: Math.round(categories.seo?.score * 100 || 0),
      accessibility: Math.round(categories.accessibility?.score * 100 || 0),
      'best-practices': Math.round(categories['best-practices']?.score * 100 || 0)
    };

    await chrome.kill();
    res.json({ success: true, url: inputUrl, scores });
  } catch (error) {
    if (chrome) await chrome.kill().catch(() => {});
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== SCHEDULER APIs =====
app.post('/scheduler/start', express.json(), (req, res) => {
  try {
    const { frequency } = req.body;
    const result = scheduler.startScheduler(frequency);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/scheduler/stop', express.json(), (req, res) => {
  const result = scheduler.stopScheduler();
  res.json(result);
});

app.post('/scheduler/set-frequency', express.json(), (req, res) => {
  try {
    const { frequency } = req.body;
    const result = scheduler.setFrequency(frequency);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/scheduler/status', (req, res) => {
  const status = scheduler.getStatus();
  res.json(status);
});

// ===== PDF REPORT API =====
app.get('/report/pdf', async (req, res) => {
  try {
    const { site } = req.query;
    if (!site) {
      return res.status(400).json({ error: 'site parameter required' });
    }

    const result = await getLatestResultForSite(site);
    if (!result) {
      return res.status(404).json({ error: `No test results found for site: ${site}` });
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `report_${site.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.pdf`;
    const pdfPath = path.join(REPORTS_DIR, filename);

    // Ensure reports dir
    await fs.promises.mkdir(REPORTS_DIR, { recursive: true });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    doc.pipe(res);
    
    // Header
    doc.fontSize(20).text('QA360 Test Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Site: ${result.site} (${result.url})`);
    doc.text(`Tested: ${result.performance.testedAt}`);
    doc.text(`Status: ${result.success ? 'PASSED' : 'FAILED'}`);
    doc.moveDown();

    // Summary
    doc.fontSize(12).text('Summary:', { continued: true }).text(result.success ? 'Test passed' : 'Test failed');
    if (result.statusCode) doc.text(`HTTP: ${result.statusCode}`);
    doc.moveDown();

    // Errors if any
    if (result.errors && result.errors.length > 0) {
      doc.text('Errors:', { underline: true });
      result.errors.forEach((error, i) => {
        doc.text(`${i+1}. ${error}`);
      });
      doc.moveDown();
    }

    // Performance
    doc.text('Performance:', { underline: true });
    doc.text(`Total time: ${result.performance.totalMs}ms`);
    
    // Screenshot if available
    if (result.screenshot) {
      doc.image(Buffer.from(result.screenshot, 'base64'), {
        width: 500,
        align: 'center'
      });
    }

    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

module.exports = app;

