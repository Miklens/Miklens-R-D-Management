import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, FlaskConical, TrendingUp, AlertTriangle, Search } from 'lucide-react';
import { useUsers } from '../hooks/useUsers';
import { useDailyLogs } from '../hooks/useDailyLogs';
import { Badge } from '../components/ui/Badge';
import { getProductName, getExperimentName } from '../constants';
import { formatDate } from '../utils/formatters';

/**
 * Management Visibility hub (SRS goal #1): lets Admin/Management understand
 * what every scientist is doing - logs submitted, hours spent, completion
 * rate, and blockers - without needing to read every daily log individually.
 */
export const TeamActivity: React.FC = () => {
  const navigate = useNavigate();
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: logs, isLoading: logsLoading } = useDailyLogs();
  const [search, setSearch] = useState('');

  const scientists = useMemo(
    () => users.filter(u => u.role === 'Scientist' && u.isActive),
    [users]
  );

  const stats = useMemo(() => {
    return scientists.map(sci => {
      const userLogs = logs.filter(l => l.userId === sci.id);
      const totalMinutes = userLogs.reduce((sum, l) => sum + l.timeSpentMinutes, 0);
      const completed = userLogs.filter(l => l.completionStatus === 'Completed').length;
      const blocked = userLogs.filter(l => l.completionStatus === 'Blocked').length;
      const avgConfidence = userLogs.length
        ? Math.round(userLogs.reduce((sum, l) => sum + l.confidenceLevel, 0) / userLogs.length)
        : 0;
      const lastLog = userLogs[0]; // hooks return newest-first (local) or ordered by createdAt desc (firestore)

      return {
        user: sci,
        logCount: userLogs.length,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
        completed,
        blocked,
        avgConfidence,
        lastLog,
      };
    });
  }, [scientists, logs]);

  const filteredStats = useMemo(() => {
    if (!search.trim()) return stats;
    const term = search.toLowerCase();
    return stats.filter(s =>
      s.user.name.toLowerCase().includes(term) ||
      s.user.department.toLowerCase().includes(term) ||
      s.user.designation.toLowerCase().includes(term)
    );
  }, [stats, search]);

  const teamTotals = useMemo(() => ({
    activeToday: stats.filter(s => s.lastLog && new Date(s.lastLog.date).toDateString() === new Date().toDateString()).length,
    totalLogs: stats.reduce((sum, s) => sum + s.logCount, 0),
    totalBlocked: stats.reduce((sum, s) => sum + s.blocked, 0),
  }), [stats]);

  const isLoading = usersLoading || logsLoading;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
          Team Activity
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          What every scientist is working on, at a glance. Failures and blockers are shown as learning signals, not penalties.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Today</dt>
          <dd className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{teamTotals.activeToday} / {scientists.length}</dd>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Logs Submitted</dt>
          <dd className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{teamTotals.totalLogs}</dd>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Open Blockers</dt>
          <dd className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{teamTotals.totalBlocked}</dd>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or department..."
          className="block w-full rounded-md border-gray-300 py-2 pl-9 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-gray-500">Loading team activity...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredStats.map(({ user, logCount, totalHours, completed, blocked, avgConfidence, lastLog }) => (
            <button
              key={user.id}
              onClick={() => navigate(`/profile/${user.id}`)}
              className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <img className="h-12 w-12 rounded-full bg-gray-200" src={user.avatar} alt="" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.designation} · {user.department}</p>
                  {lastLog ? (
                    <p className="mt-1 text-xs text-gray-400">
                      Last log {formatDate(lastLog.date)} on {getProductName(lastLog.productId)} ({getExperimentName(lastLog.experimentId)})
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-400">No logs submitted yet</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{logCount}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Logs</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{totalHours}h</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Logged</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{avgConfidence}%</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Avg Confidence</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{blocked}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Blocked</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 sm:flex-col sm:items-end">
                <Badge variant="success">{completed} completed</Badge>
              </div>
            </button>
          ))}

          {filteredStats.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500 dark:border-gray-700">
              No scientists match your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
