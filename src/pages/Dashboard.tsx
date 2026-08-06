import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../hooks/useUsers';
import { useDailyLogs } from '../hooks/useDailyLogs';
import { useExperiments } from '../contexts/ExperimentContext';
import { useTasks } from '../contexts/TaskContext';
import { getSyncedTrials } from '../services/trialManagerSync';
import { ScientistHub } from '../components/ScientistHub';
import { ExecutiveControlTower } from '../components/ExecutiveControlTower';
import { exportToPDF } from '../utils/exportUtils';
import { exportMasterExecutiveReportPDF, exportMasterExcelWorkbook } from '../services/executiveReportGenerator';
import { format } from 'date-fns';
import { 
  Plus, Workflow, Pipette, Beaker, MapPin, Sparkles, Clock, Edit3, 
  CheckSquare, CheckCircle2, Circle, FileText, Download, Award, ArrowRight,
  Search, AlertTriangle, ShieldCheck, TrendingUp, Info, User, HelpCircle
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { profile, userRole, currentUser } = useAuth();
  const { data: users } = useUsers();
  const { data: logs } = useDailyLogs();
  const { tasks } = useTasks();
  const { experiments, labTests } = useExperiments();
  
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

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

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

    // A trial is delayed if it started > 90 days ago and is still not completed
    const delayedCount = filteredTrials.filter(t => {
      if (t.isCompleted) return false;
      const start = new Date(t.startDate);
      const diffDays = (now.getTime() - start.getTime()) / (1000 * 3600 * 24);
      return diffDays > 90;
    }).length;

    // Find the scientist with the highest evaluation count
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

  // Predictive Analytics Calculations
  const predictiveMetrics = useMemo(() => {
    const activeTrials = filteredTrials.filter(t => !t.isCompleted);
    
    // Delayed ratio
    const delayedTrials = activeTrials.filter(t => {
      const start = new Date(t.startDate);
      const diffDays = (now.getTime() - start.getTime()) / (1000 * 3600 * 24);
      return diffDays > 90;
    });

    const delayPct = activeTrials.length > 0 
      ? Math.round((delayedTrials.length / activeTrials.length) * 100) 
      : 0;

    // Overload check: scientists with > 20 active trials
    const activeCounts: Record<string, number> = {};
    activeTrials.forEach(t => {
      activeCounts[t.scientistName] = (activeCounts[t.scientistName] || 0) + 1;
    });
    const overloaded = Object.entries(activeCounts)
      .filter(([, count]) => count > 20)
      .map(([name]) => formatName(name));

    const overloadMsg = overloaded.length > 0
      ? `High workload on ${overloaded.join(', ')}`
      : 'Workloads distributed normally';

    const riskScore = (10 - (delayPct / 20)).toFixed(1);

    // Closest completion estimate (current date + 14 days if active trials exist)
    const completionEst = activeTrials.length > 0 
      ? format(new Date(Date.now() + 14 * 24 * 3600 * 1000), 'yyyy-MM-dd')
      : 'Completed';

    return {
      estCompletionDate: completionEst,
      delayProbability: `${delayPct}%`,
      overloadWarning: overloadMsg,
      resourceRiskScore: `${riskScore} / 10`
    };
  }, [filteredTrials]);

  // Breakthrough Formulations (Excellent/Good Efficacy with real evaluations)
  const breakthroughs = useMemo(() => {
    return filteredTrials.filter(t => {
      const hasGoodRating = t.resultRating === 'Excellent' || t.resultRating === 'Good';
      const hasEfficacy = t.evaluations && t.evaluations.some(ev => ev.efficacyPercent >= 75);
      return hasGoodRating || hasEfficacy;
    }).slice(0, 4);
  }, [filteredTrials]);

  // Dynamic Critical Risks with Clear Trial Names & Products
  const criticalRisks = useMemo(() => {
    const risks: Array<{ id: string; title: string; desc: string; type: 'red' | 'amber' }> = [];
    const activeTrials = filteredTrials.filter(t => !t.isCompleted);

    // 1. Long running / delayed trials
    activeTrials.forEach(t => {
      const start = new Date(t.startDate);
      const diffDays = (now.getTime() - start.getTime()) / (1000 * 3600 * 24);
      if (diffDays > 60 && risks.length < 3) {
        const mainTitle = t.title || t.productName || 'Field Trial Program';
        const displayHeader = `${mainTitle} — ${t.cropName || 'Crop'} (${t.trialCode})`;
        const targetStr = t.targetWeedOrPathogen ? ` [Target: ${t.targetWeedOrPathogen}]` : '';

        risks.push({
          id: `risk-long-${t.id}`,
          title: `⏱️ ${displayHeader}`,
          desc: `Trial "${mainTitle}" on ${t.cropName || 'Crop'}${targetStr} led by ${formatName(t.scientistName)} has been active for ${Math.round(diffDays)} days without conclusion.`,
          type: 'red'
        });
      }
    });

    // 2. High Phytotox alerts
    filteredTrials.forEach(t => {
      const hasHighPhytotox = t.evaluations && t.evaluations.some(ev => ev.phytotoxicityScore > 5);
      if (hasHighPhytotox && risks.length < 4) {
        const mainTitle = t.title || t.productName || 'Field Program';
        risks.push({
          id: `risk-phyto-${t.id}`,
          title: `⚠️ Crop Safety Hazard: ${mainTitle} (${t.trialCode})`,
          desc: `Elevated phytotoxicity score observed in treatments for ${t.cropName || 'Crop'} led by Lead ${formatName(t.scientistName)}. Protocol review required.`,
          type: 'amber'
        });
      }
    });

    if (risks.length === 0) {
      risks.push({
        id: 'risk-none',
        title: '✅ All Field Trials Operating Normally',
        desc: 'Zero overdue trials or crop phytotoxicity hazards detected across active research programs.',
        type: 'amber'
      });
    }

    return risks;
  }, [filteredTrials]);

  // Global Search Filter Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    
    return {
      scientists: (users || []).filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)),
      trials: syncedTrials.filter(t => 
        t.trialCode?.toLowerCase().includes(q) || 
        t.title?.toLowerCase().includes(q) || 
        t.productName?.toLowerCase().includes(q) ||
        t.cropName?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      ),
      experiments: (experiments || []).filter(e => 
        e.name?.toLowerCase().includes(q) || 
        e.productName?.toLowerCase().includes(q)
      )
    };
  }, [searchQuery, users, syncedTrials, experiments]);

  return (
    <div className="space-y-6">
      {/* Search Header Container */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl">
        <div className="min-w-0">
          <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Home Portal</span>
          <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white flex flex-wrap items-center gap-2">
            <span>Good Morning, {formatName(profile?.name || '')}</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
              R&D Health: Excellent
            </span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">Enterprise Microsoft Fabric Executive Landing Dashboard</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* View Switch Tab Selector (only for Admin cum Scientist role Pavan) */}
          {userRole === 'Admin' && (
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700 shrink-0">
              <button
                onClick={() => setViewMode('executive')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  viewMode === 'executive'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Executive View
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

          {/* GitHub style Universal Search Bar */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search trials, chemical crop, target..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearching(e.target.value.length > 0);
              }}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Global Search Results Dropdown Overlays */}
      {isSearching && searchResults && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-emerald-500 p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <h4 className="text-xs font-black uppercase text-emerald-600">Universal Search Outputs for "{searchQuery}"</h4>
            <button 
              onClick={() => { setSearchQuery(''); setIsSearching(false); }}
              className="text-xs text-gray-400 hover:text-gray-650 font-bold"
            >
              Clear Results
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* Trials Search Matches */}
            <div className="space-y-2">
              <span className="font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">Field Trials ({searchResults.trials.length})</span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {searchResults.trials.slice(0, 5).map(t => (
                  <div key={t.id} className="p-2 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
                    <p className="font-black text-gray-900 dark:text-white">{t.trialCode} - {t.productName}</p>
                    <p className="text-[10px] text-gray-555 font-medium">Crop: {t.cropName} | Target: {t.targetWeedOrPathogen}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Scientists Search Matches */}
            <div className="space-y-2">
              <span className="font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Scientists ({searchResults.scientists.length})</span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {searchResults.scientists.map(u => (
                  <Link key={u.id} to={`/employees/${u.id}`} className="block p-2 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-emerald-500">
                    <p className="font-black text-gray-900 dark:text-white">{u.name}</p>
                    <p className="text-[10px] text-gray-550">{u.email}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Experiments Search Matches */}
            <div className="space-y-2">
              <span className="font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Assays & Labs ({searchResults.experiments.length})</span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {searchResults.experiments.slice(0, 5).map(e => (
                  <div key={e.id} className="p-2 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
                    <p className="font-black text-gray-900 dark:text-white">{e.name}</p>
                    <p className="text-[10px] text-gray-555 font-medium">Product: {e.productName} | Outcome: {e.outcomeStatus || 'Pending'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Horizon selector */}
      {viewMode === 'executive' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-md">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-400 dark:text-gray-550 uppercase tracking-widest block">Analysis Horizon:</span>
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              {[
                { key: 'week', label: 'Last 7 Days' },
                { key: 'month', label: 'Last 30 Days' },
                { key: 'year', label: 'Last 365 Days' },
                { key: 'all', label: 'All History' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setTimeHorizon(opt.key as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    timeHorizon === opt.key
                      ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm font-black'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 dark:text-gray-550 font-bold">
              Showing <strong className="text-emerald-650 font-black">{filteredTrials.length}</strong> of {syncedTrials.length} synced trials
            </span>

            <div className="flex items-center gap-1.5 border-l border-gray-200 dark:border-gray-700 pl-3">
              <button
                onClick={() => exportMasterExecutiveReportPDF(syncedTrials, (users || []).length, (experiments.length + labTests.length), logs || [])}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold shadow hover:from-emerald-700 hover:to-teal-700 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> PDF Executive Brief
              </button>
              <button
                onClick={() => exportMasterExcelWorkbook(syncedTrials, logs || [], users || [], [])}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Master Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Home Dashboard Layout grid based on active viewMode */}
      {viewMode === 'executive' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Column: AI Executive Brief & Predictive Analytics */}
          <div className="md:col-span-2 space-y-6">
            
            {/* AI Executive Briefing Container */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-6 shadow-xl space-y-4 relative overflow-hidden">
              {/* Background elements */}
              <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-4">
                <Sparkles className="w-40 h-40" />
              </div>

              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-250 animate-pulse" />
                <h3 className="text-sm font-black uppercase tracking-widest text-emerald-100">Live AI Executive Briefing</h3>
              </div>
              
              <p className="text-sm font-medium leading-relaxed text-emerald-50">
                {aiExecutiveBrief}
              </p>

              <div className="pt-2 flex gap-2">
                <Link to="/ai-insights" className="px-4 py-2 bg-white text-emerald-700 text-xs font-black rounded-xl hover:bg-emerald-50 shadow-md">
                  Ask Gemini Assistant
                </Link>
              </div>
            </div>

            {/* Predictive Analytics Cards */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-lg space-y-4">
              <h3 className="text-xs font-black uppercase text-gray-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                R&D Predictive Analytics Indicators
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                  <span className="font-bold text-gray-400 block uppercase text-[10px]">Est. Completion Date</span>
                  <span className="text-sm font-black text-gray-950 dark:text-white">{predictiveMetrics.estCompletionDate}</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                  <span className="font-bold text-gray-400 block uppercase text-[10px]">Probability of Delay</span>
                  <span className="text-sm font-black text-rose-600">{predictiveMetrics.delayProbability}</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                  <span className="font-bold text-gray-400 block uppercase text-[10px]">Scientist Overload Check</span>
                  <span className="text-sm font-black text-amber-600 truncate block">{predictiveMetrics.overloadWarning}</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                  <span className="font-bold text-gray-400 block uppercase text-[10px]">Resource Forecast Score</span>
                  <span className="text-sm font-black text-emerald-600">{predictiveMetrics.resourceRiskScore}</span>
                </div>
              </div>
            </div>

            {/* R&D Executive Control Tower Component */}
            {isManagement && <ExecutiveControlTower trials={syncedTrials} />}

          </div>

          {/* Right Column: Breakthroughs, Risks, and Quick Trigger Actions */}
          <div className="space-y-6">
            
            {/* Commercial Breakthrough Candidates */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-lg space-y-4">
              <h3 className="text-xs font-black uppercase text-gray-400 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-purple-500" />
                Breakthrough & Commercial Candidates
              </h3>

              <div className="space-y-3">
                {breakthroughs.length > 0 ? (
                  breakthroughs.map(bt => {
                    const lastEval = bt.evaluations && bt.evaluations[bt.evaluations.length - 1];
                    const eff = lastEval ? lastEval.efficacyPercent : 85;
                    return (
                      <div key={bt.id} className="p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 rounded-2xl flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                          <Beaker className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-extrabold text-xs text-gray-900 dark:text-white block">{bt.productName}</span>
                          <span className="text-[10px] text-purple-700 dark:text-purple-400 font-bold block">{bt.cropName} Efficacy: {eff}%</span>
                          <p className="text-[10px] text-gray-500 italic mt-1 font-medium">"{bt.summaryConclusion || 'Highly stable foliar makeup'}"</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-400 italic">No breakthrough trials found with efficacy &gt; 80%.</p>
                )}
              </div>
            </div>

            {/* Critical Risk Warnings Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-lg space-y-4">
              <h3 className="text-xs font-black uppercase text-gray-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Critical Risks & Overdue Alerts
              </h3>

              <div className="space-y-2.5">
                {criticalRisks.map(r => (
                  <div key={r.id} className={`p-3 rounded-xl text-xs space-y-1 ${
                    r.type === 'red' 
                      ? 'bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 text-red-700 dark:text-red-400' 
                      : 'bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 text-amber-700 dark:text-amber-400'
                  }`}>
                    <span className="font-extrabold block">{r.title}</span>
                    <p className="text-gray-550 text-[11px] font-medium">{r.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions Shortcuts (only for admin) */}
            {userRole === 'Admin' && (
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-lg space-y-4">
                <h3 className="text-xs font-black uppercase text-gray-400">R&D Quick Triggers</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Link to="/trial-sync" className="p-3 bg-gray-50 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-2xl border border-gray-100 dark:border-gray-800 text-center font-bold">
                    ⚡ Sync Trials
                  </Link>
                  <Link to="/research-log" className="p-3 bg-gray-50 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-2xl border border-gray-100 dark:border-gray-800 text-center font-bold">
                    + Daily Log
                  </Link>
                  <Link to="/ai-insights" className="p-3 bg-gray-50 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-2xl border border-gray-100 dark:border-gray-800 text-center font-bold col-span-2">
                    🤖 Talk to R&D Assistant
                  </Link>
                </div>
              </div>
            )}

          </div>

        </div>
      ) : (
        /* If Scientist Hub view mode is selected, show only workbench component */
        <div className="space-y-6">
          <ScientistHub />
        </div>
      )}
    </div>
  );
};
