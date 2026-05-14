// GET /api/reports/[id]/download — stream a stored report to the client

import { NextRequest, NextResponse } from 'next/server';
import { getReport } from '@/lib/report-store';
import type { ReportType, ExportFormat } from '@/types/reports';
import { generatePDF } from '@/lib/pdf-generator';
import { generateCSV } from '@/lib/csv-generator';
import { generateExcel } from '@/lib/excel-generator';
import { DEFAULT_BRANDING } from '@/types/reports';

const MIME: Record<ExportFormat, string> = {
  pdf: 'application/pdf',
  csv: 'text/csv',
  excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

const EXT: Record<ExportFormat, string> = {
  pdf: 'pdf',
  csv: 'csv',
  excel: 'xlsx',
};

const REPORT_NAMES: Record<ReportType, string> = {
  test_execution: 'test-execution',
  bug_summary: 'bug-summary',
  performance: 'performance',
  regression: 'regression',
  release_readiness: 'release-readiness',
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const report = getReport(id);

  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  let buffer: Buffer;

  if (report.buffer) {
    buffer = report.buffer;
  } else {
    // Demo reports don't have buffers; regenerate on the fly
    if (report.format === 'pdf') {
      buffer = await generatePDF(report.type, report.filters, DEFAULT_BRANDING);
    } else if (report.format === 'csv') {
      buffer = generateCSV(report.type, report.filters);
    } else {
      buffer = generateExcel(report.type, report.filters);
    }
  }

  const filename = `qa360-${REPORT_NAMES[report.type]}-${new Date(report.createdAt).toISOString().split('T')[0]}.${EXT[report.format]}`;

  return new Response(buffer, {
    headers: {
      'Content-Type': MIME[report.format],
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.length),
    },
  });
}
