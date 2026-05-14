// In-memory store for generated reports and scheduled reports
// Uses file-based persistence for durability

import type { ReportType, ExportFormat, ReportFilters, ScheduledReport, StoredReport } from '@/types/reports';
import fs from 'fs';
import path from 'path';

const reportMap = new Map<string, StoredReport>();
const shareTokenMap = new Map<string, string>(); // token -> id
const scheduledReports: ScheduledReport[] = [];

// Get reports directory
const REPORTS_DIR = path.join(process.cwd(), '.reports-cache');

function ensureReportsDir() {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

function getReportPath(id: string) {
  return path.join(REPORTS_DIR, `${id}.json`);
}

function saveReportToFile(report: StoredReport) {
  ensureReportsDir();
  const reportData = {
    id: report.id,
    name: report.name,
    type: report.type,
    format: report.format,
    filters: report.filters,
    createdAt: report.createdAt,
    size: report.size,
    sizeFormatted: report.sizeFormatted,
    shareToken: report.shareToken,
    status: report.status,
    buffer: report.buffer ? report.buffer.toString('base64') : undefined,
  };
  fs.writeFileSync(getReportPath(report.id), JSON.stringify(reportData, null, 2));
}

function loadReportFromFile(id: string): StoredReport | null {
  ensureReportsDir();
  const filePath = getReportPath(id);
  if (!fs.existsSync(filePath)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return {
      ...data,
      buffer: data.buffer ? Buffer.from(data.buffer, 'base64') : undefined,
    };
  } catch {
    return null;
  }
}

function loadAllReportsFromFiles() {
  ensureReportsDir();
  const files = fs.readdirSync(REPORTS_DIR).filter(f => f.endsWith('.json'));
  files.forEach(file => {
    const id = file.replace('.json', '');
    const report = loadReportFromFile(id);
    if (report) {
      reportMap.set(id, report);
      shareTokenMap.set(report.shareToken, id);
    }
  });
}


function seedDemoReports() {
  const types: ReportType[] = ['test_execution', 'bug_summary', 'regression', 'release_readiness', 'performance'];
  const formats: ExportFormat[] = ['excel'];
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
      format: 'excel',
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
  if (!seeded) {
    loadAllReportsFromFiles();
    seedDemoReports();
    seeded = true;
  }
}

export function storeReport(report: StoredReport): void {
  ensureSeeded();
  reportMap.set(report.id, report);
  shareTokenMap.set(report.shareToken, report.id);
  saveReportToFile(report);
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
  
  // Delete from file system
  const filePath = getReportPath(id);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  
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
