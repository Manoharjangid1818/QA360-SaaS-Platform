'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/header';
import {
  Play,
  Square,
  Copy,
  Download,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Globe,
  MousePointerClick,
  Type,
  ChevronDown,
  Wand2,
  Code2,
  GripVertical,
  Link,
  ToggleLeft,
  Keyboard,
  Eye,
  Camera,
  Clock,
  Navigation,
  Lightbulb,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateCode, getFileExtension, getMonacoLanguage } from '@/lib/codegen-service';
import type {
  CodeLanguage,
  InteractiveElement,
  RecordedAction,
  ActionType,
  ElementType,
} from '@/types/codegen';
import { ACTION_LABELS } from '@/types/codegen';

// Lazy-load Monaco to keep initial bundle small
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400 text-sm">
      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading editor…
    </div>
  ),
});

// ─── Types ────────────────────────────────────────────────────────────────────

type PageState = 'idle' | 'analyzing' | 'ready';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LANGUAGE_OPTIONS: { value: CodeLanguage; label: string; badge: string }[] = [
  { value: 'playwright-js', label: 'JavaScript', badge: 'JS' },
  { value: 'playwright-ts', label: 'TypeScript', badge: 'TS' },
  { value: 'python', label: 'Python', badge: 'PY' },
];

const ACTION_OPTIONS: { type: ActionType; label: string; icon: React.ReactNode; needsSelector: boolean; needsValue: boolean; valuePlaceholder?: string }[] = [
  { type: 'navigate', label: 'Navigate', icon: <Navigation className="h-3.5 w-3.5" />, needsSelector: false, needsValue: true, valuePlaceholder: 'https://...' },
  { type: 'click', label: 'Click', icon: <MousePointerClick className="h-3.5 w-3.5" />, needsSelector: true, needsValue: false },
  { type: 'fill', label: 'Type text', icon: <Type className="h-3.5 w-3.5" />, needsSelector: true, needsValue: true, valuePlaceholder: 'Text to type…' },
  { type: 'select', label: 'Select option', icon: <ChevronDown className="h-3.5 w-3.5" />, needsSelector: true, needsValue: true, valuePlaceholder: 'Option value…' },
  { type: 'check', label: 'Check', icon: <CheckCircle className="h-3.5 w-3.5" />, needsSelector: true, needsValue: false },
  { type: 'uncheck', label: 'Uncheck', icon: <ToggleLeft className="h-3.5 w-3.5" />, needsSelector: true, needsValue: false },
  { type: 'hover', label: 'Hover', icon: <Eye className="h-3.5 w-3.5" />, needsSelector: true, needsValue: false },
  { type: 'press', label: 'Press key', icon: <Keyboard className="h-3.5 w-3.5" />, needsSelector: true, needsValue: true, valuePlaceholder: 'Enter, Tab, Escape…' },
  { type: 'assertText', label: 'Assert text', icon: <CheckCircle className="h-3.5 w-3.5" />, needsSelector: true, needsValue: true, valuePlaceholder: 'Expected text…' },
  { type: 'assertVisible', label: 'Assert visible', icon: <Eye className="h-3.5 w-3.5" />, needsSelector: true, needsValue: false },
  { type: 'assertURL', label: 'Assert URL', icon: <Link className="h-3.5 w-3.5" />, needsSelector: false, needsValue: true, valuePlaceholder: 'Expected URL…' },
  { type: 'screenshot', label: 'Screenshot', icon: <Camera className="h-3.5 w-3.5" />, needsSelector: false, needsValue: true, valuePlaceholder: 'screenshot.png' },
  { type: 'wait', label: 'Wait (ms)', icon: <Clock className="h-3.5 w-3.5" />, needsSelector: false, needsValue: true, valuePlaceholder: '1000' },
];

