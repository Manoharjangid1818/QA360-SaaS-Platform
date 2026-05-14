// GET /api/reports/history — list all generated reports
// DELETE /api/reports/history?id=xxx — delete a report

import { NextRequest, NextResponse } from 'next/server';
import { listReports, deleteReport } from '@/lib/report-store';

export async function GET() {
  const reports = listReports().map(({ buffer: _buf, ...r }) => r);
  return NextResponse.json({ reports });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const ok = deleteReport(id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
