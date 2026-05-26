'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Header from '@/components/header';
import { cn } from '@/lib/utils';
import { formatNextRun, describeCron, validateCronExpression } from '@/lib/cron-utils';
import { FREQUENCY_PRESETS, PROJECTS, TEST_SUITES } from '@/types/schedules';
import type {
  Schedule,
  Job,
  SchedulerDashboardStats,
  ScheduleFrequency,
  Browser,
  Environment,
  CreateScheduleInput,
  QueueStats,
} from '@/types/schedules';
import {
  Calendar,
  Play,
  Pause,
  Trash2,
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Activity,
  Layers,
  Zap,
  ChevronDown,
  ChevronRight,
  X,
  Bell,
  BellOff,
  RotateCcw,
  Timer,
  Globe,
  Server,
  Monitor,
  Loader2,
  TrendingUp,
  BarChart3,
  Settings,
  Mail,
  MessageSquare,
  Hash,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

// ─── Toast hook ───────────────────────────────────────────────────────────────

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = idRef.current++;
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismiss = useCallback((id: number) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  return { toasts, toast, dismiss };
}

// ─── Status helpers ───────────────────────────────────────────────────────────

function jobStatusConfig(status: string) {
  const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    waiting:   { label: 'Waiting',   color: 'bg-gray-100 text-gray-600',   icon: <Clock className="h-3 w-3" /> },
    active:    { label: 'Running',   color: 'bg-blue-100 text-blue-700',   icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    completed: { label: 'Passed',    color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3" /> },
    failed:    { label: 'Failed',    color: 'bg-red-100 text-red-700',     icon: <XCircle className="h-3 w-3" /> },
    delayed:   { label: 'Delayed',   color: 'bg-yellow-100 text-yellow-700', icon: <Timer className="h-3 w-3" /> },
    retrying:  { label: 'Retrying',  color: 'bg-orange-100 text-orange-700', icon: <RotateCcw className="h-3 w-3" /> },
  };
  return map[status] ?? map.waiting;
}

function scheduleStatusConfig(status: string) {
  const map: Record<string, { label: string; color: string; dot: string }> = {
    active:   { label: 'Active',   color: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
    paused:   { label: 'Paused',   color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
    disabled: { label: 'Disabled', color: 'bg-gray-100 text-gray-500',    dot: 'bg-gray-400' },
  };
  return map[status] ?? map.disabled;
}

function browserIcon(browser: string) {
  return <Monitor className="h-3.5 w-3.5" />;
}

function envColor(env: string) {
  const map: Record<string, string> = {
    production: 'bg-red-100 text-red-700',
    staging: 'bg-yellow-100 text-yellow-700',
    development: 'bg-blue-100 text-blue-700',
  };
  return map[env] ?? 'bg-gray-100 text-gray-600';
}

function formatDuration(ms: number | null): string {
  if (!ms) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon, color,
}: { label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={cn('p-2.5 rounded-lg shrink-0', color)}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Create schedule form ─────────────────────────────────────────────────────

const defaultForm: Partial<CreateScheduleInput> = {
  name: '',
  description: '',
  project: PROJECTS[0],
  environment: 'staging',
  browser: 'chromium',
  testSuite: TEST_SUITES[0],
  frequency: 'daily',
  cronExpression: '0 2 * * *',
  status: 'active',
  parallelWorkers: 2,
  retryOnFailure: true,
  maxRetries: 1,
  timeoutMinutes: 30,
  notifications: {},
  tags: [],
};

interface CreateModalProps {
  onClose: () => void;
  onCreated: (s: Schedule) => void;
  toast: (msg: string, type?: Toast['type']) => void;
}

function CreateModal({ onClose, onCreated, toast }: CreateModalProps) {
  const [form, setForm] = useState<Partial<CreateScheduleInput>>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [cronError, setCronError] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'schedule' | 'notifications'>('basic');

  const set = <K extends keyof CreateScheduleInput>(k: K, v: CreateScheduleInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleFrequencyChange = (freq: ScheduleFrequency) => {
    set('frequency', freq);
    if (freq !== 'custom') {
      set('cronExpression', FREQUENCY_PRESETS[freq].cron);
      setCronError('');
    }
  };

  const handleCronChange = (expr: string) => {
    set('cronExpression', expr);
    if (expr) {
      const { valid, error } = validateCronExpression(expr);
      setCronError(valid ? '' : error ?? '');
    }
  };

  const handleSubmit = async () => {
    if (!form.name?.trim()) { toast('Name is required', 'error'); return; }
    if (!form.cronExpression) { toast('Cron expression is required', 'error'); return; }
    const { valid, error } = validateCronExpression(form.cronExpression);
    if (!valid) { toast(`Invalid cron: ${error}`, 'error'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create schedule');
      toast('Schedule created!', 'success');
      onCreated(data.schedule);
      onClose();
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const cronDesc = form.cronExpression && !cronError ? describeCron(form.cronExpression) : '';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">New Schedule</h2>
            <p className="text-xs text-gray-500">Configure automated test run</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          {(['basic', 'schedule', 'notifications'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'py-3 px-4 text-sm font-medium capitalize border-b-2 transition-colors',
                activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700',
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'basic' && (
            <>
              <div>
                <label className="label">Schedule Name <span className="text-red-500">*</span></label>
                <input className="input" placeholder="e.g. Nightly Regression Suite" value={form.name} onChange={(e) => set('name', e.target.value)} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input resize-none" rows={2} placeholder="What does this schedule test?" value={form.description} onChange={(e) => set('description', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Project</label>
                  <select className="input" value={form.project} onChange={(e) => set('project', e.target.value)}>
                    {PROJECTS.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Environment</label>
                  <select className="input" value={form.environment} onChange={(e) => set('environment', e.target.value as Environment)}>
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                  </select>
                </div>
                <div>
                  <label className="label">Browser</label>
                  <select className="input" value={form.browser} onChange={(e) => set('browser', e.target.value as Browser)}>
                    <option value="chromium">Chromium</option>
                    <option value="firefox">Firefox</option>
                    <option value="webkit">WebKit</option>
                  </select>
                </div>
                <div>
                  <label className="label">Test Suite</label>
                  <select className="input" value={form.testSuite} onChange={(e) => set('testSuite', e.target.value)}>
                    {TEST_SUITES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Parallel Workers</label>
                  <input type="number" min={1} max={10} className="input" value={form.parallelWorkers} onChange={(e) => set('parallelWorkers', parseInt(e.target.value, 10))} />
                </div>
                <div>
                  <label className="label">Timeout (min)</label>
                  <input type="number" min={1} max={180} className="input" value={form.timeoutMinutes} onChange={(e) => set('timeoutMinutes', parseInt(e.target.value, 10))} />
                </div>
                <div>
                  <label className="label">Max Retries</label>
                  <input type="number" min={0} max={5} className="input" value={form.maxRetries} onChange={(e) => set('maxRetries', parseInt(e.target.value, 10))} />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" checked={!!form.retryOnFailure} onChange={(e) => set('retryOnFailure', e.target.checked)} />
                <span className="text-sm text-gray-700">Retry on failure</span>
              </label>
            </>
          )}

          {activeTab === 'schedule' && (
            <>
              <div>
                <label className="label">Frequency</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(FREQUENCY_PRESETS) as [ScheduleFrequency, { label: string; cron: string }][]).map(([key, { label }]) => (
                    <button
                      key={key}
                      onClick={() => handleFrequencyChange(key)}
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm font-medium border transition-colors text-left',
                        form.frequency === key
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300',
                      )}
                    >
                      <div className="font-medium capitalize">{key}</div>
                      <div className="text-xs opacity-70">{label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">
                  Cron Expression <span className="text-gray-400 font-normal">(min hour day month weekday)</span>
                </label>
                <input
                  className={cn('input font-mono', cronError && 'border-red-400 focus:ring-red-400')}
                  placeholder="0 2 * * *"
                  value={form.cronExpression}
                  onChange={(e) => handleCronChange(e.target.value)}
                />
                {cronError ? (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> {cronError}
                  </p>
                ) : cronDesc ? (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> {cronDesc}
                  </p>
                ) : null}
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
                <p className="font-medium text-gray-600">Common expressions</p>
                {[
                  ['Every minute', '* * * * *'],
                  ['Every hour', '0 * * * *'],
                  ['Daily at 2 AM', '0 2 * * *'],
                  ['Mon–Fri at 9 AM & 5 PM', '0 9,17 * * 1-5'],
                  ['Every Sunday at midnight', '0 0 * * 0'],
                ].map(([label, expr]) => (
                  <button
                    key={expr}
                    onClick={() => { handleCronChange(expr); set('frequency', 'custom'); }}
                    className="block w-full text-left hover:text-blue-600 transition-colors"
                  >
                    <span className="font-mono">{expr}</span> — {label}
                  </button>
                ))}
              </div>
            </>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              {/* Slack */}
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
                      <Hash className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">Slack</span>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!form.notifications?.slack?.enabled}
                      onChange={(e) => set('notifications', {
                        ...form.notifications,
                        slack: { enabled: e.target.checked, webhookUrl: form.notifications?.slack?.webhookUrl ?? '', on: form.notifications?.slack?.on ?? ['failed'] },
                      })}
                    />
                    <span className="text-xs text-gray-600">Enable</span>
                  </label>
                </div>
                <input
                  className="input text-xs mb-2"
                  placeholder="https://hooks.slack.com/services/..."
                  value={form.notifications?.slack?.webhookUrl ?? ''}
                  onChange={(e) => set('notifications', {
                    ...form.notifications,
                    slack: { enabled: !!form.notifications?.slack?.enabled, webhookUrl: e.target.value, on: form.notifications?.slack?.on ?? ['failed'] },
                  })}
                />
              </div>

              {/* Teams */}
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-700 rounded flex items-center justify-center">
                      <MessageSquare className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">Microsoft Teams</span>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!form.notifications?.teams?.enabled}
                      onChange={(e) => set('notifications', {
                        ...form.notifications,
                        teams: { enabled: e.target.checked, webhookUrl: form.notifications?.teams?.webhookUrl ?? '', on: form.notifications?.teams?.on ?? ['failed'] },
                      })}
                    />
                    <span className="text-xs text-gray-600">Enable</span>
                  </label>
                </div>
                <input
                  className="input text-xs"
                  placeholder="https://outlook.office.com/webhook/..."
                  value={form.notifications?.teams?.webhookUrl ?? ''}
                  onChange={(e) => set('notifications', {
                    ...form.notifications,
                    teams: { enabled: !!form.notifications?.teams?.enabled, webhookUrl: e.target.value, on: form.notifications?.teams?.on ?? ['failed'] },
                  })}
                />
              </div>

              {/* Email */}
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center">
                      <Mail className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">Email</span>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!form.notifications?.email?.enabled}
                      onChange={(e) => set('notifications', {
                        ...form.notifications,
                        email: { enabled: e.target.checked, recipients: form.notifications?.email?.recipients ?? [], on: form.notifications?.email?.on ?? ['failed'] },
                      })}
                    />
                    <span className="text-xs text-gray-600">Enable</span>
                  </label>
                </div>
                <input
                  className="input text-xs"
                  placeholder="qa@company.com, lead@company.com"
                  value={form.notifications?.email?.recipients?.join(', ') ?? ''}
                  onChange={(e) => set('notifications', {
                    ...form.notifications,
                    email: {
                      enabled: !!form.notifications?.email?.enabled,
                      recipients: e.target.value.split(',').map((r) => r.trim()).filter(Boolean),
                      on: form.notifications?.email?.on ?? ['failed'],
                    },
                  })}
                />
                <p className="text-xs text-gray-400 mt-1">Configure SMTP via SMTP_HOST, SMTP_USER, SMTP_PASS env vars</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <div className="flex gap-2">
            {(['basic', 'schedule', 'notifications'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn('w-2 h-2 rounded-full transition-colors', activeTab === tab ? 'bg-blue-600' : 'bg-gray-300')}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary text-sm px-4 py-2">Cancel</button>
            <button onClick={handleSubmit} disabled={saving} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {saving ? 'Creating…' : 'Create Schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Schedule row ─────────────────────────────────────────────────────────────

interface ScheduleRowProps {
  schedule: Schedule;
  onTrigger: (id: string) => void;
  onTogglePause: (id: string) => void;
  onDelete: (id: string) => void;
  expanded: boolean;
  onExpand: (id: string) => void;
  recentJobs: Job[];
}

function ScheduleRow({ schedule, onTrigger, onTogglePause, onDelete, expanded, onExpand, recentJobs }: ScheduleRowProps) {
  const { label, color, dot } = scheduleStatusConfig(schedule.status);
  const lastJobConfig = schedule.lastRunStatus ? jobStatusConfig(schedule.lastRunStatus) : null;
  const passRate = schedule.totalRuns > 0
    ? Math.round((schedule.successRuns / schedule.totalRuns) * 100)
    : null;

  return (
    <div className={cn('card transition-all', expanded && 'ring-1 ring-blue-200')}>
      {/* Main row */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors"
        onClick={() => onExpand(schedule.id)}
      >
        {/* Expand icon */}
        <button className="text-gray-400 shrink-0">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm truncate">{schedule.name}</span>
            <span className={cn('badge text-xs flex items-center gap-1', color)}>
              <span className={cn('w-1.5 h-1.5 rounded-full', dot)} />
              {label}
            </span>
            <span className={cn('badge text-xs', envColor(schedule.environment))}>
              {schedule.environment}
            </span>
            {schedule.tags.map((tag) => (
              <span key={tag} className="badge bg-gray-100 text-gray-500 text-xs">{tag}</span>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{schedule.project}</span>
            <span className="flex items-center gap-1"><Monitor className="h-3 w-3" />{schedule.browser}</span>
            <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{schedule.testSuite}</span>
            <span className="flex items-center gap-1"><Activity className="h-3 w-3" />{schedule.cronHuman}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="hidden lg:flex items-center gap-6 shrink-0 text-xs text-gray-500">
          <div className="text-center">
            <p className="text-gray-900 font-semibold text-sm">{schedule.totalRuns}</p>
            <p>Runs</p>
          </div>
          {passRate !== null && (
            <div className="text-center">
              <p className={cn('font-semibold text-sm', passRate >= 80 ? 'text-green-600' : passRate >= 60 ? 'text-yellow-600' : 'text-red-600')}>
                {passRate}%
              </p>
              <p>Pass rate</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-gray-900 font-semibold text-sm">{formatNextRun(schedule.nextRunAt)}</p>
            <p>Next run</p>
          </div>
          {lastJobConfig && (
            <div className="text-center">
              <span className={cn('badge text-xs flex items-center gap-1', lastJobConfig.color)}>
                {lastJobConfig.icon} {lastJobConfig.label}
              </span>
              <p className="mt-1">{formatRelative(schedule.lastRunAt)}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onTrigger(schedule.id)}
            title="Run now"
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Play className="h-4 w-4" />
          </button>
          <button
            onClick={() => onTogglePause(schedule.id)}
            title={schedule.status === 'active' ? 'Pause' : 'Resume'}
            className={cn(
              'p-2 rounded-lg transition-colors',
              schedule.status === 'active'
                ? 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                : 'text-yellow-500 hover:text-green-600 hover:bg-green-50',
            )}
          >
            {schedule.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            onClick={() => onDelete(schedule.id)}
            title="Delete"
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expanded job history */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Recent Executions
          </p>
          {recentJobs.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No executions yet</p>
          ) : (
            <div className="space-y-2">
              {recentJobs.slice(0, 5).map((job) => {
                const cfg = jobStatusConfig(job.status);
                return (
                  <div key={job.id} className="flex items-center gap-3 text-xs bg-gray-50 rounded-lg px-3 py-2">
                    <span className={cn('badge text-xs flex items-center gap-1 shrink-0', cfg.color)}>
                      {cfg.icon} {cfg.label}
                    </span>
                    <span className="text-gray-500">{formatRelative(job.enqueuedAt)}</span>
                    <span className="text-gray-400">•</span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <span className="capitalize">{job.triggeredBy}</span>
                    </span>
                    {job.result && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-green-600 font-medium">{job.result.passed}✓</span>
                        {job.result.failed > 0 && <span className="text-red-600 font-medium">{job.result.failed}✗</span>}
                        {job.result.flaky > 0 && <span className="text-yellow-600 font-medium">{job.result.flaky}⚡</span>}
                      </>
                    )}
                    <span className="ml-auto text-gray-400">{formatDuration(job.duration)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<SchedulerDashboardStats | null>(null);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [scheduleJobs, setScheduleJobs] = useState<Record<string, Job[]>>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [triggering, setTriggering] = useState<Set<string>>(new Set());
  const { toasts, toast, dismiss } = useToast();

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    try {
      const [schRes, queueRes] = await Promise.all([
        fetch('/api/schedules'),
        fetch('/api/queue/jobs'),
      ]);
      const schData = await schRes.json();
      const queueData = await queueRes.json();

      setSchedules(schData.schedules ?? []);
      setStats(schData.stats ?? null);
      setJobs(queueData.jobs ?? []);
      setQueueStats(queueData.stats ?? null);

      // Group jobs by schedule
      const grouped: Record<string, Job[]> = {};
      for (const job of queueData.jobs ?? []) {
        if (!grouped[job.scheduleId]) grouped[job.scheduleId] = [];
        grouped[job.scheduleId].push(job);
      }
      setScheduleJobs(grouped);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 8000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleTrigger = async (id: string) => {
    setTriggering((s) => new Set([...s, id]));
    try {
      const res = await fetch(`/api/schedules/${id}/trigger`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      toast('Job queued — will run shortly', 'success');
      setTimeout(fetchAll, 1500);
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Error', 'error');
    } finally {
      setTriggering((s) => { const n = new Set(s); n.delete(id); return n; });
    }
  };

  const handleTogglePause = async (id: string) => {
    try {
      const res = await fetch(`/api/schedules/${id}/pause`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      toast(data.action === 'paused' ? 'Schedule paused' : 'Schedule resumed', 'success');
      setSchedules((prev) => prev.map((s) => s.id === id ? data.schedule : s));
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Error', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this schedule? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast('Schedule deleted', 'info');
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Error', 'error');
    }
  };

  const handleExpand = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  const filteredSchedules = schedules.filter((s) =>
    statusFilter === 'all' ? true : s.status === statusFilter,
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium pointer-events-auto',
              t.type === 'success' && 'bg-green-600 text-white',
              t.type === 'error'   && 'bg-red-600 text-white',
              t.type === 'warning' && 'bg-amber-500 text-white',
              t.type === 'info'    && 'bg-gray-800 text-white',
            )}
          >
            {t.type === 'success' && <CheckCircle className="h-4 w-4 shrink-0" />}
            {t.type === 'error'   && <XCircle className="h-4 w-4 shrink-0" />}
            {t.type === 'warning' && <AlertTriangle className="h-4 w-4 shrink-0" />}
            {t.message}
            <button onClick={() => dismiss(t.id)} className="ml-1 opacity-70 hover:opacity-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={(s) => { setSchedules((prev) => [s, ...prev]); fetchAll(); }}
          toast={toast}
        />
      )}

      <Header
        title="Test Scheduler"
        subtitle="Automate and monitor your Playwright test runs"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAll}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus className="h-4 w-4" /> New Schedule
            </button>
          </div>
        }
      />

      <div className="flex-1 p-6 space-y-6">

        {/* ── Stats row ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <StatCard
            label="Active Schedules"
            value={stats?.activeSchedules ?? 0}
            sub={`${stats?.pausedSchedules ?? 0} paused`}
            icon={<Calendar className="h-5 w-5 text-blue-600" />}
            color="bg-blue-50"
          />
          <StatCard
            label="Queued Jobs"
            value={stats?.queuedJobs ?? 0}
            sub={`${stats?.runningJobs ?? 0} running`}
            icon={<Layers className="h-5 w-5 text-purple-600" />}
            color="bg-purple-50"
          />
          <StatCard
            label="Completed Today"
            value={stats?.completedToday ?? 0}
            icon={<CheckCircle className="h-5 w-5 text-green-600" />}
            color="bg-green-50"
          />
          <StatCard
            label="Failed Today"
            value={stats?.failedToday ?? 0}
            icon={<XCircle className="h-5 w-5 text-red-600" />}
            color="bg-red-50"
          />
          <StatCard
            label="Success Rate"
            value={`${stats?.successRate ?? 100}%`}
            sub="all time"
            icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
            color="bg-emerald-50"
          />
          <StatCard
            label="Avg Duration"
            value={formatDuration(queueStats?.avgDuration ?? null)}
            sub="per run"
            icon={<Timer className="h-5 w-5 text-orange-600" />}
            color="bg-orange-50"
          />
        </div>

        <div className="flex gap-6">
          {/* ── Left: Schedules ─────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Filter + count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                {(['all', 'active', 'paused'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors',
                      statusFilter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700',
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400">
                {filteredSchedules.length} schedule{filteredSchedules.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Schedule list */}
            {loading ? (
              <div className="card p-12 flex items-center justify-center gap-3 text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading schedules…</span>
              </div>
            ) : filteredSchedules.length === 0 ? (
              <div className="card p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-600 mb-1">No schedules yet</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Create your first automated test schedule to get started.
                </p>
                <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
                  <Plus className="h-4 w-4 mr-1 inline" /> New Schedule
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSchedules.map((schedule) => (
                  <ScheduleRow
                    key={schedule.id}
                    schedule={schedule}
                    onTrigger={handleTrigger}
                    onTogglePause={handleTogglePause}
                    onDelete={handleDelete}
                    expanded={expandedId === schedule.id}
                    onExpand={handleExpand}
                    recentJobs={scheduleJobs[schedule.id] ?? []}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Queue monitor ─────────────────────────────────────────── */}
          <div className="w-72 shrink-0 space-y-4">
            {/* Queue stats */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4 text-blue-500" /> Queue Monitor
                </h3>
                <span className="text-xs text-gray-400">live</span>
              </div>
              {queueStats && (
                <div className="space-y-2">
                  {[
                    { label: 'Waiting',   value: queueStats.waiting,   color: 'bg-gray-200',  bar: 'bg-gray-500' },
                    { label: 'Active',    value: queueStats.active,    color: 'bg-blue-100',  bar: 'bg-blue-500' },
                    { label: 'Completed', value: queueStats.completed, color: 'bg-green-100', bar: 'bg-green-500' },
                    { label: 'Failed',    value: queueStats.failed,    color: 'bg-red-100',   bar: 'bg-red-500' },
                    { label: 'Delayed',   value: queueStats.delayed,   color: 'bg-yellow-100', bar: 'bg-yellow-500' },
                  ].map(({ label, value, color, bar }) => {
                    const total = queueStats.totalProcessed + queueStats.waiting + queueStats.active + queueStats.delayed;
                    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                    return (
                      <div key={label}>
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="text-gray-600">{label}</span>
                          <span className="font-semibold text-gray-800">{value}</span>
                        </div>
                        <div className={cn('w-full rounded-full h-1.5', color)}>
                          <div className={cn('h-1.5 rounded-full transition-all', bar)} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Success rate</span>
                    <span className={cn('font-bold', queueStats.successRate >= 80 ? 'text-green-600' : 'text-red-500')}>
                      {queueStats.successRate}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Recent jobs */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-purple-500" /> Recent Jobs
                </h3>
              </div>
              <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                {jobs.length === 0 ? (
                  <p className="text-xs text-gray-400 p-4 text-center">No jobs yet</p>
                ) : (
                  jobs.slice(0, 15).map((job) => {
                    const cfg = jobStatusConfig(job.status);
                    return (
                      <div key={job.id} className="px-4 py-2.5 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">{job.scheduleName}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={cn('badge text-xs flex items-center gap-0.5', cfg.color)}>
                                {cfg.icon} {cfg.label}
                              </span>
                              <span className="text-xs text-gray-400">{formatRelative(job.enqueuedAt)}</span>
                            </div>
                          </div>
                          {job.duration && (
                            <span className="text-xs text-gray-400 shrink-0">{formatDuration(job.duration)}</span>
                          )}
                        </div>
                        {job.result && (
                          <div className="flex gap-2 mt-1 text-xs">
                            <span className="text-green-600">{job.result.passed}✓</span>
                            {job.result.failed > 0 && <span className="text-red-500">{job.result.failed}✗</span>}
                            {job.result.flaky > 0 && <span className="text-amber-500">{job.result.flaky}⚡</span>}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Notification status */}
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5 mb-3">
                <Bell className="h-4 w-4 text-amber-500" /> Notifications
              </h3>
              <div className="space-y-2 text-xs">
                {[
                  { label: 'Slack', icon: <Hash className="h-3 w-3" />, configured: schedules.some((s) => s.notifications.slack?.enabled && s.notifications.slack?.webhookUrl) },
                  { label: 'Teams', icon: <MessageSquare className="h-3 w-3" />, configured: schedules.some((s) => s.notifications.teams?.enabled && s.notifications.teams?.webhookUrl) },
                  { label: 'Email', icon: <Mail className="h-3 w-3" />, configured: schedules.some((s) => s.notifications.email?.enabled && (s.notifications.email?.recipients?.length ?? 0) > 0) },
                ].map(({ label, icon, configured }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-600">{icon} {label}</span>
                    {configured ? (
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <CheckCircle className="h-3 w-3" /> Configured
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-400">
                        <BellOff className="h-3 w-3" /> Not set
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
