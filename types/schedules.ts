// Scheduler system — TypeScript types

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';
export type ScheduleStatus = 'active' | 'paused' | 'disabled';
export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'retrying';
export type Browser = 'chromium' | 'firefox' | 'webkit';
export type Environment = 'development' | 'staging' | 'production';
export type NotificationEvent = 'passed' | 'failed' | 'flaky' | 'all';

// ─── Schedule ──────────────────────────────────────────────────────────────

export interface NotificationConfig {
  email?: {
    enabled: boolean;
    recipients: string[];
    on: NotificationEvent[];
  };
  slack?: {
    enabled: boolean;
    webhookUrl: string;
    channel?: string;
    on: NotificationEvent[];
  };
  teams?: {
    enabled: boolean;
    webhookUrl: string;
    on: NotificationEvent[];
  };
}

export interface Schedule {
  id: string;
  name: string;
  description?: string;
  project: string;
  environment: Environment;
  browser: Browser;
  testSuite: string;
  frequency: ScheduleFrequency;
  cronExpression: string;
  cronHuman: string;
  status: ScheduleStatus;
  parallelWorkers: number;
  retryOnFailure: boolean;
  maxRetries: number;
  timeoutMinutes: number;
  notifications: NotificationConfig;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastRunStatus: JobStatus | null;
  totalRuns: number;
  successRuns: number;
  failedRuns: number;
}

export type CreateScheduleInput = Omit<
  Schedule,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'nextRunAt'
  | 'lastRunAt'
  | 'lastRunStatus'
  | 'totalRuns'
  | 'successRuns'
  | 'failedRuns'
  | 'cronHuman'
>;

export type UpdateScheduleInput = Partial<CreateScheduleInput>;

// ─── Job ──────────────────────────────────────────────────────────────────

export interface JobLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface JobResult {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  duration: number;
  screenshots: string[];
}

export interface Job {
  id: string;
  scheduleId: string;
  scheduleName: string;
  status: JobStatus;
  attempt: number;
  maxAttempts: number;
  priority: number;
  project: string;
  environment: Environment;
  browser: Browser;
  testSuite: string;
  parallelWorkers: number;
  triggeredBy: 'scheduler' | 'manual';
  enqueuedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null;
  result: JobResult | null;
  logs: JobLog[];
  error: string | null;
}

// ─── Queue Stats ──────────────────────────────────────────────────────────

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  totalProcessed: number;
  successRate: number;
  avgDuration: number;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────

export interface SchedulerDashboardStats {
  activeSchedules: number;
  pausedSchedules: number;
  queuedJobs: number;
  runningJobs: number;
  completedToday: number;
  failedToday: number;
  successRate: number;
  queue: QueueStats;
}

// ─── Frequency presets ────────────────────────────────────────────────────

export const FREQUENCY_PRESETS: Record<ScheduleFrequency, { label: string; cron: string }> = {
  daily: { label: 'Daily at midnight', cron: '0 0 * * *' },
  weekly: { label: 'Weekly on Monday', cron: '0 0 * * 1' },
  monthly: { label: 'Monthly on 1st', cron: '0 0 1 * *' },
  custom: { label: 'Custom expression', cron: '' },
};

export const PROJECTS = [
  'E-Commerce Platform',
  'Admin Dashboard',
  'Mobile API',
  'Auth Service',
  'Payment Gateway',
  'Notification Service',
];

export const TEST_SUITES = [
  'Full Regression Suite',
  'Smoke Tests',
  'Critical Path Tests',
  'Auth Flow Tests',
  'Checkout Flow Tests',
  'API Integration Tests',
  'Performance Tests',
  'Accessibility Tests',
];
