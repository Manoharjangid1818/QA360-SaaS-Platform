import { useState, useCallback } from 'react';
import Header from '@/components/header';
import {
  Play, Square, Copy, Download, Plus, Trash2, AlertTriangle, CheckCircle,
  Loader2, Globe, MousePointerClick, Type, ChevronDown, Code2, GripVertical,
  Link, ToggleLeft, Keyboard, Eye, Camera, Clock, Navigation, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateCode, getFileExtension, getMonacoLanguage } from '@/lib/codegen-service';
import type { CodeLanguage, RecordedAction, ActionType } from '@/types/codegen';
import { ACTION_LABELS } from '@/types/codegen';

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
  { type: 'assertURL', label: 'Assert URL', icon: <Link className="h-3.5 w-3.5" />, needsSelector: false, needsValue: true, valuePlaceholder: 'https://...' },
  { type: 'screenshot', label: 'Screenshot', icon: <Camera className="h-3.5 w-3.5" />, needsSelector: false, needsValue: false },
  { type: 'wait', label: 'Wait (ms)', icon: <Clock className="h-3.5 w-3.5" />, needsSelector: false, needsValue: true, valuePlaceholder: '1000' },
];

function generateActionId() {
  return Math.random().toString(36).substr(2, 9);
}

export default function CodegenPage() {
  const [targetUrl, setTargetUrl] = useState('https://example.com');
  const [actions, setActions] = useState<RecordedAction[]>([]);
  const [language, setLanguage] = useState<CodeLanguage>('playwright-ts');
  const [copied, setCopied] = useState(false);
  const [showAddAction, setShowAddAction] = useState(false);
  const [newAction, setNewAction] = useState<{ type: ActionType; selector: string; value: string }>({ type: 'click', selector: '', value: '' });

  const addAction = () => {
    const opt = ACTION_OPTIONS.find((o) => o.type === newAction.type);
    if (!opt) return;
    const action: RecordedAction = {
      id: generateActionId(),
      type: newAction.type,
      ...(opt.needsSelector && newAction.selector ? { selector: newAction.selector } : {}),
      ...(opt.needsValue && newAction.value ? { value: newAction.value } : {}),
      description: `${ACTION_LABELS[newAction.type]}${newAction.selector ? ` on ${newAction.selector}` : ''}`,
    };
    setActions((prev) => [...prev, action]);
    setNewAction({ type: 'click', selector: '', value: '' });
    setShowAddAction(false);
  };

  const removeAction = (id: string) => setActions((prev) => prev.filter((a) => a.id !== id));

  const moveUp = (index: number) => {
    if (index === 0) return;
    setActions((prev) => {
      const arr = [...prev];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr;
    });
  };

  const moveDown = (index: number) => {
    setActions((prev) => {
      if (index >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr;
    });
  };

  const generatedCode = generateCode(actions, language, targetUrl);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = getFileExtension(language);
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test_recorded${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedOpt = ACTION_OPTIONS.find((o) => o.type === newAction.type);

  return (
    <div>
      <Header title="Playwright Code Generator" subtitle="Build Playwright test scripts by composing actions" />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="card p-4">
            <label className="label">Target URL</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input className="input pl-9" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="https://..." />
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Actions ({actions.length})</h3>
              <button onClick={() => setShowAddAction(true)} className="btn-primary flex items-center gap-1.5 text-sm py-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Action
              </button>
            </div>

            {actions.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">No actions yet. Add an action to get started.</div>
            ) : (
              <div className="space-y-2">
                {actions.map((action, index) => {
                  const opt = ACTION_OPTIONS.find((o) => o.type === action.type);
                  return (
                    <div key={action.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2.5">
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => moveUp(index)} disabled={index === 0} className="text-gray-300 hover:text-gray-500 disabled:opacity-30">▲</button>
                        <button onClick={() => moveDown(index)} disabled={index === actions.length - 1} className="text-gray-300 hover:text-gray-500 disabled:opacity-30">▼</button>
                      </div>
                      <GripVertical className="h-4 w-4 text-gray-300" />
                      <span className="text-gray-400">{opt?.icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-gray-700">{ACTION_LABELS[action.type]}</span>
                        {action.selector && <span className="text-xs text-blue-600 ml-2">{action.selector}</span>}
                        {action.value && <span className="text-xs text-gray-500 ml-1">→ {action.value}</span>}
                      </div>
                      <button onClick={() => removeAction(action.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {showAddAction && (
            <div className="card p-4 border-blue-200 bg-blue-50">
              <h4 className="font-medium text-gray-900 mb-3">Add Action</h4>
              <div className="space-y-3">
                <div>
                  <label className="label">Action Type</label>
                  <select className="input" value={newAction.type} onChange={(e) => setNewAction({ ...newAction, type: e.target.value as ActionType })}>
                    {ACTION_OPTIONS.map((o) => <option key={o.type} value={o.type}>{o.label}</option>)}
                  </select>
                </div>
                {selectedOpt?.needsSelector && (
                  <div>
                    <label className="label">Selector</label>
                    <input className="input" value={newAction.selector} onChange={(e) => setNewAction({ ...newAction, selector: e.target.value })} placeholder="#id, .class, [data-testid=...]" />
                  </div>
                )}
                {selectedOpt?.needsValue && (
                  <div>
                    <label className="label">Value</label>
                    <input className="input" value={newAction.value} onChange={(e) => setNewAction({ ...newAction, value: e.target.value })} placeholder={selectedOpt.valuePlaceholder} />
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setShowAddAction(false)} className="btn-secondary text-sm">Cancel</button>
                <button onClick={addAction} className="btn-primary text-sm">Add</button>
              </div>
            </div>
          )}
        </div>

        <div className="card flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex gap-2">
              {LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLanguage(opt.value)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', language === opt.value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
                >
                  {opt.badge} {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={handleCopy} className="btn-secondary text-sm flex items-center gap-1.5 py-1.5">
                {copied ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button onClick={handleDownload} className="btn-secondary text-sm flex items-center gap-1.5 py-1.5">
                <Download className="h-3.5 w-3.5" /> Download
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-gray-900 rounded-b-xl">
            <pre className="p-4 text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">{generatedCode}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
