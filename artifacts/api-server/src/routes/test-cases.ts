import { Router } from "express";
import type { TestCase } from "../types/qa360.js";
import { generateId, now } from "../lib/helpers.js";

const router = Router();

let store: TestCase[] = [
  { id: "tc-1", title: "User Login with valid credentials", description: "Verify that a user can log in with a valid email and password.", steps: "1. Navigate to /login\n2. Enter valid email\n3. Enter valid password\n4. Click Sign In", expected_result: "User is redirected to the dashboard.", priority: "high", status: "passed", created_at: new Date(Date.now() - 3 * 86400000).toISOString(), updated_at: new Date(Date.now() - 86400000).toISOString() },
  { id: "tc-2", title: "User Login with invalid password", description: "Verify that login fails gracefully with an incorrect password.", steps: "1. Navigate to /login\n2. Enter valid email\n3. Enter wrong password\n4. Click Sign In", expected_result: "An error message Invalid credentials is shown.", priority: "high", status: "passed", created_at: new Date(Date.now() - 3 * 86400000).toISOString(), updated_at: new Date(Date.now() - 86400000).toISOString() },
  { id: "tc-3", title: "Create new test case", description: "Verify that a QA engineer can create a new test case via the UI.", steps: "1. Navigate to Test Cases\n2. Click New Test Case\n3. Fill in required fields\n4. Click Save", expected_result: "New test case appears in the list with status Pending.", priority: "medium", status: "pending", created_at: new Date(Date.now() - 2 * 86400000).toISOString(), updated_at: new Date(Date.now() - 2 * 86400000).toISOString() },
];

router.get("/test-cases", (_req, res) => {
  res.json({ testCases: store });
});

router.post("/test-cases", (req, res) => {
  const { title, description, steps, expected_result, priority, status } =
    req.body as Partial<TestCase>;

  if (!title?.trim()) {
    res.status(400).json({ error: "Title is required." });
    return;
  }

  const item: TestCase = {
    id: generateId(),
    title: title.trim(),
    description: description ?? "",
    steps: steps ?? "",
    expected_result: expected_result ?? "",
    priority: priority ?? "medium",
    status: status ?? "pending",
    created_at: now(),
    updated_at: now(),
  };
  store = [item, ...store];
  res.status(201).json({ testCase: item });
});

router.put("/test-cases/:id", (req, res) => {
  const { id } = req.params;
  const idx = store.findIndex((tc) => tc.id === id);
  if (idx === -1) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  store[idx] = { ...store[idx], ...(req.body as Partial<TestCase>), id, updated_at: now() };
  res.json({ testCase: store[idx] });
});

router.delete("/test-cases/:id", (req, res) => {
  const { id } = req.params;
  store = store.filter((tc) => tc.id !== id);
  res.json({ ok: true });
});

export default router;
