import React, { useState, useMemo } from 'react';
import { User, Clock, CheckCircle2, FlaskConical, Beaker, MapPin, Sparkles, AlertCircle, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { useUsers } from '../hooks/useUsers';
import { useDailyLogs } from '../hooks/useDailyLogs';
import { getSyncedTrials } from '../services/trialManagerSync';
import { getEffectiveAvatar } from '../utils/avatarHelper';
import { format } from 'date-fns';

export const ScientistLivePulse: React.FC = () => {
  const { data: users } = useUsers();
  const { data: logs } = useDailyLogs();
  const [expandedScientistId, setExpandedScientistId] = useState<string | null>(null);

  const syncedTrials = useMemo(() => getSyncedTrials(), []);
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const scientistPulseData = useMemo(() => {
    const activeUsers = (users || []).filter(u => u.isActive !== false);

    return activeUsers.map((u, idx) => {
      const uEmail = (u.email || '').toLowerCase();
      const uName = u.name && u.name !== 'User' ? u.name : (uEmail ? uEmail.split('@')[0] : 'Scientist');
      const uHandle = uEmail ? uEmail.split('@')[0] : uName.toLowerCase();

      // Find user logs for today and overall
      const userLogs = (logs || []).filter(l => l.userId === u.id || (l.userId && (l.userId.toLowerCase() === uEmail || l.userId.toLowerCase().includes(uHandle))));
      const todayLogs = userLogs.filter(l => (l.date || '').split('T')[0] === todayStr);

      // Compute total hours logged today
      const todayMinutes = todayLogs.reduce((sum, l) => sum + (l.timeSpentMinutes || 60), 0);
      const todayHours = Math.round((todayMinutes / 60) * 10) / 10;

      // Compute total hours logged this week (last 7 days)
      const nowMs = new Date().getTime();
      const weekLogs = userLogs.filter(l => {
        const dMs = new Date(l.date || l.createdAt || '').getTime();
        return (nowMs - dMs) <= 7 * 24 * 3600 * 1000;
      });
      const weekHours = Math.round((weekLogs.reduce((sum, l) => sum + (l.timeSpentMinutes || 60), 0) / 60) * 10) / 10;

      // Determine current status & work type badge
      let statusType: 'field' | 'lab' | 'stability' | 'office' | 'idle' = 'idle';
      let statusLabel = 'No Activity Logged Today';
      let currentProduct = 'General R&D';
      let latestActivityText = 'No session recorded today.';

      if (todayLogs.length > 0) {
        const latest = todayLogs[0];
        latestActivityText = latest.activities || latest.objective || 'Active research session';
        const txt = `${latest.activities || ''} ${latest.objective || ''}`.toLowerCase();

        if (txt.includes('field') || txt.includes('trial') || txt.includes('plot') || txt.includes('spraying')) {
          statusType = 'field';
          statusLabel = '🟢 Field Evaluation & Spraying';
        } else if (txt.includes('assay') || txt.includes('titration') || txt.includes('lab') || txt.includes('formulation')) {
          statusType = 'lab';
          statusLabel = '🔵 Lab Assay & Titration';
        } else if (txt.includes('stability') || txt.includes('thermal') || txt.includes('cipac')) {
          statusType = 'stability';
          statusLabel = '🟡 Thermal Stability Chamber';
        } else {
          statusType = 'office';
          statusLabel = '⚪ Research Planning & Data Analysis';
        }
      } else if (userLogs.length > 0) {
        const lastLog = userLogs[0];
        latestActivityText = `Last logged ${lastLog.date?.split('T')[0]}: ${lastLog.activities || lastLog.objective || 'Session complete'}`;
      }

      // Check linked field trials
      const myTrials = syncedTrials.filter(t => {
        const sName = (t.scientistName || '').toLowerCase();
        const sEmail = (t.creatorEmail || '').toLowerCase();
        return (uEmail && sEmail.includes(uEmail)) || (uHandle && sName.includes(uHandle)) || (uName && sName.includes(uName.toLowerCase()));
      });

      if (myTrials.length > 0) {
        currentProduct = `${myTrials[0].cropName} — ${myTrials[0].productName}`;
      }

      return {
        user: u,
        id: u.id,
        name: uName,
        email: uEmail,
        role: u.designation || 'R&D Scientist',
        avatar: getEffectiveAvatar(u.id, u.email, (u as any).avatar) || `https://i.pravatar.cc/150?u=${u.id || idx}`,
        todayHours,
        weekHours,
        todayLogsCount: todayLogs.length,
        statusType,
        statusLabel,
        currentProduct,
        latestActivityText,
        recentLogs: userLogs.slice(0, 5),
        myTrialsCount: myTrials.length,
      };
    });
  }, [users, logs, syncedTrials, todayStr]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-wider">
              Live Scientist Activity & Workload Pulse
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
            Real-time status, logged hours today, and current research focus per scientist
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-xl">
          <Calendar className="w-4 h-4 text-emerald-500" />
          <span>Today: {todayStr}</span>
        </div>
      </div>

      {/* Scientist Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scientistPulseData.map((sci) => {
          const isExpanded = expandedScientistId === sci.id;

          const badgeStyle = 
            sci.statusType === 'field' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' :
            sci.statusType === 'lab' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300' :
            sci.statusType === 'stability' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300' :
            sci.statusType === 'office' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300' :
            'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400';

          return (
            <div
              key={sci.id}
              className="p-4 bg-gray-50/50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3 hover:border-emerald-500/50 transition-all shadow-sm"
            >
              {/* Header Info */}
              <div className="flex items-center gap-3">
                <img
                  src={sci.avatar}
                  alt={sci.name}
                  className="w-11 h-11 rounded-2xl object-cover border-2 border-emerald-500/20 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white truncate">
                    {sci.name}
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate">
                    {sci.role}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block">
                    {sci.todayHours}h Today
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold block">
                    {sci.weekHours}h Week
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className={`px-3 py-1.5 rounded-xl border text-[11px] font-extrabold flex items-center justify-between ${badgeStyle}`}>
                <span className="truncate">{sci.statusLabel}</span>
                <span className="text-[10px] font-black opacity-80 shrink-0 ml-1">
                  {sci.todayLogsCount} Logs
                </span>
              </div>

              {/* Latest Activity Summary */}
              <div className="space-y-1 text-xs">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                  Current Focus & Latest Activity
                </span>
                <p className="text-gray-700 dark:text-gray-300 font-medium line-clamp-2 italic bg-white dark:bg-gray-900 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                  "{sci.latestActivityText}"
                </p>
              </div>

              {/* Expand Logs Drawer Toggle */}
              <button
                onClick={() => setExpandedScientistId(isExpanded ? null : sci.id)}
                className="w-full py-1.5 text-[11px] font-black text-emerald-600 dark:text-emerald-400 hover:underline flex items-center justify-center gap-1 cursor-pointer"
              >
                {isExpanded ? (
                  <>Hide Recent Log Drawer <ChevronUp className="w-3.5 h-3.5" /></>
                ) : (
                  <>View Recent Work Logs ({sci.recentLogs.length}) <ChevronDown className="w-3.5 h-3.5" /></>
                )}
              </button>

              {/* Expandable Logs Drawer */}
              {isExpanded && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  {sci.recentLogs.length > 0 ? (
                    sci.recentLogs.map((log: any, i: number) => (
                      <div key={log.id || i} className="p-2 bg-white dark:bg-gray-900 rounded-xl text-[11px] space-y-0.5 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                          <span>📅 {log.date?.split('T')[0] || 'N/A'}</span>
                          <span>⏱️ {((log.timeSpentMinutes || 60) / 60).toFixed(1)}h</span>
                        </div>
                        <p className="font-bold text-gray-800 dark:text-gray-200">{log.objective || 'Work Session'}</p>
                        <p className="text-gray-500 line-clamp-2">{log.activities}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic text-center py-2">No work logs recorded yet.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
