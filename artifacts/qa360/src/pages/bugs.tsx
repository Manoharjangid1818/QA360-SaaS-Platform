import { useState } from 'react';
import Header from '@/components/header';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { mockBugs, mockTestCases } from '@/lib/mock-data';
import { getPriorityColor, getStatusColor, formatDate, generateId } from '@/lib/utils';
import type { Bug, BugSeverity, BugStatus } from '@/types';

type FormData = Omit<Bug, 'id' | 'created_at' | 'updated_at'>;
const emptyForm: FormData = { title: '', description: '', steps_to_reproduce: '', severity: 'medium', status: 'open', test_case_id: '' };

export default function BugsPage() {
  const [bugs, setBugs] = useState<Bug[]>(mockBugs);
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<BugSeverity | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<BugStatus | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = bugs.filter((b) => {
    const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || b.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowModal(true); };
  const openEdit = (b: Bug) => {
    setForm({ title: b.title, description: b.description, steps_to_reproduce: b.steps_to_reproduce, severity: b.severity, status: b.status, test_case_id: b.test_case_id || '' });
    setEditingId(b.id);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    const now = new Date().toISOString();
    if (editingId) {
      setBugs((prev) => prev.map((b) => b.id === editingId ? { ...b, ...form, updated_at: now } : b));
    } else {
      setBugs((prev) => [{ ...form, id: generateId(), created_at: now, updated_at: now }, ...prev]);
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (deleteId) setBugs((prev) => prev.filter((b) => b.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <div>
      <Header
        title="Bug Tracker"
        subtitle={`${bugs.length} bugs tracked`}
        actions={
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> Report Bug
          </button>
        }
      />
      <div className="p-6 space-y-4">
        <div className="card p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input className="input pl-9" placeholder="Search bugs…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input w-auto" value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value as BugSeverity | 'all')}>
            <option value="all">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <select className="input w-auto" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as BugStatus | 'all')}>
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="card p-12 text-center text-gray-500">No bugs found</div>
          ) : (
            filtered.map((b) => (
              <div key={b.id} className="card p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${getPriorityColor(b.severity)} capitalize`}>{b.severity}</span>
                      <span className={`badge ${getStatusColor(b.status)} capitalize`}>{b.status.replace('_', ' ')}</span>
                      {b.test_case_id && <span className="badge bg-blue-50 text-blue-600 text-xs">Linked TC</span>}
                    </div>
                    <h3 className="font-medium text-gray-900 truncate">{b.title}</h3>
                    <p className="text-sm text-gray-500 truncate mt-0.5">{b.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(b.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(b)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteId(b.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{editingId ? 'Edit Bug' : 'Report Bug'}</h2>
            <div className="space-y-4">
              <div><label className="label">Title *</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Bug title" /></div>
              <div><label className="label">Description</label><textarea className="input resize-none" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the bug" /></div>
              <div><label className="label">Steps to Reproduce</label><textarea className="input resize-none" rows={4} value={form.steps_to_reproduce} onChange={(e) => setForm({ ...form, steps_to_reproduce: e.target.value })} placeholder="1. Step one&#10;2. Step two" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Severity</label>
                  <select className="input" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as BugSeverity })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as BugStatus })}>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Linked Test Case (optional)</label>
                <select className="input" value={form.test_case_id} onChange={(e) => setForm({ ...form, test_case_id: e.target.value })}>
                  <option value="">None</option>
                  {mockTestCases.map((tc) => <option key={tc.id} value={tc.id}>{tc.title}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} className="btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Bug?</h2>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
