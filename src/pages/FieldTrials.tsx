import React, { useState, useEffect } from 'react';
import { MapPin, Search, RefreshCw, Database, CheckCircle2, ShieldCheck, Key, AlertCircle, Lock, Mail, UserCheck, Filter } from 'lucide-react';
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
import { useAuth } from '../contexts/AuthContext';

export const FieldTrials: React.FC = () => {
  const { profile, userRole, currentUser } = useAuth();
  const [syncedTrials, setSyncedTrials] = useState<ExternalFieldTrial[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'herbicide' | 'fungicide' | 'pesticide'>('all');
  const [selectedScientistFilter, setSelectedScientistFilter] = useState<string>('my-trials');

  // Firebase Config Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [projectIdInput, setProjectIdInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [configError, setConfigError] = useState<string | null>(null);

  const isAdminOrManagement = userRole === 'Admin' || userRole === 'Management';

  useEffect(() => {
    // 1. Initial load from local sync storage
    const loaded = getSyncedTrials();
    setSyncedTrials(loaded);

    // Load saved Firebase config if available
    const savedConfig = getSavedFirebaseConfig();
    if (savedConfig) {
      setApiKeyInput(savedConfig.apiKey);
      setProjectIdInput(savedConfig.projectId);
      setEmailInput(savedConfig.email || '');
      setPasswordInput(savedConfig.password || '');

      // Auto-fetch from Cloud Firebase on mount if configured
      fetchTrialsFromFirebaseCloud(savedConfig).then(cloudTrials => {
        if (cloudTrials && cloudTrials.length > 0) {
          setSyncedTrials(cloudTrials);
          saveSyncedTrialsList(cloudTrials);
          setSyncNotice(`⚡ Live sync: Synced ${cloudTrials.length} trials across scientist accounts.`);
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
      if (savedConfig && savedConfig.apiKey && savedConfig.projectId) {
        try {
          const cloudTrials = await fetchTrialsFromFirebaseCloud(savedConfig);
          if (cloudTrials && cloudTrials.length > 0) {
            setSyncedTrials(cloudTrials);
            saveSyncedTrialsList(cloudTrials);
            setSyncNotice(`✅ Cloud sync success: Pulled ${cloudTrials.length} trials from Firebase Cloud!`);
            setIsSyncing(false);
            return;
          }
        } catch (err: any) {
          console.warn('Cloud fetch failed:', err);
          setSyncNotice(`⚠️ Firebase Cloud fetch failed: ${err?.message || 'Check Email & Password'}`);
        }
      }

      const idbTrials = await readTrialsFromIndexedDB();
      if (idbTrials && idbTrials.length > 0) {
        setSyncedTrials(idbTrials);
        saveSyncedTrialsList(idbTrials);
        setSyncNotice(`✅ Local device sync: Pulled ${idbTrials.length} real trials from browser database!`);
      } else {
        const current = getSyncedTrials();
        setSyncedTrials(current);
        if (!savedConfig) {
          setSyncNotice(`ℹ️ Click 'Connect Credentials' to enter your login email to fetch scientist trials.`);
        } else {
          setSyncNotice(`⚡ Connected to project "${savedConfig.projectId}".`);
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
      email: emailInput.trim(),
      password: passwordInput.trim(),
    };

    saveFirebaseConfig(newConfig);
    setShowConfigModal(false);
    setConfigError(null);
    handleManualSync();
  };

  // Get current user email — always use the logged-in R&D app user's email first
  // Do NOT use getSavedFirebaseConfig()?.email because that is the Trial Manager account
  // (e.g. Pavan's email), NOT the currently logged-in R&D user (e.g. Bindu)
  const currentUserEmail = profile?.email?.toLowerCase() || '';
  // Firebase Auth UID is the most reliable match for CreatedBy field in Firestore
  const currentUserUid = currentUser?.uid || profile?.id || '';


  // Extract unique scientist names for filter dropdown
  const uniqueScientists = Array.from(
    new Set(syncedTrials.map(t => t.scientistName).filter(Boolean))
  );

  // Scientist-wise filtering logic
  const filteredSynced = syncedTrials.filter(trial => {
    // 1. Text Search Filter
    const matchSearch = trial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trial.cropName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trial.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trial.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trial.scientistName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;

    // 2. Category Tab Filter
    if (activeCategoryTab === 'herbicide' && !(trial.productName.toLowerCase().includes('weed') || trial.productName.toLowerCase().includes('herbicide') || trial.title.toLowerCase().includes('weed'))) return false;
    if (activeCategoryTab === 'fungicide' && !(trial.productName.toLowerCase().includes('shield') || trial.productName.toLowerCase().includes('fungi'))) return false;

    // 3. Strict Logged-In User Trial Isolation Filter
    if (selectedScientistFilter === 'my-trials') {
      if (currentUserEmail) {
        const userHandle = currentUserEmail.split('@')[0].toLowerCase();
        const trialEmail = (trial.creatorEmail || '').toLowerCase();
        const trialScientist = (trial.scientistName || '').toLowerCase();
        const trialUid = (trial.creatorUid || '').toLowerCase();

        // Match by email, email handle (prefix before @), or UID
        const matchesEmail = trialEmail.includes(currentUserEmail) ||
                             trialEmail.includes(userHandle) ||
                             trialScientist.includes(userHandle) ||
                             (currentUserUid && trialUid === currentUserUid);
        if (!matchesEmail) return false;
      }
    } else if (selectedScientistFilter !== 'all-scientists') {
      if (trial.scientistName !== selectedScientistFilter) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Scientist-Wise Profile Sync
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-purple-500" /> Miklens Herbicide Trial Manager 7
            </span>
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">
            Field Trial Manager & Google Drive Cross-Device Sync
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl font-medium">
            Scientist-wise data mapping: Each scientist sees their assigned field trials & Google Drive evidence, while Management maintains cumulative pipeline oversight.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl text-xs font-bold border border-gray-200 dark:border-gray-700 transition-all active:scale-95"
          >
            <Key className="w-4 h-4 text-purple-500" />
            {getSavedFirebaseConfig()?.email ? `🔐 Logged in: ${getSavedFirebaseConfig()?.email?.split('@')[0]}` : '🔑 Connect Credentials'}
          </button>

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-black shadow-md transition-all disabled:opacity-50 active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Authenticating Cloud...' : 'Sync Live Data'}
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

      {/* Scientist-Wise Profile Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
            Scientist Profile View:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedScientistFilter('my-trials')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                selectedScientistFilter === 'my-trials'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
              }`}
            >
              👤 My Assigned Trials
            </button>
            <button
              onClick={() => setSelectedScientistFilter('all-scientists')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                selectedScientistFilter === 'all-scientists'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
              }`}
            >
              🌐 All Scientists ({syncedTrials.length})
            </button>
          </div>
        </div>

        {uniqueScientists.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedScientistFilter}
              onChange={e => setSelectedScientistFilter(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none text-gray-800 dark:text-gray-200"
            >
              <option value="my-trials">Filter by Scientist Name...</option>
              <option value="all-scientists">All Scientists</option>
              {uniqueScientists.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'herbicide', 'fungicide'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveCategoryTab(tab)}
              className={`px-4 py-2 rounded-2xl text-xs font-black capitalize transition-all whitespace-nowrap ${
                activeCategoryTab === tab
                  ? 'bg-emerald-500 text-emerald-950 shadow-md'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:bg-gray-50'
              }`}
            >
              {tab === 'all' ? `All Categories` : `${tab} Trials`}
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
            <h3 className="text-base font-bold text-gray-900 dark:text-white">No Trials Matched for Selected Scientist</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Switch Scientist Profile View to 'All Scientists' or select a different scientist from the filter dropdown.
            </p>
          </div>
        ) : (
          filteredSynced.map(trial => (
            <FieldTrialCard key={trial.id} trial={trial} />
          ))
        )}
      </div>

      {/* Firebase Key & Login Connection Modal */}
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
                  <h3 className="text-base font-black text-gray-900 dark:text-white">Connect Firebase & Trial Manager Credentials</h3>
                </div>
                <button onClick={() => setShowConfigModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xs">✕</button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Enter your <strong>Trial Manager account login (Email & Password)</strong>. Your Security Rules require login authentication (<code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-purple-600">request.auth != null</code>) to view cloud trial data across devices.
              </p>

              <form onSubmit={handleSaveFirebaseConfig} className="space-y-4">
                {configError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{configError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">Firebase Project ID</label>
                    <input
                      type="text"
                      placeholder="e.g. miklens-herbicide-trial-manager-7"
                      value={projectIdInput}
                      onChange={e => setProjectIdInput(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">Firebase Web API Key</label>
                    <input
                      type="text"
                      placeholder="e.g. AIzaSyD..."
                      value={apiKeyInput}
                      onChange={e => setApiKeyInput(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-500/30 font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50 space-y-3">
                  <span className="text-[11px] font-black text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Trial Manager Account Login (Required by Security Rules)
                  </span>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">Trial Manager Email</label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        placeholder="e.g. pavan@miklensbio.com"
                        value={emailInput}
                        onChange={e => setEmailInput(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-medium outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">Trial Manager Password</label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        placeholder="Your Trial Manager account password"
                        value={passwordInput}
                        onChange={e => setPasswordInput(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-medium outline-none"
                      />
                    </div>
                  </div>
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
                    Authenticate & Connect Live Cloud
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