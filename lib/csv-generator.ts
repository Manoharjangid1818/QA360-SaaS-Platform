// CSV export for all report types

import type { ReportType, ReportFilters } from '@/types/reports';
import {
  getTestExecutionData,
  getBugSummaryData,
  getPerformanceData,
  getRegressionData,
  getReleaseReadinessData,
} from './report-data';

function row(...cells: (string | number)[]): string {
  return cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',');
}

function section(title: string): string {
  return `\n${title}\n`;
}

export function generateCSV(type: ReportType, filters: ReportFilters): Buffer {
  const lines: string[] = [];
  const now = new Date().toLocaleString();

  lines.push(row('QA360 Enterprise Report'));
  lines.push(row('Report Type', type.replace(/_/g, ' ').toUpperCase()));
  lines.push(row('Generated At', now));
  lines.push(row('Environment', filters.environment || 'All'));
  lines.push(row('Project', filters.project || 'All'));
  lines.push('');

  switch (type) {
    case 'test_execution': {
      const data = getTestExecutionData(filters);
      lines.push(section('EXECUTIVE SUMMARY'));
      lines.push(row('Total Tests', 'Passed', 'Failed', 'Skipped', 'Pass Rate'));
      lines.push(row(data.summary.total, data.summary.passed, data.summary.failed, data.summary.skipped, `${data.summary.passRate}%`));
      lines.push('');
      lines.push(section('TEST RUNS'));
      lines.push(row('Run Name', 'Total', 'Passed', 'Failed', 'Skipped', 'Duration', 'Date'));
      data.runs.forEach((r) => lines.push(row(r.name, r.total, r.passed, r.failed, r.skipped, r.duration, r.date)));
      lines.push('');
      lines.push(section('TEST CASES'));
      lines.push(row('Title', 'Priority', 'Status', 'Last Updated'));
      data.testCases.forEach((tc) => lines.push(row(tc.title, tc.priority, tc.status, tc.updatedAt)));
      break;
    }
    case 'bug_summary': {
      const data = getBugSummaryData(filters);
      lines.push(section('EXECUTIVE SUMMARY'));
      lines.push(row('Total', 'Open', 'In Progress', 'Resolved', 'Critical', 'High'));
      lines.push(row(data.summary.total, data.summary.open, data.summary.inProgress, data.summary.resolved, data.summary.critical, data.summary.high));
      lines.push('');
      lines.push(section('BUGS BY SEVERITY'));
      lines.push(row('Severity', 'Count'));
      data.bySeverity.forEach((s) => lines.push(row(s.severity, s.count)));
      lines.push('');
      lines.push(section('BUG DETAILS'));
      lines.push(row('Title', 'Severity', 'Status', 'Created'));
      data.bugs.forEach((b) => lines.push(row(b.title, b.severity, b.status, b.createdAt)));
      break;
    }
    case 'performance': {
      const data = getPerformanceData(filters);
      lines.push(section('EXECUTIVE SUMMARY'));
      lines.push(row('Avg Lighthouse', 'Avg FCP (s)', 'Avg LCP (s)', 'Avg CLS', 'Avg TTFB (s)'));
      lines.push(row(`${data.summary.avgLighthouse}/100`, data.summary.avgFCP, data.summary.avgLCP, data.summary.avgCLS, data.summary.avgTTFB));
      lines.push('');
      lines.push(section('PAGE SCORES'));
      lines.push(row('Page', 'Performance', 'Accessibility', 'Best Practices', 'SEO'));
      data.scores.forEach((s) => lines.push(row(s.page, s.performance, s.accessibility, s.bestPractices, s.seo)));
      break;
    }
    case 'regression': {
      const data = getRegressionData(filters);
      lines.push(section('EXECUTIVE SUMMARY'));
      lines.push(row('Total', 'Passed', 'Failed', 'New Failures', 'Flaky'));
      lines.push(row(data.summary.total, data.summary.passed, data.summary.failed, data.summary.newFailures, data.summary.flaky));
      lines.push('');
      lines.push(section('TEST SUITES'));
      lines.push(row('Suite', 'Total', 'Passed', 'Failed', 'Duration'));
      data.suites.forEach((s) => lines.push(row(s.name, s.total, s.passed, s.failed, s.duration)));
      lines.push('');
      lines.push(section('FAILURES'));
      lines.push(row('Test', 'Suite', 'Error', 'Failing Since'));
      data.failures.forEach((f) => lines.push(row(f.test, f.suite, f.error, f.since)));
      break;
    }
    case 'release_readiness': {
      const data = getReleaseReadinessData(filters);
      lines.push(section('EXECUTIVE SUMMARY'));
      lines.push(row('Score', 'Grade', 'Verdict'));
      lines.push(row(`${data.score}/100`, data.grade, data.verdict));
      lines.push('');
      lines.push(section('COMPONENT READINESS'));
      lines.push(row('Component', 'Status', 'Score', 'Issues'));
      data.components.forEach((c) => lines.push(row(c.name, c.status, `${c.score}/100`, c.issues)));
      lines.push('');
      lines.push(section('METRICS'));
      lines.push(row('Metric', 'Value', 'Status'));
      data.metrics.forEach((m) => lines.push(row(m.label, m.value, m.ok ? 'PASS' : 'FAIL')));
      lines.push('');
      lines.push(section('RECOMMENDATIONS'));
      data.recommendations.forEach((r, i) => lines.push(row(`${i + 1}.`, r)));
      break;
    }
  }

  return Buffer.from(lines.join('\n'), 'utf-8');
}
