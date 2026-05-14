// GET /api/queue/jobs — return queue status and recent job list

import { NextResponse } from 'next/server';
import { initSchedulerEngine } from '@/lib/scheduler-engine';
import { getAllJobs, getQueueStats } from '@/lib/schedule-store';

function ensureInit() { initSchedulerEngine(); }

export async function GET() {
  ensureInit();
  const jobs = getAllJobs().slice(0, 50);
  const stats = getQueueStats();
  return NextResponse.json({ jobs, stats });
}
