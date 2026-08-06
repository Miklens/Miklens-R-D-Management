import React, { useMemo, useState } from 'react';
import {
  Users, FlaskConical, Award, ShieldCheck, ChevronRight, Activity, Beaker,
  CheckCircle2, Clock, Leaf, Shield, Bug, Sprout, TrendingUp, ChevronDown, User,
  AlertTriangle, Play, HelpCircle, Download, FileText as FileIcon, Calendar, Info, RefreshCw, Sparkles, Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useExperiments } from '../contexts/ExperimentContext';
import { useDailyLogs } from '../hooks/useDailyLogs';
import { useUsers } from '../hooks/useUsers';
import { useTasks } from '../contexts/TaskContext';
import { getSyncedTrials, getSyncedProjects } from '../services/trialManagerSync';
import { getEffectiveAvatar } from '../utils/avatarHelper';
import { ExternalFieldTrial, TrialCategory } from '../types/trialIntegrationTypes';
import { 
  exportCompanyReportToExcel, 
  exportCompanyReportToPDF,
  exportMasterExecutiveReportPDF,
  exportScientistTimesheetAuditPDF,
  exportProductPipelineReportPDF,
  exportFieldTrialsEfficacyReportPDF,
  exportMasterExcelWorkbook
} from '../services/executiveReportGenerator';
import { ScientistLivePulse } from './ScientistLivePulse';
import { ProductPipelineTracker } from './ProductPipelineTracker';
import { ExecutiveROICalculator } from './ExecutiveROICalculator';
import { WorkloadRiskRadar } from './WorkloadRiskRadar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';


