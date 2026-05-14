// In-memory store for schedules, jobs, and execution history
// Production-ready module-level singleton with TTL pruning

import type {
  Schedule,
  Job,
  JobStatus,
  QueueStats,
  SchedulerDashboardStats,
  CreateScheduleInput,
  UpdateScheduleInput,
} from '@/types/schedules';
import { describeCron, getNextRunDate } from './cron-utils';

// ─── Store ────────────────────────────────────────────────────────────────────

const schedules = new Map<string, Schedule>();
const jobs = new Map<string, Job>();
const MAX_JOB_HISTORY = 500;

// ─── Schedule CRUD ────────────────────────────────────────────────────────────

export function createSchedule(input: CreateScheduleInput): Schedule {
  const id = `sch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();
  const nextRun = getNextRunDate(input.cronExpression);

  const schedule: Schedule = {
    ...input,
    id,
    cronHuman: describeCron(input.cronExpression),
    createdAt: now,
    updatedAt: now,
    nextRunAt: nextRun?.toISOString() ?? null,
    lastRunAt: null,
    lastRunStatus: null,
    totalRuns: 0,
    successRuns: 0,
    failedRuns: 0,
  };

  schedules.set(id, schedule);
  return schedule;
}

export function getSchedule(id: string): Schedule | undefined {
  return schedules.get(id);
}

export function getAllSchedules(): Schedule[] {
  return Array.from(schedules.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function updateSchedule(id: string, updates: UpdateScheduleInput): Schedule | undefined {
  const existing = schedules.get(id);
  if (!existing) return undefined;

  const updated: Schedule = {
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };

  if (updates.cronExpression && updates.cronExpression !== existing.cronExpression) {
    updated.cronHuman = describeCron(updates.cronExpression);
    const nextRun = getNextRunDate(updates.cronExpression);
    updated.nextRunAt = nextRun?.toISOString() ?? null;
  }

  schedules.set(id, updated);
  return updated;
}

export function deleteSchedule(id: string): boolean {
  return schedules.delete(id);
}

export function setScheduleStatus(
  id: string,
  status: Schedule['status'],
): Schedule | undefined {
  return updateSchedule(id, { status });
}

export function recordScheduleRun(
  id: string,
  status: JobStatus,
): void {
  const schedule = schedules.get(id);
  if (!schedule) return;

  const nextRun = getNextRunDate(schedule.cronExpression);

  schedules.set(id, {
    ...schedule,
    lastRunAt: new Date().toISOString(),
    lastRunStatus: status,
    nextRunAt: nextRun?.toISOString() ?? null,
    totalRuns: schedule.totalRuns + 1,
    successRuns: schedule.successRuns + (status === 'completed' ? 1 : 0),
    failedRuns: schedule.failedRuns + (status === 'failed' ? 1 : 0),
    updatedAt: new Date().toISOString(),
  });
}

// ─── Job Queue ────────────────────────────────────────────────────────────────

export function enqueueJob(
  schedule: Schedule,
  triggeredBy: Job['triggeredBy'] = 'scheduler',
  priority = 0,
): Job {
  const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const job: Job = {
    id,
    scheduleId: schedule.id,
    scheduleName: schedule.name,
    status: 'waiting',
    attempt: 1,
    maxAttempts: schedule.retryOnFailure ? schedule.maxRetries + 1 : 1,
    priority,
    project: schedule.project,
    environment: schedule.environment,
    browser: schedule.browser,
    testSuite: schedule.testSuite,
    parallelWorkers: schedule.parallelWorkers,
    triggeredBy,
    enqueuedAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    duration: null,
    result: null,
    logs: [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Job enqueued — ${schedule.testSuite} on ${schedule.environment} (${schedule.browser})`,
      },
    ],
    error: null,
  };

  jobs.set(id, job);
  pruneOldJobs();
  return job;
}

