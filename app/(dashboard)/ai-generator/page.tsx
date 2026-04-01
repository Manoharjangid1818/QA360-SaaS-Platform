'use client';

import { useState } from 'react';
import Header from '@/components/header';
import { Sparkles, Save, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { GeneratedTestCase } from '@/types';
import { getPriorityColor } from '@/lib/utils';

const typeIcons: Record<string, React.ReactNode> = {
  positive: <CheckCircle className="h-4 w-4 text-green-500" />,
  negative: <XCircle className="h-4 w-4 text-red-500" />,
  edge: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
};

export default function AIGeneratorPage() {
  const [requirement, setRequirement] = useState('');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<GeneratedTestCase[]>([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [savedCount, setSavedCount] = useState(0);

  const handleGenerate = async () => {
    if (!requirement.trim()) return;
    setLoading(true);
    setError('');
    setGenerated([]);
    setSaved(new Set());

    try {
      const res = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirement }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setGenerated(data.testCases || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate test cases. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = () => {
    const indices = new Set(generated.map((_, i) => i));
    setSaved(indices);
    setSavedCount(generated.length);
  };

  const handleSaveOne = (index: number) => {
    setSaved((prev) => new Set([...prev, index]));
    setSavedCount((prev) => prev + 1);
  };

  const positives = generated.filter((tc) => tc.type === 'positive');
  const negatives = generated.filter((tc) => tc.type === 'negative');
  const edges = generated.filter((tc) => tc.type === 'edge');

  return (
    <div>
      <Header title="AI Test Case Generator" subtitle="Generate test cases from requirements using AI" />
      <div className="p-6 space-y-6">
        {/* Input */}
        <div className="card p-6">
          <label className="label text-base font-semibold mb-2">Feature Requirement</label>
          <p className="text-sm text-gray-500 mb-3">
            Describe the feature or functionality you want to test. Be specific for better results.
          </p>
          <textarea
            className="input resize-none text-sm"
            rows={5}
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            placeholder="Example: Users should be able to reset their password via a link sent to their email. The link expires after 24 hours. Users must enter a new password that is at least 8 characters and includes a number."
          />
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-gray-400">{requirement.length} characters</p>
            <button
              onClick={handleGenerate}
              disabled={loading || !requirement.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? 'Generating…' : 'Generate Test Cases'}
            </button>
          </div>
          {error && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
          )}
        </div>

        {/* Results */}
        {generated.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Generated Test Cases</h2>
                <p className="text-sm text-gray-500">
                  {generated.length} cases: {positives.length} positive, {negatives.length} negative, {edges.length} edge
                  {savedCount > 0 && <span className="text-green-600 ml-2">• {savedCount} saved</span>}
                </p>
              </div>
              <button onClick={handleSaveAll} className="btn-secondary flex items-center gap-2 text-sm">
                <Save className="h-4 w-4" /> Save All
              </button>
            </div>

            {/* Group by type */}
            {[
              { label: 'Positive Test Cases', type: 'positive', cases: positives, color: 'border-green-200 bg-green-50/30' },
              { label: 'Negative Test Cases', type: 'negative', cases: negatives, color: 'border-red-200 bg-red-50/30' },
              { label: 'Edge Cases', type: 'edge', cases: edges, color: 'border-yellow-200 bg-yellow-50/30' },
            ].filter((g) => g.cases.length > 0).map((group) => (
              <div key={group.type}>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  {typeIcons[group.type]} {group.label} ({group.cases.length})
                </h3>
                <div className="space-y-3">
                  {group.cases.map((tc) => {
                    const globalIndex = generated.indexOf(tc);
                    const isSaved = saved.has(globalIndex);
                    return (
                      <div key={globalIndex} className={`card p-4 border ${group.color}`}>
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <h4 className="font-medium text-gray-900 text-sm">{tc.title}</h4>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`badge ${getPriorityColor(tc.priority)} capitalize text-xs`}>{tc.priority}</span>
                            {isSaved ? (
                              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" /> Saved
                              </span>
                            ) : (
                              <button onClick={() => handleSaveOne(globalIndex)} className="btn-secondary text-xs py-1 px-2 flex items-center gap-1">
                                <Save className="h-3 w-3" /> Save
                              </button>
                            )}
                          </div>
                        </div>
                        {tc.description && <p className="text-xs text-gray-600 mb-2">{tc.description}</p>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Steps</p>
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap">{tc.steps}</pre>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Expected Result</p>
                            <p className="text-xs text-gray-700">{tc.expected_result}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && generated.length === 0 && !error && (
          <div className="card p-12 text-center">
            <Sparkles className="h-12 w-12 text-blue-300 mx-auto mb-4" />
            <h3 className="text-base font-medium text-gray-700 mb-2">Ready to Generate</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Enter a feature requirement above and click "Generate Test Cases" to get AI-powered positive, negative, and edge case suggestions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
