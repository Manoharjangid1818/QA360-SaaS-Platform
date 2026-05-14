// GET /api/schedules/:id
// PUT /api/schedules/:id
// DELETE /api/schedules/:id

import { NextRequest, NextResponse } from 'next/server';
import { initSchedulerEngine, registerCronTask, unregisterCronTask } from '@/lib/scheduler-engine';
import {
  getSchedule,
  updateSchedule,
  deleteSchedule,
  getJobsBySchedule,
} from '@/lib/schedule-store';
import { validateCronExpression } from '@/lib/cron-utils';
import type { UpdateScheduleInput } from '@/types/schedules';

function ensureInit() { initSchedulerEngine(); }

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  ensureInit();
  const { id } = await params;
  const schedule = getSchedule(id);
  if (!schedule) return NextResponse.json({ error: 'Schedule not found.' }, { status: 404 });

  const jobs = getJobsBySchedule(id).slice(0, 20);
  return NextResponse.json({ schedule, jobs });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  ensureInit();
  const { id } = await params;
  const schedule = getSchedule(id);
  if (!schedule) return NextResponse.json({ error: 'Schedule not found.' }, { status: 404 });

  let body: UpdateScheduleInput;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  if (body.cronExpression && body.cronExpression !== schedule.cronExpression) {
    const { valid, error } = validateCronExpression(body.cronExpression);
    if (!valid) return NextResponse.json({ error: `Invalid cron: ${error}` }, { status: 400 });
  }

  const updated = updateSchedule(id, body);
  if (!updated) return NextResponse.json({ error: 'Update failed.' }, { status: 500 });

  // Re-register cron task if expression or status changed
  if (body.cronExpression || body.status) {
    if (updated.status === 'active') {
      registerCronTask(updated);
    } else {
      unregisterCronTask(id);
    }
  }

  return NextResponse.json({ schedule: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  ensureInit();
  const { id } = await params;
  if (!getSchedule(id)) return NextResponse.json({ error: 'Schedule not found.' }, { status: 404 });

  unregisterCronTask(id);
  deleteSchedule(id);
  return NextResponse.json({ success: true });
}
