import React, { useState } from 'react';
import { Plus, X, Search, FlaskConical, CheckCircle2, AlertCircle, Trash2, Package, Sparkles, ChevronRight, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LaboratoryTests } from './LaboratoryTests';
import { StabilityTracker } from './StabilityTracker';
import { FieldTrials } from './FieldTrials';
import { Observations } from './Observations';
import { useExperiments } from '../contexts/ExperimentContext';
import { ScientificWorkbenchModal } from '../components/ScientificWorkbenchModal';
import type { ExperimentType } from '../types/experimentTypes';

export const Experiments: React.FC = () => {
  const { experiments, addExperiment, deleteExperiment } = useExperiments();

  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'experiments' | 'lab' | 'stability' | 'field' | 'observations'>('experiments');

  // Scientific Workbench Drawer State
  const [selectedExperiment, setSelectedExperiment] = useState<any>(null);

  // Creation Modal State
  const [expName, setExpName] = useState('');
  const [productName, setProductName] = useState('BioShield Alpha (Bio-fungicide)');
  const [isCustomProduct, setIsCustomProduct] = useState(false);
  const [customProductName, setCustomProductName] = useState('');
  const [expType, setExpType] = useState<ExperimentType>('Lab');
  const [hypothesis, setHypothesis] = useState('');
  const [protocolStepsText, setProtocolStepsText] = useState('');

  const PRODUCTS = [
    'BioShield Alpha (Bio-fungicide)',
    '+ Add Custom Product...',
  ];

  const handleCreateExperiment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expName.trim()) return;

    const finalProduct = isCustomProduct ? customProductName.trim() || 'Custom Product' : productName;

    // Parse custom protocol steps if entered
    const parsedSteps = protocolStepsText
      .split('\n')
      .filter((s) => s.trim().length > 0)
      .map((s, idx) => ({ id: `s-${idx + 1}`, title: s.trim(), completed: false }));

    addExperiment({
      name: expName.trim(),
      productName: finalProduct,
      type: expType,
      status: 'InProgress',
      progress: 0,
      startDate: new Date().toISOString().split('T')[0],
      description: 'Newly created scientific experiment',
      hypothesis: hypothesis.trim() || `Evaluate ${expName} performance on ${finalProduct}.`,
      protocolSteps: parsedSteps.length > 0 ? parsedSteps : undefined,
    });

    setExpName('');
    setHypothesis('');
    setProtocolStepsText('');
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
            Product Testing & Scientific R&D Workbench
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            End-to-end scientific experiment lifecycle: Hypothesis, Protocol Checklists, Data Readings & Outcome Verdicts
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

      {/* Operations Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
        {[
          { id: 'experiments', label: 'All Experiments' },
          { id: 'lab', label: 'Lab Tests' },
          { id: 'stability', label: 'CIPAC Stability Logs' },
          { id: 'field', label: 'Field Trials' },
          { id: 'observations', label: 'Observations' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Render Switch */}
      {activeTab === 'lab' ? (
        <LaboratoryTests />
      ) : activeTab === 'stability' ? (
        <StabilityTracker />
      ) : activeTab === 'field' ? (
        <FieldTrials />
      ) : activeTab === 'observations' ? (
        <Observations />
      ) : (
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

                {/* Experiments Cards Grid under this Product */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {expList.map((exp) => (
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
                            {exp.outcomeStatus || 'Pending'}
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
                          "{exp.hypothesis || 'No hypothesis stated yet.'}"
                        </p>
                      </div>

                      {/* Protocol Progress */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500 text-[11px]">Protocol Checklist</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">{exp.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                            style={{ width: `${exp.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Card Footer CTA */}
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
        </div>
      )}

      {/* Interactive Scientific Workbench Modal */}
      {selectedExperiment && (
        <ScientificWorkbenchModal
          category="exp"
          item={selectedExperiment}
          onClose={() => setSelectedExperiment(null)}
        />
      )}

      {/* Create New Experiment Modal with Scientific Hypothesis */}
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
                    placeholder="e.g. pH Adjustment & Viscosity Optimization"
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
                    Scientific Hypothesis & Goal
                  </label>
                  <textarea
                    rows={2}
                    placeholder="State expected outcome, e.g. Adjusting pH to 6.2 increases emulsion shelf-life by 20%..."
                    value={hypothesis}
                    onChange={(e) => setHypothesis(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Protocol Steps (1 per line)
                  </label>
                  <textarea
                    rows={3}
                    placeholder={`e.g.\nPrepare 0.1M HCl buffer\nTitrate sample to pH 6.2\nMeasure viscosity after 24h incubation`}
                    value={protocolStepsText}
                    onChange={(e) => setProtocolStepsText(e.target.value)}
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