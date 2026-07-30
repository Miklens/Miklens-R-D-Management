import React, { useState } from 'react';
import { MapPin, Plus, X, Search, Trash2, Package, Sparkles, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExperiments } from '../contexts/ExperimentContext';
import { ScientificWorkbenchModal } from '../components/ScientificWorkbenchModal';

export const FieldTrials: React.FC = () => {
  const { fieldTrials, addFieldTrial, deleteFieldTrial, allProducts } = useExperiments();

  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrial, setSelectedTrial] = useState<any>(null);

  // Modal State
  const [nameInput, setNameInput] = useState('');
  const [productInput, setProductInput] = useState('BioShield Alpha (Bio-fungicide)');
  const [isCustomProduct, setIsCustomProduct] = useState(false);
  const [customProductInput, setCustomProductInput] = useState('');
  const [locationInput, setLocationInput] = useState('Punjab, India');
  const [areaInput, setAreaInput] = useState('50 acres');
  const [hypothesis, setHypothesis] = useState('');

  const handleCreateTrial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    const finalProduct = isCustomProduct ? customProductInput.trim() || 'Custom Product' : productInput;

    addFieldTrial({
      name: nameInput.trim(),
      productName: finalProduct,
      location: locationInput.trim() || 'Punjab, India',
      area: areaInput || '30 acres',
      status: 'Active',
      startDate: new Date().toISOString().split('T')[0],
      duration: '90 days',
      hypothesis: hypothesis.trim() || `Evaluate crop disease reduction for ${finalProduct} in ${locationInput}.`,
    });

    setNameInput('');
    setHypothesis('');
    setCustomProductInput('');
    setShowModal(false);
  };

  const trialsByProduct = fieldTrials
    .filter(
      (t) =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.location.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .reduce((acc, trial) => {
      const pName = trial.productName || 'Unassigned Product';
      if (!acc[pName]) acc[pName] = [];
      acc[pName].push(trial);
      return acc;
    }, {} as Record<string, typeof fieldTrials>);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-500" />
            Field Trials & On-Farm Demonstrations
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs">
            Product-wise plot trial tracking, soil analysis, and crop efficacy
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-xs font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          New Field Trial
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search field trials, locations or products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      {/* Product-Wise Grouped Field Trial Sections */}
      {Object.keys(trialsByProduct).length === 0 ? (
        <div className="p-10 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
          <MapPin className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-xs font-semibold text-gray-500">No field trials found.</p>
        </div>
      ) : (
        Object.entries(trialsByProduct).map(([pName, trialList]) => (
          <div
            key={pName}
            className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-md space-y-4"
          >
            {/* Product Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{pName}</h3>
                  <p className="text-[11px] text-gray-400">{trialList.length} Active Field Plot Trials</p>
                </div>
              </div>
            </div>

            {/* Trial Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trialList.map((trial) => (
                <div
                  key={trial.id}
                  onClick={() => setSelectedTrial(trial)}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 space-y-3 relative group hover:border-emerald-500 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-emerald-600 transition-colors">
                          {trial.name}
                        </h4>
                        <p className="text-[11px] text-gray-400">{trial.location}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {trial.outcomeStatus || trial.status}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFieldTrial(trial.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                        title="Delete Trial"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs bg-white dark:bg-gray-900 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Trial Area</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{trial.area}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-medium">Start Date</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{trial.startDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-medium">Duration</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{trial.duration}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200/60 dark:border-gray-800 flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Open Scientific Workbench
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Drawer */}
      {selectedTrial && (
        <ScientificWorkbenchModal
          category="field"
          item={selectedTrial}
          onClose={() => setSelectedTrial(null)}
        />
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  Add New Field Trial
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleCreateTrial} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Trial Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BioShield Alpha Wheat Field Efficacy Trial"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Target Product *
                  </label>
                  <select
                    value={isCustomProduct ? 'custom' : productInput}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setIsCustomProduct(true);
                      } else {
                        setIsCustomProduct(false);
                        setProductInput(e.target.value);
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
                      value={customProductInput}
                      onChange={(e) => setCustomProductInput(e.target.value)}
                      className="mt-2 w-full px-4 py-2 bg-white dark:bg-gray-800 border border-emerald-400 rounded-xl text-sm"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Field Trial Hypothesis
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Foliar spray application reduces rust disease severity score by >85%..."
                    value={hypothesis}
                    onChange={(e) => setHypothesis(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Trial Location
                    </label>
                    <input
                      type="text"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Plot Area
                    </label>
                    <input
                      type="text"
                      value={areaInput}
                      onChange={(e) => setAreaInput(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl shadow-md"
                  >
                    Create Field Trial
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