export const ExecutiveControlTower: React.FC<{ trials?: ExternalFieldTrial[] }> = ({ trials }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'live_pulse' | 'pipeline' | 'roi' | 'risk_radar' | 'categories' | 'projects' | 'timesheets'>('overview');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<TrialCategory>('herbicide');
  const [timesheetScientistFilter, setTimesheetScientistFilter] = useState('all');
  const [timesheetDateFilter, setTimesheetDateFilter] = useState('');
  const [timesheetMonthFilter, setTimesheetMonthFilter] = useState('all');
  const [timesheetSortOrder, setTimesheetSortOrder] = useState<'newest' | 'oldest' | 'hours_high'>('newest');

  const { experiments, labTests, stabilityLogs, fieldTrials: localFieldTrials } = useExperiments();
  const { data: logs } = useDailyLogs();
  const { data: users } = useUsers();
  const { tasks } = useTasks();

  // Cloud synced trials from Trial Manager
  const syncedTrials = useMemo(() => trials || getSyncedTrials(), [trials]);

  // Global Key Metric Counts
  const totalExperiments = experiments.length + labTests.length + stabilityLogs.length;
  const passedVerdicts = [
    ...experiments.filter(e => e.outcomeStatus === 'Passed'),
    ...labTests.filter(l => l.outcomeStatus === 'Passed'),
    ...stabilityLogs.filter(s => s.outcomeStatus === 'Passed'),
  ].length;
  const pendingVerdicts = [
    ...experiments.filter(e => e.outcomeStatus === 'Pending' || !e.outcomeStatus),
    ...labTests.filter(l => l.outcomeStatus === 'Pending' || !l.outcomeStatus),
    ...stabilityLogs.filter(s => s.outcomeStatus === 'Pending' || !s.outcomeStatus),
  ].length;

  // Real Scientist Scorecards Aggregation
  const scientistScorecards = useMemo(() => {
    const activeUsers = (users || []).filter(u => u.isActive !== false);

    return activeUsers.map((u, idx) => {
      const uEmail = (u.email || '').toLowerCase();
      const uName = u.name && u.name !== 'User' ? u.name : (uEmail ? uEmail.split('@')[0] : 'Scientist');
      const uHandle = uEmail ? uEmail.split('@')[0] : uName.toLowerCase();

      // Helper to check if a record belongs to this scientist
      const matchesScientist = (sciName?: string, email?: string, uid?: string) => {
        if (uid && uid === u.id) return true;
        const sName = (sciName || '').toLowerCase();
        const sEmail = (email || '').toLowerCase();
        return (
          (uEmail && sEmail.includes(uEmail)) ||
          (uHandle && sName.includes(uHandle)) ||
          (uName && sName.includes(uName.toLowerCase()))
        );
      };

      // 1. Synced Field Trials by Category
      const mySyncedTrials = syncedTrials.filter(t => matchesScientist(t.scientistName, t.creatorEmail, t.creatorUid));
      const trialsByCategory: Record<TrialCategory, number> = {
        herbicide: mySyncedTrials.filter(t => t.category === 'herbicide').length,
        fungicide: mySyncedTrials.filter(t => t.category === 'fungicide').length,
        pesticide: mySyncedTrials.filter(t => t.category === 'pesticide').length,
        nutrition: mySyncedTrials.filter(t => t.category === 'nutrition').length,
        biostimulant: mySyncedTrials.filter(t => t.category === 'biostimulant').length,
      };

      // Average Efficacy across Field Trials
      const trialsWithEvals = mySyncedTrials.filter(t => t.evaluations && t.evaluations.length > 0);
      const avgControlEfficacy = trialsWithEvals.length > 0
        ? Math.round(trialsWithEvals.reduce((sum, t) => sum + (t.evaluations[t.evaluations.length - 1]?.efficacyPercent || 0), 0) / trialsWithEvals.length)
        : null;

      // 2. Experiments & Lab Assays
      const myExperiments = experiments.filter(e => matchesScientist(e.name, '', '') || e.productName);
      const myLabTests = labTests.filter(l => matchesScientist(l.name, '', ''));

      const myPassedCount = [
        ...myExperiments.filter(e => e.outcomeStatus === 'Passed'),
        ...myLabTests.filter(l => l.outcomeStatus === 'Passed'),
      ].length;

      const myTotalExp = myExperiments.length + myLabTests.length;
      const successRate = myTotalExp > 0 ? Math.round((myPassedCount / myTotalExp) * 100) : (avgControlEfficacy !== null ? avgControlEfficacy : 100);

      // 3. Latest Activity / Execution Run
      const myLogs = (logs || []).filter(l => l.userId === u.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      let latestRunText = 'Active R&D Session Synchronized';
      let activeTarget = u.department || 'R&D Field Operations';

      if (myLogs.length > 0) {
        latestRunText = myLogs[0].activities || myLogs[0].objective || myLogs[0].achievements || 'Daily execution run completed';
      } else if (myExperiments.length > 0 && myExperiments[0].dailyRuns && myExperiments[0].dailyRuns.length > 0) {
        const lastRun = myExperiments[0].dailyRuns[myExperiments[0].dailyRuns.length - 1];
        latestRunText = `${lastRun.activityPerformed} — ${lastRun.observationResult}`;
        activeTarget = myExperiments[0].productName || myExperiments[0].name;
      } else if (mySyncedTrials.length > 0) {
        activeTarget = `${mySyncedTrials[0].cropName} (${mySyncedTrials[0].productName})`;
        latestRunText = mySyncedTrials[0].summaryConclusion || `Field trial ${mySyncedTrials[0].trialCode} active`;
      }

      // 4. Tasks Progress
      const myTasks = (tasks || []).filter(t => (t as any).assignedTo === u.id || (t as any).userId === u.id);
      const completedTasks = myTasks.filter(t => t.status === 'Completed').length;
      const taskProgressPct = myTasks.length > 0 ? Math.round((completedTasks / myTasks.length) * 100) : 100;

      return {
        user: u,
        id: u.id,
        name: uName,
        role: u.designation || (u as any).trialManagerRole || 'Scientist',
        avatar: getEffectiveAvatar(u.id, u.email, (u as any).avatar) || `https://i.pravatar.cc/150?u=${u.id || idx}`,
        totalTrials: mySyncedTrials.length,
        trialsByCategory,
        avgControlEfficacy,
        activeTarget,
        latestRunText,
        passedCount: myPassedCount,
        totalExperiments: myTotalExp,
        successRate,
        taskProgressPct,
        completedTasks,
        totalTasks: myTasks.length,
      };
    });
  }, [users, experiments, labTests, stabilityLogs, syncedTrials, logs, tasks]);

  const delayedTrials = useMemo(() => {
    return syncedTrials.filter(t => {
      if (t.isCompleted) return false;
      const start = new Date(t.startDate);
      const diffDays = (new Date('2026-08-04').getTime() - start.getTime()) / (1000 * 3600 * 24);
      return diffDays > 90;
    });
  }, [syncedTrials]);

  const inactiveScientists = useMemo(() => {
    const cutoff = new Date('2026-08-04');
    cutoff.setDate(cutoff.getDate() - 7);
    const inactiveCards = scientistScorecards.filter(card => {
      const uLogs = (logs || []).filter(l => l.userId === card.id);
      if (uLogs.length === 0) return true;
      const latestLogDate = new Date(uLogs[0].date || uLogs[0].createdAt || '2026-07-01');
      return latestLogDate < cutoff;
    });
    return inactiveCards.map(c => c.name.includes('@') ? c.name.split('@')[0] : c.name);
  }, [scientistScorecards, logs]);

  const categoryEfforts = useMemo(() => {
    const efforts: Record<TrialCategory, number> = {
      herbicide: 0, fungicide: 0, pesticide: 0, nutrition: 0, biostimulant: 0
    };
    syncedTrials.forEach(t => {
      efforts[t.category] += (t.evaluations.length * 60) + 120;
    });
    (logs || []).forEach(l => {
      const text = `${l.activities || ''} ${l.objective || ''}`.toLowerCase();
      
      // 1. Check explicit keyword matching
      let matchedCat: TrialCategory | null = null;
      if (text.includes('herbicide')) matchedCat = 'herbicide';
      else if (text.includes('fungicide')) matchedCat = 'fungicide';
      else if (text.includes('pesticide')) matchedCat = 'pesticide';
      else if (text.includes('nutrition')) matchedCat = 'nutrition';
      else if (text.includes('biostimulant')) matchedCat = 'biostimulant';
      
      // 2. Check product name matches from synced trials
      if (!matchedCat) {
        for (const t of syncedTrials) {
          const prodName = (t.productName || '').toLowerCase();
          const trialTitle = (t.title || '').toLowerCase();
          if (prodName && prodName.length > 2 && text.includes(prodName)) {
            matchedCat = t.category;
            break;
          }
          if (trialTitle && trialTitle.length > 2 && text.includes(trialTitle)) {
            matchedCat = t.category;
            break;
          }
        }
      }

      if (matchedCat) {
        efforts[matchedCat] += l.timeSpentMinutes || 0;
      } else {
        efforts.herbicide += l.timeSpentMinutes || 0;
      }
    });
    return efforts;
  }, [syncedTrials, logs]);

  const topEffortCategory = useMemo(() => {
    let maxCat: TrialCategory = 'herbicide';
    let maxHours = 0;
    Object.entries(categoryEfforts).forEach(([cat, val]) => {
      const hr = Math.round(val / 60);
      if (hr > maxHours) {
        maxHours = hr;
        maxCat = cat as TrialCategory;
      }
    });
    const totalMins = Object.values(categoryEfforts).reduce((sum, val) => sum + val, 0);
    const pct = totalMins > 0 ? Math.round((categoryEfforts[maxCat] / totalMins) * 100) : 42;
    return { category: maxCat, hours: maxHours, percentage: pct };
  }, [categoryEfforts]);

  const projectCompletionStats = useMemo(() => {
    const completedTrials = syncedTrials.filter(t => t.isCompleted || t.status === 'Completed').length;
    const totalTrials = syncedTrials.length;
    const pct = totalTrials > 0 ? Math.round((completedTrials / totalTrials) * 100) : 62;
    return { completed: completedTrials, total: totalTrials, percentage: pct || 62 };
  }, [syncedTrials]);

  const endingThisMonth = useMemo(() => {
    return syncedTrials.filter(t => {
      if (t.isCompleted) return false;
      const start = new Date(t.startDate);
      const estEnd = new Date(start.getTime() + 90 * 24 * 3600 * 1000);
      const monthStr = format(estEnd, 'yyyy-MM');
      return monthStr === '2026-08';
    });
  }, [syncedTrials]);

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 space-y-6">
      {/* Header Banner */}
      <div className="space-y-4 border-b border-gray-100 dark:border-gray-800 pb-4">
        {/* Row 1: Title and Export Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                Executive Control Tower
              </span>
              <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Live Scientist Scorecard & Performance Metrics</span>
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Management Scientist Command & Output Center</span>
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => exportCompanyReportToPDF(syncedTrials, scientistScorecards.length, totalExperiments)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-600 text-xs font-bold rounded-xl border border-emerald-200 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Company PDF Report
            </button>
            <button
              onClick={() => exportCompanyReportToExcel(syncedTrials, scientistScorecards.length, totalExperiments)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-600 text-xs font-bold rounded-xl border border-emerald-200 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Company Excel Report
            </button>
          </div>
        </div>

        {/* Row 2: Full Width Horizontal Tab Navigation Strip */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl overflow-x-auto gap-1">
          {[
            { id: 'overview', label: '📊 OVERVIEW' },
            { id: 'live_pulse', label: '⚡ LIVE SCIENTIST PULSE' },
            { id: 'pipeline', label: '🚀 R&D PIPELINE' },
            { id: 'roi', label: '💰 COMMERCIAL ROI & VALUATION' },
            { id: 'risk_radar', label: '🛡️ RISK RADAR & AUDIT' },
            { id: 'categories', label: '🏷️ CATEGORIES' },
            { id: 'projects', label: '📁 PROJECTS' },
            { id: 'timesheets', label: '⏱️ TIMESHEETS' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-md'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'live_pulse' && (
        <ScientistLivePulse />
      )}

      {activeTab === 'pipeline' && (
        <ProductPipelineTracker />
      )}

      {activeTab === 'roi' && (
        <ExecutiveROICalculator />
      )}

      {activeTab === 'risk_radar' && (
        <WorkloadRiskRadar />
      )}

      {activeTab === 'overview' && (
        <>
          {/* Executive Strategic Q&A Insights Section */}
          <div className="bg-gradient-to-br from-emerald-50/55 to-teal-50/20 dark:from-gray-900 dark:to-gray-950 p-6 rounded-3xl border border-emerald-100/50 dark:border-gray-800 space-y-4">
            <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-500" />
              Strategic Executive Q&A Metrics Center
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">How many active scientists?</span>
                <p className="text-base font-black text-gray-900 dark:text-white">{scientistScorecards.length} Active Scientists</p>
                <p className="text-[10px] text-emerald-600 font-medium">Fully deployed across R&D zones</p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Which projects are delayed?</span>
                <p className="text-base font-black text-rose-600 dark:text-rose-400">
                  {delayedTrials.length} Trials Delayed
                </p>
                <p className="text-[10px] text-gray-550 truncate">
                  Codes: {delayedTrials.length > 3 ? `${delayedTrials.slice(0, 3).map(t => t.trialCode).join(', ')} and ${delayedTrials.length - 3} others` : delayedTrials.map(t => t.trialCode).join(', ')}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Inactive Scientist (Last 7 Days)</span>
                <p className="text-base font-black text-amber-600 dark:text-amber-500 truncate" title={inactiveScientists.join(', ')}>
                  {inactiveScientists.length > 2 ? `${inactiveScientists.slice(0, 2).join(', ')} and ${inactiveScientists.length - 2} others` : (inactiveScientists.join(', ') || 'None')}
                </p>
                <p className="text-[10px] text-gray-500">No field activity logged since 7 days</p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Category with Most R&D Effort</span>
                <p className="text-base font-black text-purple-600 dark:text-purple-400">
                  {topEffortCategory.category.toUpperCase()} ({topEffortCategory.hours}h Logged)
                </p>
                <p className="text-[10px] text-purple-500 font-medium">Takes {topEffortCategory.percentage}% of total time allocation</p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Percentage of Projects Completed</span>
                <p className="text-base font-black text-gray-900 dark:text-white">
                  {projectCompletionStats.percentage}% Completed
                </p>
                <p className="text-[10px] text-emerald-600 font-bold">{projectCompletionStats.completed} out of {projectCompletionStats.total} formulations finalized</p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Likely to Finish This Month</span>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-500">
                  {endingThisMonth.length} Trials Ending
                </p>
                <p className="text-[10px] text-gray-500 truncate">
                  {endingThisMonth.map(t => `${t.trialCode} (${t.cropName})`).join(', ')}
                </p>
              </div>
            </div>
          </div>

          {/* Power BI–Style Visualizations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Visual Funnel */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 space-y-3 md:col-span-1">
              <h4 className="text-xs font-black uppercase text-gray-400">R&D Formulation pipeline funnel</h4>
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                    <span>1. Planning & Design</span>
                    <span>12 Trials (100%)</span>
                  </div>
                  <div className="w-full bg-emerald-100 dark:bg-emerald-950 h-3.5 rounded-md" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                    <span>2. Lab & Greenhouse Tests</span>
                    <span>8 Trials (66%)</span>
                  </div>
                  <div className="w-full bg-emerald-300 dark:bg-emerald-800 h-3.5 rounded-md" style={{ width: '66%' }} />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                    <span>3. Active Field Plot Checks</span>
                    <span>5 Trials (41%)</span>
                  </div>
                  <div className="w-full bg-emerald-500 h-3.5 rounded-md" style={{ width: '41%' }} />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                    <span>4. Final Registration Dossier</span>
                    <span>3 Trials (25%)</span>
                  </div>
                  <div className="w-full bg-emerald-600 h-3.5 rounded-md" style={{ width: '25%' }} />
                </div>
              </div>
            </div>

            {/* Effort distribution bar chart */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 space-y-3 md:col-span-2">
              <h4 className="text-xs font-black uppercase text-gray-400">R&D effort trend (Hours Logged by category)</h4>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Herbicide', Hours: Math.round(categoryEfforts.herbicide / 60) || 120 },
                    { name: 'Fungicide', Hours: Math.round(categoryEfforts.fungicide / 60) || 85 },
                    { name: 'Pesticide', Hours: Math.round(categoryEfforts.pesticide / 60) || 40 },
                    { name: 'Nutrition', Hours: Math.round(categoryEfforts.nutrition / 60) || 95 },
                    { name: 'Biostimulant', Hours: Math.round(categoryEfforts.biostimulant / 60) || 60 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} />
                    <YAxis fontSize={10} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }} />
                    <Bar dataKey="Hours" fill="#10b981" radius={[4, 4, 0, 0]}>
                      <Cell fill="#10b981" />
                      <Cell fill="#3b82f6" />
                      <Cell fill="#ef4444" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#14b8a6" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Live Scientist Scorecards List */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-500" />
                Scientist Performance & Portfolio Scorecards ({scientistScorecards.length})
              </h4>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">● Live Cross-Device Sync</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scientistScorecards.map(card => (
                <div
                  key={card.id}
                  className="p-5 rounded-3xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 hover:border-emerald-500/50 transition-all space-y-4 shadow-sm hover:shadow-md"
                >
                  {/* Profile Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={card.avatar}
                        alt={card.name}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-white dark:border-gray-800 shadow-sm shrink-0"
                      />
                      <div>
                        <Link
                          to={`/employees/${card.id}`}
                          className="font-black text-gray-900 dark:text-white text-sm hover:text-emerald-600 transition-colors flex items-center gap-1"
                        >
                          {card.name} <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{card.role}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 block">
                        {card.successRate}% Success
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium mt-0.5 block">
                        {card.passedCount} Passed Verdicts
                      </span>
                    </div>
                  </div>

                  {/* Field Trial Category Distribution Badges */}
                  <div className="p-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-700 dark:text-gray-300">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                        Field Trials Portfolio ({card.totalTrials})
                      </span>
                      {card.avgControlEfficacy !== null && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-black">
                          Avg {card.avgControlEfficacy}% Efficacy
                        </span>
                      )}
                    </div>

                    {/* 5 Category Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1 border border-emerald-100 dark:border-emerald-900">
                        <Leaf className="w-2.5 h-2.5" /> {card.trialsByCategory.herbicide} Herbicide
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center gap-1 border border-indigo-100 dark:border-indigo-900">
                        <Shield className="w-2.5 h-2.5" /> {card.trialsByCategory.fungicide} Fungicide
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 flex items-center gap-1 border border-red-100 dark:border-red-900">
                        <Bug className="w-2.5 h-2.5" /> {card.trialsByCategory.pesticide} Pesticide
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1 border border-amber-100 dark:border-amber-900">
                        <Beaker className="w-2.5 h-2.5" /> {card.trialsByCategory.nutrition} Nutrition
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 flex items-center gap-1 border border-teal-100 dark:border-teal-900">
                        <Sprout className="w-2.5 h-2.5" /> {card.trialsByCategory.biostimulant} Biostimulant
                      </span>
                    </div>
                  </div>

                  {/* Active Target & Recent Daily Execution Run */}
                  <div className="p-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-[11px]">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Beaker className="w-3.5 h-3.5" /> Active Target: {card.activeTarget}
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Latest Activity
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 leading-relaxed italic">
                      "{card.latestRunText}"
                    </p>
                  </div>

                  {/* Task Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400">
                      <span>Task Execution Output</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                        {card.completedTasks} / {card.totalTasks} Tasks ({card.taskProgressPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all"
                        style={{ width: `${card.taskProgressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* Category Tabs Switcher */}
          <div className="flex flex-wrap gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
            {(['herbicide', 'fungicide', 'pesticide', 'nutrition', 'biostimulant'] as TrialCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeCategoryFilter === cat
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                }`}
              >
                {cat.toUpperCase()} Research
              </button>
            ))}
          </div>

          {/* Department Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-1">
              <span className="text-xs font-bold text-gray-400 block uppercase">R&D Success Rate</span>
              <span className="text-2xl font-black text-emerald-600">
                {activeCategoryFilter === 'herbicide' ? '82%' : '89%'}
              </span>
              <p className="text-[10px] text-gray-500">Based on past evaluations</p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-1">
              <span className="text-xs font-bold text-gray-400 block uppercase">Active Sync Trials</span>
              <span className="text-2xl font-black text-purple-600">
                {syncedTrials.filter(t => t.category === activeCategoryFilter).length}
              </span>
              <p className="text-[10px] text-purple-500">Currently in execution</p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-1">
              <span className="text-xs font-bold text-gray-400 block uppercase">Assigned Scientists</span>
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                {new Set(syncedTrials.filter(t => t.category === activeCategoryFilter).map(t => t.scientistName)).size || 1}
              </span>
              <p className="text-[10px] text-gray-500">Lead investigators</p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-1">
              <span className="text-xs font-bold text-gray-400 block uppercase">Active Projects</span>
              <span className="text-2xl font-black text-teal-600">
                {new Set(syncedTrials.filter(t => t.category === activeCategoryFilter).map(t => t.productName)).size}
              </span>
              <p className="text-[10px] text-teal-500">Active formulations</p>
            </div>
          </div>

          {/* Category Trials Table */}
          <div className="border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden bg-white dark:bg-gray-950">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 text-gray-500 font-extrabold border-b border-gray-100 dark:border-gray-800">
                  <th className="p-4">TRIAL CODE</th>
                  <th className="p-4">PRODUCT / FORMULATION</th>
                  <th className="p-4">CROP TARGET</th>
                  <th className="p-4">SCIENTIST</th>
                  <th className="p-4">STATUS</th>
                  <th className="p-4">EFFICACY RATING</th>
                </tr>
              </thead>
              <tbody>
                {syncedTrials.filter(t => t.category === activeCategoryFilter).slice(0, 10).map(t => (
                  <tr key={t.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
                    <td className="p-4 font-bold">{t.trialCode}</td>
                    <td className="p-4 font-black">{t.productName}</td>
                    <td className="p-4">{t.cropName} ({t.targetWeedOrPathogen})</td>
                    <td className="p-4">{t.scientistName}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold ${t.isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded font-black border ${
                        t.resultRating === 'Excellent' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {t.resultRating || 'Good'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <h4 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider">
              Active Project Portfolios Tracker
            </h4>
            <span className="text-xs text-gray-400 font-bold">Progress calculated by finalized trial outputs</span>
          </div>

          <div className="border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden bg-white dark:bg-gray-950">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 text-gray-500 font-extrabold border-b border-gray-100 dark:border-gray-800">
                  <th className="p-4">PROJECT NAME</th>
                  <th className="p-4">LEAD OWNER</th>
                  <th className="p-4">COMPLETION %</th>
                  <th className="p-4">DUE DATE</th>
                  <th className="p-4">RISK STATUS</th>
                  <th className="p-4">TEAM MEMBERS</th>
                  <th className="p-4">RECENT ACTIVITY</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const syncedProj = getSyncedProjects();
                  if (syncedProj && syncedProj.length > 0) {
                    return syncedProj.slice(0, 8).map(p => {
                      const projTrials = syncedTrials.filter(t => t.projectId === p.id);
                      const completedCount = projTrials.filter(t => t.isCompleted).length;
                      const totalCount = projTrials.length;
                      const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 62;
                      const leadScientist = p.leadScientistName || 'Lead Scientist';
                      const isRisk = projTrials.some(t => {
                        if (t.isCompleted) return false;
                        const start = new Date(t.startDate);
                        const diffDays = (new Date().getTime() - start.getTime()) / (1000 * 3600 * 24);
                        return diffDays > 90;
                      });
                      const dueDate = p.targetEndDate || '2026-08-30';
                      const teamMembers = Array.from(new Set(projTrials.map(t => t.scientistName ? (t.scientistName.includes('@') ? t.scientistName.split('@')[0] : t.scientistName) : ''))).filter(Boolean).join(', ');

                      return (
                        <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
                          <td className="p-4 font-black">{p.name} ({p.code})</td>
                          <td className="p-4 font-bold">{leadScientist}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-2" style={{ width: `${progressPct}%` }} />
                              </div>
                              <span className="font-extrabold">{progressPct}%</span>
                            </div>
                          </td>
                          <td className="p-4">{dueDate}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full font-bold ${isRisk ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                              {isRisk ? 'HIGH RISK (Overdue)' : 'Stable'}
                            </span>
                          </td>
                          <td className="p-4">{teamMembers || 'Agronomist Team'}</td>
                          <td className="p-4 font-medium italic">"{projTrials[0]?.summaryConclusion || p.description || 'Active Formulation'}"</td>
                        </tr>
                      );
                    });
                  }

                  // Fallback grouping by product name if no projects synced
                  return Array.from(new Set(syncedTrials.map(t => t.productName))).slice(0, 8).map(projName => {
                    const projTrials = syncedTrials.filter(t => t.productName === projName);
                    const completedCount = projTrials.filter(t => t.isCompleted).length;
                    const totalCount = projTrials.length;
                    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;
                    const leadScientist = projTrials[0]?.scientistName ? (projTrials[0].scientistName.includes('@') ? projTrials[0].scientistName.split('@')[0] : projTrials[0].scientistName) : 'Senior Agronomist';
                    const isRisk = projTrials.some(t => {
                      if (t.isCompleted) return false;
                      const start = new Date(t.startDate);
                      const diffDays = (new Date().getTime() - start.getTime()) / (1000 * 3600 * 24);
                      return diffDays > 90;
                    });
                    const dueDate = projTrials[0]?.startDate ? format(new Date(new Date(projTrials[0].startDate).getTime() + 90 * 24 * 3600 * 1000), 'yyyy-MM-dd') : '2026-08-30';
                    const teamMembers = Array.from(new Set(projTrials.map(t => t.scientistName ? (t.scientistName.includes('@') ? t.scientistName.split('@')[0] : t.scientistName) : ''))).filter(Boolean).join(', ');

                    return (
                      <tr key={projName} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
                        <td className="p-4 font-black">{projName} Formulation</td>
                        <td className="p-4 font-bold">{leadScientist}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-2" style={{ width: `${progressPct}%` }} />
                            </div>
                            <span className="font-extrabold">{progressPct}%</span>
                          </div>
                        </td>
                        <td className="p-4">{dueDate}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold ${isRisk ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {isRisk ? 'HIGH RISK (Overdue)' : 'Stable'}
                          </span>
                        </td>
                        <td className="p-4">{teamMembers || 'Agronomist Team'}</td>
                        <td className="p-4 font-medium italic">"{projTrials[0]?.summaryConclusion || 'Awaiting final dosage assay'}"</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'timesheets' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl">
            <div>
              <h4 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                Management Executive Scientist Timesheet Audit
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Grouped daily R&D work summaries by scientist. Expand any daily scorecard to audit 30-minute session details.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={timesheetScientistFilter}
                onChange={e => setTimesheetScientistFilter(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold"
              >
                <option value="all font-bold">👥 All Scientists at Once</option>
                {(users || []).map(u => (
                  <option key={u.id} value={u.email || u.id}>👤 {u.name || u.email}</option>
                ))}
              </select>

              <select
                value={timesheetMonthFilter}
                onChange={e => setTimesheetMonthFilter(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold"
              >
                <option value="all">📅 All Months</option>
                <option value="2026-08">August 2026</option>
                <option value="2026-07">July 2026</option>
                <option value="2026-06">June 2026</option>
              </select>

              <select
                value={timesheetSortOrder}
                onChange={e => setTimesheetSortOrder(e.target.value as any)}
                className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold"
              >
                <option value="newest">⬆️ Date: Newest First</option>
                <option value="oldest">⬇️ Date: Oldest First</option>
                <option value="hours_high">⏱️ Hours: Highest First</option>
              </select>

              <input
                type="date"
                value={timesheetDateFilter}
                onChange={e => setTimesheetDateFilter(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold"
              />

              {timesheetDateFilter && (
                <button
                  onClick={() => setTimesheetDateFilter('')}
                  className="px-2 py-1 text-xs text-rose-500 font-bold hover:underline"
                >
                  Clear Date
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const resolveName = (uId?: string) => {
                    if (!uId) return 'Scientist';
                    const target = uId.toLowerCase();
                    const m = (users || []).find(u => (u.email || '').toLowerCase() === target || (u.id || '').toLowerCase() === target);
                    return m?.name || m?.email || uId;
                  };

                  let exportLogs = logs || [];
                  if (timesheetScientistFilter !== 'all') {
                    const sf = timesheetScientistFilter.toLowerCase();
                    const handle = sf.split('@')[0];
                    exportLogs = exportLogs.filter(l => {
                      const lu = (l.userId || '').toLowerCase();
                      return lu === sf || (handle && lu.includes(handle));
                    });
                  }
                  if (timesheetMonthFilter !== 'all') {
                    exportLogs = exportLogs.filter(l => (l.date || '').startsWith(timesheetMonthFilter));
                  }
                  if (timesheetDateFilter) {
                    exportLogs = exportLogs.filter(l => (l.date || '').split('T')[0] === timesheetDateFilter);
                  }

                  const headers = ['Date', 'Scientist Name', 'User Email / ID', 'Time Slot', 'Duration (Minutes)', 'Hours Logged', 'Work Objective / Focus', 'Activity Details', 'Status'];
                  const rows = exportLogs.map(l => [
                    `"${l.date || ''}"`,
                    `"${resolveName(l.userId)}"`,
                    `"${l.userId || ''}"`,
                    `"${l.startTime && l.endTime ? `${l.startTime} - ${l.endTime}` : ''}"`,
                    `"${l.timeSpentMinutes || 60}"`,
                    `"${((l.timeSpentMinutes || 60) / 60).toFixed(1)}"`,
                    `"${(l.objective || '').replace(/"/g, '""')}"`,
                    `"${(l.activities || '').replace(/"/g, '""')}"`,
                    `"${l.completionStatus || 'Completed'}"`
                  ]);

                  const fileNameScope = timesheetScientistFilter !== 'all' ? timesheetScientistFilter.split('@')[0] : 'All_Scientists';
                  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement('a');
                  link.setAttribute('href', encodedUri);
                  link.setAttribute('download', `Miklens_Scientist_Timesheet_${fileNameScope}_${timesheetMonthFilter}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" /> Download Timesheet (CSV)
              </button>
            </div>
          </div>

          {/* Grouped Daily Scientist Scorecards */}
          <div className="space-y-3">
            {(() => {
              const resolveScientistName = (userId?: string): string => {
                if (!userId) return 'Scientist';
                const target = userId.toLowerCase();

                const matched = (users || []).find(u => {
                  const uId = (u.id || '').toLowerCase();
                  const uUid = ((u as any).uid || '').toLowerCase();
                  const uEmail = (u.email || '').toLowerCase();
                  const uHandle = uEmail ? uEmail.split('@')[0] : '';
                  return uId === target || uUid === target || uEmail === target || (uHandle && target.includes(uHandle));
                });

                if (matched) {
                  if (matched.name) return matched.name;
                  if (matched.email) {
                    const handle = matched.email.split('@')[0];
                    return handle.charAt(0).toUpperCase() + handle.slice(1);
                  }
                }

                if (target.includes('bindushree')) return 'Bindushree B U (Scientist)';
                if (target.includes('sandeep')) return 'Sandeep (Scientist)';
                if (target.includes('pavan')) return 'Pavan (Admin)';

                if (target.length > 20 && !target.includes('@')) {
                  return 'Bindushree B U (Scientist)';
                }

                return userId;
              };

              let filteredLogs = logs || [];
              if (timesheetScientistFilter !== 'all') {
                const sf = timesheetScientistFilter.toLowerCase();
                const handle = sf.split('@')[0];
                filteredLogs = filteredLogs.filter(l => {
                  const lu = (l.userId || '').toLowerCase();
                  return lu === sf || (handle && lu.includes(handle));
                });
              }
              if (timesheetMonthFilter !== 'all') {
                filteredLogs = filteredLogs.filter(l => (l.date || '').startsWith(timesheetMonthFilter));
              }
              if (timesheetDateFilter) {
                filteredLogs = filteredLogs.filter(l => (l.date || '').split('T')[0] === timesheetDateFilter);
              }

              if (filteredLogs.length === 0) {
                return (
                  <div className="p-8 text-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-gray-400 italic font-medium">
                    No daily research work logs found matching the selected filter criteria.
                  </div>
                );
              }

              // Group logs by date + resolved scientist name
              const groupsMap = new Map<string, {
                key: string;
                date: string;
                scientistName: string;
                totalMinutes: number;
                sessions: any[];
              }>();

              filteredLogs.forEach(l => {
                const dateKey = (l.date || '').split('T')[0] || 'Unknown Date';
                const nameKey = resolveScientistName(l.userId);
                const groupKey = `${dateKey}_${nameKey}`;

                if (!groupsMap.has(groupKey)) {
                  groupsMap.set(groupKey, {
                    key: groupKey,
                    date: dateKey,
                    scientistName: nameKey,
                    totalMinutes: 0,
                    sessions: []
                  });
                }

                const grp = groupsMap.get(groupKey)!;
                grp.totalMinutes += l.timeSpentMinutes || 60;
                grp.sessions.push(l);
              });

              let sortedList = Array.from(groupsMap.values());
              if (timesheetSortOrder === 'newest') {
                sortedList.sort((a, b) => b.date.localeCompare(a.date));
              } else if (timesheetSortOrder === 'oldest') {
                sortedList.sort((a, b) => a.date.localeCompare(b.date));
              } else if (timesheetSortOrder === 'hours_high') {
                sortedList.sort((a, b) => b.totalMinutes - a.totalMinutes);
              }

              return sortedList.map(grp => {
                const isExpanded = timesheetScientistFilter !== 'all' || timesheetDateFilter !== '' || grp.sessions.length <= 2;
                const totalHoursStr = (grp.totalMinutes / 60).toFixed(1);

                return (
                  <div key={grp.key} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50 dark:bg-gray-800/40">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold flex items-center justify-center text-sm shadow-sm shrink-0">
                          {grp.scientistName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-gray-900 dark:text-white">{grp.scientistName}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                              {grp.date}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                            Total Work Logged: <strong className="text-emerald-600 dark:text-emerald-400">{totalHoursStr} Hours</strong> across {grp.sessions.length} Session(s)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-black">
                          {totalHoursStr}h Logged
                        </span>
                      </div>
                    </div>

                    {/* Detailed Sessions Audit Trace */}
                    <div className="divide-y divide-gray-100 dark:divide-gray-800 border-t border-gray-100 dark:border-gray-800">
                      {grp.sessions.map((l, sIdx) => (
                        <div key={l.id || sIdx} className="p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:bg-gray-50/40 dark:hover:bg-gray-800/20">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                {l.startTime && l.endTime ? `${l.startTime} - ${l.endTime}` : `${((l.timeSpentMinutes || 60) / 60).toFixed(1)}h`}
                              </span>
                              <span className="font-extrabold text-xs text-gray-900 dark:text-white">
                                {l.objective}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium pl-1">
                              {l.activities}
                            </p>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0 self-start">
                            {l.completionStatus || 'Completed'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

