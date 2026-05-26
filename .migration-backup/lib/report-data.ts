// Aggregate mock/live data into report-ready structures

import { mockTestCases, mockBugs, mockTestRuns, mockDashboardStats } from './mock-data';
import type { ReportFilters, ReportType } from '@/types/reports';

export interface TestExecutionData {
  summary: { total: number; passed: number; failed: number; skipped: number; passRate: number };
  runs: { name: string; total: number; passed: number; failed: number; skipped: number; duration: string; date: string }[];
  testCases: { title: string; priority: string; status: string; updatedAt: string }[];
  trend: { date: string; passed: number; failed: number }[];
}

export interface BugSummaryData {
  summary: { total: number; open: number; inProgress: number; resolved: number; critical: number; high: number };
  bySeverity: { severity: string; count: number }[];
  byStatus: { status: string; count: number }[];
  bugs: { title: string; severity: string; status: string; createdAt: string }[];
  trend: { date: string; opened: number; resolved: number }[];
}

export interface PerformanceData {
  summary: { avgLighthouse: number; avgFCP: number; avgLCP: number; avgCLS: number; avgTTFB: number };
  scores: { page: string; performance: number; accessibility: number; bestPractices: number; seo: number }[];
  trend: { date: string; performance: number; accessibility: number }[];
}

export interface RegressionData {
  summary: { total: number; passed: number; failed: number; newFailures: number; flaky: number };
  suites: { name: string; total: number; passed: number; failed: number; duration: string }[];
  failures: { test: string; suite: string; error: string; since: string }[];
  trend: { date: string; passRate: number }[];
}

export interface ReleaseReadinessData {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  verdict: string;
  components: { name: string; status: 'ready' | 'at_risk' | 'blocked'; score: number; issues: number }[];
  risks: { level: 'high' | 'medium' | 'low'; description: string }[];
  recommendations: string[];
  metrics: { label: string; value: string; ok: boolean }[];
}

export function getTestExecutionData(_filters: ReportFilters): TestExecutionData {
  const total = mockTestRuns.reduce((s, r) => s + r.total, 0);
  const passed = mockTestRuns.reduce((s, r) => s + r.passed, 0);
  const failed = mockTestRuns.reduce((s, r) => s + r.failed, 0);
  const skipped = mockTestRuns.reduce((s, r) => s + r.skipped, 0);

  return {
    summary: { total, passed, failed, skipped, passRate: Math.round((passed / total) * 100) },
    runs: mockTestRuns.map((r) => ({
      name: r.name,
      total: r.total,
      passed: r.passed,
      failed: r.failed,
      skipped: r.skipped,
      duration: `${(r.duration_ms / 1000).toFixed(1)}s`,
      date: new Date(r.created_at).toLocaleDateString(),
    })),
    testCases: mockTestCases.map((tc) => ({
      title: tc.title,
      priority: tc.priority,
      status: tc.status,
      updatedAt: new Date(tc.updated_at).toLocaleDateString(),
    })),
    trend: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      passed: Math.floor(Math.random() * 20 + 80),
      failed: Math.floor(Math.random() * 10),
    })),
  };
}

export function getBugSummaryData(_filters: ReportFilters): BugSummaryData {
  const open = mockBugs.filter((b) => b.status === 'open').length;
  const inProgress = mockBugs.filter((b) => b.status === 'in_progress').length;
  const resolved = mockBugs.filter((b) => b.status === 'resolved').length;
  const critical = mockBugs.filter((b) => b.severity === 'critical').length;
  const high = mockBugs.filter((b) => b.severity === 'high').length;

  return {
    summary: { total: mockBugs.length, open, inProgress, resolved, critical, high },
    bySeverity: [
      { severity: 'Critical', count: critical },
      { severity: 'High', count: high },
      { severity: 'Medium', count: mockBugs.filter((b) => b.severity === 'medium').length },
      { severity: 'Low', count: mockBugs.filter((b) => b.severity === 'low').length },
    ],
    byStatus: [
      { status: 'Open', count: open },
      { status: 'In Progress', count: inProgress },
      { status: 'Resolved', count: resolved },
    ],
    bugs: mockBugs.map((b) => ({
      title: b.title,
      severity: b.severity,
      status: b.status,
      createdAt: new Date(b.created_at).toLocaleDateString(),
    })),
    trend: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      opened: Math.floor(Math.random() * 5),
      resolved: Math.floor(Math.random() * 5),
    })),
  };
}

