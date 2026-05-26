// Scheduler Engine — node-cron based job runner with BullMQ-style queue semantics
// Runs as a module-level singleton inside the Next.js process

import cron from 'node-cron';
import {
  getAllSchedules,
  getSchedule,
  enqueueJob,
  updateJob,
  addJobLog,
  recordScheduleRun,
  seedDemoData,
} from './schedule-store';
import { sendNotification } from './notification-service';
import type { Job, Schedule } from '@/types/schedules';

// ─── State ───────────────────────────────────────────────────────────────────

const cronTasks = new Map<string, cron.ScheduledTask>();
let initialized = false;

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initSchedulerEngine(): void {
  if (initialized) return;
  initialized = true;

  seedDemoData();

  // Register all active schedules on startup
  const schedules = getAllSchedules();
  for (const schedule of schedules) {
    if (schedule.status === 'active') {
      registerCronTask(schedule);
    }
  }

  // Process the waiting queue every 10 seconds
  cron.schedule('*/10 * * * * *', processQueue);

  console.log(`[Scheduler] Initialized with ${schedules.length} schedule(s)`);
}

// ─── Register / Unregister ────────────────────────────────────────────────────

export function registerCronTask(schedule: Schedule): void {
  unregisterCronTask(schedule.id);

  if (!cron.validate(schedule.cronExpression)) {
    console.warn(`[Scheduler] Invalid cron expression for "${schedule.name}": ${schedule.cronExpression}`);
    return;
  }

  const task = cron.schedule(schedule.cronExpression, () => {
    const fresh = getSchedule(schedule.id);
    if (!fresh || fresh.status !== 'active') return;
    console.log(`[Scheduler] Triggering "${fresh.name}"`);
    enqueueJob(fresh, 'scheduler');
  });

  cronTasks.set(schedule.id, task);
  console.log(`[Scheduler] Registered "${schedule.name}" → ${schedule.cronExpression}`);
}

export function unregisterCronTask(scheduleId: string): void {
  const existing = cronTasks.get(scheduleId);
  if (existing) {
    existing.stop();
    cronTasks.delete(scheduleId);
  }
}

export function pauseCronTask(scheduleId: string): void {
  cronTasks.get(scheduleId)?.stop();
}

export function resumeCronTask(scheduleId: string): void {
  const schedule = getSchedule(scheduleId);
  if (schedule && schedule.status === 'active') {
    registerCronTask(schedule);
  }
}

// ─── Queue processor ──────────────────────────────────────────────────────────

async function processQueue(): Promise<void> {
  const { getAllJobs, updateJob: updateJobStore } = await import('./schedule-store');
  const waiting = getAllJobs().filter((j) => j.status === 'waiting');

  // Process up to 3 jobs concurrently
  const batch = waiting.slice(0, 3);
  await Promise.all(batch.map(executeJob));
}

// ─── Job executor ─────────────────────────────────────────────────────────────

export async function executeJob(job: Job): Promise<void> {
  // Mark active
  updateJob(job.id, { status: 'active', startedAt: new Date().toISOString() });
  addJobLog(job.id, 'info', `Starting ${job.testSuite} on ${job.environment} (${job.browser})`);
  addJobLog(job.id, 'info', `Launching ${job.parallelWorkers} parallel worker(s)`);

  const schedule = getSchedule(job.scheduleId);

  try {
    // Simulate realistic test execution
    const result = await simulateTestRun(job);

    const completedAt = new Date().toISOString();
    const duration = Date.now() - new Date(job.startedAt ?? job.enqueuedAt).getTime();

    const hasFlaky = result.flaky > 0;
    const hasFailed = result.failed > 0;
    const finalStatus = hasFailed ? 'failed' : 'completed';

    addJobLog(
      job.id,
      hasFailed ? 'error' : 'info',
      `Finished: ${result.passed} passed, ${result.failed} failed, ${result.flaky} flaky, ${result.skipped} skipped`,
    );

    updateJob(job.id, {
      status: finalStatus,
      completedAt,
      duration,
      result: { ...result, duration },
      error: hasFailed ? `${result.failed} test(s) failed` : null,
    });

    // Record on schedule
    recordScheduleRun(job.scheduleId, finalStatus);

    // Send notifications
    if (schedule) {
      const event = hasFailed ? 'failed' : hasFlaky ? 'flaky' : 'passed';
      await sendNotification(schedule.notifications, event, {
        scheduleName: job.scheduleName,
        project: job.project,
        environment: job.environment,
        testSuite: job.testSuite,
        status: finalStatus,
        result,
        jobId: job.id,
      }).catch((e) => console.warn('[Scheduler] Notification error:', e));
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const duration = Date.now() - new Date(job.startedAt ?? job.enqueuedAt).getTime();

    addJobLog(job.id, 'error', `Job failed: ${errorMsg}`);

    // Retry logic
    if (job.attempt < job.maxAttempts) {
      addJobLog(job.id, 'warn', `Retrying (attempt ${job.attempt + 1} of ${job.maxAttempts})…`);
      updateJob(job.id, {
        status: 'waiting',
        attempt: job.attempt + 1,
        duration,
        error: errorMsg,
      });
    } else {
      updateJob(job.id, { status: 'failed', completedAt: new Date().toISOString(), duration, error: errorMsg });
      recordScheduleRun(job.scheduleId, 'failed');

      if (schedule) {
        await sendNotification(schedule.notifications, 'failed', {
          scheduleName: job.scheduleName,
          project: job.project,
          environment: job.environment,
          testSuite: job.testSuite,
          status: 'failed',
          result: null,
          jobId: job.id,
        }).catch(() => {});
      }
    }
  }
}

// ─── Test simulation ──────────────────────────────────────────────────────────

async function simulateTestRun(job: Job): Promise<{
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  duration: number;
  screenshots: string[];
}> {
  const total = Math.floor(Math.random() * 60) + 20;
  const baseDelay = 2000 + Math.random() * 3000; // 2–5 seconds (shortened for demo)

  await new Promise((r) => setTimeout(r, baseDelay));

  addJobLog(job.id, 'info', `Running ${total} test cases across ${job.parallelWorkers} workers`);

  await new Promise((r) => setTimeout(r, baseDelay * 0.5));

  // Realistic outcome distribution
  const failRate = job.environment === 'production' ? 0.03 : 0.08;
  const flakyRate = 0.04;
  const skipRate = 0.02;

  const failed = Math.random() < 0.25 ? Math.ceil(total * failRate * Math.random()) : 0;
  const flaky = Math.random() < 0.2 ? Math.ceil(total * flakyRate) : 0;
  const skipped = Math.floor(total * skipRate);
  const passed = total - failed - flaky - skipped;

  const screenshots = failed > 0
    ? Array.from({ length: failed }, (_, i) => `failure-${job.id}-${i + 1}.png`)
    : [];

  addJobLog(job.id, 'info', `Test execution complete`);
  if (failed > 0) addJobLog(job.id, 'error', `${failed} failure(s) captured with screenshots`);
  if (flaky > 0) addJobLog(job.id, 'warn', `${flaky} flaky test(s) detected — consider stabilising selectors`);

  return { total, passed, failed, skipped, flaky, duration: 0, screenshots };
}

// ─── Manual trigger ───────────────────────────────────────────────────────────

export async function triggerScheduleNow(scheduleId: string): Promise<Job | null> {
  const schedule = getSchedule(scheduleId);
  if (!schedule) return null;
  const job = enqueueJob(schedule, 'manual', 10); // high priority
  return job;
}
