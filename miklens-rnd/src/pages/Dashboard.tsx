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

const StatCard = ({ title, value, change }: { title: string; value: string; change: string }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</dt>
    <dd className="mt-2 flex items-baseline gap-x-2">
      <span className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">{value}</span>
      <span className={`text-sm font-medium ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
        {change}
      </span>
    </dd>
  </div>
);

export const Dashboard: React.FC = () => {
  const { profile, userRole } = useAuth();
  const { data: users } = useUsers();
  const { data: logs } = useDailyLogs();

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
    : 0;

  const recentActivity = useMemo(
    () => [...relevantLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [relevantLogs]
  );

  const userName = (userId: string) => users.find(u => u.id === userId)?.name || 'Unknown';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
          {isManagement ? 'Executive Dashboard' : `Welcome back, ${profile?.name?.split(' ')[0] || 'there'}`}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isManagement ? (
          <>
            <StatCard title="Active Scientists" value={String(scientistCount)} change={`${activeToday} active today`} />
            <StatCard title="Logs Submitted" value={String(logs.length)} change={`+${relevantLogs.filter(l => new Date(l.date) > new Date(Date.now() - 7 * 86400000)).length} this week`} />
            <StatCard title="Avg Confidence" value={`${avgConfidence}%`} change={completed >= blocked ? '+ trending up' : '- needs attention'} />
            <StatCard title="Open Blockers" value={String(blocked)} change={blocked > 0 ? 'needs review' : 'all clear'} />
          </>
        ) : (
          <>
            <StatCard title="Your Logs" value={String(relevantLogs.length)} change="total submitted" />
            <StatCard title="Completed" value={String(completed)} change="activities" />
            <StatCard title="Blocked" value={String(blocked)} change="learning opportunities" />
            <StatCard title="Avg Confidence" value={`${avgConfidence}%`} change="across your logs" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:col-span-2">
          <h3 className="mb-4 text-lg font-medium leading-6 text-gray-900 dark:text-white">Research Productivity</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#1f2937' }}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Recent Activity</h3>
            {isManagement && (
              <Link to="/team-activity" className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            )}
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No activity yet.</p>
          ) : (
            <ul className="space-y-4">
              {recentActivity.map(log => (
                <li key={log.id} className="flex items-start space-x-3">
                  <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {isManagement ? userName(log.userId) : getProductName(log.productId)}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {isManagement ? `${getProductName(log.productId)} · ${getExperimentName(log.experimentId)}` : log.objective}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant={log.completionStatus === 'Completed' ? 'success' : log.completionStatus === 'Blocked' ? 'warning' : 'info'}>
                        {log.completionStatus}
                      </Badge>
                      <span className="text-xs text-gray-400">{formatDate(log.date)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
