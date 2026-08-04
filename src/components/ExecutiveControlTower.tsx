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
    <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-gray-900 to-emerald-950 text-white shadow-2xl border border-emerald-900/40 space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Management Control Tower
            </span>
            <span className="text-xs text-gray-400 font-mono">Live R&D Status & Scientist Tracking</span>
          </div>
          <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Executive Quick-Glance Scientist Command Center
          </h3>
        </div>

        <Link
          to="/team-activity"
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-lg transition-all"
        >
          View Full Team Activity <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* R&D Key Metrics Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Active Scientists</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{activeScientists.length} Active</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-[10px] text-emerald-400 font-bold">{activeScientists.length} Registered</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Active Experiments</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{activeExpCount} Active</span>
            <FlaskConical className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-[10px] text-amber-400 font-bold">{activeExpCount > 0 ? `${activeExpCount} In Progress` : 'No active experiments'}</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Scientific Verdicts</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-400">{passedCount} Passed</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-[10px] text-gray-400">{pendingCount} Pending Verdict</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Stability Logs</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-300">{stabilityLogs.length}</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-[10px] text-emerald-400 font-bold">{stabilityLogs.length > 0 ? `${stabilityLogs.length} Log${stabilityLogs.length > 1 ? 's' : ''} Active` : 'No stability logs yet'}</span>
        </div>
      </div>

      {/* Live Scientist Activity & Progress List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center justify-between">
          <span>Scientists Today (Live Activity & Multi-Day Run Trace)</span>
          <span className="text-[10px] font-normal text-gray-400">Updated in Real-Time</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeScientists.map((sci) => (
            <div
              key={sci.id}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-300 text-xs">
                    {(sci.name || 'U').split(' ')[1]?.[0] || (sci.name || 'U')[0] || 'S'}
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">{sci.name}</h5>
                    <p className="text-[11px] text-gray-400">{sci.role}</p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {sci.hoursLogged}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-1 text-xs">
                <div className="flex items-center justify-between text-gray-400 text-[10px]">
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <Beaker className="w-3 h-3" />
                    Target Product: {sci.product}
                  </span>
                </div>
                <p className="font-bold text-white text-xs truncate">{sci.activeExp}</p>
                <p className="text-[11px] text-emerald-300 font-medium italic">{sci.latestRun}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
