import React, { useState, useEffect } from 'react';
import { MapPin, Plus, X, Search, Trash2, RefreshCw, Zap, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExperiments } from '../contexts/ExperimentContext';
import { FieldTrialCard } from '../components/FieldTrialCard';
import { getSyncedTrials, saveSyncedTrial } from '../services/trialManagerSync';
import { ExternalFieldTrial } from '../types/trialIntegrationTypes';

export const FieldTrials: React.FC = () => {
  const { fieldTrials, addFieldTrial, deleteFieldTrial } = useExperiments();
  const [syncedTrials, setSyncedTrials] = useState<ExternalFieldTrial[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setSyncedTrials(getSyncedTrials());
  }, []);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setSyncedTrials(getSyncedTrials());
      setIsSyncing(false);
    }, 600);
  };

  const filteredSynced = syncedTrials.filter(
    t => t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
         t.cropName.toLowerCase().includes(searchTerm.toLowerCase()) ||
         t.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
         t.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Sync Status Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-900/90 via-indigo-900 to-emerald-950 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-emerald-950 font-mono">
              Live Direct Sync Connected
            </span>
            <span className="text-xs text-purple-200 font-medium">· Miklens Trial Manager 7</span>
          </div>
          <h3 className="text-base font-black">Field Trial Manager & Google Drive Direct Data Pipeline</h3>
          <p className="text-xs text-purple-200/80 leading-relaxed">
            Field trials, treatment replications, efficacy percentage ratings & Google Drive crop photo evidence sync live into R&D Management.
          </p>
        </div>

        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-2xl text-xs font-black shadow-lg transition-all shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing Firebase...' : 'Sync Trial Manager Data'}
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter synced trials by crop, product, or plot location..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500">
            Showing {filteredSynced.length} Synced Field Trial Report Cards
          </span>
        </div>
      </div>

      {/* Synced Field Trial Cards */}
      <div className="space-y-6">
        {filteredSynced.map(trial => (
          <FieldTrialCard key={trial.id} trial={trial} />
        ))}
      </div>
    </div>
  );
};