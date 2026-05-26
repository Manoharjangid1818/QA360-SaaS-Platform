import { Router } from "express";
import type { Bug } from "../types/qa360.js";
import { generateId, now } from "../lib/helpers.js";

const router = Router();

let store: Bug[] = [
  { id: "bug-1", title: "Login button unresponsive on Safari iOS", description: "The login button does not respond to taps on Safari iOS 16+.", steps_to_reproduce: "1. Open app on iPhone\n2. Enter credentials\n3. Tap Sign In", severity: "high", status: "open", test_case_id: "tc-1", created_at: new Date(Date.now() - 2 * 86400000).toISOString(), updated_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: "bug-2", title: "Error message not cleared after successful login", description: "If a user first fails login then succeeds, the error message remains.", steps_to_reproduce: "1. Enter wrong password\n2. Enter correct password\n3. Observe error still shown", severity: "medium", status: "in_progress", test_case_id: "tc-2", created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date(Date.now() - 6 * 3600000).toISOString() },
  { id: "bug-3", title: "Report upload fails for large JSON files", description: "Playwright JSON reports exceeding 5MB fail to parse.", steps_to_reproduce: "1. Generate large Playwright suite\n2. Upload JSON\n3. Observe failure", severity: "critical", status: "open", created_at: new Date(Date.now() - 3 * 3600000).toISOString(), updated_at: new Date(Date.now() - 3 * 3600000).toISOString() },
];

router.get("/bugs", (_req, res) => {
  res.json({ bugs: store });
});

router.post("/bugs", (req, res) => {
  const { title, description, steps_to_reproduce, severity, status, test_case_id } =
    req.body as Partial<Bug>;

  if (!title?.trim()) {
    res.status(400).json({ error: "Title is required." });
    return;
  }

  const item: Bug = {
    id: generateId(),
    title: title.trim(),
    description: description ?? "",
    steps_to_reproduce: steps_to_reproduce ?? "",
    severity: severity ?? "medium",
    status: status ?? "open",
    test_case_id: test_case_id,
    created_at: now(),
    updated_at: now(),
  };
  store = [item, ...store];
  res.status(201).json({ bug: item });
});

router.put("/bugs/:id", (req, res) => {
  const { id } = req.params;
  const idx = store.findIndex((b) => b.id === id);
  if (idx === -1) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  store[idx] = { ...store[idx], ...(req.body as Partial<Bug>), id, updated_at: now() };
  res.json({ bug: store[idx] });
});

router.delete("/bugs/:id", (req, res) => {
  const { id } = req.params;
  store = store.filter((b) => b.id !== id);
  res.json({ ok: true });
});

export default router;
