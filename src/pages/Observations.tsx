import React, { useState } from 'react';
import { Eye, Plus, X, Search, MapPin, Trash2, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExperiments } from '../contexts/ExperimentContext';

export const Observations: React.FC = () => {
  const { observations, addObservation, deleteObservation, allProducts } = useExperiments();

  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [titleInput, setTitleInput] = useState('');
  const [productInput, setProductInput] = useState('BioShield Alpha (Bio-fungicide)');
  const [isCustomProduct, setIsCustomProduct] = useState(false);
  const [customProductInput, setCustomProductInput] = useState('');
  const [typeInput, setTypeInput] = useState('Visual');
  const [locationInput, setLocationInput] = useState('Field Plot 1');
  const [severityInput, setSeverityInput] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');

  const handleCreateObs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim()) return;

    const finalProduct = isCustomProduct ? customProductInput.trim() || 'Custom Product' : productInput;

    addObservation({
      title: titleInput.trim(),
      productName: finalProduct,
      type: typeInput,
      location: locationInput.trim() || 'Field Plot 1',
      date: new Date().toISOString().split('T')[0],
      severity: severityInput,
      status: 'Open',
    });

    setTitleInput('');
    setCustomProductInput('');
    setShowModal(false);
  };

  // Group Observations Product-Wise
  const obsByProduct = observations
    .filter(
      (o) =>
        o.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.type.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .reduce((acc, obs) => {
      const pName = obs.productName || 'Unassigned Product';
      if (!acc[pName]) acc[pName] = [];
      acc[pName].push(obs);
      return acc;
    }, {} as Record<string, typeof observations>);

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'Critical':
      case 'High':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-purple-500" />
            Field & Lab R&D Observations
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs">
            Product-wise qualitative findings, visual abnormalities, and measurement notes
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-xs font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          Log Observation
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search observations or products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      {/* Product-Wise Grouped Observation Sections */}
      {Object.keys(obsByProduct).length === 0 ? (
        <div className="p-10 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
          <Eye className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-xs font-semibold text-gray-500">No observations found.</p>
        </div>
      ) : (
        Object.entries(obsByProduct).map(([pName, obsList]) => (
          <div
            key={pName}
            className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-md space-y-4"
          >
            {/* Product Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xs">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{pName}</h3>
                  <p className="text-[11px] text-gray-400">{obsList.length} Recorded Findings</p>
                </div>
              </div>
            </div>

            {/* Observations List */}
            <div className="space-y-3">
              {obsList.map((obs) => (
                <div
                  key={obs.id}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{obs.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(obs.severity)}`}>
                        {obs.severity}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                      <span>Type: <strong className="text-gray-700 dark:text-gray-300">{obs.type}</strong></span>
                      <span>•</span>
                      <span>Location: <strong className="text-gray-700 dark:text-gray-300">{obs.location}</strong></span>
                      <span>•</span>
                      <span>Date: {obs.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-bold rounded-full">
                      {obs.status}
                    </span>
                    <button
                      onClick={() => deleteObservation(obs.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
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
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-purple-500" />
                  Log New Observation
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleCreateObs} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Observation Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BioShield Alpha - Rapid fungal cell lysis observed"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Observation Type
                    </label>
                    <select
                      value={typeInput}
                      onChange={(e) => setTypeInput(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                    >
                      <option value="Visual">Visual Inspection</option>
                      <option value="Measurement">Measurement Data</option>
                      <option value="Environmental">Environmental Condition</option>
                      <option value="Equipment">Equipment Calibration</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Location / Plot
                    </label>
                    <input
                      type="text"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
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
                    Log Observation
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