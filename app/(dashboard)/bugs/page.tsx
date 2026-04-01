'use client';

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
        {/* Filters */}
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

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Bug Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Severity</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Linked TC</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Reported</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No bugs found.</td></tr>
              )}
              {filtered.map((bug) => {
                const linkedTc = mockTestCases.find((tc) => tc.id === bug.test_case_id);
                return (
                  <tr key={bug.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{bug.title}</p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">{bug.description}</p>
                    </td>
                    <td className="px-4 py-3"><span className={`badge ${getPriorityColor(bug.severity)} capitalize`}>{bug.severity}</span></td>
                    <td className="px-4 py-3"><span className={`badge ${getStatusColor(bug.status)} capitalize`}>{bug.status.replace('_', ' ')}</span></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{linkedTc ? linkedTc.title.slice(0, 30) + '…' : '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(bug.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEdit(bug)} className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteId(bug.id)} className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">{editingId ? 'Edit Bug' : 'Report Bug'}</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Title *</label>
                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Brief bug title" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input resize-none" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What went wrong?" />
              </div>
              <div>
                <label className="label">Steps to Reproduce</label>
                <textarea className="input resize-none" rows={4} value={form.steps_to_reproduce} onChange={(e) => setForm({ ...form, steps_to_reproduce: e.target.value })} placeholder="1. Step one&#10;2. Step two" />
              </div>
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
                  <option value="">— None —</option>
                  {mockTestCases.map((tc) => <option key={tc.id} value={tc.id}>{tc.title}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSave} disabled={!form.title.trim()} className="btn-primary flex-1">{editingId ? 'Save Changes' : 'Report Bug'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-6 text-center">
            <p className="text-gray-900 font-medium mb-2">Delete Bug Report?</p>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDelete} className="btn-danger flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
