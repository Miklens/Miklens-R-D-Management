import React, { useState, useEffect } from 'react';
import { MapPin, Search, RefreshCw, Database, CheckCircle2, ShieldCheck, Key, Settings as SettingsIcon, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FieldTrialCard } from '../components/FieldTrialCard';
import {
  getSyncedTrials,
  readTrialsFromIndexedDB,
  saveSyncedTrialsList,
  fetchTrialsFromFirebaseCloud,
  getSavedFirebaseConfig,
  saveFirebaseConfig,
  FirebaseConnectionConfig
} from '../services/trialManagerSync';
import { ExternalFieldTrial } from '../types/trialIntegrationTypes';

export const FieldTrials: React.FC = () => {
  const [syncedTrials, setSyncedTrials] = useState<ExternalFieldTrial[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'herbicide' | 'fungicide' | 'pesticide'>('all');

  // Firebase Config Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [projectIdInput, setProjectIdInput] = useState('');
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Initial load from local sync storage
    const loaded = getSyncedTrials();
    setSyncedTrials(loaded);

    // Load saved Firebase config if available
    const savedConfig = getSavedFirebaseConfig();
    if (savedConfig) {
      setApiKeyInput(savedConfig.apiKey);
      setProjectIdInput(savedConfig.projectId);
      // Auto-fetch from Cloud Firebase on mount if configured
      fetchTrialsFromFirebaseCloud(savedConfig).then(cloudTrials => {
        if (cloudTrials && cloudTrials.length > 0) {
          setSyncedTrials(cloudTrials);
          saveSyncedTrialsList(cloudTrials);
          setSyncNotice(`⚡ Cross-device live sync: Fetched ${cloudTrials.length} real trials from Cloud Firebase!`);
        }
      }).catch(err => {
        console.warn('Auto cloud sync notice:', err);
      });
    }

    // 2. Auto-attempt local IndexedDB scan if on same device
    readTrialsFromIndexedDB().then(idbTrials => {
      if (idbTrials && idbTrials.length > 0) {
        setSyncedTrials(idbTrials);
        saveSyncedTrialsList(idbTrials);
      }
    });
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncNotice(null);

    const savedConfig = getSavedFirebaseConfig();

    try {
      // Priority A: Try Cloud Firebase if config is saved
      if (savedConfig && savedConfig.apiKey && savedConfig.projectId) {
        try {
          const cloudTrials = await fetchTrialsFromFirebaseCloud(savedConfig);
          if (cloudTrials && cloudTrials.length > 0) {
            setSyncedTrials(cloudTrials);
            saveSyncedTrialsList(cloudTrials);
            setSyncNotice(`✅ Cross-device sync success: Pulled ${cloudTrials.length} live trials from Firebase Cloud!`);
            setIsSyncing(false);
            return;
          }
        } catch (err: any) {
          console.warn('Cloud fetch failed, falling back to local DB scan:', err);
        }
      }

      // Priority B: Local IndexedDB scan
      const idbTrials = await readTrialsFromIndexedDB();
      if (idbTrials && idbTrials.length > 0) {
        setSyncedTrials(idbTrials);
        saveSyncedTrialsList(idbTrials);
        setSyncNotice(`✅ Local device sync: Pulled ${idbTrials.length} real trials from browser database!`);
      } else {
        const current = getSyncedTrials();
        setSyncedTrials(current);
        if (!savedConfig) {
          setSyncNotice(`ℹ️ Running on demo/cached data. Click 'Configure Firebase Key' to sync across different devices.`);
        } else {
          setSyncNotice(`⚡ Connected to cloud project "${savedConfig.projectId}". 0 unsynced trials found.`);
        }
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
    };

    saveFirebaseConfig(newConfig);
    setShowConfigModal(false);
    setConfigError(null);
    handleManualSync();
  };

  const filteredSynced = syncedTrials.filter(
    t => {
      const matchSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.cropName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.location.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (activeTab === 'herbicide') return t.productName.toLowerCase().includes('weed') || t.productName.toLowerCase().includes('herbicide') || t.title.toLowerCase().includes('weed');
      if (activeTab === 'fungicide') return t.productName.toLowerCase().includes('shield') || t.productName.toLowerCase().includes('fungi');
      return true;
    }
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white shadow-2xl border border-purple-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-emerald-950 font-mono shadow-sm">
              Cross-Device Cloud Sync
            </span>
            <span className="text-xs text-purple-200 font-semibold flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-purple-400" /> Miklens Herbicide Trial Manager 7
            </span>
          </div>
          <h2 className="text-xl font-black text-white">
            Field Trial Manager & Google Drive Cross-Device Sync
          </h2>
          <p className="text-xs text-purple-200/80 leading-relaxed max-w-2xl">
            Real-time cloud & device synchronization for field trials, plot treatments, efficacy ratings & Google Drive photos. Connect different laptops & mobile phones instantly.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-900/80 hover:bg-purple-800 text-purple-200 rounded-2xl text-xs font-bold border border-purple-700/60 transition-all"
          >
            <Key className="w-4 h-4 text-purple-300" />
            {getSavedFirebaseConfig() ? '⚙️ Firebase Connected' : '🔑 Connect Firebase (Cross-Device)'}
          </button>

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-emerald-950 rounded-2xl text-xs font-black shadow-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing Cloud...' : 'Sync Live Data'}
          </button>
        </div>
      </div>

      {/* Sync Status Alert */}
      {syncNotice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between gap-3 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{syncNotice}</span>
          </div>
          <button onClick={() => setSyncNotice(null)} className="text-emerald-500 hover:text-emerald-700 text-xs font-black">
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'herbicide', 'fungicide'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-2xl text-xs font-black capitalize transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:bg-gray-50'
              }`}
            >
              {tab === 'all' ? `All Trials (${syncedTrials.length})` : `${tab} Trials`}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search synced trials by crop, product, or plot location..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-500/30"
          />
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-6">
        {filteredSynced.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center shadow-lg border border-gray-100 dark:border-gray-800 space-y-3">
            <Database className="w-12 h-12 text-purple-400 mx-auto" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">No Trials Matched</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Click 'Sync Live Data' or configure Firebase Cloud credentials to pull real-time trials across devices.
            </p>
          </div>
        ) : (
          filteredSynced.map(trial => (
            <FieldTrialCard key={trial.id} trial={trial} />
          ))
        )}
      </div>

      {/* Firebase Key Connection Modal */}
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
                  <h3 className="text-base font-black text-gray-900 dark:text-white">Connect Firebase Project (Cross-Device)</h3>
                </div>
                <button onClick={() => setShowConfigModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xs">✕</button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Enter the Firebase Project details used by <strong>Miklens Trial Manager 7</strong>. This enables live cross-device streaming between scientist mobile phones and management laptops.
              </p>

              <form onSubmit={handleSaveFirebaseConfig} className="space-y-4">
                {configError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{configError}</span>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">Firebase Project ID</label>
                  <input
                    type="text"
                    placeholder="e.g. miklens-herbicide-trial-manager-7"
                    value={projectIdInput}
                    onChange={e => setProjectIdInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">Firebase Web API Key</label>
                  <input
                    type="text"
                    placeholder="e.g. AIzaSyD..."
                    value={apiKeyInput}
                    onChange={e => setApiKeyInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-500/30 font-mono"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-black shadow-lg hover:from-purple-700 hover:to-indigo-700"
                  >
                    Save & Connect Cloud Sync
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};