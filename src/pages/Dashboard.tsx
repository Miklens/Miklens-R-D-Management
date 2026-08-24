import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../hooks/useUsers';
import { useDailyLogs } from '../hooks/useDailyLogs';
import { useExperiments } from '../contexts/ExperimentContext';
import { getSyncedTrials } from '../services/trialManagerSync';
import { ScientistHub } from '../components/ScientistHub';
import { ExecutiveControlTower } from '../components/ExecutiveControlTower';
import { ScientistDailyPulse } from '../components/ScientistDailyPulse';
import { ScientistEffortHeatmap } from '../components/ScientistEffortHeatmap';
import { exportMasterExecutiveReportPDF, exportMasterExcelWorkbook } from '../services/executiveReportGenerator';
import { GlobalSearchModal } from '../components/GlobalSearchModal';
import { format } from 'date-fns';
import { calculateTotalHours } from '../utils/timeTracking';
import { 
  Sparkles, Clock, Beaker, Download, Award, Search, AlertTriangle, 
  TrendingUp, Users, ArrowRight, CheckCircle2, MapPin, User, Calendar, Target
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { profile, userRole, currentUser } = useAuth();
  const { data: users } = useUsers();
  const { data: logs } = useDailyLogs();
  const { experiments, labTests, stabilityLogs } = useExperiments();
  
  const isManagement = userRole === 'Admin' || userRole === 'Management';
  const syncedTrials = useMemo(() => {
    const all = getSyncedTrials();
    if (isManagement) return all;
    const email = profile?.email || currentUser?.email || '';
    if (!email) return all;
    const namePart = email.split('@')[0].toLowerCase();
    return all.filter(t => 
      (t.creatorEmail || '').toLowerCase() === email.toLowerCase() ||
      (t.scientistName || '').toLowerCase().includes(namePart)
    );
  }, [isManagement, profile, currentUser]);
  const now = useMemo(() => new Date(), []);

  // View switch mode to prevent dashboard overlap confusion for Admins
  const [viewMode, setViewMode] = useState<'executive' | 'scientist'>(
    userRole === 'Admin' ? 'executive' : (userRole === 'Management' ? 'executive' : 'scientist')
  );

  // Time Horizon filter state
  const [timeHorizon, setTimeHorizon] = useState<'week' | 'month' | 'year' | 'all'>('all');

  // Global Search Modal trigger state
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  // Helper to format email handles
  const formatName = (name: string) => {
    if (!name) return 'Scientist';
    return name.includes('@') ? name.split('@')[0] : name;
  };

  // Filtered synced trials based on selected timeHorizon
  const filteredTrials = useMemo(() => {
    if (timeHorizon === 'all') return syncedTrials;
    return syncedTrials.filter(t => {
      if (!t.startDate) return false;
      const start = new Date(t.startDate);
      const diffDays = (now.getTime() - start.getTime()) / (1000 * 3600 * 24);
      if (timeHorizon === 'week') return diffDays >= 0 && diffDays <= 7;
      if (timeHorizon === 'month') return diffDays >= 0 && diffDays <= 30;
      if (timeHorizon === 'year') return diffDays >= 0 && diffDays <= 365;
      return true;
    });
  }, [syncedTrials, timeHorizon, now]);

  // Dynamic AI Executive Briefing Generator
  const aiExecutiveBrief = useMemo(() => {
    const totalTrialsCount = filteredTrials.length;
    if (totalTrialsCount === 0) {
      return `No trials recorded for the selected time horizon (${timeHorizon === 'week' ? 'Last 7 Days' : timeHorizon === 'month' ? 'Last 30 Days' : 'Last 365 Days'}). Please adjust the horizon filter above.`;
    }

    const herbicideTrials = filteredTrials.filter(t => t.category === 'herbicide');
    const herbicideRatio = Math.round((herbicideTrials.length / totalTrialsCount) * 100) || 0;
    
    const activeTrials = filteredTrials.filter(t => !t.isCompleted);
    const completedTrials = filteredTrials.filter(t => t.isCompleted);
    const passedVerdicts = completedTrials.filter(t => t.resultRating === 'Excellent' || t.resultRating === 'Good').length;

    const delayedCount = filteredTrials.filter(t => {
      if (t.isCompleted) return false;
      const start = new Date(t.startDate);
      const diffDays = (now.getTime() - start.getTime()) / (1000 * 3600 * 24);
      return diffDays > 90;
    }).length;

    const scientistCounts: Record<string, number> = {};
    filteredTrials.forEach(t => {
      scientistCounts[t.scientistName] = (scientistCounts[t.scientistName] || 0) + (t.evaluations?.length || 0);
    });
    let topScientist = 'N/A';
    let maxEvals = 0;
    Object.entries(scientistCounts).forEach(([name, count]) => {
      if (count > maxEvals) {
        maxEvals = count;
        topScientist = name;
      }
    });

    const displayScientist = formatName(topScientist);
    const horizonText = timeHorizon === 'week' ? 'this week' : timeHorizon === 'month' ? 'this month' : timeHorizon === 'year' ? 'this year' : 'overall';

    return `During the selected time frame (${horizonText}), ${totalTrialsCount} trials were active or initiated. Herbicide research accounts for ${herbicideRatio}% of these deployments. ${passedVerdicts} trials reached validation with Good or Excellent efficacy rates, while ${delayedCount} active trials are currently flagged with delayed progress based on their start dates. ${displayScientist} shows the highest field logging productivity with ${maxEvals} completed plot observations.`;
  }, [filteredTrials, timeHorizon]);

  // Breakthrough Formulations (Excellent/Good Efficacy or high WCE rating)
  const breakthroughs = useMemo(() => {
    return filteredTrials.filter(t => {
      const hasGoodRating = t.resultRating === 'Excellent' || t.resultRating === 'Good';
      const hasEfficacy = t.evaluations && t.evaluations.some(ev => ev.efficacyPercent >= 75);
      return hasGoodRating || hasEfficacy;
    }).slice(0, 4);
  }, [filteredTrials]);

  // Top KPI calculations
  const totalHoursLogged = calculateTotalHours(logs || []);
  const totalAssays = experiments.length + labTests.length + (stabilityLogs || []).length;

  return (
    <div className="space-y-6">
      {/* ── Executive Header Banner ── */}
      <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                ENTERPRISE R&D COMMAND CENTER
              </span>
              <span className="text-[11px] text-gray-400 font-medium">
                {format(now, 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white mt-1">
              Welcome back, {formatName(profile?.name || '')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Real-time agricultural research overview, scientist timesheets, and field trial sync hub
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Mode Switcher for Admin/Management */}
            {isManagement && (
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setViewMode('executive')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    viewMode === 'executive'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Executive Control
                </button>
                <button
                  onClick={() => setViewMode('scientist')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    viewMode === 'scientist'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Scientist Hub
                </button>
              </div>
            )}

            {/* Quick Export Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportMasterExecutiveReportPDF(syncedTrials, (users || []).length, totalAssays, logs || [])}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Executive PDF
              </button>
              <button
                onClick={() => exportMasterExcelWorkbook(syncedTrials, logs || [], users || [], [])}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Master Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={showGlobalSearch} onClose={() => setShowGlobalSearch(false)} />

      {/* ── Main Home Dashboard Layout ── */}
      {viewMode === 'executive' ? (
        <div className="space-y-6">
          {/* Live Scientist Daily Pulse Component */}
          <ScientistDailyPulse />

          {/* Scientist Work Allocation & Resource Heatmap Component */}
          <ScientistEffortHeatmap />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Area: Executive Control Tower */}
            <div className="lg:col-span-2 space-y-6">
              {/* R&D Executive Control Tower Component */}
              {isManagement && <ExecutiveControlTower trials={syncedTrials} />}
            </div>

            {/* Right Sidebar Rail: Breakthroughs & Quick Triggers */}
            <div className="space-y-6">
              {/* Commercial Breakthrough Candidates */}
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xl space-y-4">
                <h3 className="text-xs font-black uppercase text-gray-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-purple-500" />
                    Breakthrough Candidates ({breakthroughs.length})
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">&gt;75% WCE</span>
                </h3>

                <div className="space-y-3">
                  {breakthroughs.length > 0 ? (
                    breakthroughs.map(bt => {
                      const lastEval = bt.evaluations && bt.evaluations[bt.evaluations.length - 1];
                      const eff = lastEval ? lastEval.efficacyPercent : 85;
                      const sci = formatName(bt.scientistName);
                      return (
                        <div key={bt.id} className="p-3.5 bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 rounded-2xl flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center shrink-0 font-bold">
                            <Beaker className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-extrabold text-xs text-gray-900 dark:text-white truncate">{bt.productName || bt.title}</span>
                              <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950 px-1.5 py-0.5 rounded shrink-0">
                                {eff}% WCE
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium block truncate mt-0.5">
                              {bt.cropName || 'Crop Plot'} | Lead: {sci} | {bt.trialCode}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-gray-400 italic">No breakthrough trials found with efficacy &gt; 75%.</p>
                  )}
                </div>
              </div>

              {/* Quick Triggers */}
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xl space-y-4">
                <h3 className="text-xs font-black uppercase text-gray-400">R&D Quick Triggers</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Link to="/trial-sync" className="p-3 bg-gray-50 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-2xl border border-gray-100 dark:border-gray-800 text-center font-bold text-gray-800 dark:text-gray-200 transition-colors">
                    ⚡ Sync Trials
                  </Link>
                  <Link to="/research-log" className="p-3 bg-gray-50 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-2xl border border-gray-100 dark:border-gray-800 text-center font-bold text-gray-800 dark:text-gray-200 transition-colors">
                    + Daily Log
                  </Link>
                  <Link to="/ai-insights" className="col-span-2 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 hover:from-emerald-100 hover:to-teal-100 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center font-black text-emerald-700 dark:text-emerald-300 transition-colors">
                    💬 Talk to R&D Gemini Assistant
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Scientist Workbench Tab */
        <ScientistHub />
      )}
    </div>
  );
};
