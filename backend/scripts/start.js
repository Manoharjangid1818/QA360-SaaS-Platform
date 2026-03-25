/* eslint-disable no-console */

const { execSync } = require("child_process");

const platform = process.platform;

// On Railway (Linux containers), Chromium often needs extra system libraries.
// Installing them here makes startup reliable even if `start.sh` isn't executed.
if (platform === "linux") {
  console.log("backend/start.js: installing Playwright chromium deps (with-deps)...");
  // This will install required OS packages inside the build/runtime image.
  execSync("npx playwright install --with-deps chromium", { stdio: "inherit" });
}

// Start the Express server after dependencies are ready.
require("../server");

