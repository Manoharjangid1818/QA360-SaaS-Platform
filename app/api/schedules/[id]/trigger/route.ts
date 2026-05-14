// POST /api/schedules/:id/trigger — manually trigger a schedule run immediately

import { NextRequest, NextResponse } from 'next/server';
import { initSchedulerEngine, triggerScheduleNow } from '@/lib/scheduler-engine';

function ensureInit() { initSchedulerEngine(); }

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  ensureInit();
  const { id } = await params;

  const job = await triggerScheduleNow(id);
  if (!job) return NextResponse.json({ error: 'Schedule not found.' }, { status: 404 });

  return NextResponse.json({ job }, { status: 201 });
}
