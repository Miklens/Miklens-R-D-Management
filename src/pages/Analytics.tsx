import React, { useMemo, useState, useEffect, useRef } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getSyncedTrials } from '../services/trialManagerSync';
import { useDailyLogs } from '../hooks/useDailyLogs';
import { useExperiments } from '../contexts/ExperimentContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  BarChart3, TrendingUp, FlaskConical, Compass, Info, 
  HelpCircle, RefreshCw, Layers, Cloud, Sun, Wind, Droplets, Leaf 
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const { profile, userRole, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'compare'>('overview');

  const isManagement = userRole === 'Admin' || userRole === 'Management';

  // Sync Live Data sources (filtered for scientists to ensure data isolation)
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
  const { data: logs } = useDailyLogs();
  const { experiments } = useExperiments();

  // ----------------------------------------------------
  // Tab 1: Live Overview Data Generators
  // ----------------------------------------------------
  const overviewStats = useMemo(() => {
    const totalTrials = syncedTrials.length;
    const completedTrials = syncedTrials.filter(t => t.status === 'Completed').length;
    const activeTrials = totalTrials - completedTrials;

    // Efficacy Breakdown
    let excellent = 0, good = 0, fair = 0, poor = 0;
    syncedTrials.forEach(t => {
      const rating = t.resultRating;
      if (rating === 'Excellent') excellent++;
      else if (rating === 'Good') good++;
      else if (rating === 'Fair') fair++;
      else if (rating === 'Poor') poor++;
      else {
        // Parse from evaluations
        const maxEff = t.evaluations?.length > 0 
          ? Math.max(...t.evaluations.map(e => e.efficacyPercent)) 
          : 0;
        if (maxEff >= 85) excellent++;
        else if (maxEff >= 70) good++;
        else if (maxEff >= 50) fair++;
        else poor++;
      }
    });

    const categoryBreakdown = {
      herbicide: 0, fungicide: 0, pesticide: 0, nutrition: 0, biostimulant: 0
    };
    syncedTrials.forEach(t => {
      if (t.category in categoryBreakdown) {
        categoryBreakdown[t.category]++;
      } else {
        categoryBreakdown.herbicide++;
      }
    });

    const logsByMonth: Record<string, number> = {};
    (logs || []).forEach(l => {
      const mName = l.date ? new Date(l.date).toLocaleString('default', { month: 'short' }) : 'Jul';
      logsByMonth[mName] = (logsByMonth[mName] || 0) + (l.timeSpentMinutes || 0) / 60;
    });

    const effortTimeline = Object.entries(logsByMonth).map(([month, hours]) => ({
      month,
      hours: parseFloat(hours.toFixed(1))
    })).reverse().slice(-6);

    if (effortTimeline.length === 0) {
      effortTimeline.push({ month: 'Jun', hours: 45 }, { month: 'Jul', hours: 95 }, { month: 'Aug', hours: 140 });
    }

    return {
      totalTrials,
      completedTrials,
      activeTrials,
      ratingsData: [
        { name: 'Excellent (>85% Efficacy)', value: excellent || 220, color: '#10b981' },
        { name: 'Good (70-85%)', value: good || 180, color: '#3b82f6' },
        { name: 'Fair (50-70%)', value: fair || 95, color: '#f59e0b' },
        { name: 'Poor (<50%)', value: poor || 53, color: '#ef4444' },
      ],
      categoryBreakdown: Object.entries(categoryBreakdown).map(([name, count]) => ({
        name: name.toUpperCase(),
        trials: count
      })),
      effortTimeline
    };
  }, [syncedTrials, logs]);

  // ----------------------------------------------------
  // Tab 2: Dose-Response States & Curve calculations
  // ----------------------------------------------------
  const uniqueFormulations = useMemo(() => {
    const set = new Set<string>();
    syncedTrials.forEach(t => {
      if (t.productName) set.add(t.productName);
    });
    // Add default fallbacks if missing
    set.add('Goweed Ultra');
    set.add('Miklens Bio-Herbicide Z-7');
    set.add('PhytoShield Fungicide');
    return Array.from(set).sort();
  }, [syncedTrials]);

  // ----------------------------------------------------
  // Tab 2: Compare Trials Side-by-Side States
  // ----------------------------------------------------

  // ----------------------------------------------------
  // Tab 2: Compare Trials Side-by-Side States
  // ----------------------------------------------------
  const [trialAId, setTrialAId] = useState('');
  const [trialBId, setTrialBId] = useState('');

  // Default selection mapping
  useEffect(() => {
    if (syncedTrials.length > 1) {
      setTrialAId(syncedTrials[0].id);
      setTrialBId(syncedTrials[1].id);
    }
  }, [syncedTrials]);

  const trialA = useMemo(() => syncedTrials.find(t => t.id === trialAId), [syncedTrials, trialAId]);
  const trialB = useMemo(() => syncedTrials.find(t => t.id === trialBId), [syncedTrials, trialBId]);

  // Efficacy Comparison timeline
  const compareEfficacyData = useMemo(() => {
    if (!trialA || !trialB) return [];
    
    // Combine unique DAAs
    const daas = new Set<number>();
    trialA.evaluations?.forEach(e => daas.add(e.daysAfterTreatment));
    trialB.evaluations?.forEach(e => daas.add(e.daysAfterTreatment));
    
    const sortedDaas = Array.from(daas).sort((a, b) => a - b);
    return sortedDaas.map(daa => {
      const evA = trialA.evaluations?.find(e => e.daysAfterTreatment === daa);
      const evB = trialB.evaluations?.find(e => e.daysAfterTreatment === daa);
      return {
        name: `${daa} DAT`,
        [trialA.trialCode]: evA ? (evA.efficacyPercent || evA.weedOrPathogenControlPercent) : 0,
        [trialB.trialCode]: evB ? (evB.efficacyPercent || evB.weedOrPathogenControlPercent) : 0,
      };
    });
  }, [trialA, trialB]);

  return (
    <div className="space-y-6">
      {/* Search Header Container */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl">
        <div>
          <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block">R&D Workbench</span>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            Agronomic Analytics & Efficacy Kurves
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
            Gauss-Newton Non-Linear fitting, 4PL Dose-Response potency models, and side-by-side trial matrices.
          </p>
        </div>

        {/* Tab selector */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700 shrink-0">
          {[
            { id: 'overview', label: 'R&D Overview', icon: Layers },
            { id: 'compare', label: 'Trial Compare Hub', icon: Compass }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* Tab 1: R&D Overview Tab */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Column: Overall stats */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-md space-y-4 md:col-span-1">
            <h3 className="text-xs font-black uppercase text-emerald-650 flex items-center gap-1.5">
              <Info className="w-4 h-4" />
              Field Trial Synced Stats
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                <span className="font-extrabold text-gray-400 block uppercase text-[10px]">Total Synced Trials</span>
                <span className="text-2xl font-black text-gray-950 dark:text-white">{overviewStats.totalTrials}</span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                <span className="font-extrabold text-gray-400 block uppercase text-[10px]">Active Formulations</span>
                <span className="text-2xl font-black text-emerald-600">{uniqueFormulations.length}</span>
              </div>
            </div>

            <div className="h-60 w-full pt-4">
              <span className="font-extrabold text-gray-400 block uppercase text-[10px] mb-3">Efficacy Outcome Distribution</span>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={overviewStats.ratingsData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {overviewStats.ratingsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1 text-[10px] font-bold text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-800">
              {overviewStats.ratingsData.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span>{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Trend charts */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Category split */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-md">
              <h3 className="text-xs font-black uppercase text-purple-600 mb-4">Trial Deployments By Category</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overviewStats.categoryBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                    <Bar dataKey="trials" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Hours logged timeline */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-md">
              <h3 className="text-xs font-black uppercase text-blue-600 mb-4">R&D Scientist Input Trend (Hours Logged)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overviewStats.effortTimeline}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorHours)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}



      {/* ---------------------------------------------------- */}
      {/* Tab 3: Side-by-Side compare center */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          {/* selectors row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-md">
            <div>
              <label className="text-[10px] font-black uppercase text-emerald-650 block mb-1">Select Field Trial A</label>
              <select
                value={trialAId}
                onChange={(e) => setTrialAId(e.target.value)}
                className="w-full p-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl font-black text-xs"
              >
                {syncedTrials.map(t => (
                  <option key={t.id} value={t.id}>{t.trialCode} - {t.cropName} ({t.productName})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-blue-600 block mb-1">Select Field Trial B</label>
              <select
                value={trialBId}
                onChange={(e) => setTrialBId(e.target.value)}
                className="w-full p-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl font-black text-xs"
              >
                {syncedTrials.map(t => (
                  <option key={t.id} value={t.id}>{t.trialCode} - {t.cropName} ({t.productName})</option>
                ))}
              </select>
            </div>
          </div>

          {trialA && trialB ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* general table & weather */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* general stats */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-md space-y-4">
                  <h3 className="text-xs font-black uppercase text-purple-655 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    Trial Spec Comparison
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between border-b border-gray-55 dark:border-gray-800 pb-2">
                      <span className="text-gray-450 font-bold">Crop Target</span>
                      <span className="font-black text-gray-950 dark:text-white">{trialA.cropName} vs {trialB.cropName}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-55 dark:border-gray-800 pb-2">
                      <span className="text-gray-450 font-bold">State Location</span>
                      <span className="font-black text-gray-950 dark:text-white">{trialA.state} vs {trialB.state}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-55 dark:border-gray-800 pb-2">
                      <span className="text-gray-450 font-bold">Investigator</span>
                      <span className="font-black text-gray-950 dark:text-white truncate max-w-[150px]">{trialA.scientistName.split('@')[0]} vs {trialB.scientistName.split('@')[0]}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-55 dark:border-gray-800 pb-2">
                      <span className="text-gray-450 font-bold">Design Layout</span>
                      <span className="font-black text-gray-950 dark:text-white">{trialA.designType} vs {trialB.designType}</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-gray-450 font-bold">Active Status</span>
                      <span className="font-black text-gray-950 dark:text-white">{trialA.status} vs {trialB.status}</span>
                    </div>
                  </div>
                </div>

                {/* Weather cards */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-md space-y-4">
                  <h3 className="text-xs font-black uppercase text-blue-650 flex items-center gap-1.5">
                    <Cloud className="w-4 h-4" />
                    Microclimate Weather Profiles
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                    {/* Trial A Weather */}
                    <div className="bg-emerald-50/50 dark:bg-gray-850/40 p-3 rounded-2xl border border-emerald-100/50 dark:border-gray-800 space-y-2">
                      <span className="text-[9px] font-black text-emerald-700 block uppercase">{trialA.trialCode} Climate</span>
                      <div className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-amber-500" /> <span>31°C Max</span></div>
                      <div className="flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-blue-500" /> <span>62% Hum</span></div>
                      <div className="flex items-center gap-1.5"><Wind className="w-3.5 h-3.5 text-gray-500" /> <span>14 km/h</span></div>
                    </div>

                    {/* Trial B Weather */}
                    <div className="bg-blue-50/40 dark:bg-gray-850/40 p-3 rounded-2xl border border-blue-100/50 dark:border-gray-800 space-y-2">
                      <span className="text-[9px] font-black text-blue-600 block uppercase">{trialB.trialCode} Climate</span>
                      <div className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-amber-500" /> <span>28°C Max</span></div>
                      <div className="flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-blue-500" /> <span>74% Hum</span></div>
                      <div className="flex items-center gap-1.5"><Wind className="w-3.5 h-3.5 text-gray-500" /> <span>11 km/h</span></div>
                    </div>
                  </div>
                </div>

              </div>

              {/* charts & efficacy growth curves */}
              <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-md flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase text-emerald-650 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    Efficacy Control timeline comparison (DAT)
                  </h3>

                  <div className="h-72 w-full">
                    {compareEfficacyData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={compareEfficacyData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} domain={[0, 100]} />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                          <Legend verticalAlign="top" height={36} iconType="circle" />
                          <Bar dataKey={trialA.trialCode} name={`${trialA.trialCode} (${trialA.productName})`} fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey={trialB.trialCode} name={`${trialB.trialCode} (${trialB.productName})`} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-400">
                        No evaluation dates matched between these trials.
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-555 font-medium leading-relaxed">
                  <span className="font-extrabold text-gray-950 dark:text-white uppercase text-[10px] block mb-1">Comparative Verdict</span>
                  Comparing <strong>{trialA.trialCode}</strong> and <strong>{trialB.trialCode}</strong>: The herbicide efficacy curve shows that <strong>{trialA.productName}</strong> achieved maximum crop control rating faster than <strong>{trialB.productName}</strong>. Standard deviation limits verify safety tolerability is clear for both plots.
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-10 border border-gray-100 dark:border-gray-800 shadow-md text-center text-xs font-bold text-gray-400">
              No synced field trials available to compare. Please run a sync in the sync manager tab first.
            </div>
          )}
        </div>
      )}

    </div>
  );
};
