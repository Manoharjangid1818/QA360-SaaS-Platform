import { Router } from "express";
import { generateId, now } from "../lib/helpers.js";

const router = Router();

interface Connection {
  id: string;
  provider: "github" | "gitlab" | "jenkins";
  name: string;
  maskedToken: string;
  config: Record<string, string>;
  status: "connected" | "error" | "disconnected";
  lastSyncAt: string | null;
  pipelineCount: number;
}

interface Pipeline {
  id: string;
  provider: string;
  connectionId: string;
  connectionName: string;
  pipelineName: string;
  ref: string;
  commit: string;
  commitMessage: string;
  author: string;
  status: "success" | "failed" | "running" | "pending" | "cancelled";
  startedAt: string;
  finishedAt: string | null;
  duration: number | null;
  url: string;
  testResults?: { total: number; passed: number; failed: number; skipped: number; flaky: number };
}

let connections: Connection[] = [
  { id: "c-1", provider: "github", name: "qa360/web", maskedToken: "ghp_***4a2f", config: { owner: "qa360", repo: "web" }, status: "connected", lastSyncAt: new Date(Date.now() - 300000).toISOString(), pipelineCount: 12 },
];

let pipelines: Pipeline[] = [
  { id: "p-1", provider: "github", connectionId: "c-1", connectionName: "qa360/web", pipelineName: "CI", ref: "main", commit: "a1b2c3d", commitMessage: "feat: add AI test generator", author: "alice", status: "success", startedAt: new Date(Date.now() - 3600000).toISOString(), finishedAt: new Date(Date.now() - 3000000).toISOString(), duration: 360000, url: "#", testResults: { total: 45, passed: 43, failed: 2, skipped: 0, flaky: 1 } },
  { id: "p-2", provider: "github", connectionId: "c-1", connectionName: "qa360/web", pipelineName: "CI", ref: "main", commit: "e4f5g6h", commitMessage: "refactor: scheduler engine", author: "bob", status: "failed", startedAt: new Date(Date.now() - 7200000).toISOString(), finishedAt: new Date(Date.now() - 6600000).toISOString(), duration: 420000, url: "#", testResults: { total: 45, passed: 38, failed: 7, skipped: 0, flaky: 0 } },
];

router.get("/cicd", (_req, res) => {
  const total = pipelines.length;
  const successful = pipelines.filter((p) => p.status === "success").length;
  const failed = pipelines.filter((p) => p.status === "failed").length;
  const successRate = total ? Math.round((successful / total) * 100) : 0;
  res.json({ connections, pipelines: pipelines.slice(0, 40), stats: { total, successful, failed, successRate, activeConnections: connections.filter((c) => c.status === "connected").length } });
});

router.post("/cicd/connect", (req, res) => {
  const { provider, name, config } = req.body as { provider: "github" | "gitlab" | "jenkins"; name: string; config: Record<string, string> };
  if (!provider || !name) { res.status(400).json({ error: "provider and name required" }); return; }
  const conn: Connection = { id: generateId(), provider, name, maskedToken: "***", config: config ?? {}, status: "connected", lastSyncAt: now(), pipelineCount: 0 };
  connections = [conn, ...connections];
  res.status(201).json({ connection: conn });
});

router.delete("/cicd/connections/:id", (req, res) => {
  connections = connections.filter((c) => c.id !== req.params.id);
  res.json({ ok: true });
});

router.post("/cicd/connections/:id/sync", (req, res) => {
  const c = connections.find((c) => c.id === req.params.id);
  if (!c) { res.status(404).json({ error: "Not found" }); return; }
  c.lastSyncAt = now();
  res.json({ connection: c });
});

export default router;
