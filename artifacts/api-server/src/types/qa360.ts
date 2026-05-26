export type Priority = "low" | "medium" | "high" | "critical";
export type TestStatus = "pending" | "passed" | "failed" | "skipped";
export type BugSeverity = "low" | "medium" | "high" | "critical";
export type BugStatus = "open" | "in_progress" | "resolved" | "closed";

export interface TestCase {
  id: string;
  title: string;
  description: string;
  steps: string;
  expected_result: string;
  priority: Priority;
  status: TestStatus;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export interface Bug {
  id: string;
  title: string;
  description: string;
  steps_to_reproduce: string;
  severity: BugSeverity;
  status: BugStatus;
  test_case_id?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export interface GeneratedTestCase {
  title: string;
  description: string;
  steps: string;
  expected_result: string;
  priority: Priority;
  type: "positive" | "negative" | "edge";
}