export function updateJob(id: string, updates: Partial<Job>): Job | undefined {
  const job = jobs.get(id);
  if (!job) return undefined;
  const updated = { ...job, ...updates };
  jobs.set(id, updated);
  return updated;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function getAllJobs(): Job[] {
  return Array.from(jobs.values()).sort(
    (a, b) => new Date(b.enqueuedAt).getTime() - new Date(a.enqueuedAt).getTime(),
  );
}

export function getJobsBySchedule(scheduleId: string): Job[] {
  return getAllJobs().filter((j) => j.scheduleId === scheduleId);
}

export function getJobsByStatus(status: JobStatus): Job[] {
  return getAllJobs().filter((j) => j.status === status);
}

export function addJobLog(
  jobId: string,
  level: 'info' | 'warn' | 'error',
  message: string,
): void {
  const job = jobs.get(jobId);
  if (!job) return;
  job.logs.push({ timestamp: new Date().toISOString(), level, message });
  jobs.set(jobId, job);
}

function pruneOldJobs(): void {
  const all = getAllJobs();
  if (all.length <= MAX_JOB_HISTORY) return;
  const toDelete = all
    .filter((j) => j.status === 'completed' || j.status === 'failed')
    .slice(MAX_JOB_HISTORY - 50);
  for (const job of toDelete) jobs.delete(job.id);
}

// ─── Stats ─────────────────────────────────────────────────────────────────

export function getQueueStats(): QueueStats {
  const allJobs = getAllJobs();
  const completed = allJobs.filter((j) => j.status === 'completed');
  const failed = allJobs.filter((j) => j.status === 'failed');
  const avgDuration =
    completed.length > 0
      ? completed.reduce((sum, j) => sum + (j.duration ?? 0), 0) / completed.length
      : 0;

  return {
    waiting: allJobs.filter((j) => j.status === 'waiting').length,
    active: allJobs.filter((j) => j.status === 'active').length,
    completed: completed.length,
    failed: failed.length,
    delayed: allJobs.filter((j) => j.status === 'delayed').length,
    totalProcessed: completed.length + failed.length,
    successRate:
      completed.length + failed.length > 0
        ? Math.round((completed.length / (completed.length + failed.length)) * 100)
        : 100,
    avgDuration: Math.round(avgDuration),
  };
}

export function getDashboardStats(): SchedulerDashboardStats {
  const allSchedules = getAllSchedules();
  const allJobs = getAllJobs();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayJobs = allJobs.filter((j) => new Date(j.enqueuedAt) >= today);

  return {
    activeSchedules: allSchedules.filter((s) => s.status === 'active').length,
    pausedSchedules: allSchedules.filter((s) => s.status === 'paused').length,
    queuedJobs: allJobs.filter((j) => j.status === 'waiting').length,
    runningJobs: allJobs.filter((j) => j.status === 'active').length,
    completedToday: todayJobs.filter((j) => j.status === 'completed').length,
    failedToday: todayJobs.filter((j) => j.status === 'failed').length,
    successRate: getQueueStats().successRate,
    queue: getQueueStats(),
  };
}

// ─── Seed demo data ───────────────────────────────────────────────────────────

export function seedDemoData(): void {
  if (schedules.size > 0) return;

  const demos: CreateScheduleInput[] = [
    {
      name: 'Nightly Regression Suite',
      description: 'Full regression run every night at 2 AM',
      project: 'E-Commerce Platform',
      environment: 'staging',
      browser: 'chromium',
      testSuite: 'Full Regression Suite',
      frequency: 'daily',
      cronExpression: '0 2 * * *',
      status: 'active',
      parallelWorkers: 4,
      retryOnFailure: true,
      maxRetries: 2,
      timeoutMinutes: 60,
      notifications: {
        slack: { enabled: true, webhookUrl: '', on: ['failed', 'flaky'] },
        email: { enabled: false, recipients: [], on: ['failed'] },
      },
      tags: ['regression', 'nightly'],
    },
    {
      name: 'Smoke Tests — Pre-deploy',
      description: 'Quick smoke run before each production deploy',
      project: 'Admin Dashboard',
      environment: 'production',
      browser: 'chromium',
      testSuite: 'Smoke Tests',
      frequency: 'custom',
      cronExpression: '0 9,17 * * 1-5',
      status: 'active',
      parallelWorkers: 2,
      retryOnFailure: true,
      maxRetries: 1,
      timeoutMinutes: 15,
      notifications: {
        slack: { enabled: true, webhookUrl: '', on: ['failed'] },
        teams: { enabled: false, webhookUrl: '', on: ['all'] },
      },
      tags: ['smoke', 'pre-deploy'],
    },
    {
      name: 'Weekly Auth Flow Tests',
      description: 'Comprehensive auth flow validation every Monday',
      project: 'Auth Service',
      environment: 'staging',
      browser: 'firefox',
      testSuite: 'Auth Flow Tests',
      frequency: 'weekly',
      cronExpression: '0 8 * * 1',
      status: 'active',
      parallelWorkers: 2,
      retryOnFailure: false,
      maxRetries: 0,
      timeoutMinutes: 30,
      notifications: {
        email: { enabled: true, recipients: ['qa@company.com'], on: ['failed'] },
      },
      tags: ['auth', 'weekly'],
    },
    {
      name: 'Monthly Accessibility Audit',
      description: 'Accessibility compliance check on the first of every month',
      project: 'E-Commerce Platform',
      environment: 'production',
      browser: 'chromium',
      testSuite: 'Accessibility Tests',
      frequency: 'monthly',
      cronExpression: '0 6 1 * *',
      status: 'paused',
      parallelWorkers: 1,
      retryOnFailure: false,
      maxRetries: 0,
      timeoutMinutes: 45,
      notifications: {
        email: { enabled: true, recipients: ['accessibility@company.com'], on: ['all'] },
      },
      tags: ['accessibility', 'monthly'],
    },
  ];

  for (const demo of demos) {
    const schedule = createSchedule(demo);

    // Add realistic run history
    const statusOptions: JobStatus[] = ['completed', 'completed', 'completed', 'failed', 'completed'];
    for (let i = 4; i >= 0; i--) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - i);
      if (demo.status === 'paused' && i < 2) continue;

      const status = statusOptions[i % statusOptions.length];
      const job = enqueueJob(schedule, 'scheduler');
      const duration = Math.floor(Math.random() * 180000) + 30000;
      const total = Math.floor(Math.random() * 80) + 20;
      const failed = status === 'failed' ? Math.floor(Math.random() * 5) + 1 : 0;
      const flaky = Math.floor(Math.random() * 3);

      updateJob(job.id, {
        status,
        startedAt: daysAgo.toISOString(),
        completedAt: new Date(daysAgo.getTime() + duration).toISOString(),
        enqueuedAt: daysAgo.toISOString(),
        duration,
        result: {
          total,
          passed: total - failed - flaky,
          failed,
          skipped: 0,
          flaky,
          duration,
          screenshots: failed > 0 ? ['screenshot-failure-001.png'] : [],
        },
        logs: [
          { timestamp: daysAgo.toISOString(), level: 'info', message: 'Job started' },
          {
            timestamp: new Date(daysAgo.getTime() + duration / 2).toISOString(),
            level: 'info',
            message: `Running ${total} tests across ${demo.parallelWorkers} workers`,
          },
          {
            timestamp: new Date(daysAgo.getTime() + duration).toISOString(),
            level: status === 'failed' ? 'error' : 'info',
            message:
              status === 'failed'
                ? `${failed} test(s) failed. See screenshots for details.`
                : `All tests passed successfully`,
          },
        ],
        error: status === 'failed' ? 'Test assertions failed' : null,
      });

      schedules.set(schedule.id, {
        ...schedule,
        totalRuns: schedule.totalRuns + (4 - i + 1),
        successRuns: schedule.successRuns + (status === 'completed' ? 1 : 0),
        failedRuns: schedule.failedRuns + (status === 'failed' ? 1 : 0),
        lastRunAt: daysAgo.toISOString(),
        lastRunStatus: status,
      });
    }
  }
}
