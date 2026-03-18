'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ChartBarIcon, UserGroupIcon, ClipboardDocumentListIcon, ClockIcon } from '@heroicons/react/24/outline';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  assigned_to: string;
  due_date: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

interface DashboardData {
  tasks: Task[];
  employees: Employee[];
}

function statusClass(status: string) {
  if (status === 'completed') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'in_progress') return 'bg-cyan-50 text-cyan-700 border-cyan-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

export default function Home() {
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await axios.get('/api/dashboard', { timeout: 90000 });
      return response.data;
    },
  });

  const tasks = dashboardData?.tasks ?? [];
  const employees = dashboardData?.employees ?? [];

  const metrics = useMemo(() => {
    const completed = tasks.filter((task) => task.status === 'completed').length;
    const inProgress = tasks.filter((task) => task.status === 'in_progress').length;
    const pending = tasks.filter((task) => task.status === 'pending').length;
    const completionRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

    return {
      completed,
      inProgress,
      pending,
      completionRate,
    };
  }, [tasks]);

  const topOwners = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((task) => {
      const owner = task.assigned_to || 'Unassigned';
      counts[owner] = (counts[owner] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-32 rounded-3xl bg-white/80" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-28 rounded-2xl bg-white/80" />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="h-96 rounded-2xl bg-white/80" />
          <div className="h-96 rounded-2xl bg-white/80" />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Tasks',
      value: tasks.length,
      icon: ClipboardDocumentListIcon,
      tone: 'text-cyan-700 bg-cyan-100',
    },
    {
      name: 'Team Members',
      value: employees.length,
      icon: UserGroupIcon,
      tone: 'text-emerald-700 bg-emerald-100',
    },
    {
      name: 'Completion Rate',
      value: `${metrics.completionRate}%`,
      icon: ChartBarIcon,
      tone: 'text-slate-700 bg-slate-100',
    },
    {
      name: 'In Progress',
      value: metrics.inProgress,
      icon: ClockIcon,
      tone: 'text-amber-700 bg-amber-100',
    },
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 p-7 text-white shadow-xl">
        <div className="absolute -left-12 top-6 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute right-4 top-0 h-48 w-48 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Team Operations Command Center</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Live delivery health at a glance</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-200 sm:text-base">
            Monitor throughput, identify bottlenecks, and use AI Copilot for evidence-backed task and staffing decisions.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((item) => (
          <div key={item.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{item.name}</p>
              <div className={`rounded-lg p-2 ${item.tone}`}>
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-900">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Execution Mix</h2>
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Tasks</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between text-sm text-slate-600"><span>Completed</span><span>{metrics.completed}</span></div>
              <div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${tasks.length ? (metrics.completed / tasks.length) * 100 : 0}%` }} /></div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-sm text-slate-600"><span>In Progress</span><span>{metrics.inProgress}</span></div>
              <div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-cyan-500" style={{ width: `${tasks.length ? (metrics.inProgress / tasks.length) * 100 : 0}%` }} /></div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-sm text-slate-600"><span>Pending</span><span>{metrics.pending}</span></div>
              <div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-500" style={{ width: `${tasks.length ? (metrics.pending / tasks.length) * 100 : 0}%` }} /></div>
            </div>
          </div>

          <p className="mt-5 rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-sm text-cyan-800">
            Current delivery completion rate: <strong>{metrics.completionRate}%</strong>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Workload Leaders</h2>
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Top Assignees</span>
          </div>

          <div className="space-y-3">
            {topOwners.length === 0 && <p className="text-sm text-slate-500">No assignment data available.</p>}
            {topOwners.map(([name, count]) => (
              <div key={name} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-800">{name}</p>
                  <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-700">{count} tasks</span>
                </div>
              </div>
            ))}
          </div>

          <h3 className="mt-6 mb-3 text-sm font-semibold text-slate-700">Recent Tasks</h3>
          <div className="space-y-2">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">{task.title}</p>
                  <p className="text-xs text-slate-500">{task.assigned_to || 'Unassigned'} • Due {task.due_date || 'TBD'}</p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusClass(task.status)}`}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
