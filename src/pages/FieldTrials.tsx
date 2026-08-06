import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, RefreshCw, Database, CheckCircle2, Key, AlertCircle,
  Lock, Mail, UserCheck, Leaf, Shield, Bug, Beaker, Sprout, Users,
  ChevronDown, ChevronUp, X, Activity, TrendingUp, BarChart3, Calendar, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FieldTrialCard } from '../components/FieldTrialCard';
import {
  getSyncedTrials,
  saveSyncedTrialsList,
  fetchTrialsFromFirebaseCloud,
  getSavedFirebaseConfig,
  saveFirebaseConfig,
  FirebaseConnectionConfig,
  fetchProjectsFromFirebaseCloud,
  saveSyncedProjectsList,
  fetchFormulationsFromFirebaseCloud,
  saveSyncedFormulationsList
} from '../services/trialManagerSync';
import { ExternalFieldTrial, TrialCategory } from '../types/trialIntegrationTypes';
import { useAuth } from '../contexts/AuthContext';

// Category Config
const CATEGORY_CONFIG: Record<TrialCategory, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgLight: string;
  bgDark: string;
  borderColor: string;
}> = {
  herbicide: { label: 'Herbicide', icon: Leaf, color: '#059669', bgLight: 'bg-emerald-50', bgDark: 'dark:bg-emerald-950/30', borderColor: 'border-emerald-200 dark:border-emerald-900/50' },
  fungicide: { label: 'Fungicide', icon: Shield, color: '#4f46e5', bgLight: 'bg-indigo-50', bgDark: 'dark:bg-indigo-950/30', borderColor: 'border-indigo-200 dark:border-indigo-900/50' },
  pesticide: { label: 'Pesticide', icon: Bug, color: '#dc2626', bgLight: 'bg-red-50', bgDark: 'dark:bg-red-950/30', borderColor: 'border-red-200 dark:border-red-900/50' },
  nutrition: { label: 'Nutrition', icon: Beaker, color: '#d97706', bgLight: 'bg-amber-50', bgDark: 'dark:bg-amber-950/30', borderColor: 'border-amber-200 dark:border-amber-900/50' },
  biostimulant: { label: 'Biostimulant', icon: Sprout, color: '#0d9488', bgLight: 'bg-teal-50', bgDark: 'dark:bg-teal-950/30', borderColor: 'border-teal-200 dark:border-teal-900/50' },
};

const ALL_CATEGORIES: TrialCategory[] = ['herbicide', 'fungicide', 'pesticide', 'nutrition', 'biostimulant'];

