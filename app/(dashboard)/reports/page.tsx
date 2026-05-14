'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/header';
import {
  FileText, Download, RefreshCw, Trash2, Calendar, Mail,
  CheckCircle, XCircle, Clock, Share2,
  BarChart2, Bug, Zap, GitBranch, Shield, Plus, Eye,
  Check, Building2, Palette,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import type { ReportType, ExportFormat, ReportFilters, ScheduledReport, BrandingSettings } from '@/types/reports';
import { DEFAULT_BRANDING } from '@/types/reports';

type Tab = 'builder' | 'history' | 'scheduled' | 'branding';

interface ReportRecord {
  id: string;
  name: string;
  type: ReportType;
  format: ExportFormat;
  createdAt: string;
  sizeFormatted: string;
  shareToken: string;
  status: 'completed' | 'generating' | 'failed';
}

const REPORT_TYPES: {
  type: ReportType;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  { type: 'test_execution', label: 'Test Execution', desc: 'Pass/fail metrics, test runs, duration & history', icon: BarChart2, color: 'blue' },
  { type: 'bug_summary', label: 'Bug Summary', desc: 'Severity distribution, status breakdown, open bugs', icon: Bug, color: 'red' },
  { type: 'performance', label: 'Performance', desc: 'Lighthouse scores, Core Web Vitals, load times', icon: Zap, color: 'yellow' },
  { type: 'regression', label: 'Regression', desc: 'Regression pass rate, new failures, flaky tests', icon: GitBranch, color: 'purple' },
  { type: 'release_readiness', label: 'Release Readiness', desc: 'Go/No-Go assessment, risks & recommendations', icon: Shield, color: 'green' },
];

const FORMAT_OPTS: { fmt: ExportFormat; label: string; ext: string; bg: string }[] = [
  { fmt: 'pdf', label: 'PDF', ext: '.pdf', bg: 'bg-red-500' },
  { fmt: 'csv', label: 'CSV', ext: '.csv', bg: 'bg-green-500' },
  { fmt: 'excel', label: 'Excel', ext: '.xlsx', bg: 'bg-emerald-600' },
];

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  purple: 'bg-purple-100 text-purple-700',
  green: 'bg-green-100 text-green-700',
};

const ICON_MAP: Record<string, string> = {
  blue: 'text-blue-600',
  red: 'text-red-600',
  yellow: 'text-yellow-600',
  purple: 'text-purple-600',
  green: 'text-green-600',
};

const ICON_BG_MAP: Record<string, string> = {
  blue: 'bg-blue-100',
  red: 'bg-red-100',
  yellow: 'bg-yellow-100',
  purple: 'bg-purple-100',
  green: 'bg-green-100',
};

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', COLOR_MAP[color] || COLOR_MAP.blue)}>
      {children}
    </span>
  );
}

function buildTrendData() {
  return Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    passed: 80 + Math.floor(Math.sin(i) * 8 + Math.random() * 5),
    failed: 3 + Math.floor(Math.cos(i) * 3 + Math.random() * 3),
  }));
}

function buildPerfData() {
  return Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    performance: 70 + Math.floor(Math.sin(i) * 10 + Math.random() * 8),
    accessibility: 85 + Math.floor(Math.cos(i) * 6 + Math.random() * 4),
  }));
}

const SEVERITY_DATA = [
  { name: 'Critical', value: 1, fill: '#ef4444' },
  { name: 'High', value: 1, fill: '#f97316' },
  { name: 'Medium', value: 1, fill: '#f59e0b' },
  { name: 'Low', value: 0, fill: '#22c55e' },
];

