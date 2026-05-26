const { execSync } = require("child_process");

// Install only the Playwright browser binaries here.
// System libraries are installed at runtime in `start.sh` (Railway runtime container),
// which avoids build-time failures from missing apt/OS tooling.
const cmd = "npx playwright install chromium";

execSync(cmd, { stdio: "inherit" });

