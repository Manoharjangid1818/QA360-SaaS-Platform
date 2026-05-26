import { useState, useCallback, useRef } from 'react';
import Header from '@/components/header';
import { cn } from '@/lib/utils';
import { formatNextRun, describeCron, validateCronExpression } from '@/lib/cron-utils';
import { FREQUENCY_PRESETS, PROJECTS, TEST_SUITES } from '@/types/schedules';
import type { Schedule, ScheduleFrequency, Browser, Environment, CreateScheduleInput } from '@/types/schedules';
import {
  Calendar, Play, Pause, Trash2, Plus, RefreshCw, CheckCircle, XCircle, Clock,
  AlertTriangle, Activity, Zap, ChevronDown, X, Bell, BellOff, RotateCcw,
  Timer, Globe, Server, Monitor, Loader2, Settings,
} from 'lucide-react';

const mockSchedules: Schedule[] = [
  {
    id: 's-1', name: 'Nightly Regression', description: 'Full regression suite every night', project: 'QA360 Web', environment: 'staging', browser: 'chromium', testSuite: 'regression', frequency: 'daily', cronExpression: '0 0 * * *', cronHuman: 'Every day at 00:00', status: 'active', parallelWorkers: 2, retryOnFailure: true, maxRetries: 2, timeoutMinutes: 60, notifications: { email: { enabled: true, recipients: ['qa@example.com'], on: ['failed'] } }, tags: ['nightly', 'regression'], createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString(), nextRunAt: new Date(Date.now() + 3 * 3600000).toISOString(), lastRunAt: new Date(Date.now() - 21 * 3600000).toISOString(), lastRunStatus: 'completed', totalRuns: 14, successRuns: 12, failedRuns: 2,
  },
  {
    id: 's-2', name: 'Smoke Tests - Hourly', description: 'Quick smoke tests every hour', project: 'API Services', environment: 'production', browser: 'chromium', testSuite: 'smoke', frequency: 'custom', cronExpression: '0 * * * *', cronHuman: 'Every hour', status: 'active', parallelWorkers: 1, retryOnFailure: false, maxRetries: 0, timeoutMinutes: 10, notifications: {}, tags: ['smoke', 'production'], createdAt: new Date(Date.now() - 14 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(), nextRunAt: new Date(Date.now() + 1800000).toISOString(), lastRunAt: new Date(Date.now() - 1800000).toISOString(), lastRunStatus: 'completed', totalRuns: 336, successRuns: 330, failedRuns: 6,
  },
  {
    id: 's-3', name: 'Weekly Auth Tests', project: 'QA360 Web', environment: 'development', browser: 'firefox', testSuite: 'auth', frequency: 'weekly', cronExpression: '0 0 * * 1', cronHuman: 'Every Monday at 00:00', status: 'paused', parallelWorkers: 1, retryOnFailure: true, maxRetries: 1, timeoutMinutes: 30, notifications: {}, tags: ['auth', 'weekly'], createdAt: new Date(Date.now() - 30 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(), nextRunAt: null, lastRunAt: new Date(Date.now() - 7 * 86400000).toISOString(), lastRunStatus: 'failed', totalRuns: 4, successRuns: 2, failedRuns: 2,
  },
];

const statusConfig = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  paused: { label: 'Paused', color: 'bg-yellow-100 text-yellow-700', icon: <Pause className="h-3.5 w-3.5" /> },
  disabled: { label: 'Disabled', color: 'bg-gray-100 text-gray-600', icon: <X className="h-3.5 w-3.5" /> },
};

const browserIcons: Record<Browser, React.ReactNode> = {
  chromium: <Globe className="h-3.5 w-3.5" />,
  firefox: <Globe className="h-3.5 w-3.5 text-orange-500" />,
  webkit: <Monitor className="h-3.5 w-3.5 text-gray-500" />,
};

const envColors: Record<Environment, string> = {
  development: 'bg-gray-100 text-gray-600',
  staging: 'bg-blue-100 text-blue-700',
  production: 'bg-red-100 text-red-700',
};

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>(mockSchedules);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<CreateScheduleInput>>({
    name: '', project: PROJECTS[0], environment: 'staging', browser: 'chromium', testSuite: TEST_SUITES[0],
    frequency: 'daily', cronExpression: '0 0 * * *', status: 'active', parallelWorkers: 1,
    retryOnFailure: false, maxRetries: 1, timeoutMinutes: 30, tags: [], notifications: {},
  });
  const [cronError, setCronError] = useState('');

  const handleCronChange = (expr: string) => {
    setForm((prev) => ({ ...prev, cronExpression: expr }));
    const { valid, error } = validateCronExpression(expr);
    setCronError(valid ? '' : (error || 'Invalid expression'));
  };

  const handleFrequencyChange = (freq: ScheduleFrequency) => {
    const preset = FREQUENCY_PRESETS.find((p) => p.value === freq);
    setForm((prev) => ({ ...prev, frequency: freq, cronExpression: preset?.cron || prev.cronExpression }));
    setCronError('');
  };

  const handleSave = () => {
    if (!form.name?.trim() || !form.cronExpression) return;
    const { valid } = validateCronExpression(form.cronExpression);
    if (!valid) return;
    const now = new Date().toISOString();
    const newSched: Schedule = {
      id: Math.random().toString(36).substr(2, 9),
      name: form.name!,
      description: form.description,
      project: form.project!,
      environment: form.environment!,
      browser: form.browser!,
      testSuite: form.testSuite!,
      frequency: form.frequency!,
      cronExpression: form.cronExpression!,
      cronHuman: describeCron(form.cronExpression!),
      status: form.status!,
      parallelWorkers: form.parallelWorkers!,
      retryOnFailure: form.retryOnFailure!,
      maxRetries: form.maxRetries!,
      timeoutMinutes: form.timeoutMinutes!,
      notifications: form.notifications!,
      tags: form.tags!,
      createdAt: now, updatedAt: now,
      nextRunAt: new Date(Date.now() + 3600000).toISOString(),
      lastRunAt: null, lastRunStatus: null,
      totalRuns: 0, successRuns: 0, failedRuns: 0,
    };
    setSchedules((prev) => [newSched, ...prev]);
    setShowModal(false);
  };

  const toggleStatus = (id: string) => {
    setSchedules((prev) => prev.map((s) => s.id === id ? {
      ...s, status: s.status === 'active' ? 'paused' : 'active',
    } : s));
  };

  const handleDelete = () => {
    if (deleteId) setSchedules((prev) => prev.filter((s) => s.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <div>
      <Header
        title="Test Scheduler"
        subtitle={`${schedules.filter((s) => s.status === 'active').length} active schedules`}
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> New Schedule
          </button>
        }
      />
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Schedules', value: schedules.length, icon: <Calendar className="h-5 w-5" />, color: 'text-blue-600 bg-blue-100' },
            { label: 'Active', value: schedules.filter((s) => s.status === 'active').length, icon: <Activity className="h-5 w-5" />, color: 'text-green-600 bg-green-100' },
            { label: 'Paused', value: schedules.filter((s) => s.status === 'paused').length, icon: <Pause className="h-5 w-5" />, color: 'text-yellow-600 bg-yellow-100' },
          ].map((stat) => (
            <div key={stat.label} className="card p-4 flex items-center gap-4">
              <div className={cn('p-2.5 rounded-lg', stat.color)}>{stat.icon}</div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {schedules.map((s) => {
            const cfg = statusConfig[s.status];
            const successRate = s.totalRuns > 0 ? Math.round((s.successRuns / s.totalRuns) * 100) : 0;
            return (
              <div key={s.id} className="card p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <span className={cn('badge flex items-center gap-1', cfg.color)}>{cfg.icon}{cfg.label}</span>
                      <span className={cn('badge capitalize', envColors[s.environment])}>{s.environment}</span>
                      <span className="badge bg-gray-100 text-gray-600 flex items-center gap-1">{browserIcons[s.browser]}{s.browser}</span>
                    </div>
                    <h3 className="font-medium text-gray-900">{s.name}</h3>
                    {s.description && <p className="text-sm text-gray-500 truncate mt-0.5">{s.description}</p>}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{describeCron(s.cronExpression)}</span>
                      <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5" />Next: {formatNextRun(s.nextRunAt)}</span>
                      {s.totalRuns > 0 && <span className="flex items-center gap-1"><Activity className="h-3.5 w-3.5" />{successRate}% success ({s.totalRuns} runs)</span>}
                      <span>{s.project} — {s.testSuite}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleStatus(s.id)} className={cn('p-1.5 rounded-lg transition-colors', s.status === 'active' ? 'text-yellow-500 hover:bg-yellow-50' : 'text-green-500 hover:bg-green-50')}>
                      {s.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <button onClick={() => setDeleteId(s.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">New Schedule</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="label">Name *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nightly Regression" /></div>
                <div><label className="label">Project</label><select className="input" value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}>{PROJECTS.map((p) => <option key={p}>{p}</option>)}</select></div>
                <div><label className="label">Test Suite</label><select className="input" value={form.testSuite} onChange={(e) => setForm({ ...form, testSuite: e.target.value })}>{TEST_SUITES.map((s) => <option key={s}>{s}</option>)}</select></div>
                <div><label className="label">Environment</label><select className="input" value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value as Environment })}><option value="development">Development</option><option value="staging">Staging</option><option value="production">Production</option></select></div>
                <div><label className="label">Browser</label><select className="input" value={form.browser} onChange={(e) => setForm({ ...form, browser: e.target.value as Browser })}><option value="chromium">Chromium</option><option value="firefox">Firefox</option><option value="webkit">WebKit</option></select></div>
              </div>
              <div>
                <label className="label">Frequency</label>
                <div className="flex flex-wrap gap-2">
                  {FREQUENCY_PRESETS.map((p) => (
                    <button key={p.value} onClick={() => handleFrequencyChange(p.value)} className={cn('px-3 py-1.5 text-sm rounded-lg border transition-colors', form.frequency === p.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300')}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Cron Expression</label>
                <input className={cn('input', cronError ? 'border-red-400' : '')} value={form.cronExpression} onChange={(e) => handleCronChange(e.target.value)} placeholder="0 0 * * *" />
                {cronError ? <p className="text-xs text-red-600 mt-1">{cronError}</p> : <p className="text-xs text-gray-500 mt-1">{describeCron(form.cronExpression || '')}</p>}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="label">Parallel Workers</label><input type="number" min={1} max={8} className="input" value={form.parallelWorkers} onChange={(e) => setForm({ ...form, parallelWorkers: parseInt(e.target.value) || 1 })} /></div>
                <div><label className="label">Timeout (min)</label><input type="number" min={5} max={120} className="input" value={form.timeoutMinutes} onChange={(e) => setForm({ ...form, timeoutMinutes: parseInt(e.target.value) || 30 })} /></div>
                <div className="flex flex-col justify-end"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.retryOnFailure} onChange={(e) => setForm({ ...form, retryOnFailure: e.target.checked })} className="rounded" /><span className="text-sm text-gray-700">Retry on failure</span></label></div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={!form.name?.trim() || !!cronError} className="btn-primary disabled:opacity-50">Create Schedule</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Schedule?</h2>
            <p className="text-sm text-gray-500 mb-6">This will stop all future scheduled runs.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