const EXEC_HISTORY = [
  { name: 'Smoke', passed: 38, failed: 5, skipped: 2 },
  { name: 'Regression', passed: 115, failed: 4, skipped: 1 },
  { name: 'Auth', passed: 18, failed: 2, skipped: 0 },
];

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('builder');
  const [selectedType, setSelectedType] = useState<ReportType>('test_execution');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [filters, setFilters] = useState<ReportFilters>({ environment: 'production', project: 'QA360', severity: 'all' });
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const [generating, setGenerating] = useState(false);
  const [history, setHistory] = useState<ReportRecord[]>([]);
  const [schedules, setSchedules] = useState<ScheduledReport[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [newSchedule, setNewSchedule] = useState<Partial<ScheduledReport>>({
    name: '', type: 'test_execution', format: 'pdf', frequency: 'weekly', time: '08:00', recipients: [], active: true,
  });
  const [recipientInput, setRecipientInput] = useState('');
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [trendData] = useState(buildTrendData);
  const [perfData] = useState(buildPerfData);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/reports/history');
      const data = await res.json();
      setHistory(data.reports || []);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const loadSchedules = useCallback(async () => {
    const res = await fetch('/api/reports/schedule');
    const data = await res.json();
    setSchedules(data.schedules || []);
  }, []);

  useEffect(() => { loadHistory(); loadSchedules(); }, [loadHistory, loadSchedules]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedType, format: selectedFormat, filters, branding }),
      });
      const data = await res.json();
      if (data.success) {
        const report = data.report;
        setHistory((prev) => [report, ...prev]);
        window.open(`/api/reports/${report.id}/download`, '_blank');
        setTab('history');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/reports/history?id=${id}`, { method: 'DELETE' });
    setHistory((prev) => prev.filter((r) => r.id !== id));
  };

  const handleCopyShareLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/reports/share/${token}`);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleSaveSchedule = async () => {
    const res = await fetch('/api/reports/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSchedule),
    });
    if (res.ok) {
      setScheduleSuccess(true);
      setTimeout(() => setScheduleSuccess(false), 2500);
      loadSchedules();
      setNewSchedule({ name: '', type: 'test_execution', format: 'pdf', frequency: 'weekly', time: '08:00', recipients: [], active: true });
      setRecipientInput('');
    }
  };

  const handleToggleSchedule = async (s: ScheduledReport) => {
    await fetch('/api/reports/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...s, active: !s.active }),
    });
    loadSchedules();
  };

  const handleDeleteSchedule = async (id: string) => {
    await fetch(`/api/reports/schedule?id=${id}`, { method: 'DELETE' });
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  const addRecipient = () => {
    const email = recipientInput.trim();
    if (email && /\S+@\S+\.\S+/.test(email)) {
      setNewSchedule((p) => ({ ...p, recipients: [...(p.recipients || []), email] }));
      setRecipientInput('');
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'builder', label: 'Report Builder', icon: FileText },
    { id: 'history', label: `History (${history.length})`, icon: Clock },
    { id: 'scheduled', label: `Scheduled (${schedules.length})`, icon: Calendar },
    { id: 'branding', label: 'Branding', icon: Palette },
  ];

  const selectedTypeMeta = REPORT_TYPES.find((r) => r.type === selectedType)!;

  return (
    <div>
      <Header
        title="Enterprise Reports"
        subtitle="Generate, export, and schedule executive-level QA reports"
        actions={
          <button onClick={handleGenerate} disabled={generating} className="btn-primary flex items-center gap-2">
            {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {generating ? 'Generating…' : 'Generate & Download'}
          </button>
        }
      />

      <div className="p-6 space-y-6">

        {/* Filter Bar */}
        <div className="card p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">From</label>
              <input type="date" className="input py-1.5 text-sm" value={filters.dateFrom || ''}
                onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">To</label>
              <input type="date" className="input py-1.5 text-sm" value={filters.dateTo || ''}
                onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Project</label>
              <select className="input py-1.5 text-sm" value={filters.project || ''}
                onChange={(e) => setFilters((p) => ({ ...p, project: e.target.value }))}>
                <option value="QA360">QA360</option>
                <option value="API v3">API v3</option>
                <option value="Mobile App">Mobile App</option>
                <option value="">All Projects</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Environment</label>
              <select className="input py-1.5 text-sm" value={filters.environment || ''}
                onChange={(e) => setFilters((p) => ({ ...p, environment: e.target.value }))}>
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
                <option value="">All</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Severity</label>
              <select className="input py-1.5 text-sm" value={filters.severity || ''}
                onChange={(e) => setFilters((p) => ({ ...p, severity: e.target.value }))}>
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live Data
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-0">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={cn(
                  'flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors',
                  tab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                )}>
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── BUILDER TAB ─── */}
        {tab === 'builder' && (
          <div className="space-y-6">

            {/* Step 1 — Report Type */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                Select Report Type
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {REPORT_TYPES.map(({ type, label, desc, icon: Icon, color }) => (
                  <button key={type} onClick={() => setSelectedType(type)}
                    className={cn(
                      'card p-4 text-left transition-all hover:shadow-md',
                      selectedType === type ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50',
                    )}>
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', ICON_BG_MAP[color])}>
                      <Icon className={cn('h-5 w-5', ICON_MAP[color])} />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
                    {selectedType === type && (
                      <div className="mt-2 flex items-center gap-1 text-blue-600 text-xs font-medium">
                        <CheckCircle className="h-3.5 w-3.5" /> Selected
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2 — Format */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                Export Format
              </h3>
              <div className="flex flex-wrap gap-3">
                {FORMAT_OPTS.map(({ fmt, label, ext, bg }) => (
                  <button key={fmt} onClick={() => setSelectedFormat(fmt)}
                    className={cn(
                      'flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all text-sm font-medium',
                      selectedFormat === fmt ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white',
                    )}>
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white', bg)}>
                      {label}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">{label} Report</p>
                      <p className="text-xs text-gray-400 font-normal">{ext} file</p>
                    </div>
                    {selectedFormat === fmt && <CheckCircle className="h-4 w-4 text-blue-600 ml-2" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3 — Charts Preview */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                Live Data Preview
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Pass/Fail Trend */}
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-800">Pass / Fail Trend</h4>
                    <Badge color="blue">Last 7 days</Badge>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="passG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="failG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend iconSize={10} />
                      <Area type="monotone" dataKey="passed" stroke="#22c55e" fill="url(#passG)" strokeWidth={2} />
                      <Area type="monotone" dataKey="failed" stroke="#ef4444" fill="url(#failG)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Bug Severity */}
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-800">Bug Severity Distribution</h4>
                    <Badge color="red">Current</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="55%" height={200}>
                      <PieChart>
                        <Pie data={SEVERITY_DATA} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={3}>
                          {SEVERITY_DATA.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-3">
                      {SEVERITY_DATA.map((s) => (
                        <div key={s.name} className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.fill }} />
                          <span className="text-xs text-gray-600 flex-1">{s.name}</span>
                          <span className="text-xs font-bold text-gray-900">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Execution History */}
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-800">Execution History</h4>
                    <Badge color="purple">By Suite</Badge>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={EXEC_HISTORY} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend iconSize={10} />
                      <Bar dataKey="passed" fill="#22c55e" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="failed" fill="#ef4444" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="skipped" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Performance Trends */}
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-800">Performance Trends</h4>
                    <Badge color="yellow">Lighthouse</Badge>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={perfData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis domain={[50, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend iconSize={10} />
                      <Line type="monotone" dataKey="performance" stroke="#f59e0b" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="accessibility" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Generate CTA */}
            <div className="card p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h4 className="font-semibold text-gray-900">Ready to generate</h4>
                  <p className="text-sm text-gray-600 mt-0.5">
                    <span className="font-semibold text-blue-700">{selectedTypeMeta.label}</span> report as{' '}
                    <span className="font-semibold text-blue-700">{selectedFormat.toUpperCase()}</span>
                    {' '}· <span className="font-semibold text-blue-700">{filters.environment || 'All environments'}</span>
                    {filters.project && <> · <span className="font-semibold text-blue-700">{filters.project}</span></>}
                    {branding.showWatermark && <> · Watermarked</>}
                  </p>
                </div>
                <button onClick={handleGenerate} disabled={generating}
                  className="btn-primary flex items-center gap-2 shrink-0 px-6 py-2.5">
                  {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {generating ? 'Generating…' : 'Generate & Download'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── HISTORY TAB ─── */}
        {tab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{history.length} report{history.length !== 1 ? 's' : ''} in history</p>
              <button onClick={loadHistory} disabled={loadingHistory}
                className="btn-secondary flex items-center gap-2 text-sm py-1.5">
                <RefreshCw className={cn('h-3.5 w-3.5', loadingHistory && 'animate-spin')} />
                Refresh
              </button>
            </div>

            {history.length === 0 ? (
              <div className="card p-16 text-center">
                <FileText className="h-14 w-14 mx-auto mb-3 text-gray-200" />
                <p className="font-semibold text-gray-400">No reports generated yet</p>
                <p className="text-sm text-gray-400 mt-1">Head to the Builder tab to create your first report</p>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Report Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Format</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Size</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map((r) => {
                      const typeMeta = REPORT_TYPES.find((t) => t.type === r.type);
                      return (
                        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-gray-900 truncate max-w-[200px]">{r.name}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge color={typeMeta?.color || 'blue'}>
                              {r.type.replace(/_/g, ' ')}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={cn(
                              'inline-block px-2 py-0.5 rounded text-xs font-bold text-white',
                              r.format === 'pdf' ? 'bg-red-500' : r.format === 'csv' ? 'bg-green-500' : 'bg-emerald-600',
                            )}>
                              {r.format.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-gray-500 text-xs">{r.sizeFormatted}</td>
                          <td className="px-4 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                            {new Date(r.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={cn(
                              'flex items-center gap-1 text-xs font-medium w-fit',
                              r.status === 'completed' ? 'text-green-600' : r.status === 'generating' ? 'text-blue-600' : 'text-red-600',
                            )}>
                              {r.status === 'completed' && <CheckCircle className="h-3.5 w-3.5" />}
                              {r.status === 'generating' && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                              {r.status === 'failed' && <XCircle className="h-3.5 w-3.5" />}
                              {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1 justify-end">
                              <a href={`/api/reports/${r.id}/download`} target="_blank" rel="noreferrer"
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Download">
                                <Download className="h-4 w-4" />
                              </a>
                              <button onClick={() => handleCopyShareLink(r.shareToken)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title={copiedToken === r.shareToken ? 'Copied!' : 'Copy share link'}>
                                {copiedToken === r.shareToken
                                  ? <Check className="h-4 w-4 text-green-600" />
                                  : <Share2 className="h-4 w-4" />}
                              </button>
                              <button onClick={() => handleDelete(r.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── SCHEDULED TAB ─── */}
        {tab === 'scheduled' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Configured Schedules</h3>
              {schedules.length === 0 ? (
                <div className="card p-10 text-center">
                  <Calendar className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                  <p className="text-sm text-gray-400">No scheduled reports yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {schedules.map((s) => {
                    const typeMeta = REPORT_TYPES.find((t) => t.type === s.type);
                    return (
                      <div key={s.id} className="card p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start gap-4">
                          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5', ICON_BG_MAP[typeMeta?.color || 'blue'])}>
                            {typeMeta && <typeMeta.icon className={cn('h-4 w-4', ICON_MAP[typeMeta.color])} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-semibold text-gray-900 text-sm">{s.name}</span>
                              <Badge color={s.active ? 'green' : 'red'}>{s.active ? 'Active' : 'Paused'}</Badge>
                              <Badge color={typeMeta?.color || 'blue'}>{s.type.replace(/_/g, ' ')}</Badge>
                              <span className={cn(
                                'text-xs font-bold text-white px-1.5 py-0.5 rounded',
                                s.format === 'pdf' ? 'bg-red-500' : s.format === 'csv' ? 'bg-green-500' : 'bg-emerald-600',
                              )}>{s.format.toUpperCase()}</span>
                            </div>
                            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {s.frequency.charAt(0).toUpperCase() + s.frequency.slice(1)} at {s.time}
                              </span>
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {s.recipients.length > 0 ? s.recipients.join(', ') : 'No recipients'}
                              </span>
                              {s.nextRunAt && <span>Next run: {new Date(s.nextRunAt).toLocaleDateString()}</span>}
                              {s.lastSentAt && <span>Last sent: {new Date(s.lastSentAt).toLocaleDateString()}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => handleToggleSchedule(s)}
                              className={cn(
                                'text-xs px-3 py-1.5 rounded-lg font-medium transition-colors',
                                s.active ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200',
                              )}>
                              {s.active ? 'Pause' : 'Resume'}
                            </button>
                            <button onClick={() => handleDeleteSchedule(s.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* New Schedule Form */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4 text-blue-600" /> Create New Schedule
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Schedule Name *</label>
                  <input className="input" placeholder="e.g. Weekly Test Execution Summary"
                    value={newSchedule.name || ''}
                    onChange={(e) => setNewSchedule((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Report Type</label>
                  <select className="input" value={newSchedule.type}
                    onChange={(e) => setNewSchedule((p) => ({ ...p, type: e.target.value as ReportType }))}>
                    {REPORT_TYPES.map((r) => <option key={r.type} value={r.type}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Export Format</label>
                  <select className="input" value={newSchedule.format}
                    onChange={(e) => setNewSchedule((p) => ({ ...p, format: e.target.value as ExportFormat }))}>
                    {FORMAT_OPTS.map((f) => <option key={f.fmt} value={f.fmt}>{f.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Frequency</label>
                  <select className="input" value={newSchedule.frequency}
                    onChange={(e) => setNewSchedule((p) => ({ ...p, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' }))}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="label">Send Time</label>
                  <input type="time" className="input" value={newSchedule.time || '08:00'}
                    onChange={(e) => setNewSchedule((p) => ({ ...p, time: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Email Recipients</label>
                  <div className="flex gap-2">
                    <input className="input flex-1" placeholder="name@company.com"
                      value={recipientInput}
                      onChange={(e) => setRecipientInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRecipient())} />
                    <button onClick={addRecipient} className="btn-secondary px-3 text-sm">Add</button>
                  </div>
                  {(newSchedule.recipients || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(newSchedule.recipients || []).map((email) => (
                        <span key={email} className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full">
                          {email}
                          <button onClick={() => setNewSchedule((p) => ({ ...p, recipients: p.recipients?.filter((e) => e !== email) }))}>
                            <XCircle className="h-3 w-3 hover:text-red-600" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
                <button onClick={handleSaveSchedule} disabled={!newSchedule.name?.trim()}
                  className="btn-primary flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Save Schedule
                </button>
                {scheduleSuccess && (
                  <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                    <CheckCircle className="h-4 w-4" /> Schedule saved!
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── BRANDING TAB ─── */}
        {tab === 'branding' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Settings */}
              <div className="card p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" /> Company Identity
                </h3>
                <div>
                  <label className="label">Company Name</label>
                  <input className="input" value={branding.companyName}
                    onChange={(e) => setBranding((p) => ({ ...p, companyName: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Brand Name / Logo Text</label>
                  <input className="input" value={branding.logoText}
                    onChange={(e) => setBranding((p) => ({ ...p, logoText: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Primary Brand Color</label>
                  <div className="flex gap-3 items-center">
                    <input type="color" className="w-10 h-10 rounded cursor-pointer border border-gray-300 p-0.5"
                      value={branding.primaryColor}
                      onChange={(e) => setBranding((p) => ({ ...p, primaryColor: e.target.value }))} />
                    <input className="input flex-1 font-mono" value={branding.primaryColor}
                      onChange={(e) => setBranding((p) => ({ ...p, primaryColor: e.target.value }))} />
                  </div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {['#2563eb', '#7c3aed', '#dc2626', '#059669', '#d97706', '#0891b2', '#1e293b', '#db2777'].map((c) => (
                      <button key={c} onClick={() => setBranding((p) => ({ ...p, primaryColor: c }))}
                        title={c}
                        className={cn('w-6 h-6 rounded-full border-2 transition-all hover:scale-110',
                          branding.primaryColor === c ? 'border-gray-800 scale-110' : 'border-transparent')}
                        style={{ background: c }} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Footer Text</label>
                  <input className="input" value={branding.footerText}
                    onChange={(e) => setBranding((p) => ({ ...p, footerText: e.target.value }))} />
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-gray-500" /> Watermark
                  </h4>
                  <label className="flex items-center gap-3 mb-3 cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" className="sr-only peer" checked={branding.showWatermark}
                        onChange={(e) => setBranding((p) => ({ ...p, showWatermark: e.target.checked }))} />
                      <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                    </div>
                    <span className="text-sm text-gray-700">Show watermark on PDF reports</span>
                  </label>
                  {branding.showWatermark && (
                    <div>
                      <label className="label">Watermark Text</label>
                      <input className="input" placeholder="e.g. CONFIDENTIAL"
                        value={branding.watermark}
                        onChange={(e) => setBranding((p) => ({ ...p, watermark: e.target.value }))} />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  <button onClick={handleGenerate} disabled={generating}
                    className="btn-primary flex items-center gap-2 text-sm">
                    {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Generate PDF Preview
                  </button>
                  <button onClick={() => setBranding(DEFAULT_BRANDING)} className="btn-secondary text-sm">
                    Reset Defaults
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">PDF Header Preview</h3>
                <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200">
                  <div className="p-6 relative overflow-hidden" style={{ background: branding.primaryColor }}>
                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <p className="text-2xl font-bold text-white">{branding.logoText || 'Your Company'}</p>
                        <p className="text-sm text-white opacity-75 mt-0.5">Enterprise Test Management Platform</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white text-base">{selectedTypeMeta.label} Report</p>
                        <p className="text-sm text-white opacity-75">{new Date().toLocaleDateString()}</p>
                        <p className="text-xs text-white opacity-60 mt-0.5">{filters.environment || 'All Environments'}</p>
                      </div>
                    </div>
                    {branding.showWatermark && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none select-none">
                        <span className="text-5xl font-black tracking-widest" style={{ transform: 'rotate(-35deg)' }}>
                          {branding.watermark}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-white space-y-3">
                    <div className="flex gap-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex-1 rounded-lg p-3" style={{ background: branding.primaryColor + '15' }}>
                          <div className="h-5 rounded mb-1 w-8" style={{ background: branding.primaryColor }} />
                          <div className="h-2.5 bg-gray-200 rounded w-full" />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {[90, 75, 55].map((w) => (
                        <div key={w} className="h-2 bg-gray-100 rounded" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                    <div className="h-px bg-gray-100" />
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map((i) => <div key={i} className="h-2 bg-gray-100 rounded" />)}
                    </div>
                  </div>
                  <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-400 truncate max-w-xs">{branding.footerText}</p>
                    <p className="text-xs text-gray-400 shrink-0">Page 1</p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  Branding settings are applied to all PDF reports. CSV and Excel exports include company name in the header row.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
