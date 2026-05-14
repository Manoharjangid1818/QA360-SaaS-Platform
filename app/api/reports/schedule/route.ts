// GET /api/reports/schedule — list scheduled reports
// POST /api/reports/schedule — create/update a scheduled report
// DELETE /api/reports/schedule?id=xxx — delete scheduled report

import { NextRequest, NextResponse } from 'next/server';
import {
  listScheduledReports,
  upsertScheduledReport,
  deleteScheduledReport,
} from '@/lib/report-store';
import type { ScheduledReport } from '@/types/reports';

export async function GET() {
  return NextResponse.json({ schedules: listScheduledReports() });
}

export async function POST(req: NextRequest) {
  try {
    const body: Partial<ScheduledReport> = await req.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'name required' }, { status: 400 });
    }
    const id = body.id || `sched-${Date.now()}`;
    const now = new Date().toISOString();
    const schedule: ScheduledReport = {
      id,
      name: body.name,
      type: body.type || 'test_execution',
      format: body.format || 'pdf',
      frequency: body.frequency || 'weekly',
      dayOfWeek: body.dayOfWeek,
      dayOfMonth: body.dayOfMonth,
      time: body.time || '08:00',
      recipients: body.recipients || [],
      filters: body.filters || {},
      active: body.active ?? true,
      createdAt: body.createdAt || now,
      nextRunAt: body.nextRunAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    upsertScheduledReport(schedule);
    return NextResponse.json({ success: true, schedule });
  } catch (err) {
    console.error('POST /api/reports/schedule error:', err);
    return NextResponse.json({ error: 'Failed to save schedule.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const ok = deleteScheduledReport(id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
