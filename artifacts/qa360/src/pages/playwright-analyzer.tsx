import { useState, useCallback } from 'react';
import Header from '@/components/header';
import { Upload, FileJson, CheckCircle, XCircle, SkipForward, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { mockTestRuns } from '@/lib/mock-data';
import { formatDate } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { PlaywrightReport } from '@/types';

interface ParsedResult {
  suiteName: string;
  title: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
}

interface ParsedRun {
  name: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  results: ParsedResult[];
}

function flattenSuites(suites: PlaywrightReport['suites'], suiteName = ''): ParsedResult[] {
  const results: ParsedResult[] = [];
  for (const suite of suites) {
    const name = suiteName ? `${suiteName} > ${suite.title}` : suite.title;
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        results.push({
          suiteName: name,
          title: spec.title,
          status: test.status === 'expected' ? 'passed' : test.status === 'skipped' ? 'skipped' : 'failed',
          duration: test.duration || 0,
        });
      }
    }
    if (suite.suites) results.push(...flattenSuites(suite.suites, name));
  }
  return results;
}

export default function PlaywrightPage() {
  const [dragging, setDragging] = useState(false);
  const [parsedRun, setParsedRun] = useState<ParsedRun | null>(null);
  const [error, setError] = useState('');
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set());

  const parseReport = useCallback((file: File) => {
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string) as PlaywrightReport;
        if (!raw.stats || !raw.suites) throw new Error('Invalid Playwright JSON format');
        const results = flattenSuites(raw.suites);
        setParsedRun({
          name: file.name.replace('.json', ''),
          total: results.length || raw.stats.total,
          passed: results.filter((r) => r.status === 'passed').length || raw.stats.expected,
          failed: results.filter((r) => r.status === 'failed').length || raw.stats.unexpected,
          skipped: results.filter((r) => r.status === 'skipped').length || raw.stats.skipped,
          duration: raw.stats.duration || 0,
          results,
        });
      } catch {
        setError('Could not parse this file. Make sure it is a valid Playwright JSON report.');
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseReport(file);
  }, [parseReport]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseReport(file);
    e.target.value = '';
  };

  const toggleSuite = (suite: string) => {
    setExpandedSuites((prev) => {
      const next = new Set(prev);
      next.has(suite) ? next.delete(suite) : next.add(suite);
      return next;
    });
  };

  const suiteGroups = parsedRun
    ? parsedRun.results.reduce<Record<string, ParsedResult[]>>((acc, r) => {
        (acc[r.suiteName] = acc[r.suiteName] || []).push(r);
        return acc;
      }, {})
    : {};

  const historyChartData = mockTestRuns.map((r) => ({
    name: r.name.split(' - ')[0],
    Passed: r.passed,
    Failed: r.failed,
    Skipped: r.skipped,
  }));

  return (
    <div>
      <Header title="Playwright Report Analyzer" subtitle="Upload and analyze Playwright JSON test reports" />
      <div className="p-6 space-y-6">
        <div
          className={`card p-8 border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors ${dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <div className="bg-blue-100 p-4 rounded-full">
            <FileJson className="h-8 w-8 text-blue-600" />
          </div>
          <div className="text-center">
            <p className="font-medium text-gray-900">Drop your Playwright JSON report here</p>
            <p className="text-sm text-gray-500 mt-1">or click to browse — only .json files accepted</p>
          </div>
          <input id="file-input" type="file" accept=".json" className="hidden" onChange={handleFileChange} />
          <label htmlFor="file-input" className="btn-primary cursor-pointer" onClick={(e) => e.stopPropagation()}>
            <Upload className="h-4 w-4 inline mr-2" /> Upload Report
          </label>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>}

        {parsedRun && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Tests', value: parsedRun.total, color: 'text-gray-900', bg: 'bg-gray-50' },
                { label: 'Passed', value: parsedRun.passed, color: 'text-green-700', bg: 'bg-green-50' },
                { label: 'Failed', value: parsedRun.failed, color: 'text-red-700', bg: 'bg-red-50' },
                { label: 'Skipped', value: parsedRun.skipped, color: 'text-yellow-700', bg: 'bg-yellow-50' },
              ].map((s) => (
                <div key={s.label} className={`card p-4 ${s.bg}`}>
                  <p className="text-sm text-gray-600">{s.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="card p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Test Results by Suite</h3>
              {Object.entries(suiteGroups).map(([suite, results]) => {
                const isExpanded = expandedSuites.has(suite);
                const passed = results.filter((r) => r.status === 'passed').length;
                const failed = results.filter((r) => r.status === 'failed').length;
                return (
                  <div key={suite} className="border border-gray-200 rounded-lg mb-2 overflow-hidden">
                    <button
                      onClick={() => toggleSuite(suite)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <span className="font-medium text-gray-900 text-sm truncate text-left">{suite}</span>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-xs text-green-600 font-medium">{passed}✓</span>
                        {failed > 0 && <span className="text-xs text-red-600 font-medium">{failed}✗</span>}
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="divide-y divide-gray-100">
                        {results.map((r, i) => (
                          <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                            {r.status === 'passed' ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> : r.status === 'skipped' ? <SkipForward className="h-4 w-4 text-yellow-500 shrink-0" /> : <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
                            <span className="text-sm text-gray-700 flex-1">{r.title}</span>
                            <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="h-3 w-3" />{(r.duration / 1000).toFixed(2)}s</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="card p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Test Run History</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={historyChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="Passed" fill="#22c55e" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Failed" fill="#ef4444" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Skipped" fill="#f59e0b" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-2 font-medium text-gray-600">Run</th>
                  <th className="py-2 text-center font-medium text-gray-600">Total</th>
                  <th className="py-2 text-center font-medium text-gray-600">Passed</th>
                  <th className="py-2 text-center font-medium text-gray-600">Failed</th>
                  <th className="py-2 text-right font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {mockTestRuns.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 font-medium text-gray-900">{r.name}</td>
                    <td className="py-2.5 text-center text-gray-600">{r.total}</td>
                    <td className="py-2.5 text-center text-green-600 font-medium">{r.passed}</td>
                    <td className="py-2.5 text-center text-red-600 font-medium">{r.failed}</td>
                    <td className="py-2.5 text-right text-gray-500">{formatDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