const ELEMENT_ICONS: Record<ElementType, React.ReactNode> = {
  button: <MousePointerClick className="h-3.5 w-3.5" />,
  input: <Type className="h-3.5 w-3.5" />,
  link: <Link className="h-3.5 w-3.5" />,
  select: <ChevronDown className="h-3.5 w-3.5" />,
  textarea: <Type className="h-3.5 w-3.5" />,
  other: <Globe className="h-3.5 w-3.5" />,
};

const ELEMENT_TYPE_COLORS: Record<ElementType, string> = {
  button: 'bg-blue-100 text-blue-700',
  input: 'bg-green-100 text-green-700',
  link: 'bg-purple-100 text-purple-700',
  select: 'bg-yellow-100 text-yellow-700',
  textarea: 'bg-green-100 text-green-700',
  other: 'bg-gray-100 text-gray-700',
};

// ─── Toast hook ───────────────────────────────────────────────────────────────

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CodegenPage() {
  const [pageState, setPageState] = useState<PageState>('idle');
  const [url, setUrl] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState('');
  const [elements, setElements] = useState<InteractiveElement[]>([]);
  const [actions, setActions] = useState<RecordedAction[]>([]);
  const [language, setLanguage] = useState<CodeLanguage>('playwright-ts');
  const [analyzeError, setAnalyzeError] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [elementFilter, setElementFilter] = useState<ElementType | 'all'>('all');
  const [expandedHint, setExpandedHint] = useState<string | null>(null);

  // Add-action form state
  const [addForm, setAddForm] = useState<{
    type: ActionType;
    selector: string;
    value: string;
    description: string;
    useDetected: string;
  }>({ type: 'click', selector: '', value: '', description: '', useDetected: '' });

  const { toasts, addToast, removeToast } = useToasts();

  // Generated code (reactive)
  const generatedCode = generateCode(actions, language, url);

  // ── Analyze URL ─────────────────────────────────────────────────────────────

  const handleStart = async () => {
    if (!url.trim()) return;
    setAnalyzeError('');
    setPageState('analyzing');
    setElements([]);
    setActions([]);

    try {
      const res = await fetch('/api/codegen/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed.');

      setSessionId(data.sessionId);
      setPageTitle(data.pageTitle || url);
      setElements(data.elements || []);
      setPageState('ready');
      addToast(`Found ${data.elements?.length ?? 0} interactive elements`, 'success');

      // Auto-add a navigate action as the first step
      setActions([
        {
          id: `act-${Date.now()}`,
          type: 'navigate',
          value: data.url || url,
          description: 'Open the target URL',
        },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to analyze URL.';
      setAnalyzeError(msg);
      setPageState('idle');
    }
  };

  // ── Stop session ─────────────────────────────────────────────────────────────

  const handleStop = async () => {
    if (sessionId) {
      await fetch('/api/codegen/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).catch(() => {});
    }
    setPageState('idle');
    setSessionId(null);
    setElements([]);
    setActions([]);
    setPageTitle('');
    setAnalyzeError('');
    addToast('Session stopped', 'info');
  };

  // ── Add action ────────────────────────────────────────────────────────────────

  const handleAddAction = () => {
    const opt = ACTION_OPTIONS.find((o) => o.type === addForm.type);
    if (!opt) return;

    const selector = addForm.useDetected
      ? addForm.useDetected
      : addForm.selector.trim();

    if (opt.needsSelector && !selector) {
      addToast('Please select or enter a selector', 'error');
      return;
    }
    if (opt.needsValue && !addForm.value.trim()) {
      addToast('Please enter a value', 'error');
      return;
    }

    const newAction: RecordedAction = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      type: addForm.type,
      selector: selector || undefined,
      value: addForm.value.trim() || undefined,
      description: addForm.description.trim() || undefined,
    };

    // Flaky locator check
    const el = elements.find((e) => e.selector === selector);
    if (el?.isFlaky) {
      newAction.isFlaky = true;
      newAction.healingSuggestion = el.healingSuggestions[0];
    }

    setActions((prev) => [...prev, newAction]);
    setAddForm((f) => ({ ...f, selector: '', value: '', description: '', useDetected: '' }));
    addToast('Step added', 'success');
  };

  // ── Quick-add by clicking detected element ────────────────────────────────────

  const handleElementClick = (el: InteractiveElement) => {
    const defaultAction: ActionType =
      el.elementType === 'input' || el.elementType === 'textarea'
        ? 'fill'
        : el.elementType === 'select'
        ? 'select'
        : 'click';

    setAddForm((f) => ({
      ...f,
      type: defaultAction,
      useDetected: el.selector,
      selector: el.selector,
      description: el.text
        ? `${defaultAction} "${el.text}"`
        : el.placeholder
        ? `${defaultAction} ${el.placeholder} field`
        : '',
    }));
    addToast(`Element selected — configure the step below`, 'info');
  };

  // ── Remove action ─────────────────────────────────────────────────────────────

  const removeAction = (id: string) => {
    setActions((prev) => prev.filter((a) => a.id !== id));
  };

  // ── Copy code ─────────────────────────────────────────────────────────────────

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedCode);
    addToast('Code copied to clipboard', 'success');
  };

  // ── Download script ───────────────────────────────────────────────────────────

  const handleDownload = () => {
    const ext = getFileExtension(language);
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `qa360-recorded.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
    addToast(`Downloaded qa360-recorded.${ext}`, 'success');
  };

  // ── Filtered elements ─────────────────────────────────────────────────────────

  const filteredElements =
    elementFilter === 'all' ? elements : elements.filter((e) => e.elementType === elementFilter);

  const elementTypeCounts = elements.reduce<Partial<Record<ElementType, number>>>((acc, el) => {
    acc[el.elementType] = (acc[el.elementType] ?? 0) + 1;
    return acc;
  }, {});

  const flakyCount = actions.filter((a) => a.isFlaky).length;
  const selectedOpt = ACTION_OPTIONS.find((o) => o.type === addForm.type);

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium pointer-events-auto transition-all',
              toast.type === 'success' && 'bg-green-600 text-white',
              toast.type === 'error' && 'bg-red-600 text-white',
              toast.type === 'info' && 'bg-gray-800 text-white',
            )}
          >
            {toast.type === 'success' && <CheckCircle className="h-4 w-4 shrink-0" />}
            {toast.type === 'error' && <AlertTriangle className="h-4 w-4 shrink-0" />}
            {toast.message}
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-1 opacity-70 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <Header
        title="Code Generator"
        subtitle="Record interactions and generate Playwright automation scripts"
        actions={
          <div className="flex items-center gap-2">
            {flakyCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                <AlertTriangle className="h-3 w-3" />
                {flakyCount} flaky {flakyCount === 1 ? 'selector' : 'selectors'}
              </span>
            )}
            <button
              onClick={() => setDarkMode((d) => !d)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {darkMode ? '☀ Light' : '🌙 Dark'}
            </button>
          </div>
        }
      />

      {/* Split layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ──────────── LEFT PANEL ──────────── */}
        <div className="w-96 shrink-0 flex flex-col border-r border-gray-200 bg-white overflow-y-auto">
          {/* URL input */}
          <div className="p-4 border-b border-gray-100 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Target URL
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="url"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && pageState === 'idle' && handleStart()}
                    disabled={pageState === 'analyzing' || pageState === 'ready'}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {pageState !== 'ready' ? (
                <button
                  onClick={handleStart}
                  disabled={!url.trim() || pageState === 'analyzing'}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {pageState === 'analyzing' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Analyze & Start
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  <Square className="h-4 w-4" />
                  Stop Session
                </button>
              )}
            </div>

            {analyzeError && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {analyzeError}
              </div>
            )}

            {pageState === 'ready' && (
              <div className="text-xs text-green-700 bg-green-50 border border-green-200 p-2 rounded-lg flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                <span>
                  <strong>{pageTitle}</strong> — {elements.length} elements detected
                </span>
              </div>
            )}
          </div>

          {/* Detected elements */}
          {pageState === 'ready' && elements.length > 0 && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-4 pt-3 pb-2 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Detected Elements
                </p>
                {/* Filter tabs */}
                <div className="flex gap-1 flex-wrap">
                  <button
                    onClick={() => setElementFilter('all')}
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium transition-colors',
                      elementFilter === 'all'
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                    )}
                  >
                    All ({elements.length})
                  </button>
                  {(Object.entries(elementTypeCounts) as [ElementType, number][]).map(([type, count]) => (
                    <button
                      key={type}
                      onClick={() => setElementFilter(type)}
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium capitalize transition-colors',
                        elementFilter === type
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                      )}
                    >
                      {type}s ({count})
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
                {filteredElements.map((el) => (
                  <div key={el.id}>
                    <button
                      onClick={() => handleElementClick(el)}
                      className={cn(
                        'w-full text-left p-2.5 rounded-lg border text-xs transition-all hover:shadow-sm group',
                        el.isFlaky
                          ? 'border-amber-200 bg-amber-50 hover:border-amber-300'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50',
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            'flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium capitalize',
                            ELEMENT_TYPE_COLORS[el.elementType],
                          )}
                        >
                          {ELEMENT_ICONS[el.elementType]}
                          {el.elementType}
                        </span>
                        {el.isFlaky && (
                          <span className="flex items-center gap-0.5 text-amber-600 font-medium">
                            <AlertTriangle className="h-3 w-3" /> flaky
                          </span>
                        )}
                        <span className="ml-auto text-gray-400 group-hover:text-blue-500 text-xs">
                          + use
                        </span>
                      </div>

                      <div className="font-medium text-gray-800 truncate">
                        {el.text || el.placeholder || el.label || el.ariaLabel || el.name || `<${el.tag}>`}
                      </div>

                      <div className="text-gray-400 font-mono text-[10px] truncate mt-0.5">
                        {el.selector}
                      </div>
                    </button>

                    {/* Flaky hint */}
                    {el.isFlaky && (
                      <div className="ml-2 mr-1 mb-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-b px-2 py-1.5">
                        <div className="flex items-center gap-1 font-medium mb-0.5">
                          <Lightbulb className="h-3 w-3" /> Healing suggestion
                        </div>
                        <div className="font-mono text-[10px] text-amber-800">
                          {el.healingSuggestions[0] ?? 'Add data-testid to element'}
                        </div>
                        {el.flakyReason && (
                          <div className="text-amber-600 mt-0.5">{el.flakyReason}</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add action form */}
          {pageState === 'ready' && (
            <div className="border-t border-gray-200 p-4 space-y-3 bg-gray-50">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Step
              </p>

              {/* Action type */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Action</label>
                <select
                  className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={addForm.type}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, type: e.target.value as ActionType, useDetected: '', selector: '' }))
                  }
                >
                  {ACTION_OPTIONS.map((o) => (
                    <option key={o.type} value={o.type}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector */}
              {selectedOpt?.needsSelector && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Selector</label>
                  {addForm.useDetected ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 border border-blue-300 bg-blue-50 rounded-lg text-xs">
                      <span className="font-mono text-blue-700 truncate flex-1">
                        {addForm.useDetected}
                      </span>
                      <button
                        onClick={() => setAddForm((f) => ({ ...f, useDetected: '', selector: '' }))}
                        className="text-blue-400 hover:text-blue-600 shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      className="w-full text-xs font-mono border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="page.getByRole('button', { name: '…' })"
                      value={addForm.selector}
                      onChange={(e) => setAddForm((f) => ({ ...f, selector: e.target.value }))}
                    />
                  )}
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Or click an element above to use it
                  </p>
                </div>
              )}

              {/* Value */}
              {selectedOpt?.needsValue && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    {addForm.type === 'navigate' || addForm.type === 'assertURL'
                      ? 'URL'
                      : addForm.type === 'wait'
                      ? 'Duration (ms)'
                      : addForm.type === 'screenshot'
                      ? 'Filename'
                      : 'Value'}
                  </label>
                  <input
                    type="text"
                    className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={selectedOpt.valuePlaceholder}
                    value={addForm.value}
                    onChange={(e) => setAddForm((f) => ({ ...f, value: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddAction()}
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Comment (optional)</label>
                <input
                  type="text"
                  className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe this step…"
                  value={addForm.description}
                  onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddAction()}
                />
              </div>

              <button
                onClick={handleAddAction}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Step
              </button>
            </div>
          )}

          {/* Idle placeholder */}
          {pageState === 'idle' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
                <Code2 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Ready to record</h3>
              <p className="text-xs text-gray-500">
                Enter a URL and click "Analyze &amp; Start" to detect interactive elements and begin building your script.
              </p>
            </div>
          )}
        </div>

        {/* ──────────── RIGHT PANEL ──────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white shrink-0">
            {/* Language selector */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              {LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLanguage(opt.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                    language === opt.value
                      ? 'bg-white shadow-sm text-gray-900'
                      : 'text-gray-500 hover:text-gray-700',
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-bold',
                      language === opt.value ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600',
                    )}
                  >
                    {opt.badge}
                  </span>
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {actions.length > 0 && (
                <span className="text-xs text-gray-400">{actions.length} step{actions.length !== 1 ? 's' : ''}</span>
              )}
              <button
                onClick={handleCopy}
                disabled={actions.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </button>
              <button
                onClick={handleDownload}
                disabled={actions.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
            </div>
          </div>

          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Step list */}
            {actions.length > 0 && (
              <div className="w-64 shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto">
                <div className="px-3 pt-3 pb-2 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Steps ({actions.length})
                  </p>
                </div>
                <div className="p-2 space-y-1">
                  {actions.map((action, idx) => (
                    <div
                      key={action.id}
                      className={cn(
                        'flex items-start gap-2 p-2 rounded-lg border text-xs group',
                        action.isFlaky
                          ? 'border-amber-200 bg-amber-50'
                          : 'border-gray-200 bg-white',
                      )}
                    >
                      <div className="flex items-center gap-1 shrink-0">
                        <GripVertical className="h-3 w-3 text-gray-300" />
                        <span className="w-4 h-4 flex items-center justify-center bg-gray-200 text-gray-600 rounded text-[10px] font-bold">
                          {idx + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-700 capitalize">
                          {ACTION_LABELS[action.type]}
                        </div>
                        {action.description && (
                          <div className="text-gray-400 truncate">{action.description}</div>
                        )}
                        {action.value && (
                          <div className="text-gray-400 font-mono text-[10px] truncate">
                            {action.value}
                          </div>
                        )}
                        {action.isFlaky && action.healingSuggestion && (
                          <div className="mt-1 text-amber-600 flex items-center gap-0.5">
                            <Lightbulb className="h-3 w-3 shrink-0" />
                            <span className="font-mono text-[10px] truncate">
                              {action.healingSuggestion}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeAction(action.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 shrink-0 transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monaco editor */}
            <div className="flex-1 min-w-0 relative">
              {actions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center bg-gray-900 text-center p-8">
                  <Wand2 className="h-10 w-10 text-gray-600 mb-3" />
                  <p className="text-gray-400 text-sm font-medium mb-1">No steps yet</p>
                  <p className="text-gray-600 text-xs max-w-xs">
                    {pageState === 'idle'
                      ? 'Analyze a URL to get started — detected elements will appear on the left.'
                      : 'Click a detected element or use the step builder to add your first action.'}
                  </p>
                </div>
              ) : (
                <MonacoEditor
                  height="100%"
                  language={getMonacoLanguage(language)}
                  value={generatedCode}
                  theme={darkMode ? 'vs-dark' : 'light'}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineHeight: 22,
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                    fontLigatures: true,
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    padding: { top: 16, bottom: 16 },
                    renderLineHighlight: 'none',
                    overviewRulerBorder: false,
                    smoothScrolling: true,
                    cursorBlinking: 'phase',
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
