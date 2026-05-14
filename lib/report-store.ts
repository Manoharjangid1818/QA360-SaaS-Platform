// In-memory store for generated reports and scheduled reports
// In production, persist to a database

import type { ReportType, ExportFormat, ReportFilters, ScheduledReport, StoredReport } from '@/types/reports';

const reportMap = new Map<string, StoredReport>();
const shareTokenMap = new Map<string, string>(); // token -> id
const scheduledReports: ScheduledReport[] = [];

// Seed with some demo history
function seedDemoReports() {
  const types: ReportType[] = ['test_execution', 'bug_summary', 'regression', 'release_readiness', 'performance'];
  const formats: ExportFormat[] = ['pdf', 'csv', 'excel'];
  const names = [
    'Q2 Release Regression Report',
    'Sprint 24 Bug Summary',
    'Production Test Execution — May 2026',
    'v2.4 Release Readiness',
    'Performance Benchmark — API v3',
  ];

  names.forEach((name, i) => {
    const id = `demo-report-${i + 1}`;
    const token = `share-${id}-${Math.random().toString(36).slice(2)}`;
    const report: StoredReport = {
      id,
      name,
      type: types[i % types.length],
      format: formats[i % formats.length],
      filters: { environment: 'production', severity: 'all', project: 'QA360' },
      createdAt: new Date(Date.now() - (i + 1) * 2 * 24 * 60 * 60 * 1000).toISOString(),
      size: Math.floor(Math.random() * 800 + 200) * 1024,
      sizeFormatted: `${(Math.floor(Math.random() * 800 + 200))} KB`,
      shareToken: token,
      status: 'completed',
    };
    reportMap.set(id, report);
    shareTokenMap.set(token, id);
  });

  // Seed scheduled reports
  scheduledReports.push(
    {
      id: 'sched-1',
      name: 'Weekly Test Execution Summary',
      type: 'test_execution',
      format: 'pdf',
      frequency: 'weekly',
      dayOfWeek: 1,
      time: '08:00',
      recipients: ['qa-team@company.com', 'manager@company.com'],
      filters: { environment: 'production', severity: 'all', project: 'QA360' },
      active: true,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      lastSentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      nextRunAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'sched-2',
      name: 'Daily Bug Summary',
      type: 'bug_summary',
      format: 'excel',
      frequency: 'daily',
      time: '07:00',
      recipients: ['dev-lead@company.com'],
      filters: { environment: 'staging', severity: 'high', project: 'QA360' },
      active: false,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      nextRunAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  );
}

let seeded = false;
function ensureSeeded() {
  if (!seeded) { seedDemoReports(); seeded = true; }
}

export function storeReport(report: StoredReport): void {
  ensureSeeded();
  reportMap.set(report.id, report);
  shareTokenMap.set(report.shareToken, report.id);
}

export function getReport(id: string): StoredReport | undefined {
  ensureSeeded();
  return reportMap.get(id);
}

export function getReportByToken(token: string): StoredReport | undefined {
  ensureSeeded();
  const id = shareTokenMap.get(token);
  if (!id) return undefined;
  return reportMap.get(id);
}

export function listReports(): StoredReport[] {
  ensureSeeded();
  return Array.from(reportMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function deleteReport(id: string): boolean {
  ensureSeeded();
  const report = reportMap.get(id);
  if (!report) return false;
  shareTokenMap.delete(report.shareToken);
  reportMap.delete(id);
  return true;
}

export function listScheduledReports(): ScheduledReport[] {
  ensureSeeded();
  return [...scheduledReports];
}

export function upsertScheduledReport(report: ScheduledReport): void {
  ensureSeeded();
  const idx = scheduledReports.findIndex((r) => r.id === report.id);
  if (idx >= 0) scheduledReports[idx] = report;
  else scheduledReports.push(report);
}

export function deleteScheduledReport(id: string): boolean {
  ensureSeeded();
  const idx = scheduledReports.findIndex((r) => r.id === id);
  if (idx < 0) return false;
  scheduledReports.splice(idx, 1);
  return true;
}
