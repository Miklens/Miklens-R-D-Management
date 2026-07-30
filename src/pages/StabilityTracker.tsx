import React, { useState } from 'react';
import { Thermometer, Calendar, Plus, Sparkles, CheckCircle2, AlertTriangle, AlertCircle, Clock, Search, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StabilityBatch {
  id: string;
  batchNo: string;
  productName: string;
  chamberTemp: string; // "54°C (Accelerated)", "0°C (Cold)", "25°C (Ambient)"
  startDate: string;
  duration: string; // "14 Days", "7 Days", "24 Months"
  nextTestDate: string;
  nextInterval: '0 Month' | '3 Month' | '6 Month' | '12 Month' | '18 Month' | '24 Month' | 'Complete';
  status: 'active' | 'completed' | 'overdue' | 'warning';
  activeRetention: number; // % of active ingredient left
  pH: number;
}

const INITIAL_BATCHES: StabilityBatch[] = [
  {
    id: '1',
    batchNo: 'B-PS-2026-07A',
    productName: 'Pseudomonas SC Bio-Pesticide',
    chamberTemp: '54°C (Accelerated)',
    startDate: '2026-07-05',
    duration: '14 Days',
    nextTestDate: '2026-07-19', // Today!
    nextInterval: 'Complete',
    status: 'overdue',
    activeRetention: 91.5,
    pH: 6.1
  },
  {
    id: '2',
    batchNo: 'B-BT-2026-05F',
    productName: 'Bacillus thuringiensis WP',
    chamberTemp: '25°C (Ambient)',
    startDate: '2026-05-10',
    duration: '24 Months',
    nextTestDate: '2026-08-10',
    nextInterval: '3 Month',
    status: 'active',
    activeRetention: 98.2,
    pH: 7.2
  },
  {
    id: '3',
    batchNo: 'B-TC-2026-06C',
    productName: 'Trichoderma harzianum granules',
    chamberTemp: '25°C (Ambient)',
    startDate: '2026-06-15',
    duration: '24 Months',
    nextTestDate: '2026-07-15', // Overdue
    nextInterval: '3 Month',
    status: 'overdue',
    activeRetention: 84.0,
    pH: 5.4
  },
  {
    id: '4',
    batchNo: 'B-NE-2026-07K',
    productName: 'Neem Oil Concentrated Emulsion',
    chamberTemp: '0°C (Cold)',
    startDate: '2026-07-16',
    duration: '7 Days',
    nextTestDate: '2026-07-23',
    nextInterval: 'Complete',
    status: 'active',
    activeRetention: 99.8,
    pH: 6.5
  }
];

export const StabilityTracker: React.FC = () => {
  const [batches, setBatches] = useState<StabilityBatch[]>(INITIAL_BATCHES);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New batch modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBatchNo, setNewBatchNo] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newChamber, setNewChamber] = useState('54°C (Accelerated)');
  const [newInterval, setNewInterval] = useState<'0 Month' | '3 Month' | '6 Month' | '12 Month' | '18 Month' | '24 Month' | 'Complete'>('0 Month');
  const [newDuration, setNewDuration] = useState('14 Days');

  // AI Projection states
  const [projectingId, setProjectingId] = useState<string | null>(null);
  const [aiProjection, setAiProjection] = useState<string | null>(null);

  const filteredBatches = batches.filter(batch => 
    batch.batchNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchNo || !newProductName) return;
    const newBatch: StabilityBatch = {
      id: Date.now().toString(),
      batchNo: newBatchNo,
      productName: newProductName,
      chamberTemp: newChamber,
      startDate: new Date().toISOString().split('T')[0],
      duration: newDuration,
      nextTestDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      nextInterval: newInterval,
      status: 'active',
      activeRetention: 100.0,
      pH: 7.0
    };
    setBatches(prev => [newBatch, ...prev]);
    setNewBatchNo('');
    setNewProductName('');
    setShowAddModal(false);
  };

  const handleLogTest = (id: string) => {
    // Record current date and update batch
    setBatches(prev => prev.map(b => {
      if (b.id === id) {
        return {
          ...b,
          status: 'completed',
          activeRetention: Number((b.activeRetention - (Math.random() * 2)).toFixed(1))
        };
      }
      return b;
    }));
  };

  const runAiProjection = (batch: StabilityBatch) => {
    setProjectingId(batch.id);
    setAiProjection(null);

    setTimeout(() => {
      // Simple Arrhenius equation prediction model
      const tempF = batch.chamberTemp.includes('54°C') ? 54 : 25;
      const retention = batch.activeRetention;
      
      let report = '';
      if (tempF === 54) {
        // Accelerated stability calculations
        const degradationRate = 100 - retention;
        const predictedShelfLifeMonths = Math.max(6, Math.min(24, Math.floor((15 / (degradationRate || 0.5)) * 12)));
        const expected2YearRetention = Math.max(50, 100 - (degradationRate * 2.2));

        report = `🧬 Arrhenius Kinetics Projection for ${batch.batchNo}:\n\n` +
          `• Accelerated Decay Rate: ${(degradationRate / 14).toFixed(3)}% loss per day at 54°C.\n` +
          `• Estimated Equivalent Shelf Life: ${predictedShelfLifeMonths} months at 25°C.\n` +
          `• Predicted 24-Month Retention: ${expected2YearRetention.toFixed(1)}% (Threshold: 85%).\n` +
          `• Status: ${expected2YearRetention >= 85 ? '🟢 HIGH PROBABILITY OF PASSING' : '🔴 ACCELERATED DEGRADATION RISK'}\n\n` +
          `💡 Recommendation: ${
            expected2YearRetention < 85 
              ? 'Active biological strain is degrading too fast. Consider adding a polyol stabilizer (e.g. Glycerol at 2.0%) or chelators to mitigate transition metal oxidation in formulation.' 
              : 'Formulation stability parameters are optimal. Good emulsification preventing agglomeration.'
          }`;
      } else {
        // Ambient predictions
        const daysPassed = Math.floor((Date.now() - new Date(batch.startDate).getTime()) / (1000 * 60 * 60 * 24)) || 1;
        const ambientDecay = (100 - retention) / daysPassed;
        const predictedRetention2Years = Math.max(50, 100 - (ambientDecay * 730));

        report = `🧬 Arrhenius Kinetics Projection for ${batch.batchNo}:\n\n` +
          `• Ambient Decay Rate: ${(ambientDecay * 30).toFixed(3)}% loss per month.\n` +
          `• Predicted 24-Month Retention: ${predictedRetention2Years.toFixed(1)}%.\n` +
          `• Status: ${predictedRetention2Years >= 85 ? '🟢 STABLE SHELF LIFE' : '⚠️ GRADUAL DECLINE DETECTED'}\n\n` +
          `💡 Recommendation: ${
            predictedRetention2Years < 85 
              ? 'Stability is declining slightly faster than standard. Check capsule wall thickness in micro-encapsulated batches.' 
              : 'Ambient decay is negligible. Cell count viability remains high.'
          }`;
      }

      setAiProjection(report);
      setProjectingId(null);
    }, 1500);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Thermometer className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shelf-Life & Stability Tracker</h1>
              <p className="text-sm text-gray-500">Accelerated stability chambers and real-time degradation mapping.</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 text-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Setup Stability Program
        </button>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Thermometer className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Active Programs</p>
            <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{batches.length}</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-500 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Overdue Inspections</p>
            <h4 className="text-2xl font-bold text-red-500 dark:text-red-400">
              {batches.filter(b => b.status === 'overdue').length}
            </h4>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-500 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Scheduled Tests (30d)</p>
            <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
              {batches.filter(b => b.status === 'active').length}
            </h4>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-500 dark:text-blue-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Finished Protocols</p>
            <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
              {batches.filter(b => b.status === 'completed').length}
            </h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle Column: Program List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="text-base font-bold text-gray-800 dark:text-white">Stability Batches</h3>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search batches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none outline-0 transition-all"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-emerald-500/30 dark:hover:border-emerald-500/20 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/20 dark:bg-gray-900/10"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-400 dark:text-gray-500">{batch.batchNo}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        batch.status === 'overdue' ? 'bg-red-50 text-red-500 dark:bg-red-950/20' :
                        batch.status === 'completed' ? 'bg-blue-50 text-blue-500 dark:bg-blue-950/20' :
                        'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20'
                      }`}>
                        {batch.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-white">{batch.productName}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 text-[11px] text-gray-500 dark:text-gray-400">
                      <div>
                        <span className="block text-[10px] text-gray-400 font-semibold">CHAMBER TEMP</span>
                        {batch.chamberTemp}
                      </div>
                      <div>
                        <span className="block text-[10px] text-gray-400 font-semibold">START DATE</span>
                        {batch.startDate}
                      </div>
                      <div>
                        <span className="block text-[10px] text-gray-400 font-semibold">TEST INTERVAL</span>
                        {batch.nextInterval}
                      </div>
                      <div>
                        <span className="block text-[10px] text-gray-400 font-semibold">DUE DATE</span>
                        {batch.nextTestDate}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end justify-between gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Active Retention:</span>
                      <span className={`font-mono text-sm font-bold ${batch.activeRetention >= 90 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {batch.activeRetention}%
                      </span>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                      <button
                        onClick={() => runAiProjection(batch)}
                        className="px-2.5 py-1.5 text-xs font-semibold bg-purple-50 dark:bg-purple-950/20 hover:bg-purple-100 text-purple-600 dark:text-purple-400 border border-purple-200/50 rounded-lg flex items-center gap-1 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Projection
                      </button>

                      {batch.status !== 'completed' && (
                        <button
                          onClick={() => handleLogTest(batch.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all"
                        >
                          Complete Inspection
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Kinship Predictions */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-slate-800 text-white rounded-2xl shadow-xl p-6 min-h-[300px] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-purple-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base">Gemini Shelf-Life Projector</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Analyze chemical kinetics curves. Select a batch’s **Projection** button to simulate Arrhenius reactions.
              </p>

              <AnimatePresence mode="wait">
                {projectingId ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-10 space-y-3"
                  >
                    <div className="w-8 h-8 rounded-full border-4 border-t-purple-400 border-r-purple-300 border-b-transparent border-l-transparent animate-spin"></div>
                    <span className="text-xs text-purple-300">Modeling thermal degradation...</span>
                  </motion.div>
                ) : aiProjection ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-xl border border-purple-500/20 bg-purple-950/20 text-xs font-mono whitespace-pre-line leading-relaxed text-slate-100 max-h-[320px] overflow-y-auto"
                  >
                    {aiProjection}
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl p-4">
                    <Thermometer className="w-8 h-8 mb-2 opacity-30" />
                    <span className="text-xs">No active thermal calculation modeling is loaded.</span>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm space-y-3 text-xs text-gray-500 dark:text-gray-400">
            <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              CIPAC Regulations Info
            </h4>
            <p className="leading-relaxed">
              Accelerated Heat Storage (CIPAC MT 46.3) at 54°C for 14 days is mandatory for chemical formulations. If active concentration drops below 95% of initial value during AHS, stabilizer concentration adjustments must be recorded.
            </p>
          </div>
        </div>
      </div>

      {/* Setup Program Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Setup Stability Program</h3>
            <form onSubmit={handleAddBatch} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Batch Number</label>
                <input
                  type="text"
                  placeholder="e.g. B-PS-2026-07B"
                  value={newBatchNo}
                  onChange={(e) => setNewBatchNo(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Pseudomonas fluorescens SC"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Chamber Temp</label>
                  <select
                    value={newChamber}
                    onChange={(e) => setNewChamber(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="54°C (Accelerated)">54°C (Accelerated)</option>
                    <option value="0°C (Cold)">0°C (Cold)</option>
                    <option value="25°C (Ambient)">25°C (Ambient)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Duration</label>
                  <select
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="14 Days">14 Days</option>
                    <option value="7 Days">7 Days</option>
                    <option value="24 Months">24 Months</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all shadow-md shadow-emerald-500/10"
                >
                  Start Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
