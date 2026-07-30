import React, { useState, useMemo } from 'react';
import {
  Bell, Check, X, Trash2, FlaskConical, ClipboardList,
  Clock, FileText, AlertCircle, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { getLogsByUser } from '../services/localStore';
import { useExperiments } from '../contexts/ExperimentContext';
import { useTasks } from '../contexts/TaskContext';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

interface RealNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'session' | 'experiment' | 'task' | 'info' | 'warning';
  unread: boolean;
}

const timeLabel = (dateStr?: string): string => {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  if (isToday(d)) return formatDistanceToNow(d, { addSuffix: true });
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'dd MMM yyyy');
};

const TYPE_CONFIG = {
  session:    { icon: Clock,         bg: 'bg-emerald-100 dark:bg-emerald-950', color: 'text-emerald-600 dark:text-emerald-400', border: 'border-l-emerald-500' },
  experiment: { icon: FlaskConical,  bg: 'bg-purple-100 dark:bg-purple-950',   color: 'text-purple-600 dark:text-purple-400',   border: 'border-l-purple-500' },
  task:       { icon: ClipboardList, bg: 'bg-blue-100 dark:bg-blue-950',       color: 'text-blue-600 dark:text-blue-400',       border: 'border-l-blue-500' },
  info:       { icon: FileText,      bg: 'bg-gray-100 dark:bg-gray-800',       color: 'text-gray-500 dark:text-gray-400',       border: 'border-l-gray-400' },
  warning:    { icon: AlertCircle,   bg: 'bg-amber-100 dark:bg-amber-950',     color: 'text-amber-600 dark:text-amber-400',     border: 'border-l-amber-500' },
};

