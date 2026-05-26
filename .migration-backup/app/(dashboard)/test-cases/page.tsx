'use client';

import { useState } from 'react';
import Header from '@/components/header';
import { Plus, Search, Pencil, Trash2, ChevronDown } from 'lucide-react';
import { mockTestCases } from '@/lib/mock-data';
import { getPriorityColor, getStatusColor, formatDate, generateId } from '@/lib/utils';
import type { TestCase, Priority, TestStatus } from '@/types';

type FormData = Omit<TestCase, 'id' | 'created_at' | 'updated_at'>;

const emptyForm: FormData = {
  title: '',
  description: '',
  steps: '',
  expected_result: '',
  priority: 'medium',
  status: 'pending',
};

export default function TestCasesPage() {
  const [testCases, setTestCases] = useState<TestCase[]>(mockTestCases);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<TestStatus | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = testCases.filter((tc) => {
    const matchesSearch = tc.title.toLowerCase().includes(search.toLowerCase()) ||
      tc.description.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = filterPriority === 'all' || tc.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || tc.status === filterStatus;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (tc: TestCase) => {
    setForm({ title: tc.title, description: tc.description, steps: tc.steps, expected_result: tc.expected_result, priority: tc.priority, status: tc.status });
    setEditingId(tc.id);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    const now = new Date().toISOString();
    if (editingId) {
      setTestCases((prev) => prev.map((tc) => tc.id === editingId ? { ...tc, ...form, updated_at: now } : tc));
    } else {
      const newTc: TestCase = { ...form, id: generateId(), created_at: now, updated_at: now };
      setTestCases((prev) => [newTc, ...prev]);
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (deleteId) setTestCases((prev) => prev.filter((tc) => tc.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <div>
      <Header
        title="Test Cases"
        subtitle={`${testCases.length} total test cases`}
        actions={
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> New Test Case
          </button>
        }
      />
      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="card p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input className="input pl-9" placeholder="Search test cases…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input w-auto" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as Priority | 'all')}>
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <select className="input w-auto" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as TestStatus | 'all')}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Priority</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Updated</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">No test cases found.</td></tr>
              )}
              {filtered.map((tc) => (
                <tr key={tc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{tc.title}</p>
                    <p className="text-xs text-gray-500 truncate max-w-xs">{tc.description}</p>
                  </td>
                  <td className="px-4 py-3"><span className={`badge ${getPriorityColor(tc.priority)} capitalize`}>{tc.priority}</span></td>
                  <td className="px-4 py-3"><span className={`badge ${getStatusColor(tc.status)} capitalize`}>{tc.status}</span></td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(tc.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(tc)} className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setDeleteId(tc.id)} className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">{editingId ? 'Edit Test Case' : 'New Test Case'}</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Title *</label>
                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Test case title" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input resize-none" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
              </div>
              <div>
                <label className="label">Steps</label>
                <textarea className="input resize-none" rows={4} value={form.steps} onChange={(e) => setForm({ ...form, steps: e.target.value })} placeholder="1. Step one&#10;2. Step two" />
              </div>
              <div>
                <label className="label">Expected Result</label>
                <textarea className="input resize-none" rows={2} value={form.expected_result} onChange={(e) => setForm({ ...form, expected_result: e.target.value })} placeholder="What should happen?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Priority</label>
                  <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TestStatus })}>
                    <option value="pending">Pending</option>
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                    <option value="skipped">Skipped</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSave} disabled={!form.title.trim()} className="btn-primary flex-1">
                  {editingId ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-6 text-center">
            <p className="text-gray-900 font-medium mb-2">Delete Test Case?</p>
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
