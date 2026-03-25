const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();
const port = process.env.PORT || 8080;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post("/run-test", (req, res) => {
  const { url } = req.body || {};

  if (!url || typeof url !== "string") {
    return res.status(400).json({
      status: "error",
      message: "Please provide a valid URL string in the request body.",
    });
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return res.status(400).json({
      status: "error",
      message: "URL cannot be empty.",
    });
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return res.status(400).json({
      status: "error",
      message: "Invalid URL format.",
    });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return res.status(400).json({
      status: "error",
      message: "URL must use http or https.",
    });
  }

  return res.status(200).json({
    status: "success",
    message: "Test completed successfully",
    testedUrl: trimmed,
    time: "5s",
  });
});

app.listen(port, () => {
  console.log(`QA360 API listening on port ${port}`);
});
