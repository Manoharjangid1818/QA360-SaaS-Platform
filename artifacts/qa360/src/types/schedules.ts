export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';
export type ScheduleStatus = 'active' | 'paused' | 'disabled';
export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'retrying';
export type Browser = 'chromium' | 'firefox' | 'webkit';
export type Environment = 'development' | 'staging' | 'production';
export type NotificationEvent = 'passed' | 'failed' | 'flaky' | 'all';

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
  startedAt: string | null;
  finishedAt: string | null;
  duration: number | null;
  result: JobResult | null;
  logs: JobLog[];
  error?: string;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface SchedulerDashboardStats {
  totalSchedules: number;
  activeSchedules: number;
  pausedSchedules: number;
  totalJobsToday: number;
  successfulJobsToday: number;
  failedJobsToday: number;
  avgDurationMs: number;
  upcomingJobs: { scheduleId: string; scheduleName: string; nextRunAt: string }[];
}

export const FREQUENCY_PRESETS: { value: ScheduleFrequency; label: string; cron: string }[] = [
  { value: 'daily', label: 'Daily at midnight', cron: '0 0 * * *' },
  { value: 'weekly', label: 'Weekly on Monday', cron: '0 0 * * 1' },
  { value: 'monthly', label: 'Monthly on 1st', cron: '0 0 1 * *' },
  { value: 'custom', label: 'Custom cron', cron: '' },
];

export const PROJECTS = ['QA360 Web', 'API Services', 'Mobile App', 'Admin Portal', 'Checkout Flow'];
export const TEST_SUITES = ['smoke', 'regression', 'sanity', 'auth', 'checkout', 'api', 'visual'];