export const Notifications: React.FC = () => {
  const { profile } = useAuth();
  const userId = profile?.id || 'sci-1';
  const { experiments, labTests } = useExperiments();
  const { tasks } = useTasks();

  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [readIds, setReadIds]     = useState<Set<string>>(new Set());
  const [filter, setFilter]       = useState<'all' | 'unread'>('all');

  // ── Build live notifications from real app data ──
  const allNotifications = useMemo((): RealNotification[] => {
    const items: RealNotification[] = [];
    const logs = getLogsByUser(userId);

    // ── Daily Research Log Sessions ──
    const todayLogs = logs.filter(l => l.date && isToday(new Date(l.date)));
    if (todayLogs.length > 0) {
      const totalMins = todayLogs.reduce((a, c) => a + (c.timeSpentMinutes || 0), 0);
      items.push({
        id: `today-sessions-${todayLogs.length}`,
        title: `✅ ${todayLogs.length} session${todayLogs.length > 1 ? 's' : ''} logged today`,
        message: `${profile?.name || 'You'} logged ${(totalMins / 60).toFixed(1)} hrs of R&D work today across ${todayLogs.length} slot${todayLogs.length > 1 ? 's' : ''}.`,
        time: 'Today',
        type: 'session',
        unread: true,
      });
    } else {
      items.push({
        id: 'no-session-today',
        title: '⏰ No sessions logged yet today',
        message: 'Open Daily Research Log and add your first session for today.',
        time: 'Today',
        type: 'warning',
        unread: true,
      });
    }

    // Recent past logs (last 5)
    logs.filter(l => l.date && !isToday(new Date(l.date))).slice(0, 5).forEach(log => {
      items.push({
        id: `log-${log.id}`,
        title: `📋 Session saved — ${log.date?.split('T')[0] ?? ''}`,
        message: log.objective || log.activities?.slice(0, 100) || 'R&D session recorded.',
        time: timeLabel(log.createdAt || log.date),
        type: 'session',
        unread: false,
      });
    });

    // ── Experiments ──
    experiments.slice(0, 6).forEach(exp => {
      const runCount = exp.dailyRuns?.length ?? 0;
      // Passed / Failed outcome
      if (exp.outcomeStatus === 'Passed') {
        items.push({
          id: `exp-pass-${exp.id}`,
          title: `🎉 Experiment passed — ${exp.name || exp.productName}`,
          message: exp.conclusion?.slice(0, 120) || `${exp.productName} experiment completed with Passed status.`,
          time: timeLabel(exp.createdAt),
          type: 'experiment',
          unread: true,
        });
      } else if (exp.outcomeStatus === 'Failed') {
        items.push({
          id: `exp-fail-${exp.id}`,
          title: `❌ Experiment failed — ${exp.name || exp.productName}`,
          message: exp.conclusion?.slice(0, 120) || `${exp.productName} experiment marked as Failed. Review needed.`,
          time: timeLabel(exp.createdAt),
          type: 'warning',
          unread: true,
        });
      } else if (runCount > 0) {
        items.push({
          id: `exp-run-${exp.id}`,
          title: `🧪 Experiment running — Day ${runCount}`,
          message: `${exp.name || exp.productName} has ${runCount} run${runCount > 1 ? 's' : ''} recorded. Outcome: ${exp.outcomeStatus ?? 'Pending'}.`,
          time: timeLabel(exp.createdAt),
          type: 'experiment',
          unread: false,
        });
      } else {
        items.push({
          id: `exp-new-${exp.id}`,
          title: `🔬 New experiment created — ${exp.name || exp.productName}`,
          message: `Type: ${exp.type} · Status: ${exp.status} · Template: ${exp.templateType ?? 'Custom'}. No runs recorded yet.`,
          time: timeLabel(exp.createdAt),
          type: 'experiment',
          unread: false,
        });
      }
    });

    // ── Lab Tests ──
    labTests.slice(0, 4).forEach(test => {
      const passed = test.outcomeStatus === 'Passed';
      const failed = test.outcomeStatus === 'Failed';
      items.push({
        id: `lab-${test.id}`,
        title: passed
          ? `✅ Lab test passed — ${test.type || test.name}`
          : failed
          ? `❌ Lab test failed — ${test.type || test.name}`
          : `⏳ Lab test in progress — ${test.type || test.name}`,
        message: `${test.productName}: ${test.conclusion?.slice(0, 100) ?? 'Results pending analysis.'}`,
        time: timeLabel(test.createdAt),
        type: passed ? 'info' : failed ? 'warning' : 'experiment',
        unread: !passed && !failed,
      });
    });

    // ── Tasks ──
    const myTasks = tasks?.filter(
      t => t.assignedToUserId === userId || t.entityId === userId
    ) ?? [];

    // Overdue tasks
    myTasks
      .filter(t => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) < new Date())
      .slice(0, 3)
      .forEach(task => {
        items.push({
          id: `task-overdue-${task.id}`,
          title: `⚠️ Task overdue — ${task.title?.slice(0, 40) ?? 'Task'}`,
          message: `Due: ${format(new Date(task.dueDate), 'dd MMM yyyy')}. Current status: ${task.status}. Priority: ${task.priority}.`,
          time: timeLabel(task.dueDate),
          type: 'warning',
          unread: true,
        });
      });

    // Tasks due within 3 days
    myTasks
      .filter(t => {
        if (t.status === 'Completed' || !t.dueDate) return false;
        const diff = new Date(t.dueDate).getTime() - Date.now();
        return diff > 0 && diff < 86400000 * 3;
      })
      .slice(0, 2)
      .forEach(task => {
        items.push({
          id: `task-soon-${task.id}`,
          title: `📅 Task due soon — ${task.title?.slice(0, 40) ?? 'Task'}`,
          message: `Due: ${format(new Date(task.dueDate), 'dd MMM yyyy')}. Priority: ${task.priority}.`,
          time: timeLabel(task.dueDate),
          type: 'task',
          unread: true,
        });
      });

    // Recently completed tasks
    myTasks
      .filter(t => t.status === 'Completed')
      .slice(0, 2)
      .forEach(task => {
        items.push({
          id: `task-done-${task.id}`,
          title: `✅ Task completed — ${task.title?.slice(0, 40) ?? 'Task'}`,
          message: task.description?.slice(0, 80) ?? 'Task marked complete.',
          time: timeLabel(task.updatedAt),
          type: 'task',
          unread: false,
        });
      });

    // ── Empty fallback ──
    if (items.length === 0) {
      items.push({
        id: 'empty-state',
        title: '🟢 All caught up!',
        message: 'Start by logging your first R&D session in Daily Research Log. Notifications will auto-generate from your activity.',
        time: 'Now',
        type: 'info',
        unread: false,
      });
    }

    return items;
  }, [userId, experiments, labTests, tasks, profile]);

  // Apply dismissed + read overrides
  const visible = useMemo(
    () => allNotifications.filter(n => !dismissed.has(n.id)),
    [allNotifications, dismissed]
  );

  const withReadState = visible.map(n => ({
    ...n,
    unread: n.unread && !readIds.has(n.id),
  }));

  const filtered = filter === 'unread' ? withReadState.filter(n => n.unread) : withReadState;
  const unreadCount = withReadState.filter(n => n.unread).length;

  const markAllRead = () => setReadIds(new Set(visible.map(n => n.id)));
  const markRead    = (id: string) => setReadIds(prev => new Set([...prev, id]));
  const dismiss     = (id: string) => setDismissed(prev => new Set([...prev, id]));
  const clearAll    = () => setDismissed(new Set(visible.map(n => n.id)));
  const refresh     = () => { setDismissed(new Set()); setReadIds(new Set()); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
              <Bell className="w-5 h-5" />
            </div>
            Notifications
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {unreadCount > 0
              ? `${unreadCount} unread — live activity from your sessions, experiments & tasks`
              : 'All caught up — no new alerts'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={refresh}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-semibold transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-xl hover:bg-emerald-100 text-xs font-semibold transition-colors">
              <Check className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
          {filtered.length > 0 && (
            <button onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 text-xs font-semibold transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'unread'] as const).map(tab => (
          <button key={tab} onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              filter === tab
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
            }`}>
            {tab === 'all' ? `All (${withReadState.length})` : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center shadow-lg border border-gray-100 dark:border-gray-800">
              <Bell className="w-14 h-14 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No notifications here</p>
              <p className="text-xs text-gray-400 mt-1">Activity will appear here as you log sessions, run experiments, and manage tasks.</p>
              <button onClick={refresh}
                className="mt-4 px-4 py-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors">
                Reload notifications
              </button>
            </motion.div>
          ) : (
            filtered.map((notif, idx) => {
              const cfg = TYPE_CONFIG[notif.type];
              const Icon = cfg.icon;
              return (
                <motion.div key={notif.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 30, transition: { duration: 0.2 } }}
                  transition={{ delay: idx * 0.03 }}
                  className={`bg-white dark:bg-gray-900 rounded-2xl p-4 shadow border border-gray-100 dark:border-gray-800 flex items-start gap-4 ${
                    notif.unread ? `border-l-4 ${cfg.border}` : ''
                  }`}>
                  <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${cfg.bg}`}>
                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-bold ${notif.unread ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                        {notif.title}
                      </span>
                      {notif.unread && <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{notif.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1.5 font-medium">{notif.time}</p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {notif.unread && (
                      <button onClick={() => markRead(notif.id)} title="Mark as read"
                        className="p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-gray-400 hover:text-emerald-500 transition-colors">
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => dismiss(notif.id)} title="Dismiss"
                      className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};