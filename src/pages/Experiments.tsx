import React, { useState } from 'react';
import { Beaker, Plus, X, Search, FlaskConical, CheckCircle2, AlertCircle, Trash2, Package, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LaboratoryTests } from './LaboratoryTests';
import { StabilityTracker } from './StabilityTracker';
import { FieldTrials } from './FieldTrials';
import { Observations } from './Observations';
import { useExperiments } from '../contexts/ExperimentContext';
import type { ExperimentType, ExperimentStatus } from '../types/experimentTypes';

export const Experiments: React.FC = () => {
  const { experiments, addExperiment, deleteExperiment } = useExperiments();

  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'experiments' | 'lab' | 'stability' | 'field' | 'observations'>('experiments');

  // Modal State
  const [expName, setExpName] = useState('');
  const [productName, setProductName] = useState('BioShield Alpha (Bio-fungicide)');
  const [isCustomProduct, setIsCustomProduct] = useState(false);
  const [customProductName, setCustomProductName] = useState('');
  const [expType, setExpType] = useState<ExperimentType>('Lab');

  const PRODUCTS = [
    'BioShield Alpha (Bio-fungicide)',
    '+ Add Custom Product...',
  ];

  const handleCreateExperiment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expName.trim()) return;

    const finalProduct = isCustomProduct ? customProductName.trim() || 'Custom Product' : productName;

    addExperiment({
      name: expName.trim(),
      productName: finalProduct,
      type: expType,
      status: 'InProgress',
      progress: 10,
      startDate: new Date().toISOString().split('T')[0],
      description: 'Newly created experiment',
    });

    setExpName('');
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'Blocked':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-blue-500" />;
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
            Product Testing & R&D Operations
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            Product-wise structured lab tests, CIPAC stability tracking, field trials, and observations
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
              placeholder="Search experiments or products..."
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
                      className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 space-y-3 relative group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white">
                          <FlaskConical className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(exp.status)}
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                            {exp.status}
                          </span>
                          <button
                            onClick={() => deleteExperiment(exp.id)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{exp.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Type: <span className="font-medium">{exp.type}</span> • Started: {exp.startDate}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500">Progress</span>
                          <span className="font-bold text-gray-900 dark:text-white">{exp.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                            style={{ width: `${exp.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* New Experiment Modal */}
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
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-500" />
                  Create New Product Experiment
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
                    Experiment Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BioShield pH Adjustment Assay"
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