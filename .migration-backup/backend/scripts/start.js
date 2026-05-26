/* eslint-disable no-console */

const { spawn } = require("child_process");
const platform = process.platform;

const { startServer } = require("../server");

// Start the server immediately so Railway healthcheck can pass.
startServer();

// Install Playwright system deps in the background on Linux.
// If it fails, `/health` can still work; `/api/test` may fail until deps are present.
if (platform === "linux") {
  console.log(
    "backend/start.js: starting async Playwright install --with-deps chromium..."
  );
  const child = spawn(
    "npx",
    ["playwright", "install", "--with-deps", "chromium"],
    { stdio: "inherit", shell: false }
  );

  child.on("error", (err) => {
    console.error("backend/start.js: playwright deps install failed:", err);
  });
}

