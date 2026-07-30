import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileText, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../hooks/useUsers';
import { useDailyLogs } from '../hooks/useDailyLogs';
import { getProductName, getExperimentName } from '../constants';
import { Badge } from '../components/ui/Badge';
import { formatDate } from '../utils/formatters';

const mockData = [
  { name: 'Jan', value: 40 },
  { name: 'Feb', value: 30 },
  { name: 'Mar', value: 60 },
  { name: 'Apr', value: 45 },
  { name: 'May', value: 80 },
  { name: 'Jun', value: 65 },
];

import { ScientistHub } from '../components/ScientistHub';
import { Plus, Workflow, Pipette, Beaker, MapPin, Sparkles, Clock, Edit3, CheckSquare, CheckCircle2, Circle } from 'lucide-react';
import { useTasks } from '../contexts/TaskContext';

const StatCard = ({ title, value, change, link }: { title: string; value: string; change: string; link?: string }) => {
  const content = (
    <div className="rounded-2xl border border-gray-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl transition-all hover:shadow-md dark:border-gray-800/80 dark:bg-gray-900/80">
      <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{title}</dt>
      <dd className="mt-2 flex items-baseline gap-x-2">
        <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{value}</span>
        <span className={`text-xs font-semibold ${change.includes('+') || change.includes('active') ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
          {change}
        </span>
      </dd>
    </div>
  );

  return link ? <Link to={link}>{content}</Link> : content;
};

export const Dashboard: React.FC = () => {
  const { profile, userRole } = useAuth();
  const { data: users } = useUsers();
  const { data: logs } = useDailyLogs();
  const { tasks, toggleTaskStatus } = useTasks();

  const isManagement = userRole === 'Admin' || userRole === 'Management';

  const scientistCount = useMemo(() => users.filter(u => u.role === 'Scientist' && u.isActive).length, [users]);

  const activeToday = useMemo(() => {
    const today = new Date().toDateString();
    const activeIds = new Set(logs.filter(l => new Date(l.date).toDateString() === today).map(l => l.userId));
    return activeIds.size;
  }, [logs]);

  const relevantLogs = useMemo(() => {
    if (isManagement) return logs;
    return logs.filter(l => l.userId === profile?.id);
  }, [logs, isManagement, profile?.id]);

  const completed = relevantLogs.filter(l => l.completionStatus === 'Completed').length;
  const blocked = relevantLogs.filter(l => l.completionStatus === 'Blocked').length;
  const avgConfidence = relevantLogs.length
    ? Math.round(relevantLogs.reduce((s, l) => s + l.confidenceLevel, 0) / relevantLogs.length)
    : 85;

  const recentActivity = useMemo(
    () => [...relevantLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [relevantLogs]
  );

  const userName = (userId: string) => users.find(u => u.id === userId)?.name || 'Unknown';

  return (
    <div className="space-y-6">
      {/* Quick Access Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border border-emerald-100/50 dark:border-emerald-900/30">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isManagement ? 'Executive Overview' : `Welcome back, ${profile?.name?.split(' ')[0] || 'Scientist'}`}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Agricultural R&D Management Portal</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/research-log"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-xs font-semibold shadow-md hover:from-emerald-600 hover:to-teal-600 transition-all"
          >
            <Edit3 className="w-4 h-4" /> Log Work
          </Link>
          <Link
            to="/products"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            <Workflow className="w-4 h-4 text-emerald-500" /> Products
          </Link>
          <Link
            to="/experiments"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            <Beaker className="w-4 h-4 text-purple-500" /> Experiments & Testing
          </Link>
          <Link
            to="/ai-insights"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold shadow-md hover:bg-purple-700 transition-all"
          >
            <Sparkles className="w-4 h-4" /> AI Insights
          </Link>
        </div>
      </div>

      {/* Main Scientist Hub Component */}
      <ScientistHub userId={profile?.id} />

      {/* Stats Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isManagement ? (
          <>
            <StatCard title="Active Scientists" value={String(scientistCount)} change={`${activeToday} active today`} link="/employees" />
            <StatCard title="Logs Submitted" value={String(logs.length)} change={`+${relevantLogs.filter(l => new Date(l.date) > new Date(Date.now() - 7 * 86400000)).length} this week`} link="/research-log" />
            <StatCard title="Avg Confidence" value={`${avgConfidence}%`} change={completed >= blocked ? '+ trending up' : '- needs attention'} link="/analytics" />
            <StatCard title="Open Blockers" value={String(blocked)} change={blocked > 0 ? 'needs review' : 'all clear'} link="/team-activity" />
          </>
        ) : (
          <>
            <StatCard title="Your Logs" value={String(relevantLogs.length)} change="total submitted" link="/research-log" />
            <StatCard title="Completed" value={String(completed)} change="activities" link="/time-motion" />
            <StatCard title="Blocked" value={String(blocked)} change="learning opportunities" link="/research-log" />
            <StatCard title="Avg Confidence" value={`${avgConfidence}%`} change="across your logs" link="/ai-insights" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800/80 dark:bg-gray-900 lg:col-span-2">
          <h3 className="mb-4 text-base font-bold leading-6 text-gray-900 dark:text-white">Research Productivity Curve</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#1f2937' }}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800/80 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold leading-6 text-gray-900 dark:text-white">Recent Activity</h3>
            {isManagement && (
              <Link to="/team-activity" className="flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
                View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            )}
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity.</p>
          ) : (
            <ul className="space-y-3">
              {recentActivity.map(log => (
                <li key={log.id} className="flex items-start space-x-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {isManagement ? userName(log.userId) : getProductName(log.productId)}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {isManagement ? `${getProductName(log.productId)} · ${getExperimentName(log.experimentId)}` : log.objective}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant={log.completionStatus === 'Completed' ? 'success' : log.completionStatus === 'Blocked' ? 'warning' : 'info'}>
                        {log.completionStatus}
                      </Badge>
                      <span className="text-[10px] text-gray-400">{formatDate(log.date)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Global Active Tasks Widget */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800/80 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-6 text-gray-900 dark:text-white">Active Product & Experiment Tasks</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tasks linked across products, field trials & research milestones</p>
            </div>
          </div>
          <Link to="/tasks" className="flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
            Go to Task Center <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tasks.slice(0, 6).map((task) => (
            <div
              key={task.id}
              className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex items-start gap-3 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors"
            >
              <button
                onClick={() => toggleTaskStatus(task.id)}
                className="mt-0.5 flex-shrink-0"
              >
                {task.status === 'Completed' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : task.status === 'In Progress' ? (
                  <Clock className="h-4 w-4 text-amber-500" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-300 dark:text-gray-600 hover:text-emerald-500 transition-colors" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-bold truncate ${task.status === 'Completed' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                  {task.title}
                </p>
                <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                  <span className="truncate font-semibold text-emerald-600 dark:text-emerald-400">{task.entityName || task.type}</span>
                  <span>{task.assignedToName || 'Unassigned'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
