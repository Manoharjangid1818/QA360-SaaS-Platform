// Excel export using xlsx — multi-sheet workbooks for all report types

import * as XLSX from 'xlsx';
import type { ReportType, ReportFilters } from '@/types/reports';
import {
  getTestExecutionData,
  getBugSummaryData,
  getPerformanceData,
  getRegressionData,
  getReleaseReadinessData,
} from './report-data';

function createWorkbook(): XLSX.WorkBook {
  return XLSX.utils.book_new();
}

function addSheet(wb: XLSX.WorkBook, data: unknown[][], name: string): void {
  const ws = XLSX.utils.aoa_to_sheet(data);
  // Auto-width columns
  const cols = (data[0] as unknown[])?.map((_, ci) => ({
    wch: Math.max(...data.map((row) => String((row as unknown[])[ci] ?? '').length), 10),
  }));
  if (cols) ws['!cols'] = cols;
  XLSX.utils.book_append_sheet(wb, ws, name);
}

export function generateExcel(type: ReportType, filters: ReportFilters): Buffer {
  const wb = createWorkbook();
  const now = new Date().toLocaleString();

  // Cover sheet
  const cover = [
    ['QA360 Enterprise Report'],
    ['Report Type', type.replace(/_/g, ' ').toUpperCase()],
    ['Generated At', now],
    ['Environment', filters.environment || 'All'],
    ['Project', filters.project || 'All'],
    ['Severity Filter', filters.severity || 'All'],
  ];
  addSheet(wb, cover, 'Cover');

  switch (type) {
    case 'test_execution': {
      const data = getTestExecutionData(filters);
      addSheet(wb, [
        ['Total Tests', 'Passed', 'Failed', 'Skipped', 'Pass Rate'],
        [data.summary.total, data.summary.passed, data.summary.failed, data.summary.skipped, `${data.summary.passRate}%`],
      ], 'Summary');
      addSheet(wb, [
        ['Run Name', 'Total', 'Passed', 'Failed', 'Skipped', 'Duration', 'Date'],
        ...data.runs.map((r) => [r.name, r.total, r.passed, r.failed, r.skipped, r.duration, r.date]),
      ], 'Test Runs');
      addSheet(wb, [
        ['Title', 'Priority', 'Status', 'Last Updated'],
        ...data.testCases.map((tc) => [tc.title, tc.priority, tc.status, tc.updatedAt]),
      ], 'Test Cases');
      addSheet(wb, [
        ['Date', 'Passed', 'Failed'],
        ...data.trend.map((t) => [t.date, t.passed, t.failed]),
      ], 'Pass-Fail Trend');
      break;
    }
    case 'bug_summary': {
      const data = getBugSummaryData(filters);
      addSheet(wb, [
        ['Total', 'Open', 'In Progress', 'Resolved', 'Critical', 'High'],
        [data.summary.total, data.summary.open, data.summary.inProgress, data.summary.resolved, data.summary.critical, data.summary.high],
      ], 'Summary');
      addSheet(wb, [
        ['Severity', 'Count'],
        ...data.bySeverity.map((s) => [s.severity, s.count]),
      ], 'By Severity');
      addSheet(wb, [
        ['Status', 'Count'],
        ...data.byStatus.map((s) => [s.status, s.count]),
      ], 'By Status');
      addSheet(wb, [
        ['Title', 'Severity', 'Status', 'Created At'],
        ...data.bugs.map((b) => [b.title, b.severity, b.status, b.createdAt]),
      ], 'Bug Details');
      addSheet(wb, [
        ['Date', 'Opened', 'Resolved'],
        ...data.trend.map((t) => [t.date, t.opened, t.resolved]),
      ], 'Bug Trend');
      break;
    }
    case 'performance': {
      const data = getPerformanceData(filters);
      addSheet(wb, [
        ['Avg Lighthouse', 'Avg FCP (s)', 'Avg LCP (s)', 'Avg CLS', 'Avg TTFB (s)'],
        [data.summary.avgLighthouse, data.summary.avgFCP, data.summary.avgLCP, data.summary.avgCLS, data.summary.avgTTFB],
      ], 'Summary');
      addSheet(wb, [
        ['Page', 'Performance', 'Accessibility', 'Best Practices', 'SEO'],
        ...data.scores.map((s) => [s.page, s.performance, s.accessibility, s.bestPractices, s.seo]),
      ], 'Lighthouse Scores');
      addSheet(wb, [
        ['Date', 'Performance', 'Accessibility'],
        ...data.trend.map((t) => [t.date, t.performance, t.accessibility]),
      ], 'Performance Trend');
      break;
    }
    case 'regression': {
      const data = getRegressionData(filters);
      addSheet(wb, [
        ['Total', 'Passed', 'Failed', 'New Failures', 'Flaky'],
        [data.summary.total, data.summary.passed, data.summary.failed, data.summary.newFailures, data.summary.flaky],
      ], 'Summary');
      addSheet(wb, [
        ['Suite Name', 'Total', 'Passed', 'Failed', 'Duration'],
        ...data.suites.map((s) => [s.name, s.total, s.passed, s.failed, s.duration]),
      ], 'Suites');
      addSheet(wb, [
        ['Test', 'Suite', 'Error Message', 'Failing Since'],
        ...data.failures.map((f) => [f.test, f.suite, f.error, f.since]),
      ], 'Failures');
      addSheet(wb, [
        ['Date', 'Pass Rate (%)'],
        ...data.trend.map((t) => [t.date, t.passRate]),
      ], 'Pass Rate Trend');
      break;
    }
    case 'release_readiness': {
      const data = getReleaseReadinessData(filters);
      addSheet(wb, [
        ['Score', 'Grade', 'Verdict'],
        [`${data.score}/100`, data.grade, data.verdict],
      ], 'Summary');
      addSheet(wb, [
        ['Component', 'Status', 'Score', 'Issues'],
        ...data.components.map((c) => [c.name, c.status, `${c.score}/100`, c.issues]),
      ], 'Components');
      addSheet(wb, [
        ['Risk Level', 'Description'],
        ...data.risks.map((r) => [r.level.toUpperCase(), r.description]),
      ], 'Risks');
      addSheet(wb, [
        ['Metric', 'Value', 'Status'],
        ...data.metrics.map((m) => [m.label, m.value, m.ok ? 'PASS' : 'FAIL']),
      ], 'Metrics');
      addSheet(wb, [
        ['#', 'Recommendation'],
        ...data.recommendations.map((r, i) => [i + 1, r]),
      ], 'Recommendations');
      break;
    }
  }

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return Buffer.from(buf);
}
