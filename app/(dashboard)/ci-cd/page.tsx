'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Header from '@/components/header';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Github, GitBranch, CheckCircle, XCircle, Clock,
  AlertTriangle, RefreshCw, Plus, X, ExternalLink,
  Zap, Loader2, ChevronDown, ChevronUp, TrendingUp,
  TrendingDown, Minus, Activity, Server, Settings,
  Rocket, FlameKindling, BarChart3, Shield, Unplug,
  Play,
} from 'lucide-react';
import type {
  Connection, Pipeline, CICDStats, FlakyTest,
  Provider, ConnectInput,
} from '@/types/cicd';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Toast { id: number; message: string; type: 'success' | 'error' | 'info' | 'warning'; }
interface PageData {
  connections: Connection[];
  stats: CICDStats | null;
  pipelines: Pipeline[];
  flakyTests: FlakyTest[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const toast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = idRef.current++;
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4500);
  }, []);
  const dismiss = useCallback((id: number) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  return { toasts, toast, dismiss };
}

const STATUS_CFG = {
  success:   { label: 'Passed',    color: 'bg-green-100 text-green-700',  dot: 'bg-green-500',  icon: <CheckCircle className="h-3.5 w-3.5" /> },
  failed:    { label: 'Failed',    color: 'bg-red-100 text-red-700',      dot: 'bg-red-500',    icon: <XCircle className="h-3.5 w-3.5" /> },
  running:   { label: 'Running',   color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500',   icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
  pending:   { label: 'Pending',   color: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400',   icon: <Clock className="h-3.5 w-3.5" /> },
  cancelled: { label: 'Cancelled', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500', icon: <X className="h-3.5 w-3.5" /> },
  skipped:   { label: 'Skipped',   color: 'bg-gray-100 text-gray-500',    dot: 'bg-gray-300',   icon: <Minus className="h-3.5 w-3.5" /> },
} as const;

const PROVIDER_CFG = {
  github:  { label: 'GitHub Actions', color: '#1f2937', bgColor: 'bg-gray-900', textColor: 'text-white', accent: '#6ee7b7' },
  jenkins: { label: 'Jenkins',        color: '#D24939', bgColor: 'bg-red-600',  textColor: 'text-white', accent: '#fca5a5' },
  gitlab:  { label: 'GitLab CI',      color: '#FC6D26', bgColor: 'bg-orange-500', textColor: 'text-white', accent: '#fed7aa' },
} as const;

const PIE_COLORS = ['#1f2937', '#D24939', '#FC6D26'];

function ProviderIcon({ provider, size = 'md' }: { provider: Provider; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
  if (provider === 'github') return <Github className={sz} />;
  if (provider === 'jenkins') return <Server className={sz} />;
  return <GitBranch className={sz} />;
}

function formatDuration(ms: number | null): string {
  if (!ms) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function shortDate(iso: string): string {
  return iso.slice(5, 10).replace('-', '/');
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, color, trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string; trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="card p-4 flex items-start gap-3">
      <div className={cn('p-2 rounded-lg shrink-0', color)}>{icon}</div>
      <div className="min-w-0">
        <div className="flex items-end gap-1.5">
          <p className="text-xl font-bold text-gray-900">{value}</p>
          {trend && (
            <span className={cn('text-xs mb-0.5', trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-gray-400')}>
              {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : trend === 'down' ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            </span>
          )}
        </div>
        <p className="text-xs font-medium text-gray-700">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Connect modal ────────────────────────────────────────────────────────────

function ConnectModal({ provider, onClose, onConnected, toast }: {
  provider: Provider;
  onClose: () => void;
  onConnected: (c: Connection) => void;
  toast: (m: string, t?: Toast['type']) => void;
}) {
  const cfg = PROVIDER_CFG[provider];
  const [form, setForm] = useState<Partial<ConnectInput>>({ provider, name: cfg.label });
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof ConnectInput>(k: K, v: ConnectInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.token?.trim()) { toast('API token is required', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/cicd/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to connect');
      toast(`Connected to ${cfg.label}! Syncing pipelines…`, 'success');
      onConnected(data.connection);
      onClose();
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Error', 'error');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-5 border-b border-gray-100">
          <div className={cn('p-2 rounded-lg', cfg.bgColor, cfg.textColor)}>
            <ProviderIcon provider={provider} size="md" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Connect {cfg.label}</h2>
            <p className="text-xs text-gray-500">Tokens are stored in-memory only</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="label">Connection Name</label>
            <input className="input" value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} placeholder={cfg.label} />
          </div>

          <div>
            <label className="label">
              {provider === 'jenkins' ? 'API Token' : 'Personal Access Token'} <span className="text-red-500">*</span>
            </label>
            <input type="password" className="input font-mono" value={form.token ?? ''} onChange={(e) => set('token', e.target.value)}
              placeholder={provider === 'github' ? 'ghp_...' : provider === 'gitlab' ? 'glpat-...' : 'your-api-token'} />
          </div>

          {provider === 'github' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Owner / Org <span className="text-red-500">*</span></label>
                <input className="input" placeholder="my-org" value={form.owner ?? ''} onChange={(e) => set('owner', e.target.value)} />
              </div>
              <div>
                <label className="label">Repository <span className="text-red-500">*</span></label>
                <input className="input" placeholder="my-repo" value={form.repo ?? ''} onChange={(e) => set('repo', e.target.value)} />
              </div>
            </div>
          )}

          {provider === 'jenkins' && (
            <>
              <div>
                <label className="label">Jenkins URL <span className="text-red-500">*</span></label>
                <input className="input" placeholder="https://jenkins.example.com" value={form.url ?? ''} onChange={(e) => set('url', e.target.value)} />
              </div>
              <div>
                <label className="label">Username <span className="text-red-500">*</span></label>
                <input className="input" placeholder="admin" value={form.username ?? ''} onChange={(e) => set('username', e.target.value)} />
              </div>
              <div>
                <label className="label">Job Name (optional)</label>
                <input className="input" placeholder="Leave blank to fetch all jobs" value={form.jobName ?? ''} onChange={(e) => set('jobName', e.target.value)} />
              </div>
            </>
          )}

          {provider === 'gitlab' && (
            <>
              <div>
                <label className="label">Project ID or Namespace <span className="text-red-500">*</span></label>
                <input className="input" placeholder="12345 or my-group/my-project" value={form.projectId ?? ''} onChange={(e) => set('projectId', e.target.value)} />
              </div>
              <div>
                <label className="label">GitLab URL (optional)</label>
                <input className="input" placeholder="https://gitlab.com" value={form.gitlabUrl ?? ''} onChange={(e) => set('gitlabUrl', e.target.value)} />
              </div>
            </>
          )}

          <div className="flex items-start gap-2 bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
            <Shield className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Tokens are only held in-memory for this session. For production, set <code className="font-mono">GITHUB_TOKEN</code>, <code className="font-mono">JENKINS_TOKEN</code>, or <code className="font-mono">GITLAB_TOKEN</code> as environment variables.</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary text-sm flex items-center gap-2">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            {saving ? 'Connecting…' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Provider card ────────────────────────────────────────────────────────────

function ProviderCard({ provider, connection, onConnect, onDisconnect, onSync, syncing }: {
  provider: Provider;
  connection?: Connection;
  onConnect: () => void;
  onDisconnect: (id: string) => void;
  onSync: (id: string) => void;
  syncing: boolean;
}) {
  const cfg = PROVIDER_CFG[provider];
  const isConnected = !!connection;

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('p-2.5 rounded-xl', cfg.bgColor, cfg.textColor)}>
            <ProviderIcon provider={provider} size="lg" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{cfg.label}</h3>
            {isConnected ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn(
                  'w-2 h-2 rounded-full',
                  connection.status === 'connected' ? 'bg-green-500' :
                  connection.status === 'syncing' ? 'bg-blue-500 animate-pulse' :
                  connection.status === 'error' ? 'bg-red-500' : 'bg-gray-400',
                )} />
                <span className="text-xs text-gray-600 capitalize">{connection.status}</span>
              </div>
            ) : (
              <span className="text-xs text-gray-400">Not connected</span>
            )}
          </div>
        </div>

        {isConnected ? (
          <div className="flex items-center gap-1">
            <button onClick={() => onSync(connection.id)} disabled={syncing} title="Sync now"
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <RefreshCw className={cn('h-3.5 w-3.5', syncing && 'animate-spin')} />
            </button>
            <button onClick={() => onDisconnect(connection.id)} title="Disconnect"
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <Unplug className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button onClick={onConnect} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
            <Plus className="h-3 w-3" /> Connect
          </button>
        )}
      </div>

      {isConnected && (
        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-500">
          <div>
            <p className="text-gray-900 font-semibold">{connection.pipelineCount || '—'}</p>
            <p>Pipelines</p>
          </div>
          <div>
            <p className="text-gray-900 font-semibold">
              {connection.lastSyncAt ? formatRelative(connection.lastSyncAt) : 'Never'}
            </p>
            <p>Last sync</p>
          </div>
          {connection.error && (
            <div className="col-span-2 bg-red-50 rounded p-2 text-red-600">
              <AlertTriangle className="h-3 w-3 inline mr-1" />{connection.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Pipeline row ──────────────────────────────────────────────────────────────

function PipelineRow({ pipeline, expanded, onExpand }: {
  pipeline: Pipeline;
  expanded: boolean;
  onExpand: () => void;
}) {
  const st = STATUS_CFG[pipeline.status] ?? STATUS_CFG.pending;
  const pCfg = PROVIDER_CFG[pipeline.provider];

  return (
    <div className={cn('border-b border-gray-50 last:border-0', expanded && 'bg-blue-50/30')}>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onExpand}
      >
        {/* Provider badge */}
        <div className={cn('p-1 rounded shrink-0', pCfg.bgColor, pCfg.textColor)}>
          <ProviderIcon provider={pipeline.provider} size="sm" />
        </div>

        {/* Status */}
        <span className={cn('badge text-xs flex items-center gap-1 shrink-0', st.color)}>
          {st.icon} {st.label}
        </span>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-800 truncate">{pipeline.pipelineName}</span>
            <span className="text-xs text-gray-400 font-mono">{pipeline.ref}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
            <span className="font-mono text-gray-400">{pipeline.commit}</span>
            <span className="truncate max-w-48">{pipeline.commitMessage}</span>
          </div>
        </div>

        {/* Test results */}
        {pipeline.testResults && (
          <div className="hidden md:flex items-center gap-2 text-xs shrink-0">
            <span className="text-green-600 font-medium">{pipeline.testResults.passed}✓</span>
            {pipeline.testResults.failed > 0 && <span className="text-red-500 font-medium">{pipeline.testResults.failed}✗</span>}
            {pipeline.testResults.flaky > 0 && <span className="text-amber-500 font-medium">{pipeline.testResults.flaky}⚡</span>}
          </div>
        )}

        {/* Meta */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-gray-400 shrink-0">
          <span>{pipeline.author}</span>
          <span>{formatDuration(pipeline.duration)}</span>
          <span>{formatRelative(pipeline.startedAt)}</span>
          {pipeline.url && (
            <a href={pipeline.url} target="_blank" rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700" onClick={(e) => e.stopPropagation()}>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <button className="text-gray-400 shrink-0">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Expanded jobs */}
      {expanded && pipeline.jobs.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Jobs</p>
          <div className="space-y-1">
            {pipeline.jobs.map((job) => {
              const jst = STATUS_CFG[job.status] ?? STATUS_CFG.pending;
              return (
                <div key={job.id} className="flex items-center gap-3 text-xs bg-white rounded-lg px-3 py-2 border border-gray-100">
                  <span className={cn('badge text-xs flex items-center gap-1', jst.color)}>{jst.icon} {jst.label}</span>
                  <span className="font-medium text-gray-700">{job.name}</span>
                  <span className="ml-auto text-gray-400">{formatDuration(job.duration)}</span>
                  {job.failureReason && (
                    <span className="text-red-500 max-w-48 truncate">{job.failureReason}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Flaky test row ───────────────────────────────────────────────────────────

function FlakyTestRow({ test }: { test: FlakyTest }) {
  const trendCfg = test.trend === 'worsening'
    ? { icon: <TrendingDown className="h-3.5 w-3.5" />, color: 'text-red-600' }
    : test.trend === 'improving'
    ? { icon: <TrendingUp className="h-3.5 w-3.5" />, color: 'text-green-600' }
    : { icon: <Minus className="h-3.5 w-3.5" />, color: 'text-gray-400' };

  const failPct = Math.round(test.failureRate * 100);
  const barColor = failPct >= 40 ? 'bg-red-500' : failPct >= 20 ? 'bg-amber-500' : 'bg-yellow-400';

  return (
    <div className="flex items-start gap-4 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
      <div className={cn('p-1 rounded shrink-0 mt-0.5', PROVIDER_CFG[test.provider].bgColor, PROVIDER_CFG[test.provider].textColor)}>
        <ProviderIcon provider={test.provider} size="sm" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{test.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">{test.suite}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {test.impactedTestCases.map((tc) => (
            <span key={tc} className="badge bg-orange-50 text-orange-700 text-xs">{tc}</span>
          ))}
          {test.affectedBranches.map((b) => (
            <span key={b} className="badge bg-gray-100 text-gray-600 text-xs font-mono">{b}</span>
          ))}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className="flex items-center gap-2 justify-end mb-1">
          <span className={cn('flex items-center gap-1 text-xs font-medium', trendCfg.color)}>
            {trendCfg.icon} {test.trend}
          </span>
          <span className="text-sm font-bold text-gray-900">{failPct}%</span>
        </div>
        <div className="w-24 h-1.5 bg-gray-200 rounded-full">
          <div className={cn('h-1.5 rounded-full', barColor)} style={{ width: `${failPct}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-1">{test.failCount}/{test.totalRuns} fails · {formatRelative(test.lastSeen)}</p>
      </div>
    </div>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-semibold text-gray-900">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CICDPage() {
  const [data, setData] = useState<PageData>({ connections: [], stats: null, pipelines: [], flakyTests: [] });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<Set<string>>(new Set());
  const [connectingProvider, setConnectingProvider] = useState<Provider | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<'all' | Provider>('all');
  const [showFlaky, setShowFlaky] = useState(true);
  const { toasts, toast, dismiss } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/cicd');
      const d = await res.json();
      setData(d);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 15000);
    return () => clearInterval(iv);
  }, [fetchData]);

  const handleConnect = async (connection: Connection) => {
    setData((d) => ({
      ...d,
      connections: [...d.connections.filter((c) => c.provider !== connection.provider), connection],
    }));
    setTimeout(fetchData, 3000);
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm('Disconnect this provider? All cached pipeline data will be removed.')) return;
    try {
      const res = await fetch('/api/cicd/disconnect', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: id }),
      });
      if (!res.ok) throw new Error('Disconnect failed');
      toast('Provider disconnected', 'info');
      fetchData();
    } catch (e: unknown) { toast(e instanceof Error ? e.message : 'Error', 'error'); }
  };

  const handleSync = async (id: string) => {
    setSyncing((s) => new Set([...s, id]));
    try {
      const res = await fetch('/api/cicd/sync', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: id }),
      });
      const d = await res.json();
      if (d.success) { toast(`Synced ${d.count} pipelines`, 'success'); fetchData(); }
      else toast(`Sync error: ${d.error}`, 'error');
    } catch (e: unknown) { toast(e instanceof Error ? e.message : 'Error', 'error'); }
    finally { setSyncing((s) => { const n = new Set(s); n.delete(id); return n; }); }
  };

  const handleSyncAll = async () => {
    toast('Syncing all providers…', 'info');
    const res = await fetch('/api/cicd/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    const d = await res.json();
    if (d.results) toast('All providers synced', 'success');
    fetchData();
  };

  const { stats, pipelines, flakyTests, connections } = data;

  const connByProvider = (p: Provider) => connections.find((c) => c.provider === p);

  const filteredPipelines = pipelines.filter((p) =>
    activeProvider === 'all' ? true : p.provider === activeProvider,
  ).slice(0, 20);

  // Pie chart data — builds per provider
  const pieData = stats ? [
    { name: 'GitHub', value: stats.buildTrend.reduce((s, d) => s + d.github, 0) },
    { name: 'Jenkins', value: stats.buildTrend.reduce((s, d) => s + d.jenkins, 0) },
    { name: 'GitLab', value: stats.buildTrend.reduce((s, d) => s + d.gitlab, 0) },
  ] : [];

  // Build trend for chart (last 14 days)
  const trendData = stats?.buildTrend.slice(-14).map((d) => ({
    ...d,
    date: shortDate(d.date),
  })) ?? [];

  // Deploy trend
  const deployData = stats?.deployTrend ?? [];

  // Flaky trend (last 14 days)
  const flakyTrendData = stats?.flakyTrend.map((d) => ({
    date: shortDate(d.date),
    rate: d.flakyRate,
    count: d.occurrences,
  })) ?? [];

  return (
    <div className="flex flex-col min-h-screen">

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium pointer-events-auto',
            t.type === 'success' && 'bg-green-600 text-white',
            t.type === 'error'   && 'bg-red-600 text-white',
            t.type === 'warning' && 'bg-amber-500 text-white',
            t.type === 'info'    && 'bg-gray-800 text-white',
          )}>
            {t.type === 'success' && <CheckCircle className="h-4 w-4 shrink-0" />}
            {t.type === 'error'   && <XCircle className="h-4 w-4 shrink-0" />}
            {t.message}
            <button onClick={() => dismiss(t.id)} className="ml-1 opacity-70 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>

      {/* Connect modal */}
      {connectingProvider && (
        <ConnectModal
          provider={connectingProvider}
          onClose={() => setConnectingProvider(null)}
          onConnected={handleConnect}
          toast={toast}
        />
      )}

      <Header
        title="CI/CD Integrations"
        subtitle="Monitor pipelines across GitHub Actions, Jenkins, and GitLab CI"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={fetchData} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button onClick={handleSyncAll} className="btn-secondary text-sm flex items-center gap-1.5">
              <Zap className="h-4 w-4" /> Sync All
            </button>
          </div>
        }
      />

      <div className="flex-1 p-6 space-y-6">

        {/* ── Provider cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['github', 'jenkins', 'gitlab'] as Provider[]).map((p) => (
            <ProviderCard
              key={p}
              provider={p}
              connection={connByProvider(p)}
              onConnect={() => setConnectingProvider(p)}
              onDisconnect={handleDisconnect}
              onSync={handleSync}
              syncing={syncing.has(connByProvider(p)?.id ?? '')}
            />
          ))}
        </div>

        {/* ── Stats row ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3">
          <div className="xl:col-span-2">
            <StatCard label="Total Builds" value={stats?.totalBuilds ?? 0} sub="30-day window" icon={<Activity className="h-4 w-4 text-blue-600" />} color="bg-blue-50" trend="up" />
          </div>
          <div className="xl:col-span-2">
            <StatCard label="Success Rate" value={`${stats?.successRate ?? 0}%`} sub="all providers" icon={<CheckCircle className="h-4 w-4 text-green-600" />} color="bg-green-50" trend={stats && stats.successRate >= 80 ? 'up' : 'down'} />
          </div>
          <div className="xl:col-span-1">
            <StatCard label="Deploy / Week" value={stats?.deployFrequency ?? 0} sub="last 7 days" icon={<Rocket className="h-4 w-4 text-purple-600" />} color="bg-purple-50" />
          </div>
          <div className="xl:col-span-1">
            <StatCard label="Avg Build" value={formatDuration(stats?.avgBuildTime ?? null)} icon={<Clock className="h-4 w-4 text-orange-600" />} color="bg-orange-50" />
          </div>
          <div className="xl:col-span-1">
            <StatCard label="Flaky Tests" value={stats?.flakyTests ?? 0} icon={<FlameKindling className="h-4 w-4 text-amber-600" />} color="bg-amber-50" trend="down" />
          </div>
          <div className="xl:col-span-1">
            <StatCard label="Failed Builds" value={stats?.failedBuilds ?? 0} icon={<XCircle className="h-4 w-4 text-red-600" />} color="bg-red-50" />
          </div>
        </div>

        {/* ── Charts row ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Build trend — area chart */}
          <div className="xl:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Build Trend — Last 14 Days</h3>
                <p className="text-xs text-gray-400">Daily build outcomes across all providers</p>
              </div>
              <BarChart3 className="h-4 w-4 text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gradPassed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="passed" name="Passed" stroke="#22c55e" fill="url(#gradPassed)" strokeWidth={2} />
                <Area type="monotone" dataKey="failed" name="Failed" stroke="#ef4444" fill="url(#gradFailed)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Provider distribution — pie */}
          <div className="card p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-800">Build Distribution</h3>
              <p className="text-xs text-gray-400">By CI provider (30 days)</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                  dataKey="value" nameKey="name" paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number, n: string) => [`${v} builds`, n]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Second charts row ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          {/* Deploy frequency */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Deployment Frequency</h3>
                <p className="text-xs text-gray-400">Weekly deploys + success rate</p>
              </div>
              <Rocket className="h-4 w-4 text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={deployData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="deploys" name="Deploys" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Flaky test rate */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Flaky Test Rate</h3>
                <p className="text-xs text-gray-400">% of tests with intermittent failures (14 days)</p>
              </div>
              <FlameKindling className="h-4 w-4 text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={flakyTrendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} unit="%" />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="rate" name="Flaky %" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Recent pipelines table ─────────────────────────────────────────── */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" /> Recent Pipelines
            </h3>
            {/* Provider filter */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              {(['all', 'github', 'jenkins', 'gitlab'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setActiveProvider(p)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors',
                    activeProvider === p ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700',
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">Loading pipelines…</span>
            </div>
          ) : filteredPipelines.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No pipelines found</p>
            </div>
          ) : (
            <div>
              {filteredPipelines.map((p) => (
                <PipelineRow
                  key={p.id}
                  pipeline={p}
                  expanded={expandedId === p.id}
                  onExpand={() => setExpandedId(expandedId === p.id ? null : p.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Flaky test insights ────────────────────────────────────────────── */}
        <div className="card overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setShowFlaky((v) => !v)}
          >
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <FlameKindling className="h-4 w-4 text-amber-500" /> Flaky Test Insights
              <span className="badge bg-amber-100 text-amber-700 text-xs">{flakyTests.length} detected</span>
            </h3>
            {showFlaky ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </div>

          {showFlaky && (
            <>
              {flakyTests.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">No flaky tests detected</div>
              ) : (
                <div>
                  {/* Header row */}
                  <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                    <div className="col-span-6">Test / Suite</div>
                    <div className="col-span-3">Impacted Cases</div>
                    <div className="col-span-3 text-right">Failure Rate</div>
                  </div>
                  {flakyTests.map((t) => <FlakyTestRow key={t.id} test={t} />)}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Webhook info ────────────────────────────────────────────────────── */}
        <div className="card p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg shrink-0">
              <Zap className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Webhook Auto-Trigger</h3>
              <p className="text-xs text-gray-500 mb-3">
                QA360 can automatically trigger Playwright tests after a successful CI/CD deployment.
                Point your provider webhooks to the endpoint below.
              </p>
              <div className="flex flex-wrap gap-2">
                {(['github', 'jenkins', 'gitlab'] as Provider[]).map((p) => (
                  <div key={p} className="bg-gray-50 rounded-lg px-3 py-2 text-xs font-mono text-gray-600 flex items-center gap-2">
                    <ProviderIcon provider={p} size="sm" />
                    <span>{typeof window !== 'undefined' ? window.location.origin : ''}/api/cicd/webhook?provider={p}</span>
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
