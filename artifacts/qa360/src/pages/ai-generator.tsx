import { useState } from 'react';
import Header from '@/components/header';
import { Sparkles, Save, Loader2, CheckCircle, XCircle, AlertTriangle, Hash } from 'lucide-react';
import type { GeneratedTestCase } from '@/types';
import { getPriorityColor } from '@/lib/utils';

const typeIcons: Record<string, React.ReactNode> = {
  positive: <CheckCircle className="h-4 w-4 text-green-500" />,
  negative: <XCircle className="h-4 w-4 text-red-500" />,
  edge: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
};

const COUNT_OPTIONS = [5, 10, 15, 20, 30];

export default function AIGeneratorPage() {
  const [requirement, setRequirement] = useState('');
  const [count, setCount] = useState(10);
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
        body: JSON.stringify({ requirement, count }),
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
    setSaved(new Set(generated.map((_, i) => i)));
    setSavedCount(generated.length);
  };

  const handleSaveOne = (index: number) => {
    setSaved((prev) => new Set([...prev, index]));
    setSavedCount((prev) => prev + 1);
  };

  const positives = generated.filter((tc) => tc.type === 'positive');
  const negatives = generated.filter((tc) => tc.type === 'negative');
  const edges = generated.filter((tc) => tc.type === 'edge');

  const renderGroup = (label: string, items: GeneratedTestCase[], color: string) => {
    if (!items.length) return null;
    const startIndex = generated.findIndex((tc) => tc === items[0]);
    return (
      <div>
        <h3 className={`text-sm font-semibold ${color} mb-2 flex items-center gap-1.5`}>
          {typeIcons[items[0].type]} {label} ({items.length})
        </h3>
        <div className="space-y-2">
          {items.map((tc, localIdx) => {
            const globalIdx = startIndex + localIdx;
            const isSaved = saved.has(globalIdx);
            return (
              <div key={globalIdx} className={`card p-4 ${isSaved ? 'border-green-200 bg-green-50' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${getPriorityColor(tc.priority)} capitalize`}>{tc.priority}</span>
                      {isSaved && <span className="badge bg-green-100 text-green-700">Saved</span>}
                    </div>
                    <h4 className="font-medium text-gray-900 text-sm">{tc.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{tc.description}</p>
                    {tc.steps && (
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 cursor-pointer hover:underline">View steps</summary>
                        <pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap bg-gray-50 p-2 rounded">{tc.steps}</pre>
                      </details>
                    )}
                  </div>
                  <button
                    onClick={() => handleSaveOne(globalIdx)}
                    disabled={isSaved}
                    className={`shrink-0 p-1.5 rounded-lg transition-colors ${isSaved ? 'text-green-500 bg-green-100' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                  >
                    <Save className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      <Header title="AI Test Case Generator" subtitle="Generate test cases from requirements using AI" />
      <div className="p-6 space-y-6">
        <div className="card p-6">
          <label className="label text-base font-semibold mb-2">Feature Requirement</label>
          <p className="text-sm text-gray-500 mb-3">Describe the feature or functionality you want to test. Be specific for better results.</p>
          <textarea
            className="input resize-none text-sm"
            rows={5}
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            placeholder="Example: Users should be able to reset their password via a link sent to their email. The link expires after 24 hours."
          />

          {/* Count selector */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Hash className="h-4 w-4 text-gray-500" />
              <label className="label text-sm font-semibold">Number of Test Cases to Generate</label>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {COUNT_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setCount(opt)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    count === opt
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  {opt}
                </button>
              ))}
              <div className="flex items-center gap-2 ml-2">
                <span className="text-xs text-gray-400">or custom:</span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                  className="input w-20 py-1 text-sm text-center"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              AI will distribute cases across positive, negative, and edge categories. Max 50.
            </p>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-gray-400">{requirement.length} characters · {count} test cases</p>
            <button onClick={handleGenerate} disabled={loading || !requirement.trim()} className="btn-primary flex items-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? `Generating ${count} cases…` : `Generate ${count} Test Cases`}
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
        </div>

        {generated.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Generated Test Cases</h2>
                <p className="text-sm text-gray-500">{generated.length} cases generated · {savedCount} saved</p>
              </div>
              <button onClick={handleSaveAll} className="btn-secondary flex items-center gap-2">
                <Save className="h-4 w-4" /> Save All
              </button>
            </div>
            {renderGroup('Positive Test Cases', positives, 'text-green-700')}
            {renderGroup('Negative Test Cases', negatives, 'text-red-700')}
            {renderGroup('Edge Cases', edges, 'text-yellow-700')}
          </div>
        )}
      </div>
    </div>
  );
}
