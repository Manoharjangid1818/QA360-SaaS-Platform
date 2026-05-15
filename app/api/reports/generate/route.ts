// POST /api/reports/generate
// Generates a report, stores it in-memory, returns metadata

import { NextRequest, NextResponse } from 'next/server';
import type { ReportType, ExportFormat, ReportFilters, BrandingSettings } from '@/types/reports';
import { DEFAULT_BRANDING } from '@/types/reports';
import { generateExcel } from '@/lib/excel-generator';
import { storeReport } from '@/lib/report-store';

const REPORT_NAMES: Record<ReportType, string> = {
  test_execution: 'Test Execution Report',
  bug_summary: 'Bug Summary Report',
  performance: 'Performance Report',
  regression: 'Regression Report',
  release_readiness: 'Release Readiness Report',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type = 'test_execution',
      format = 'excel',
      filters = {},
      branding = DEFAULT_BRANDING,
      customName,
    }: {
      type: ReportType;
      format: ExportFormat;
      filters: ReportFilters;
      branding: BrandingSettings;
      customName?: string;
    } = body;

    let buffer: Buffer;

    if (format !== 'excel') {
      return NextResponse.json({ error: 'Only Excel format is supported.' }, { status: 400 });
    }
    buffer = generateExcel(type, filters);

    const id = `report-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const shareToken = `share-${id}-${Math.random().toString(36).slice(2)}`;
    const sizeFormatted = buffer.length > 1024 * 1024
      ? `${(buffer.length / 1024 / 1024).toFixed(1)} MB`
      : `${Math.round(buffer.length / 1024)} KB`;

    const report = {
      id,
      name: customName || `${REPORT_NAMES[type]} — ${new Date().toLocaleDateString()}`,
      type,
      format,
      filters,
      createdAt: new Date().toISOString(),
      size: buffer.length,
      sizeFormatted,
      shareToken,
      status: 'completed' as const,
      buffer,
    };

    storeReport(report);

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        name: report.name,
        type: report.type,
        format: report.format,
        createdAt: report.createdAt,
        sizeFormatted: report.sizeFormatted,
        shareToken: report.shareToken,
        status: report.status,
        downloadUrl: `/api/reports/${report.id}/download`,
        shareUrl: `/reports/share/${report.shareToken}`,
      },
    });
  } catch (err) {
    console.error('POST /api/reports/generate error:', err);
    return NextResponse.json({ error: 'Failed to generate report.' }, { status: 500 });
  }
}
