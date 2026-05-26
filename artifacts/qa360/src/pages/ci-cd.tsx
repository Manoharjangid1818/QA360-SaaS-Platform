import { useState } from 'react';
import Header from '@/components/header';
import { cn } from '@/lib/utils';
import {
  Github, GitBranch, CheckCircle, XCircle, Clock, RefreshCw, Plus, X, ExternalLink,
  Loader2, ChevronDown, ChevronUp, Activity, Server, Settings, Rocket, Shield, Minus,
} from 'lucide-react';
import type { Connection, Pipeline, Provider } from '@/types/cicd';

const STATUS_CFG = {
  success:   { label: 'Passed',    color: 'bg-green-100 text-green-700',  icon: <CheckCircle className="h-3.5 w-3.5" /> },
  failed:    { label: 'Failed',    color: 'bg-red-100 text-red-700',      icon: <XCircle className="h-3.5 w-3.5" /> },
  running:   { label: 'Running',   color: 'bg-blue-100 text-blue-700',    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
  pending:   { label: 'Pending',   color: 'bg-gray-100 text-gray-600',    icon: <Clock className="h-3.5 w-3.5" /> },
  cancelled: { label: 'Cancelled', color: 'bg-yellow-100 text-yellow-700', icon: <X className="h-3.5 w-3.5" /> },
  skipped:   { label: 'Skipped',   color: 'bg-gray-100 text-gray-500',    icon: <Minus className="h-3.5 w-3.5" /> },
} as const;

const mockConnections: Connection[] = [
  { id: 'c-1', provider: 'github', name: 'qa360/web', maskedToken: 'ghp_***4a2f', config: { owner: 'qa360', repo: 'web' }, status: 'connected', lastSyncAt: new Date(Date.now() - 300000).toISOString(), pipelineCount: 12 },
  { id: 'c-2', provider: 'gitlab', name: 'qa360/api', maskedToken: 'glp_***7b9c', config: { projectId: '12345' }, status: 'connected', lastSyncAt: new Date(Date.now() - 1800000).toISOString(), pipelineCount: 5 },
];

const mockPipelines: Pipeline[] = [
  { id: 'p-1', provider: 'github', connectionId: 'c-1', connectionName: 'qa360/web', pipelineName: 'CI', ref: 'main', commit: 'a1b2c3d', commitMessage: 'feat: add AI test generator endpoint', author: 'alice', status: 'success', startedAt: new Date(Date.now() - 3600000).toISOString(), finishedAt: new Date(Date.now() - 3000000).toISOString(), duration: 360000, url: '#', jobs: [], testResults: { total: 45, passed: 43, failed: 2, skipped: 0, flaky: 1 } },
  { id: 'p-2', provider: 'github', connectionId: 'c-1', connectionName: 'qa360/web', pipelineName: 'CI', ref: 'feature/schedule-v2', commit: 'e4f5g6h', commitMessage: 'refactor: scheduler engine', author: 'bob', status: 'failed', startedAt: new Date(Date.now() - 7200000).toISOString(), finishedAt: new Date(Date.now() - 6600000).toISOString(), duration: 420000, url: '#', jobs: [], testResults: { total: 45, passed: 38, failed: 7, skipped: 0, flaky: 0 } },
  { id: 'p-3', provider: 'gitlab', connectionId: 'c-2', connectionName: 'qa360/api', pipelineName: 'pipeline', ref: 'main', commit: 'i7j8k9l', commitMessage: 'chore: update dependencies', author: 'carol', status: 'running', startedAt: new Date(Date.now() - 600000).toISOString(), finishedAt: null, duration: null, url: '#', jobs: [] },
  { id: 'p-4', provider: 'github', connectionId: 'c-1', connectionName: 'qa360/web', pipelineName: 'CI', ref: 'main', commit: 'm1n2o3p', commitMessage: 'fix: login redirect bug', author: 'alice', status: 'success', startedAt: new Date(Date.now() - 86400000).toISOString(), finishedAt: new Date(Date.now() - 85800000).toISOString(), duration: 300000, url: '#', jobs: [] },
];

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

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function CICDPage() {
  const [connections] = useState<Connection[]>(mockConnections);
  const [pipelines] = useState<Pipeline[]>(mockPipelines);
  const [expandedPipeline, setExpandedPipeline] = useState<string | null>(null);
  const [showConnect, setShowConnect] = useState(false);
  const [connectProvider, setConnectProvider] = useState<Provider>('github');

  const stats = {
    total: pipelines.length,
    successful: pipelines.filter((p) => p.status === 'success').length,
    failed: pipelines.filter((p) => p.status === 'failed').length,
    running: pipelines.filter((p) => p.status === 'running').length,
  };

  return (
    <div>
      <Header
        title="CI/CD Integrations"
        subtitle="Monitor pipelines across GitHub, GitLab, and Jenkins"
        actions={
          <button onClick={() => setShowConnect(true)} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> Connect Provider
          </button>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Pipelines', value: stats.total, color: 'text-gray-900' },
            { label: 'Successful', value: stats.successful, color: 'text-green-600' },
            { label: 'Failed', value: stats.failed, color: 'text-red-600' },
            { label: 'Running', value: stats.running, color: 'text-blue-600' },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className={cn('text-3xl font-bold mt-1', s.color)}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="card p-4">
          <h3 className="font-medium text-gray-900 mb-3">Connected Providers</h3>
          <div className="space-y-2">
            {connections.map((c) => (
              <div key={c.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="bg-gray-900 text-white p-2 rounded-lg">
                  <ProviderIcon provider={c.provider} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.pipelineCount} pipelines • Last synced {formatRelative(c.lastSyncAt)}</p>
                </div>
                <span className={cn('badge', c.status === 'connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>{c.status}</span>
                <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"><RefreshCw className="h-4 w-4" /></button>
                <button className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-medium text-gray-900 mb-3">Recent Pipelines</h3>
          <div className="space-y-2">
            {pipelines.map((p) => {
              const cfg = STATUS_CFG[p.status] || STATUS_CFG.pending;
              const isExpanded = expandedPipeline === p.id;
              return (
                <div key={p.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setExpandedPipeline(isExpanded ? null : p.id)}
                  >
                    <ProviderIcon provider={p.provider} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm truncate">{p.pipelineName} #{p.commit.substring(0, 7)}</span>
                        <span className={cn('badge flex items-center gap-1', cfg.color)}>{cfg.icon}{cfg.label}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{p.commitMessage} • {p.author} • {p.ref}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-500">{formatDuration(p.duration)}</p>
                      <p className="text-xs text-gray-400">{formatRelative(p.startedAt)}</p>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                  {isExpanded && p.testResults && (
                    <div className="border-t border-gray-200 p-3 bg-gray-50">
                      <p className="text-xs font-medium text-gray-600 mb-2">Test Results</p>
                      <div className="flex gap-4 text-sm">
                        <span className="text-gray-600">Total: <strong>{p.testResults.total}</strong></span>
                        <span className="text-green-600">Passed: <strong>{p.testResults.passed}</strong></span>
                        <span className="text-red-600">Failed: <strong>{p.testResults.failed}</strong></span>
                        {p.testResults.flaky > 0 && <span className="text-yellow-600">Flaky: <strong>{p.testResults.flaky}</strong></span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showConnect && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Connect CI/CD Provider</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Provider</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['github', 'gitlab', 'jenkins'] as Provider[]).map((p) => (
                    <button key={p} onClick={() => setConnectProvider(p)} className={cn('flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors capitalize', connectProvider === p ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300')}>
                      <ProviderIcon provider={p} size="lg" />
                      <span className="text-xs font-medium">{p}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="label">Connection Name</label><input className="input" placeholder="my-org/my-repo" /></div>
              <div><label className="label">Access Token</label><input type="password" className="input" placeholder="••••••••••••" /></div>
              {connectProvider === 'github' && (
                <>
                  <div><label className="label">Owner</label><input className="input" placeholder="github-org-or-username" /></div>
                  <div><label className="label">Repository</label><input className="input" placeholder="repo-name" /></div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowConnect(false)} className="btn-secondary">Cancel</button>
              <button onClick={() => setShowConnect(false)} className="btn-primary">Connect</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