export function getPerformanceData(_filters: ReportFilters): PerformanceData {
  const pages = ['Homepage', 'Dashboard', 'Login', 'Test Cases', 'Reports', 'API Docs'];
  const scores = pages.map((page) => ({
    page,
    performance: Math.floor(Math.random() * 30 + 65),
    accessibility: Math.floor(Math.random() * 15 + 80),
    bestPractices: Math.floor(Math.random() * 20 + 75),
    seo: Math.floor(Math.random() * 10 + 88),
  }));

  const avgPerf = Math.round(scores.reduce((s, p) => s + p.performance, 0) / scores.length);

  return {
    summary: { avgLighthouse: avgPerf, avgFCP: 1.8, avgLCP: 2.4, avgCLS: 0.05, avgTTFB: 0.32 },
    scores,
    trend: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      performance: Math.floor(Math.random() * 20 + 70),
      accessibility: Math.floor(Math.random() * 10 + 85),
    })),
  };
}

export function getRegressionData(_filters: ReportFilters): RegressionData {
  const total = 248;
  const passed = 231;
  const failed = 17;
  return {
    summary: { total, passed, failed, newFailures: 5, flaky: 3 },
    suites: [
      { name: 'Authentication Suite', total: 45, passed: 44, failed: 1, duration: '2m 14s' },
      { name: 'Dashboard Suite', total: 68, passed: 65, failed: 3, duration: '4m 02s' },
      { name: 'API Integration Suite', total: 92, passed: 85, failed: 7, duration: '6m 55s' },
      { name: 'UI Regression Suite', total: 43, passed: 37, failed: 6, duration: '3m 41s' },
    ],
    failures: [
      { test: 'Dashboard charts load within 3s', suite: 'Dashboard Suite', error: 'Timeout: element not visible', since: '2026-05-12' },
      { test: 'API returns 200 for /test-cases', suite: 'API Integration Suite', error: 'Expected 200, got 503', since: '2026-05-13' },
      { test: 'Login redirects on success', suite: 'Authentication Suite', error: 'AssertionError: path mismatch', since: '2026-05-14' },
    ],
    trend: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      passRate: Math.floor(Math.random() * 10 + 87),
    })),
  };
}

export function getReleaseReadinessData(_filters: ReportFilters): ReleaseReadinessData {
  const bugs = mockBugs;
  const criticalBugs = bugs.filter((b) => b.severity === 'critical' && b.status === 'open').length;
  const score = criticalBugs > 0 ? 62 : 87;
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

  return {
    score,
    grade,
    verdict: criticalBugs > 0 ? 'Release blocked — critical bugs open' : 'Conditionally ready for release',
    components: [
      { name: 'Authentication', status: 'ready', score: 95, issues: 0 },
      { name: 'Dashboard', status: 'at_risk', score: 78, issues: 2 },
      { name: 'Test Case Manager', status: 'ready', score: 91, issues: 1 },
      { name: 'Bug Tracker', status: 'at_risk', score: 72, issues: 3 },
      { name: 'API Layer', status: criticalBugs > 0 ? 'blocked' : 'at_risk', score: 58, issues: criticalBugs + 2 },
      { name: 'AI Generator', status: 'ready', score: 88, issues: 0 },
    ],
    risks: [
      { level: 'high', description: `${criticalBugs} critical bug(s) unresolved in API layer` },
      { level: 'medium', description: 'Dashboard load time exceeds 3s threshold on low-end devices' },
      { level: 'low', description: 'Minor accessibility issues flagged in Lighthouse audit' },
    ],
    recommendations: [
      'Resolve all critical and high-severity bugs before deploying to production',
      'Run full regression suite on staging environment after bug fixes',
      'Conduct performance profiling for Dashboard component',
      'Complete accessibility remediation for WCAG 2.1 AA compliance',
      'Obtain sign-off from QA Lead and Product Owner',
    ],
    metrics: [
      { label: 'Pass Rate', value: `${mockDashboardStats.passed}/${mockDashboardStats.totalTestCases} (${Math.round(mockDashboardStats.passed / mockDashboardStats.totalTestCases * 100)}%)`, ok: true },
      { label: 'Critical Bugs', value: `${criticalBugs} open`, ok: criticalBugs === 0 },
      { label: 'High Bugs', value: `${bugs.filter((b) => b.severity === 'high' && b.status === 'open').length} open`, ok: false },
      { label: 'Code Coverage', value: '74%', ok: false },
      { label: 'Lighthouse Score', value: '81/100', ok: true },
      { label: 'API Response Time', value: '< 200ms', ok: true },
    ],
  };
}

export function getReportData(type: ReportType, filters: ReportFilters) {
  switch (type) {
    case 'test_execution': return getTestExecutionData(filters);
    case 'bug_summary': return getBugSummaryData(filters);
    case 'performance': return getPerformanceData(filters);
    case 'regression': return getRegressionData(filters);
    case 'release_readiness': return getReleaseReadinessData(filters);
  }
}
