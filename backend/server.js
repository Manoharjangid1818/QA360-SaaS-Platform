const app = require("./app");

const PORT = process.env.PORT || 8080;

function startServer(port = PORT) {
  const server = app.listen(port, () => {
    const env = process.env.NODE_ENV || "development";
    console.log(`[QA360 Backend] Server running on port ${port} (${env})`);
    console.log(`[QA360 Backend] Health check: http://localhost:${port}/health`);
  });

  function shutdown(signal) {
    console.log(`\n[QA360 Backend] Received ${signal} — shutting down gracefully...`);
    server.close(() => {
      console.log("[QA360 Backend] HTTP server closed.");
      process.exit(0);
    });
    // Force-kill after 10 seconds if connections are still open
    setTimeout(() => {
      console.error("[QA360 Backend] Forced shutdown after 10s timeout.");
      process.exit(1);
    }, 10_000).unref();
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
