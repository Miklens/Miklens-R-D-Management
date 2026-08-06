import React, { useState } from 'react';
import { TestTube2, Plus, X, Search, Trash2, Package, Sparkles, ChevronRight, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExperiments } from '../contexts/ExperimentContext';
import { ScientificWorkbenchModal } from '../components/ScientificWorkbenchModal';

export const LaboratoryTests: React.FC = () => {
  const { labTests, addLabTest, deleteLabTest, allProducts } = useExperiments();

  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLabTest, setSelectedLabTest] = useState<any>(null);

  // Modal State
  const [nameInput, setNameInput] = useState('');
  const [productInput, setProductInput] = useState(() => allProducts.length > 0 ? allProducts[0] : 'Active Formulation');
  const [isCustomProduct, setIsCustomProduct] = useState(false);
  const [customProductInput, setCustomProductInput] = useState('');
  const [typeInput, setTypeInput] = useState('Efficacy');
  const [labInput, setLabInput] = useState('Main Microbiology Lab');
  const [hypothesis, setHypothesis] = useState('');

  const handleCreateTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    const finalProduct = isCustomProduct ? customProductInput.trim() || 'Custom Product' : productInput;

    addLabTest({
      name: nameInput.trim(),
      productName: finalProduct,
      type: typeInput,
      status: 'InProgress',
      lab: labInput,
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      hypothesis: hypothesis.trim() || `Assay ${nameInput} for ${finalProduct}.`,
    });

    setNameInput('');
    setHypothesis('');
    setCustomProductInput('');
    setShowModal(false);
  };

  const testsByProduct = labTests
    .filter(
      (t) =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.type.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .reduce((acc, test) => {
      const pName = test.productName || 'Unassigned Product';
      if (!acc[pName]) acc[pName] = [];
      acc[pName].push(test);
      return acc;
    }, {} as Record<string, typeof labTests>);

  const getOutcomeBadge = (status?: string) => {
    switch (status) {
      case 'Passed':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300';
      case 'Failed':
        return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TestTube2 className="w-5 h-5 text-pink-500" />
            Laboratory Assay Operations & Traceability
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs">
            Product-wise quality analysis, efficacy assays, and multi-day run logs
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-xs font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          Queue Lab Test
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search lab tests or products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      {/* Product-Wise Grouped Lab Test Sections */}
      {Object.keys(testsByProduct).length === 0 ? (
        <div className="p-10 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
          <TestTube2 className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-xs font-semibold text-gray-500">No laboratory tests found.</p>
        </div>
      ) : (
        Object.entries(testsByProduct).map(([pName, testList]) => (
          <div
            key={pName}
            className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-md space-y-4"
          >
            {/* Product Section Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-pink-50 dark:bg-pink-950/40 flex items-center justify-center text-pink-600 dark:text-pink-400 font-bold text-xs">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{pName}</h3>
                  <p className="text-[11px] text-gray-400">{testList.length} Lab Assays</p>
                </div>
              </div>
            </div>

            {/* Test Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {testList.map((test) => {
                const runs = test.dailyRuns || [];
                const latestRun = runs.length > 0 ? runs[runs.length - 1] : null;

                return (
                  <div
                    key={test.id}
                    onClick={() => setSelectedLabTest(test)}
                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 space-y-3 relative group hover:border-pink-400 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white">
                        <TestTube2 className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getOutcomeBadge(test.outcomeStatus)}`}>
                          Verdict: {test.outcomeStatus || 'Pending'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteLabTest(test.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-pink-600 transition-colors">
                        {test.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                        <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded font-semibold text-gray-700 dark:text-gray-300">
                          {test.type}
                        </span>
                        <span>{test.lab}</span>
                      </div>
                    </div>

                    {/* Traceability Daily Runs Summary */}
                    <div className="bg-white dark:bg-gray-900 p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-gray-500 text-[11px]">
                        <span className="flex items-center gap-1 font-bold text-pink-600 dark:text-pink-400">
                          <History className="w-3.5 h-3.5 text-pink-500" />
                          {runs.length} Runs Logged
                        </span>
                        <span className="text-[10px]">Due: {test.dueDate}</span>
                      </div>

                      {latestRun && (
                        <p className="text-[11px] text-gray-700 dark:text-gray-300 font-medium truncate pt-1 border-t border-gray-100 dark:border-gray-800">
                          Day #{latestRun.dayNumber}: {latestRun.activityPerformed}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-gray-200/60 dark:border-gray-800 flex items-center justify-between text-[11px] text-pink-600 dark:text-pink-400 font-semibold">
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

      {/* Drawer */}
      {selectedLabTest && (
        <ScientificWorkbenchModal
          category="lab"
          item={selectedLabTest}
          onClose={() => setSelectedLabTest(null)}
        />
      )}

      {/* Modal */}
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
                  <TestTube2 className="w-4 h-4 text-pink-500" />
                  Queue New Laboratory Assay
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleCreateTest} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Test Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Active Ingredient Concentration Assay"
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
                    Scientific Hypothesis
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Active ingredient concentration stays >10 g/L across batch samples..."
                    value={hypothesis}
                    onChange={(e) => setHypothesis(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Test Category
                    </label>
                    <select
                      value={typeInput}
                      onChange={(e) => setTypeInput(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                    >
                      <option value="Efficacy">Efficacy Assay</option>
                      <option value="Quality">Quality Control</option>
                      <option value="Stability">Thermal Stability</option>
                      <option value="Safety">Toxicity / Safety</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Assay Laboratory
                    </label>
                    <input
                      type="text"
                      value={labInput}
                      onChange={(e) => setLabInput(e.target.value)}
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
                    Queue Test
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