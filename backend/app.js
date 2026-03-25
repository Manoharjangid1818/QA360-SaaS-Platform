const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { chromium } = require("playwright");

const app = express();

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

app.get("/", (_req, res) => {
  res.send("QA360 backend is running.");
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
  const errors = [];
  const startTime = Date.now();
  let browser;
  let context;
  let page;

  try {
    logs.push("Launching Chromium in headless mode...");
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(30000);

    page.on("console", (msg) => {
      const entry = `[console:${msg.type()}] ${msg.text()}`;
      logs.push(entry);
      if (msg.type() === "error") {
        errors.push(entry);
      }
    });

    page.on("pageerror", (err) => {
      errors.push(`[pageerror] ${err.message}`);
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
    const screenshotBuffer = await page.screenshot({ fullPage: true });
    const screenshotBase64 = screenshotBuffer.toString("base64");

    const performance = {
      totalMs: Date.now() - startTime,
      navigationMs,
      responseStatus: statusCode,
      testedAt: new Date().toISOString(),
    };

    const success = errors.length === 0;
    const output = logs.join("\n");
    const testedUrl = targetUrl;
    const time = typeof performance.totalMs === "number" ? `${performance.totalMs}ms` : "?";
    const status = success ? "success" : "failed";

    return res.status(success ? 200 : 422).json({
      success,
      // Backward-compatible response fields for older frontend bundles.
      status,
      message: summary,
      testedUrl,
      time,
      output,
      logs,
      errors,
      performance,
      summary: success
        ? "Website test completed successfully."
        : "Website test completed with issues.",
      data: {
        url: targetUrl,
        title,
        screenshotBase64,
      },
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

module.exports = app;
