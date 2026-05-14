// GET /api/schedules — list all schedules with dashboard stats
// POST /api/schedules — create a new schedule

import { NextRequest, NextResponse } from 'next/server';
import { initSchedulerEngine, registerCronTask } from '@/lib/scheduler-engine';
import {
  getAllSchedules,
  createSchedule,
  getDashboardStats,
} from '@/lib/schedule-store';
import { validateCronExpression } from '@/lib/cron-utils';
import type { CreateScheduleInput } from '@/types/schedules';

function ensureInit() {
  initSchedulerEngine();
}

export async function GET() {
  ensureInit();
  const schedules = getAllSchedules();
  const stats = getDashboardStats();
  return NextResponse.json({ schedules, stats });
}

export async function POST(req: NextRequest) {
  ensureInit();

  let body: Partial<CreateScheduleInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  // Validate required fields
  const required = ['name', 'project', 'environment', 'browser', 'testSuite', 'cronExpression'];
  for (const field of required) {
    if (!body[field as keyof CreateScheduleInput]) {
      return NextResponse.json({ error: `${field} is required.` }, { status: 400 });
    }
  }

  // Validate cron
  const { valid, error: cronError } = validateCronExpression(body.cronExpression!);
  if (!valid) {
    return NextResponse.json({ error: `Invalid cron expression: ${cronError}` }, { status: 400 });
  }

  const schedule = createSchedule({
    name: body.name!,
    description: body.description ?? '',
    project: body.project!,
    environment: body.environment!,
    browser: body.browser!,
    testSuite: body.testSuite!,
    frequency: body.frequency ?? 'custom',
    cronExpression: body.cronExpression!,
    status: body.status ?? 'active',
    parallelWorkers: body.parallelWorkers ?? 1,
    retryOnFailure: body.retryOnFailure ?? false,
    maxRetries: body.maxRetries ?? 1,
    timeoutMinutes: body.timeoutMinutes ?? 30,
    notifications: body.notifications ?? {},
    tags: body.tags ?? [],
  });

  // Register with cron engine if active
  if (schedule.status === 'active') {
    registerCronTask(schedule);
  }

  return NextResponse.json({ schedule }, { status: 201 });
}
