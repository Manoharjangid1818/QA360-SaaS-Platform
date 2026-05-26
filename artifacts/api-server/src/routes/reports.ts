import { Router } from "express";
import { generateId, now } from "../lib/helpers.js";

const router = Router();

interface Report {
  id: string;
  name: string;
  type: string;
  format: string;
  filters: Record<string, string>;
  createdAt: string;
  sizeFormatted: string;
  shareToken: string;
  status: "completed" | "generating" | "failed";
}

let reports: Report[] = [
  { id: "r-1", name: "Test Execution Report — May 2026", type: "test_execution", format: "excel", filters: {}, createdAt: new Date(Date.now() - 86400000).toISOString(), sizeFormatted: "245 KB", shareToken: "abc123", status: "completed" },
];

router.get("/reports/history", (_req, res) => {
  res.json({ reports });
});

router.post("/reports/generate", (req, res) => {
  const { type, filters, name } = req.body as { type?: string; filters?: Record<string, string>; name?: string };
  if (!type) { res.status(400).json({ error: "type is required" }); return; }
  const token = Math.random().toString(36).slice(2, 10);
  const report: Report = {
    id: generateId(),
    name: name ?? `${type} report — ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
    type,
    format: "excel",
    filters: filters ?? {},
    createdAt: now(),
    sizeFormatted: `${Math.floor(100 + Math.random() * 300)} KB`,
    shareToken: token,
    status: "completed",
  };
  reports = [report, ...reports];
  res.status(201).json({ report });
});

router.delete("/reports/:id", (req, res) => {
  reports = reports.filter((r) => r.id !== req.params.id);
  res.json({ ok: true });
});

router.get("/reports/share/:token", (req, res) => {
  const r = reports.find((r) => r.shareToken === req.params.token);
  if (!r) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ report: r });
});

export default router;
