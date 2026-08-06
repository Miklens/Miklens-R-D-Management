import React, { useMemo } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, UserCheck, Clock, RefreshCw, Zap, Flame, Award, AlertCircle } from 'lucide-react';
import { getSyncedTrials } from '../services/trialManagerSync';
import { useUsers } from '../hooks/useUsers';
import { useDailyLogs } from '../hooks/useDailyLogs';
import { calculateTotalHours } from '../utils/timeTracking';

export const WorkloadRiskRadar: React.FC = () => {
  const syncedTrials = useMemo(() => getSyncedTrials(), []);
  const { data: users } = useUsers();
  const { data: logs } = useDailyLogs();

  const formatName = (name: string) => {
    if (!name) return 'Scientist';
    return name.includes('@') ? name.split('@')[0] : name;
  };

  const auditData = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);

    // 1. Scientist Compliance Audit
    const userAudit = (users || []).map(u => {
      const uLogs = (logs || []).filter(l => l.userId === u.id || l.userId === u.email);
      const totalHours = calculateTotalHours(uLogs);
      const recentLogs = uLogs.filter(l => new Date(l.date || l.createdAt || '2026-01-01') >= cutoffDate);

      let status: 'Optimal' | 'Overburdened' | 'Inactive / Pending';
      if (totalHours > 40) status = 'Overburdened';
      else if (recentLogs.length === 0) status = 'Inactive / Pending';
      else status = 'Optimal';

      return {
        name: formatName(u.name || u.email),
        role: u.role || 'Scientist',
        totalHours,
        sessionCount: uLogs.length,
        recentCount: recentLogs.length,
        status,
      };
    });

    // 2. Risk Radar: Stalled or Delayed Field Trials
    const delayedTrials = syncedTrials.filter(t => {
      if (t.isCompleted) return false;
      const start = new Date(t.startDate);
      const diffDays = (new Date().getTime() - start.getTime()) / (1000 * 3600 * 24);
      return diffDays > 60;
    });

    // 3. High Efficacy Ready for Commercial Registration
    const readyForRegistration = syncedTrials.filter(t => {
      const lastEval = t.evaluations && t.evaluations.length > 0 ? t.evaluations[t.evaluations.length - 1] : null;
      return (lastEval && lastEval.efficacyPercent >= 85) || t.resultRating === 'Excellent';
    });

    return {
      userAudit,
      delayedTrials,
      readyForRegistration,
    };
  }, [syncedTrials, users, logs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200">
            EXECUTIVE RISK & COMPLIANCE RADAR
          </span>
          <h3 className="text-xl font-black text-gray-900 dark:text-white mt-1 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            Scientist Workload Balance & R&D Delay Warning System
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
            Real-time compliance monitoring, bottleneck detection, and trial escalation triggers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-200">
            🚨 {auditData.delayedTrials.length} Stalled Trials Flagged
          </span>
        </div>
      </div>

      {/* Grid: Scientist Workload Audit + Stalled Trial Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Card 1: Scientist Workload Balance */}
        <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl space-y-4">
          <h4 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-500" />
            Scientist Workload Distribution & Logging Compliance
          </h4>

          <div className="space-y-3">
            {auditData.userAudit.map((u, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-center justify-between gap-3">
                <div>
                  <h5 className="text-xs font-black text-gray-900 dark:text-white">{u.name}</h5>
                  <p className="text-[11px] text-gray-500 font-medium">
                    {u.totalHours}h logged across {u.sessionCount} sessions ({u.recentCount} in last 7 days)
                  </p>
                </div>

                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border ${
                  u.status === 'Optimal'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200'
                    : u.status === 'Overburdened'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200'
                }`}>
                  {u.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Stalled & Overdue Field Trials */}
        <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl space-y-4">
          <h4 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            Stalled & Overdue Field Trials ({auditData.delayedTrials.length})
          </h4>

          <div className="space-y-3">
            {auditData.delayedTrials.length > 0 ? (
              auditData.delayedTrials.slice(0, 5).map((t, idx) => {
                const start = new Date(t.startDate);
                const days = Math.round((new Date().getTime() - start.getTime()) / (1000 * 3600 * 24));
                const mainTitle = t.title || t.productName || 'Field Trial Program';

                return (
                  <div key={idx} className="p-3.5 rounded-2xl border border-rose-100 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-rose-900 dark:text-rose-300">
                        {mainTitle} — {t.cropName || 'Crop'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-200 text-rose-800">
                        {t.trialCode}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium">
                      Active for <strong>{days} days</strong> under Lead {formatName(t.scientistName)} {t.targetWeedOrPathogen ? `(Target: ${t.targetWeedOrPathogen})` : ''}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-gray-400 italic text-center py-6">No delayed or stalled field trials detected.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
