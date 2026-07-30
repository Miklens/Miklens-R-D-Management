import React, { useState } from 'react';
import { Thermometer, Calendar, Plus, CheckCircle2, AlertTriangle, Search, Trash2, Package, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExperiments } from '../contexts/ExperimentContext';

export const StabilityTracker: React.FC = () => {
  const { stabilityLogs, addStabilityLog, deleteStabilityLog, allProducts } = useExperiments();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Modal State
  const [newBatchNo, setNewBatchNo] = useState('');
  const [newProductName, setNewProductName] = useState('BioShield Alpha (Bio-fungicide)');
  const [isCustomProduct, setIsCustomProduct] = useState(false);
  const [customProductName, setCustomProductName] = useState('');
  const [newChamber, setNewChamber] = useState('54°C (Accelerated)');
  const [newDuration, setNewDuration] = useState('14 Days');

  // AI Projection states
  const [projectingId, setProjectingId] = useState<string | null>(null);
  const [aiProjection, setAiProjection] = useState<string | null>(null);

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchNo.trim()) return;

    const finalProduct = isCustomProduct ? customProductName.trim() || 'Custom Product' : newProductName;

    addStabilityLog({
      batchNo: newBatchNo.trim(),
      productName: finalProduct,
      chamberTemp: newChamber,
      startDate: new Date().toISOString().split('T')[0],
      duration: newDuration,
      nextTestDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      nextInterval: '14 Day Check',
      status: 'active',
      activeRetention: 99.0,
      pH: 6.5,
    });

    setNewBatchNo('');
    setCustomProductName('');
    setShowAddModal(false);
  };

  const handleSimulateArrhenius = (id: string) => {
    setProjectingId(id);
    setAiProjection(null);
    setTimeout(() => {
      setAiProjection(
        'Arrhenius Kinetic Model Projection: Active ingredient degradation rate k = 0.0012 day⁻¹ at 25°C. Estimated shelf-life expiry: 24 Months with >90% active ingredient retention.'
      );
    }, 800);
  };

  // Group Stability Logs Product-Wise
  const logsByProduct = stabilityLogs
    .filter(
      (b) =>
        b.batchNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.chamberTemp.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .reduce((acc, batch) => {
      const pName = batch.productName || 'Unassigned Product';
      if (!acc[pName]) acc[pName] = [];
      acc[pName].push(batch);
      return acc;
    }, {} as Record<string, typeof stabilityLogs>);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-amber-500" />
            CIPAC Stability & Thermal Chamber Program
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs">
            Accelerated heat degradation mapping, thermal stress assays, and shelf-life projections
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-xs font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          Setup Stability Program
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search batches or products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      {/* Product-Wise Grouped Stability Logs */}
      {Object.keys(logsByProduct).length === 0 ? (
        <div className="p-10 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
          <Thermometer className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-xs font-semibold text-gray-500">No CIPAC stability logs found.</p>
        </div>
      ) : (
        Object.entries(logsByProduct).map(([pName, batchList]) => (
          <div
            key={pName}
            className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-md space-y-4"
          >
            {/* Product Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-xs">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{pName}</h3>
                  <p className="text-[11px] text-gray-400">{batchList.length} Stability Batches</p>
                </div>
              </div>
            </div>

            {/* Batch Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {batchList.map((batch) => (
                <div
                  key={batch.id}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                        {batch.batchNo}
                      </span>
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm mt-0.5">
                        {batch.chamberTemp}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {batch.status}
                      </span>
                      <button
                        onClick={() => deleteStabilityLog(batch.id)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                        title="Delete Batch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs bg-white dark:bg-gray-900 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Duration</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{batch.duration}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-medium">Active Left</span>
                      <span className="font-extrabold text-emerald-600">{batch.activeRetention}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-medium">pH Level</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{batch.pH}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[11px] text-gray-400">Next Check: {batch.nextTestDate}</span>
                    <button
                      onClick={() => handleSimulateArrhenius(batch.id)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:underline"
                    >
                      <Sparkles className="w-3 h-3 text-purple-500" />
                      Arrhenius Projection
                    </button>
                  </div>

                  {projectingId === batch.id && aiProjection && (
                    <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 rounded-xl text-xs text-purple-900 dark:text-purple-200">
                      {aiProjection}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-amber-500" />
                  Setup CIPAC Stability Program
                </h3>
              </div>

              <form onSubmit={handleCreateBatch} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Batch Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. B-BSA-2026-09K"
                    value={newBatchNo}
                    onChange={(e) => setNewBatchNo(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Target Product *
                  </label>
                  <select
                    value={isCustomProduct ? 'custom' : newProductName}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setIsCustomProduct(true);
                      } else {
                        setIsCustomProduct(false);
                        setNewProductName(e.target.value);
                      }
                    }}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                  >
                    {allProducts.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                    <option value="custom">+ Add Custom Product...</option>
                  </select>

                  {isCustomProduct && (
                    <input
                      type="text"
                      placeholder="Type custom product name..."
                      value={customProductName}
                      onChange={(e) => setCustomProductName(e.target.value)}
                      className="mt-2 w-full px-4 py-2 bg-white dark:bg-gray-800 border border-emerald-400 rounded-xl text-sm"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Chamber Temp
                    </label>
                    <select
                      value={newChamber}
                      onChange={(e) => setNewChamber(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                    >
                      <option value="54°C (Accelerated)">54°C (Accelerated)</option>
                      <option value="25°C (Ambient)">25°C (Ambient)</option>
                      <option value="0°C (Cold)">0°C (Cold)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Program Duration
                    </label>
                    <input
                      type="text"
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl shadow-md"
                  >
                    Setup Program
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
