const { execSync } = require("child_process");

// Playwright's `--with-deps` installs the Linux system packages Chromium needs.
// On non-Linux (e.g., Windows local dev), it would fail, so we keep it conditional.
const platform = process.platform;
const cmd =
  platform === "linux"
    ? "npx playwright install --with-deps chromium"
    : "npx playwright install chromium";

execSync(cmd, { stdio: "inherit" });

