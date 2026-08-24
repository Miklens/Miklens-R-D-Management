import React, { useState } from 'react';
import { Plus, X, Search, FlaskConical, Trash2, Package, Sparkles, ChevronRight, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LaboratoryTests } from './LaboratoryTests';
import { FieldTrials } from './FieldTrials';
import { Observations } from './Observations';
import { useExperiments } from '../contexts/ExperimentContext';
import { useAuth } from '../contexts/AuthContext';
import { ScientificWorkbenchModal } from '../components/ScientificWorkbenchModal';
import type { ExperimentType } from '../types/experimentTypes';

export const Experiments: React.FC = () => {
  const { experiments, addExperiment, deleteExperiment, allProducts } = useExperiments();
  const { profile } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'experiments' | 'lab' | 'field' | 'observations'>('experiments');

  // Scientific Workbench Drawer State
  const [selectedExperiment, setSelectedExperiment] = useState<any>(null);

  // Creation Modal State
  const [expName, setExpName] = useState('');
  const [productName, setProductName] = useState('');
  const [isCustomProduct, setIsCustomProduct] = useState(false);
  const [customProductName, setCustomProductName] = useState('');
  const [expType, setExpType] = useState<ExperimentType>('Lab');
  const [hypothesis, setHypothesis] = useState('');
  const [initialActivity, setInitialActivity] = useState('');

  const PRODUCTS = allProducts && allProducts.length > 0
    ? [...allProducts, '+ Add Custom Product...']
    : ['+ Add Custom Product...'];

  const handleCreateExperiment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expName.trim()) return;

    const finalProduct = isCustomProduct ? customProductName.trim() || 'Custom Product' : productName;

    addExperiment({
      name: expName.trim(),
      productName: finalProduct,
      type: expType,
      status: 'InProgress',
      startDate: new Date().toISOString().split('T')[0],
      description: 'Newly created scientific experiment',
      hypothesis: hypothesis.trim() || `Evaluate ${expName} performance on ${finalProduct}.`,
      dailyRuns: [
        {
          id: `run-${Date.now()}`,
          dayNumber: 1,
          date: new Date().toISOString().split('T')[0],
          scientistName: profile?.name || 'Scientist',
          activityPerformed: initialActivity.trim() || 'Initial experiment setup & baseline parameter measurement.',
          observationResult: 'Sample prepared, initial parameters recorded.',
          runStatus: 'In Progress',
        },
      ],
    });

    setExpName('');
    setHypothesis('');
    setInitialActivity('');
    setCustomProductName('');
    setShowModal(false);
  };

  // Group experiments product-wise
  const experimentsByProduct = experiments
    .filter((e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.productName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .reduce((acc, exp) => {
      const pName = exp.productName || 'Unassigned Product';
      if (!acc[pName]) acc[pName] = [];
      acc[pName].push(exp);
      return acc;
    }, {} as Record<string, typeof experiments>);

  const getOutcomeBadge = (status?: string) => {
    switch (status) {
      case 'Passed':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300';
      case 'Failed':
        return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-300';
      case 'Inconclusive':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-md">
              <FlaskConical className="w-5 h-5" />
            </div>
            Product Testing & R&D Audit Traceability
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            Chronological multi-day execution traceability timeline, hypotheses & scientific verdicts
          </p>
        </div>

        {activeTab === 'experiments' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            New Experiment
          </button>
        )}
      </div>

      {/* All Experiments View */}
      <div className="space-y-6">
          {/* Search Toolbar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search experiments, hypotheses or products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          {/* Product-Wise Grouped Experiment Sections */}
          {Object.keys(experimentsByProduct).length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
              <FlaskConical className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">No experiments found.</p>
            </div>
          ) : (
            Object.entries(experimentsByProduct).map(([pName, expList]) => (
              <div
                key={pName}
                className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-md space-y-4"
              >
                {/* Product Section Header */}
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-base">{pName}</h3>
                      <p className="text-xs text-gray-400">{expList.length} Active Experiments</p>
                    </div>
                  </div>
                </div>

                {/* Experiments Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {expList.map((exp) => {
                    const runs = exp.dailyRuns || [];
                    const latestRun = runs.length > 0 ? runs[runs.length - 1] : null;

                    return (
                      <div
                        key={exp.id}
                        onClick={() => setSelectedExperiment(exp)}
                        className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 space-y-3 relative group hover:border-emerald-500/50 hover:shadow-lg transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md">
                            <FlaskConical className="w-5 h-5" />
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getOutcomeBadge(exp.outcomeStatus)}`}>
                              Verdict: {exp.outcomeStatus || 'Pending'}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteExperiment(exp.id);
                              }}
                              className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-emerald-600 transition-colors">
                            {exp.name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 italic">
                            "{exp.hypothesis || 'No hypothesis stated.'}"
                          </p>
                        </div>

                        {/* Daily Runs Traceability Summary */}
                        <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-800 space-y-1 text-xs">
                          <div className="flex items-center justify-between text-gray-500 text-[11px]">
                            <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                              <History className="w-3.5 h-3.5 text-emerald-500" />
                              {runs.length} Daily Runs Logged
                            </span>
                            <span className="font-mono text-[10px]">Started: {exp.startDate}</span>
                          </div>

                          {latestRun && (
                            <p className="text-[11px] text-gray-700 dark:text-gray-300 font-medium truncate pt-1 border-t border-gray-100 dark:border-gray-800">
                              Day #{latestRun.dayNumber}: {latestRun.activityPerformed}
                            </p>
                          )}
                        </div>

                        {/* Card Footer CTA */}
                        <div className="pt-2 border-t border-gray-200/60 dark:border-gray-800 flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            View Traceability Timeline
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

      {/* Interactive Scientific Workbench Modal */}
      {selectedExperiment && (
        <ScientificWorkbenchModal
          category="exp"
          item={selectedExperiment}
          onClose={() => setSelectedExperiment(null)}
        />
      )}

      {/* Create New Experiment Modal */}
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
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-500" />
                  Design New Scientific Experiment
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleCreateExperiment} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Experiment Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Volume Makeup & pH Adjustment Assay"
                    value={expName}
                    onChange={(e) => setExpName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Target Product *
                  </label>
                  <select
                    value={isCustomProduct ? '+ Add Custom Product...' : productName}
                    onChange={(e) => {
                      if (e.target.value === '+ Add Custom Product...') {
                        setIsCustomProduct(true);
                      } else {
                        setIsCustomProduct(false);
                        setProductName(e.target.value);
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                  >
                    {PRODUCTS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
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

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Scientific Hypothesis & Target Goal
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Adjusting pH from 7.4 to 6.2 and volume to 1000mL optimizes viscosity without spore precipitation..."
                    value={hypothesis}
                    onChange={(e) => setHypothesis(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Day 1 Activity & Method Performed
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Initial formulation batch prep. Measured initial volume 800mL and initial pH 7.4..."
                    value={initialActivity}
                    onChange={(e) => setInitialActivity(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Experiment Type
                  </label>
                  <select
                    value={expType}
                    onChange={(e: any) => setExpType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                  >
                    <option value="Lab">Laboratory Assay</option>
                    <option value="Field">Field Trial</option>
                    <option value="Both">Lab & Field Dual Assay</option>
                  </select>
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
                    Create Experiment
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