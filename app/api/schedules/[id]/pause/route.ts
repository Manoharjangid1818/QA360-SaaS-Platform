// POST /api/schedules/:id/pause — toggle pause/resume on a schedule

import { NextRequest, NextResponse } from 'next/server';
import { initSchedulerEngine, registerCronTask, unregisterCronTask } from '@/lib/scheduler-engine';
import { getSchedule, setScheduleStatus } from '@/lib/schedule-store';

function ensureInit() { initSchedulerEngine(); }

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  ensureInit();
  const { id } = await params;

  const schedule = getSchedule(id);
  if (!schedule) return NextResponse.json({ error: 'Schedule not found.' }, { status: 404 });
  if (schedule.status === 'disabled') {
    return NextResponse.json({ error: 'Cannot toggle a disabled schedule.' }, { status: 400 });
  }

  const newStatus = schedule.status === 'active' ? 'paused' : 'active';
  const updated = setScheduleStatus(id, newStatus);

  if (newStatus === 'active' && updated) {
    registerCronTask(updated);
  } else {
    unregisterCronTask(id);
  }

  return NextResponse.json({ schedule: updated, action: newStatus === 'active' ? 'resumed' : 'paused' });
}
