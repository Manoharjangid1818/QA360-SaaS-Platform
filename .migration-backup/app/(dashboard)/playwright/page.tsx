'use client';

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
        const passed = results.filter((r) => r.status === 'passed').length;
        const failed = results.filter((r) => r.status === 'failed').length;
        const skipped = results.filter((r) => r.status === 'skipped').length;

        setParsedRun({
          name: file.name.replace('.json', ''),
          total: results.length || raw.stats.total,
          passed: passed || raw.stats.expected,
          failed: failed || raw.stats.unexpected,
          skipped: skipped || raw.stats.skipped,
          duration: raw.stats.duration || 0,
          results,
        });
      } catch (err) {
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

  const groupedResults: Record<string, ParsedResult[]> = {};
  parsedRun?.results.forEach((r) => {
    if (!groupedResults[r.suiteName]) groupedResults[r.suiteName] = [];
    groupedResults[r.suiteName].push(r);
  });

  const barData = parsedRun ? [
    { name: 'Passed', value: parsedRun.passed, fill: '#22c55e' },
    { name: 'Failed', value: parsedRun.failed, fill: '#ef4444' },
    { name: 'Skipped', value: parsedRun.skipped, fill: '#f59e0b' },
  ] : [];

  return (
    <div>
      <Header title="Playwright Integration" subtitle="Upload and analyze Playwright test reports" />
      <div className="p-6 space-y-6">
        {/* Upload */}
        <div
          className={`card p-8 border-2 border-dashed transition-colors text-center cursor-pointer ${dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-300'}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input id="file-input" type="file" accept=".json" className="hidden" onChange={handleFileChange} />
          <FileJson className="h-12 w-12 text-blue-400 mx-auto mb-3" />
          <p className="text-base font-medium text-gray-700">Drop your Playwright JSON report here</p>
          <p className="text-sm text-gray-500 mt-1">or click to browse. Supports <code className="bg-gray-100 px-1 rounded text-xs">playwright report --reporter json</code> output.</p>
          {dragging && <p className="mt-2 text-blue-600 font-medium text-sm">Release to upload!</p>}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

        {/* Parsed Results */}
        {parsedRun && (
          <div className="space-y-5">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{parsedRun.total}</p>
                <p className="text-sm text-gray-500 mt-1">Total Tests</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{parsedRun.passed}</p>
                <p className="text-sm text-gray-500 mt-1 flex items-center justify-center gap-1"><CheckCircle className="h-3 w-3" /> Passed</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{parsedRun.failed}</p>
                <p className="text-sm text-gray-500 mt-1 flex items-center justify-center gap-1"><XCircle className="h-3 w-3" /> Failed</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">{parsedRun.skipped}</p>
                <p className="text-sm text-gray-500 mt-1 flex items-center justify-center gap-1"><SkipForward className="h-3 w-3" /> Skipped</p>
              </div>
            </div>

            {/* Chart */}
            <div className="card p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Results Breakdown — {parsedRun.name}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <rect key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Suite breakdown */}
            {Object.keys(groupedResults).length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700">Test Suite Details</h3>
                </div>
                {Object.entries(groupedResults).map(([suite, results]) => {
                  const isExpanded = expandedSuites.has(suite);
                  const failCount = results.filter((r) => r.status === 'failed').length;
                  return (
                    <div key={suite} className="border-b border-gray-100 last:border-0">
                      <button
                        onClick={() => toggleSuite(suite)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                          <span className="text-sm font-medium text-gray-900">{suite || 'Root'}</span>
                          {failCount > 0 && <span className="badge bg-red-100 text-red-700 text-xs">{failCount} failed</span>}
                        </div>
                        <span className="text-xs text-gray-400">{results.length} tests</span>
                      </button>
                      {isExpanded && (
                        <div className="border-t border-gray-100">
                          {results.map((r, i) => (
                            <div key={i} className="flex items-center gap-3 px-8 py-2 hover:bg-gray-50 transition-colors">
                              {r.status === 'passed' && <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />}
                              {r.status === 'failed' && <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                              {r.status === 'skipped' && <SkipForward className="h-3.5 w-3.5 text-yellow-500 shrink-0" />}
                              <span className="text-sm text-gray-700 flex-1">{r.title}</span>
                              {r.duration > 0 && (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />{r.duration}ms
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Previous runs */}
        <div className="card p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Previous Test Runs</h3>
          <div className="space-y-3">
            {mockTestRuns.map((run) => {
              const passRate = Math.round((run.passed / run.total) * 100);
              return (
                <div key={run.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{run.name}</p>
                    <p className="text-xs text-gray-500">{formatDate(run.created_at)} • {(run.duration_ms / 1000).toFixed(1)}s</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-green-600 font-medium">{run.passed}✓</span>
                    <span className="text-red-600 font-medium">{run.failed}✗</span>
                    <div className="w-20 bg-gray-200 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${passRate}%` }} />
                    </div>
                    <span className="text-gray-600 font-medium w-10 text-right">{passRate}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