// Helper to format Date Group Header (e.g. "Thursday, Jul 30, 2026", "Today", "Yesterday")
const getTrialDateGroupKey = (trialDateStr?: string): string => {
  if (!trialDateStr) return 'No Date Set';
  const d = new Date(trialDateStr);
  if (isNaN(d.getTime())) return 'No Date Set';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const trialDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (trialDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (trialDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    return trialDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
  }
};

export const FieldTrials: React.FC = () => {
  const { profile, userRole, currentUser } = useAuth();
  const [syncedTrials, setSyncedTrials] = useState<ExternalFieldTrial[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Category Tab Filter
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | TrialCategory>('all');

  // Sub-Tab Filter (All | Standard | Project-Grouped | Control | Finalized)
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'standard' | 'project' | 'control' | 'finalized'>('all');

  // Scientist Filter
  const [selectedScientistFilter, setSelectedScientistFilter] = useState<string>('all-scientists');

  // Firebase Config Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [projectIdInput, setProjectIdInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [configError, setConfigError] = useState<string | null>(null);

  const isAdminOrManagement = userRole === 'Admin' || userRole === 'Management';

  useEffect(() => {
    const loaded = getSyncedTrials();
    setSyncedTrials(loaded);

    const savedConfig = getSavedFirebaseConfig();
    if (savedConfig) {
      setApiKeyInput(savedConfig.apiKey);
      setProjectIdInput(savedConfig.projectId);
      setEmailInput(savedConfig.email || '');
      setPasswordInput(savedConfig.password || '');

      fetchTrialsFromFirebaseCloud(savedConfig).then(async (cloudTrials) => {
        if (cloudTrials && cloudTrials.length > 0) {
          setSyncedTrials(cloudTrials);
          saveSyncedTrialsList(cloudTrials);
          try {
            const cloudProjects = await fetchProjectsFromFirebaseCloud(savedConfig);
            if (cloudProjects && cloudProjects.length > 0) {
              saveSyncedProjectsList(cloudProjects);
            }
            const cloudFormulations = await fetchFormulationsFromFirebaseCloud(savedConfig);
            if (cloudFormulations && cloudFormulations.length > 0) {
              saveSyncedFormulationsList(cloudFormulations);
            }
            setSyncNotice(`⚡ Live Cloud Sync: ${cloudTrials.length} trials, ${cloudProjects.length || 0} projects, and ${cloudFormulations.length || 0} formulations loaded.`);
          } catch (projErr) {
            setSyncNotice(`⚡ Live Cloud Sync: ${cloudTrials.length} trials loaded across all categories.`);
          }
        }
      }).catch(err => {
        console.warn('Auto cloud sync notice:', err);
      });
    }
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncNotice(null);
    const savedConfig = getSavedFirebaseConfig();
    try {
      if (savedConfig?.apiKey && savedConfig?.projectId) {
        try {
          const cloudTrials = await fetchTrialsFromFirebaseCloud(savedConfig);
          const cloudProjects = await fetchProjectsFromFirebaseCloud(savedConfig);
          const cloudFormulations = await fetchFormulationsFromFirebaseCloud(savedConfig);
          if (cloudTrials && cloudTrials.length > 0) {
            setSyncedTrials(cloudTrials);
            saveSyncedTrialsList(cloudTrials);
            if (cloudProjects && cloudProjects.length > 0) {
              saveSyncedProjectsList(cloudProjects);
            }
            if (cloudFormulations && cloudFormulations.length > 0) {
              saveSyncedFormulationsList(cloudFormulations);
            }
            setSyncNotice(`✅ Cloud sync: ${cloudTrials.length} trials, ${cloudProjects.length || 0} projects, and ${cloudFormulations.length || 0} formulations loaded!`);
          } else {
            setSyncNotice(`⚡ Connected to "${savedConfig.projectId}". No cloud trial records found.`);
          }
        } catch (err: any) {
          setSyncNotice(`⚠️ Cloud sync failed: ${err?.message || 'Check credentials'}`);
        }
      } else {
        const current = getSyncedTrials();
        setSyncedTrials(current);
        setSyncNotice(`ℹ️ Click 'Connect Credentials' to enter your Trial Manager login.`);
      }
    } catch (err: any) {
      setSyncNotice(`Sync completed: ${err?.message || 'Running in cached view.'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim() || !projectIdInput.trim()) {
      setConfigError('Please enter both API Key and Project ID.');
      return;
    }
    const newConfig: FirebaseConnectionConfig = {
      apiKey: apiKeyInput.trim(),
      projectId: projectIdInput.trim(),
      email: emailInput.trim(),
      password: passwordInput.trim(),
    };
    saveFirebaseConfig(newConfig);
    setShowConfigModal(false);
    setConfigError(null);
    handleManualSync();
  };

  const currentUserEmail = profile?.email?.toLowerCase() || '';
  const currentUserUid = currentUser?.uid || profile?.id || '';

  // ─── Filtering Logic ───

  const matchesUser = (trial: ExternalFieldTrial): boolean => {
    if (!isAdminOrManagement) {
      if (!currentUserEmail && !currentUserUid) return true;
      const userHandle = currentUserEmail.split('@')[0].toLowerCase();
      const trialEmail = (trial.creatorEmail || '').toLowerCase();
      const trialScientist = (trial.scientistName || '').toLowerCase();
      const trialUid = (trial.creatorUid || '').toLowerCase();
      return (
        trialEmail.includes(currentUserEmail) ||
        trialEmail.includes(userHandle) ||
        trialScientist.includes(userHandle) ||
        (!!currentUserUid && trialUid === currentUserUid.toLowerCase())
      );
    }
    if (selectedScientistFilter === 'all-scientists') return true;
    if (selectedScientistFilter === 'my-trials') {
      if (!currentUserEmail && !currentUserUid) return true;
      const userHandle = currentUserEmail.split('@')[0].toLowerCase();
      const trialEmail = (trial.creatorEmail || '').toLowerCase();
      const trialScientist = (trial.scientistName || '').toLowerCase();
      const trialUid = (trial.creatorUid || '').toLowerCase();
      return (
        trialEmail.includes(currentUserEmail) ||
        trialEmail.includes(userHandle) ||
        trialScientist.includes(userHandle) ||
        (!!currentUserUid && trialUid === currentUserUid.toLowerCase())
      );
    }
    return trial.scientistName === selectedScientistFilter;
  };

  const matchesSearch = (trial: ExternalFieldTrial): boolean => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      trial.title.toLowerCase().includes(q) ||
      trial.cropName.toLowerCase().includes(q) ||
      trial.productName.toLowerCase().includes(q) ||
      trial.location.toLowerCase().includes(q) ||
      trial.scientistName.toLowerCase().includes(q) ||
      trial.targetWeedOrPathogen.toLowerCase().includes(q) ||
      trial.trialCode.toLowerCase().includes(q)
    );
  };

  const matchesSubTab = (trial: ExternalFieldTrial): boolean => {
    if (activeSubTab === 'standard') return !trial.projectId;
    if (activeSubTab === 'project') return !!trial.projectId;
    if (activeSubTab === 'control') return trial.isControl === true;
    if (activeSubTab === 'finalized') return trial.isCompleted === true || trial.status === 'Completed';
    return true;
  };

  // Base filtered list
  const baseFiltered = useMemo(() => {
    return syncedTrials.filter(t => matchesSearch(t) && matchesUser(t) && matchesSubTab(t));
  }, [syncedTrials, searchTerm, selectedScientistFilter, activeSubTab, currentUserEmail, currentUserUid, isAdminOrManagement]);

  // Category map counts for top pills
  const categoryCounts = useMemo(() => {
    const map: Record<TrialCategory, number> = { herbicide: 0, fungicide: 0, pesticide: 0, nutrition: 0, biostimulant: 0 };
    syncedTrials.forEach(t => {
      if (matchesSearch(t) && matchesUser(t)) {
        const cat = t.category || 'herbicide';
        if (map[cat] !== undefined) map[cat]++;
      }
    });
    return map;
  }, [syncedTrials, searchTerm, selectedScientistFilter, currentUserEmail, currentUserUid, isAdminOrManagement]);

  // Active Category List
  const activeTabTrials = useMemo(() => {
    if (activeCategoryTab === 'all') return baseFiltered;
    return baseFiltered.filter(t => t.category === activeCategoryTab);
  }, [baseFiltered, activeCategoryTab]);

  // Sort & Group Trials by Date (Descending - newest date first)
  const groupedDateSections = useMemo(() => {
    const sorted = [...activeTabTrials].sort((a, b) => {
      const dateA = new Date(a.rawDateStr || a.startDate || 0).getTime();
      const dateB = new Date(b.rawDateStr || b.startDate || 0).getTime();
      return dateB - dateA;
    });

    const groups: { key: string; dateSortKey: number; trials: ExternalFieldTrial[] }[] = [];
    const groupMap: Record<string, typeof groups[0]> = {};

    sorted.forEach(t => {
      const key = getTrialDateGroupKey(t.rawDateStr || t.startDate);
      const dVal = new Date(t.rawDateStr || t.startDate || 0).getTime();

      if (!groupMap[key]) {
        const newGroup = { key, dateSortKey: dVal, trials: [] };
        groupMap[key] = newGroup;
        groups.push(newGroup);
      }
      groupMap[key].trials.push(t);
    });

    return groups;
  }, [activeTabTrials]);

  // Sub-Tab Counts
  const subTabCounts = useMemo(() => {
    const currentCategoryList = activeCategoryTab === 'all'
      ? syncedTrials.filter(t => matchesSearch(t) && matchesUser(t))
      : syncedTrials.filter(t => matchesSearch(t) && matchesUser(t) && t.category === activeCategoryTab);

    return {
      all: currentCategoryList.length,
      standard: currentCategoryList.filter(t => !t.projectId).length,
      project: currentCategoryList.filter(t => !!t.projectId).length,
      control: currentCategoryList.filter(t => t.isControl === true).length,
      finalized: currentCategoryList.filter(t => t.isCompleted === true || t.status === 'Completed').length,
    };
  }, [syncedTrials, activeCategoryTab, searchTerm, selectedScientistFilter, currentUserEmail, currentUserUid, isAdminOrManagement]);

  const uniqueScientists = useMemo(
    () => Array.from(new Set(syncedTrials.map(t => t.scientistName).filter(Boolean))),
    [syncedTrials]
  );

  return (
    <div className="space-y-6">
      {/* ── Top Header Banner ── */}
      <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Miklens Trial Manager Live View
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-purple-500" /> Miklens Herbicide Trial Manager 7
            </span>
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">
            Trials & Field Operations
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl font-medium">
            Chronological date-wise trial layout mirroring Trial Manager. Filter by category, project status, or scientist.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">

          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl text-xs font-bold border border-gray-200 dark:border-gray-700 transition-all active:scale-95"
          >
            <Key className="w-4 h-4 text-purple-500" />
            {getSavedFirebaseConfig()?.email ? `🔐 ${getSavedFirebaseConfig()?.email?.split('@')[0]}` : '🔑 Connect Credentials'}
          </button>

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-black shadow-md transition-all disabled:opacity-50 active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Live Data'}
          </button>
        </div>
      </div>

      {/* Sync Alert */}
      <AnimatePresence>
        {syncNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between gap-3 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{syncNotice}</span>
            </div>
            <button onClick={() => setSyncNotice(null)} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Category Pill Tabs Bar ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveCategoryTab('all')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all border ${
            activeCategoryTab === 'all'
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white shadow-md'
              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-50'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          All Categories
          <span className="ml-1 px-1.5 py-0.5 rounded-lg text-[10px] font-black bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {syncedTrials.length}
          </span>
        </button>

        {ALL_CATEGORIES.map(cat => {
          const cfg = CATEGORY_CONFIG[cat];
          const CatIcon = cfg.icon;
          const count = categoryCounts[cat] || 0;
          const isActive = activeCategoryTab === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategoryTab(cat)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all border ${
                isActive
                  ? 'text-white border-transparent shadow-md'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-50'
              }`}
              style={isActive ? { background: `linear-gradient(135deg, ${cfg.color}dd, ${cfg.color})`, borderColor: cfg.color } : {}}
            >
              <CatIcon className="w-3.5 h-3.5" />
              {cfg.label}
              <span
                className="ml-1 px-1.5 py-0.5 rounded-lg text-[10px] font-black"
                style={isActive ? { background: 'rgba(255,255,255,0.25)', color: 'white' } : { background: '#f3f4f6', color: '#6b7280' }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Sub-Tab Filters (All | Standard | Project-Grouped | Control | Finalized) ── */}
      <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-md space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Sub-Tab Filter Pills matching Screenshot 3 */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { key: 'all', label: 'All', count: subTabCounts.all },
              { key: 'standard', label: 'Standard', count: subTabCounts.standard },
              { key: 'project', label: 'Project-Grouped', count: subTabCounts.project },
              { key: 'control', label: 'Control', count: subTabCounts.control },
              { key: 'finalized', label: 'Finalized', count: subTabCounts.finalized },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveSubTab(tab.key as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeSubTab === tab.key
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  activeSubTab === tab.key ? 'bg-emerald-800 text-emerald-100' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Scientist & Search Filters */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {uniqueScientists.length > 0 && (
              <select
                value={selectedScientistFilter}
                onChange={e => setSelectedScientistFilter(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none text-gray-800 dark:text-gray-200 cursor-pointer"
              >
                <option value="all-scientists">All Scientists ({uniqueScientists.length})</option>
                {!isAdminOrManagement && <option value="my-trials">👤 My Trials</option>}
                {uniqueScientists.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            )}

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search trials..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium outline-none"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Date-Wise Grouped Trial Grid (Matching Screenshot 3) ── */}
      <div className="space-y-6">
        {groupedDateSections.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center shadow-lg border border-gray-100 dark:border-gray-800 space-y-3">
            <Database className="w-12 h-12 text-purple-400 mx-auto" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">No Trials Found</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              No field trials match the selected category or sub-tab filter. Try switching tabs.
            </p>
          </div>
        ) : (
          groupedDateSections.map(section => (
            <div key={section.key} className="space-y-3">
              {/* Date Header Banner matching Screenshot 3 */}
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-black text-gray-900 dark:text-white">
                  {section.key}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {section.trials.length} trials
                </span>
              </div>

              {/* 4-Column Responsive Grid matching Trial Manager Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {section.trials.map(trial => (
                  <FieldTrialCard key={trial.id} trial={trial} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Firebase Config Modal ── */}
      <AnimatePresence>
        {showConfigModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowConfigModal(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="max-w-lg w-full bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-base font-black text-gray-900 dark:text-white">Connect Firebase Credentials</h3>
                </div>
                <button onClick={() => setShowConfigModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveFirebaseConfig} className="space-y-4">
                {configError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{configError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">Project ID</label>
                    <input
                      type="text"
                      value={projectIdInput}
                      onChange={e => setProjectIdInput(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">API Key</label>
                    <input
                      type="text"
                      value={apiKeyInput}
                      onChange={e => setApiKeyInput(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium outline-none font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50 space-y-3">
                  <span className="text-[11px] font-black text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Trial Manager Account Login
                  </span>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">Email</label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">Password</label>
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={e => setPasswordInput(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-medium outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setShowConfigModal(false)} className="px-4 py-2 text-xs font-bold text-gray-500">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-purple-600 text-white rounded-xl text-xs font-black">Save & Connect</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

      </AnimatePresence>
    </div>
  );
};