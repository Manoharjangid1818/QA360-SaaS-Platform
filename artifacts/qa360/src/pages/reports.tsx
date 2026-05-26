import { useState } from 'react';
import Header from '@/components/header';
import {
  FileText, Download, Trash2, Calendar, Mail, CheckCircle, XCircle, Clock,
  Share2, BarChart2, Bug, Zap, GitBranch, Shield, Plus, Eye, Check, Building2,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import type { ReportType, ExportFormat, ReportFilters, ScheduledReport } from '@/types/reports';
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

const REPORT_TYPES = [
  { type: 'test_execution' as ReportType, label: 'Test Execution', desc: 'Pass/fail metrics, test runs, duration & history', icon: BarChart2, color: 'blue' },
  { type: 'bug_summary' as ReportType, label: 'Bug Summary', desc: 'Severity distribution, status breakdown, open bugs', icon: Bug, color: 'red' },
  { type: 'performance' as ReportType, label: 'Performance', desc: 'Lighthouse scores, Core Web Vitals, load times', icon: Zap, color: 'yellow' },
  { type: 'regression' as ReportType, label: 'Regression', desc: 'Regression pass rate, new failures, flaky tests', icon: GitBranch, color: 'purple' },
  { type: 'release_readiness' as ReportType, label: 'Release Readiness', desc: 'Go/No-Go assessment, risks & recommendations', icon: Shield, color: 'green' },
];

const COLOR_MAP: Record<string, string> = { blue: 'bg-blue-100 text-blue-700', red: 'bg-red-100 text-red-700', yellow: 'bg-yellow-100 text-yellow-700', purple: 'bg-purple-100 text-purple-700', green: 'bg-green-100 text-green-700' };
const ICON_BG_MAP: Record<string, string> = { blue: 'bg-blue-100', red: 'bg-red-100', yellow: 'bg-yellow-100', purple: 'bg-purple-100', green: 'bg-green-100' };
const ICON_MAP: Record<string, string> = { blue: 'text-blue-600', red: 'text-red-600', yellow: 'text-yellow-600', purple: 'text-purple-600', green: 'text-green-600' };

const previewData = {
  trend: Array.from({ length: 7 }, (_, i) => ({ date: `Day ${i + 1}`, passed: 80 + Math.floor(Math.random() * 20), failed: Math.floor(Math.random() * 10) })),
  pie: [{ name: 'Open', value: 2 }, { name: 'In Progress', value: 1 }, { name: 'Resolved', value: 3 }, { name: 'Closed', value: 1 }],
  pieColors: ['#ef4444', '#3b82f6', '#22c55e', '#9ca3af'],
};

const mockHistory: ReportRecord[] = [
  { id: 'r-1', name: 'Test Execution Report — May 2026', type: 'test_execution', format: 'excel', createdAt: new Date(Date.now() - 86400000).toISOString(), sizeFormatted: '245 KB', shareToken: 'abc123', status: 'completed' },
  { id: 'r-2', name: 'Bug Summary Report — Q1 2026', type: 'bug_summary', format: 'excel', createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), sizeFormatted: '189 KB', shareToken: 'def456', status: 'completed' },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('builder');
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [history, setHistory] = useState<ReportRecord[]>(mockHistory);
  const [generating, setGenerating] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({});
  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = () => {
    if (!selectedType) return;
    setGenerating(true);
    setTimeout(() => {
      const rt = REPORT_TYPES.find((r) => r.type === selectedType);
      const newRecord: ReportRecord = {
        id: Math.random().toString(36).substr(2, 9),
        name: `${rt?.label || 'Report'} — ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        type: selectedType,
        format: 'excel',
        createdAt: new Date().toISOString(),
        sizeFormatted: `${Math.floor(100 + Math.random() * 300)} KB`,
        shareToken: Math.random().toString(36).substr(2, 8),
        status: 'completed',
      };
      setHistory((prev) => [newRecord, ...prev]);
      setGenerating(false);
      setActiveTab('history');
    }, 2000);
  };

  const copyShareLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/reports/share/${token}`);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'builder', label: 'Report Builder' },
    { id: 'history', label: `History (${history.length})` },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'branding', label: 'Branding' },
  ];

  return (
    <div>
      <Header title="Reports" subtitle="Generate and manage QA reports" />
      <div className="p-6 space-y-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn('px-4 py-2 text-sm font-medium rounded-md transition-colors', activeTab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900')}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'builder' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Select Report Type</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {REPORT_TYPES.map((rt) => {
                  const Icon = rt.icon;
                  const isSelected = selectedType === rt.type;
                  return (
                    <button
                      key={rt.type}
                      onClick={() => setSelectedType(rt.type)}
                      className={cn('card p-4 text-left transition-all', isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-sm')}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn('p-2 rounded-lg', ICON_BG_MAP[rt.color])}>
                          <Icon className={cn('h-5 w-5', ICON_MAP[rt.color])} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 text-sm">{rt.label}</p>
                            {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{rt.desc}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedType && (
              <div className="card p-4 space-y-3">
                <h3 className="font-medium text-gray-900">Filters</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div><label className="label">From</label><input type="date" className="input" value={filters.dateFrom || ''} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} /></div>
                  <div><label className="label">To</label><input type="date" className="input" value={filters.dateTo || ''} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} /></div>
                  <div><label className="label">Project</label><select className="input" value={filters.project || ''} onChange={(e) => setFilters({ ...filters, project: e.target.value })}><option value="">All Projects</option><option>QA360 Web</option><option>API Services</option></select></div>
                  <div><label className="label">Environment</label><select className="input" value={filters.environment || ''} onChange={(e) => setFilters({ ...filters, environment: e.target.value })}><option value="">All</option><option>development</option><option>staging</option><option>production</option></select></div>
                </div>
              </div>
            )}

            {selectedType && (
              <div className="card p-4">
                <h3 className="font-medium text-gray-900 mb-3">Preview</h3>
                {selectedType === 'test_execution' && (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={previewData.trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="passed" stackId="1" stroke="#22c55e" fill="#dcfce7" />
                      <Area type="monotone" dataKey="failed" stackId="1" stroke="#ef4444" fill="#fee2e2" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
                {selectedType === 'bug_summary' && (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={previewData.pie} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {previewData.pie.map((_, i) => <Cell key={i} fill={previewData.pieColors[i]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {!['test_execution', 'bug_summary'].includes(selectedType) && (
                  <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Chart preview for {REPORT_TYPES.find((r) => r.type === selectedType)?.label}</div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <button onClick={handleGenerate} disabled={!selectedType || generating} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {generating ? <><Clock className="h-4 w-4 animate-spin" /> Generating…</> : <><FileText className="h-4 w-4" /> Generate Report</>}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-2">
            {history.length === 0 ? (
              <div className="card p-12 text-center text-gray-500">No reports generated yet</div>
            ) : history.map((r) => (
              <div key={r.id} className="card p-4 flex items-center gap-4">
                <div className={cn('p-2 rounded-lg', ICON_BG_MAP[REPORT_TYPES.find((t) => t.type === r.type)?.color || 'blue'])}>
                  <FileText className={cn('h-4 w-4', ICON_MAP[REPORT_TYPES.find((t) => t.type === r.type)?.color || 'blue'])} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{r.name}</p>
                  <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()} • {r.sizeFormatted} • Excel</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => copyShareLink(r.shareToken)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="Copy share link">
                    {copied === r.shareToken ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="Download">
                    <Download className="h-4 w-4" />
                  </button>
                  <button onClick={() => setHistory((prev) => prev.filter((h) => h.id !== r.id))} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'scheduled' && (
          <div className="card p-12 text-center text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="font-medium">No scheduled reports</p>
            <p className="text-sm mt-1">Set up automated report delivery to email recipients.</p>
            <button className="btn-primary mt-4 flex items-center gap-2 mx-auto">
              <Plus className="h-4 w-4" /> Schedule a Report
            </button>
          </div>
        )}

        {activeTab === 'branding' && (
          <div className="card p-6 space-y-4 max-w-lg">
            <h3 className="font-medium text-gray-900">Report Branding</h3>
            <div><label className="label">Company Name</label><input className="input" value={branding.companyName} onChange={(e) => setBranding({ ...branding, companyName: e.target.value })} /></div>
            <div><label className="label">Primary Color</label><div className="flex gap-2"><input type="color" value={branding.primaryColor} onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })} className="h-9 w-12 rounded border cursor-pointer" /><input className="input flex-1" value={branding.primaryColor} onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })} /></div></div>
            <div><label className="label">Footer Text</label><input className="input" value={branding.footerText || ''} onChange={(e) => setBranding({ ...branding, footerText: e.target.value })} /></div>
            <button className="btn-primary">Save Branding</button>
          </div>
        )}
      </div>
    </div>
  );
}
