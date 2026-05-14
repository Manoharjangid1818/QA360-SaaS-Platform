// GET /api/reports/share/[token] — return report metadata for public share link

import { NextRequest, NextResponse } from 'next/server';
import { getReportByToken } from '@/lib/report-store';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const report = getReportByToken(token);

  if (!report) {
    return NextResponse.json({ error: 'Report not found or link expired' }, { status: 404 });
  }

  const { buffer: _buf, ...safeReport } = report;
  return NextResponse.json({
    report: {
      ...safeReport,
      downloadUrl: `/api/reports/${report.id}/download`,
    },
  });
}
