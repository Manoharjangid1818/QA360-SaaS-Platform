// Core data types for QA360

export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type TestStatus = 'pending' | 'passed' | 'failed' | 'skipped';
export type BugSeverity = 'low' | 'medium' | 'high' | 'critical';
export type BugStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

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

export interface TestRun {
  id: string;
  name: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration_ms: number;
  created_at: string;
  user_id?: string;
}

export interface DashboardStats {
  totalTestCases: number;
  passed: number;
  failed: number;
  pending: number;
  totalBugs: number;
  openBugs: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'test_case' | 'bug' | 'test_run';
  action: 'created' | 'updated' | 'resolved';
  title: string;
  timestamp: string;
}

// Playwright JSON report shape
export interface PlaywrightReport {
  stats: {
    total: number;
    expected: number;
    unexpected: number;
    skipped: number;
    duration: number;
  };
  suites: PlaywrightSuite[];
}

export interface PlaywrightSuite {
  title: string;
  specs: PlaywrightSpec[];
  suites?: PlaywrightSuite[];
}

export interface PlaywrightSpec {
  title: string;
  ok: boolean;
  tests: PlaywrightTest[];
}

export interface PlaywrightTest {
  title: string;
  status: 'expected' | 'unexpected' | 'skipped';
  duration: number;
}

// AI generation types
export interface GeneratedTestCase {
  title: string;
  description: string;
  steps: string;
  expected_result: string;
  priority: Priority;
  type: 'positive' | 'negative' | 'edge';
}
