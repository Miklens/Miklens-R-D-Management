import React from 'react';
import { Users, FlaskConical, Award, ShieldCheck, Clock, ChevronRight, Activity, Beaker } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useExperiments } from '../contexts/ExperimentContext';
import { useDailyLogs } from '../hooks/useDailyLogs';
import { useUsers } from '../hooks/useUsers';

export const ExecutiveControlTower: React.FC = () => {
  const { experiments, labTests, stabilityLogs } = useExperiments();
  const { data: logs } = useDailyLogs();

  const { data: users } = useUsers();

  const passedCount = experiments.filter((e) => e.outcomeStatus === 'Passed').length + labTests.filter((l) => l.outcomeStatus === 'Passed').length;
  const pendingCount = experiments.filter((e) => e.outcomeStatus === 'Pending' || !e.outcomeStatus).length;
  const activeExpCount = experiments.length;

  const activeScientists = (users || []).map(u => {
    const displayName = u.name && u.name !== 'User' ? u.name : (u.email ? u.email.split('@')[0] : 'Scientist');
    return {
      id: u.id,
      name: displayName,
      role: u.designation || (u as any).trialManagerRole || 'R&D Scientist',
      product: u.department || 'Active Field Operations',
      hoursLogged: 'Active Today',
      activeExp: 'Field Operations & Research',
      latestRun: 'Active Session Synchronized',
      status: 'Active Now',
    };
  });

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Management Control Tower
            </span>
            <span className="text-xs text-gray-400 font-medium">Live R&D Status & Scientist Tracking</span>
          </div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            Executive Quick-Glance Scientist Command Center
          </h3>
        </div>

        <Link
          to="/team-activity"
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 shrink-0"
        >
          View Full Team Activity <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* R&D Key Metrics Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Active Scientists</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-gray-900 dark:text-white">{activeScientists.length}</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">{activeScientists.length} Registered</span>
        </div>

        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Active Experiments</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-gray-900 dark:text-white">{activeExpCount}</span>
            <FlaskConical className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">{activeExpCount > 0 ? `${activeExpCount} In Progress` : 'No active experiments'}</span>
        </div>

        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Scientific Verdicts</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{passedCount} Passed</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-[11px] text-gray-400">{pendingCount} Pending Verdict</span>
        </div>

        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Stability Logs</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{stabilityLogs.length}</span>
            <ShieldCheck className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">{stabilityLogs.length > 0 ? `${stabilityLogs.length} Active` : 'No stability logs yet'}</span>
        </div>
      </div>

      {/* Live Scientist Activity & Progress List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center justify-between">
          <span>Scientists Directory & Live Status</span>
          <span className="text-[11px] font-normal text-gray-400">Updated Real-Time</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeScientists.map((sci, idx) => (
            <div
              key={sci.id}
              className="p-5 rounded-3xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 hover:border-emerald-500/50 transition-all space-y-4 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={`https://i.pravatar.cc/150?u=${sci.id || idx}`}
                      alt={sci.name}
                      className="w-11 h-11 rounded-2xl object-cover border-2 border-white dark:border-gray-800 shadow-sm"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-gray-800 rounded-full" />
                  </div>
                  <div>
                    <h5 className="font-black text-gray-900 dark:text-white text-sm">{sci.name}</h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{sci.role}</p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Active Today
                </span>
              </div>

              {/* Progress bar matching reference card 1 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400">
                  <span>Activity Trace & Output</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">100% Synced</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full w-full" />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 space-y-1 text-xs">
                <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-[11px]">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Beaker className="w-3.5 h-3.5" />
                    Target: {sci.product}
                  </span>
                </div>
                <p className="font-bold text-gray-900 dark:text-white text-xs truncate">{sci.activeExp}</p>
                <p className="text-[11px] text-gray-400 font-medium italic">{sci.latestRun}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
