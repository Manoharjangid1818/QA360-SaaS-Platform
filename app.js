const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { exec } = require("child_process");

const app = express();

app.use(express.json());
app.use(cors({ origin: "*" }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
});
app.use(limiter);

app.post("/run-test", (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ message: "URL is required" });
  }

  console.log("Running Playwright test for:", url);

  const command =
    process.platform === "win32"
      ? set TEST_URL= && npx playwright test tests/dynamic.spec.js
      : TEST_URL= npx playwright test tests/dynamic.spec.js;

  exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
    if (error) {
      return res.json({
        status: "fail",
        message: "Test failed",
        error: stderr,
      });
    }

    return res.json({
      status: "success",
      message: "Test executed successfully",
      testedUrl: url,
      output: stdout,
    });
  });
});

module.exports = app;
