import { Router } from "express";
import { generateId, now } from "../lib/helpers.js";

const router = Router();

interface Schedule {
  id: string;
  name: string;
  description?: string;
  project: string;
  environment: string;
  browser: string;
  testSuite: string;
  frequency: string;
  cronExpression: string;
  cronHuman: string;
  status: "active" | "paused" | "disabled";
  parallelWorkers: number;
  retryOnFailure: boolean;
  maxRetries: number;
  timeoutMinutes: number;
  notifications: Record<string, unknown>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  totalRuns: number;
  successRuns: number;
  failedRuns: number;
}

let store: Schedule[] = [
  { id: "s-1", name: "Nightly Regression", description: "Full regression suite", project: "QA360 Web", environment: "staging", browser: "chromium", testSuite: "regression", frequency: "daily", cronExpression: "0 0 * * *", cronHuman: "Every day at 00:00", status: "active", parallelWorkers: 2, retryOnFailure: true, maxRetries: 2, timeoutMinutes: 60, notifications: {}, tags: ["nightly"], createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString(), nextRunAt: new Date(Date.now() + 3 * 3600000).toISOString(), lastRunAt: new Date(Date.now() - 21 * 3600000).toISOString(), lastRunStatus: "completed", totalRuns: 14, successRuns: 12, failedRuns: 2 },
];

router.get("/schedules", (_req, res) => {
  const active = store.filter((s) => s.status === "active").length;
  res.json({
    schedules: store,
    stats: { total: store.length, active, paused: store.filter((s) => s.status === "paused").length },
  });
});

router.post("/schedules", (req, res) => {
  const body = req.body as Partial<Schedule>;
  if (!body.name?.trim() || !body.cronExpression) {
    res.status(400).json({ error: "name and cronExpression are required." });
    return;
  }
  const item: Schedule = {
    id: generateId(),
    name: body.name.trim(),
    description: body.description,
    project: body.project ?? "Default",
    environment: body.environment ?? "staging",
    browser: body.browser ?? "chromium",
    testSuite: body.testSuite ?? "smoke",
    frequency: body.frequency ?? "custom",
    cronExpression: body.cronExpression,
    cronHuman: body.cronHuman ?? body.cronExpression,
    status: body.status ?? "active",
    parallelWorkers: body.parallelWorkers ?? 1,
    retryOnFailure: body.retryOnFailure ?? false,
    maxRetries: body.maxRetries ?? 1,
    timeoutMinutes: body.timeoutMinutes ?? 30,
    notifications: body.notifications ?? {},
    tags: body.tags ?? [],
    createdAt: now(),
    updatedAt: now(),
    nextRunAt: new Date(Date.now() + 3600000).toISOString(),
    lastRunAt: null,
    lastRunStatus: null,
    totalRuns: 0,
    successRuns: 0,
    failedRuns: 0,
  };
  store = [item, ...store];
  res.status(201).json({ schedule: item });
});

router.put("/schedules/:id", (req, res) => {
  const { id } = req.params;
  const idx = store.findIndex((s) => s.id === id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  store[idx] = { ...store[idx], ...(req.body as Partial<Schedule>), id, updatedAt: now() };
  res.json({ schedule: store[idx] });
});

router.patch("/schedules/:id/pause", (req, res) => {
  const { id } = req.params;
  const s = store.find((s) => s.id === id);
  if (!s) { res.status(404).json({ error: "Not found" }); return; }
  s.status = s.status === "active" ? "paused" : "active";
  s.updatedAt = now();
  res.json({ schedule: s });
});

router.delete("/schedules/:id", (req, res) => {
  const { id } = req.params;
  store = store.filter((s) => s.id !== id);
  res.json({ ok: true });
});

export default router;
