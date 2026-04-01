'use client';

import { useMemo } from 'react';
import Header from '@/components/header';
import StatCard from '@/components/stat-card';
import { ClipboardList, CheckCircle, XCircle, Clock, Bug, AlertCircle } from 'lucide-react';
import { mockDashboardStats, mockTestRuns } from '@/lib/mock-data';
import { formatRelativeTime, formatDate } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
} from 'recharts';

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6'];

export default function DashboardPage() {
  const stats = mockDashboardStats;

  const pieData = useMemo(() => [
    { name: 'Passed', value: stats.passed },
    { name: 'Failed', value: stats.failed },
    { name: 'Pending', value: stats.pending },
  ], [stats]);

  const barData = useMemo(() =>
    mockTestRuns.map((run) => ({
      name: run.name.split(' - ')[0],
      Passed: run.passed,
      Failed: run.failed,
      Skipped: run.skipped,
    })),
  []);

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Overview of your QA testing activity"
      />
      <div className="p-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="xl:col-span-2">
            <StatCard title="Total Test Cases" value={stats.totalTestCases} icon={ClipboardList} color="blue" subtitle="All test cases" />
          </div>
          <div className="xl:col-span-2">
            <StatCard title="Passed" value={stats.passed} icon={CheckCircle} color="green" subtitle="Tests passing" />
          </div>
          <div className="xl:col-span-2">
            <StatCard title="Failed" value={stats.failed} icon={XCircle} color="red" subtitle="Need attention" />
          </div>
          <div className="xl:col-span-2">
            <StatCard title="Pending" value={stats.pending} icon={Clock} color="yellow" subtitle="Not yet run" />
          </div>
          <div className="xl:col-span-2">
            <StatCard title="Total Bugs" value={stats.totalBugs} icon={Bug} color="purple" subtitle="Tracked issues" />
          </div>
          <div className="xl:col-span-2">
            <StatCard title="Open Bugs" value={stats.openBugs} icon={AlertCircle} color="red" subtitle="Require action" />
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="card p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Test Case Status</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="card p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Recent Test Runs</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Passed" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Failed" fill="#ef4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Skipped" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {stats.recentActivity.map((item) => {
              const typeColors: Record<string, string> = {
                test_case: 'bg-blue-100 text-blue-700',
                bug: 'bg-red-100 text-red-700',
                test_run: 'bg-green-100 text-green-700',
              };
              const actionVerbs: Record<string, string> = {
                created: 'Created',
                updated: 'Updated',
                resolved: 'Resolved',
              };
              return (
                <div key={item.id} className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0">
                  <span className={`badge ${typeColors[item.type]} capitalize`}>
                    {item.type.replace('_', ' ')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      <span className="font-medium">{actionVerbs[item.action]}:</span> {item.title}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{formatRelativeTime(item.timestamp)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Test Runs Table */}
        <div className="card p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Test Run History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-600">Run Name</th>
                  <th className="text-center py-2 font-medium text-gray-600">Total</th>
                  <th className="text-center py-2 font-medium text-gray-600">Passed</th>
                  <th className="text-center py-2 font-medium text-gray-600">Failed</th>
                  <th className="text-right py-2 font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {mockTestRuns.map((run) => (
                  <tr key={run.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 font-medium text-gray-900">{run.name}</td>
                    <td className="py-3 text-center text-gray-600">{run.total}</td>
                    <td className="py-3 text-center text-green-600 font-medium">{run.passed}</td>
                    <td className="py-3 text-center text-red-600 font-medium">{run.failed}</td>
                    <td className="py-3 text-right text-gray-500">{formatDate(run.created_at)}</td>
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
