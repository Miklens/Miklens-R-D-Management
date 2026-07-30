import React, { useState } from 'react';
import { 
  X, CheckSquare, Square, Plus, FlaskConical, Award, Table, Lightbulb, 
  Beaker, Bug, MapPin, Thermometer, Layers, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExperiments } from '../contexts/ExperimentContext';
import type { ScientificOutcomeStatus, TemplateType } from '../types/experimentTypes';

interface ScientificWorkbenchProps {
  category: 'exp' | 'lab' | 'stability' | 'field';
  item: any;
  onClose: () => void;
}

export const ScientificWorkbenchModal: React.FC<ScientificWorkbenchProps> = ({
  category,
  item,
  onClose,
}) => {
  const { toggleProtocolStep, addDataReading, updateScientificConclusion } = useExperiments();

  // Local Data Reading state
  const [paramName, setParamName] = useState('');
  const [paramValue, setParamValue] = useState('');
  const [paramUnit, setParamUnit] = useState('');

  // Conclusion state
  const [conclusionText, setConclusionText] = useState(item?.conclusion || '');
  const [outcomeStatus, setOutcomeStatus] = useState<ScientificOutcomeStatus>(item?.outcomeStatus || 'Pending');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Formulation Makeup Calculator state
  const [initialVol, setInitialVol] = useState('800');
  const [targetVol, setTargetVol] = useState('1000');
  const makeupVolNeeded = Math.max(0, (parseFloat(targetVol) || 0) - (parseFloat(initialVol) || 0));

  if (!item) return null;

  const template: TemplateType = item.templateType || (category === 'lab' ? 'Microbiology' : category === 'stability' ? 'Stability' : category === 'field' ? 'Field' : 'Formulation');

  const handleAddReading = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paramName.trim() || !paramValue.trim()) return;

    addDataReading(category, item.id, {
      parameter: paramName.trim(),
      value: paramValue.trim(),
      unit: paramUnit.trim() || '-',
    });

    setParamName('');
    setParamValue('');
    setParamUnit('');
  };

  const handleSaveConclusion = (e: React.FormEvent) => {
    e.preventDefault();
    updateScientificConclusion(category, item.id, conclusionText, outcomeStatus);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const getOutcomeBadge = (status?: ScientificOutcomeStatus) => {
    switch (status) {
      case 'Passed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300';
      case 'Failed':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300';
      case 'Inconclusive':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-5xl overflow-hidden my-6"
        >
          {/* Top Header Banner */}
          <div className="p-6 bg-gradient-to-r from-slate-900 via-gray-900 to-emerald-950 text-white relative">
            <button
              onClick={onClose}
              className="absolute right-5 top-5 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {item.productName}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                {template === 'Formulation' && <Beaker className="w-3 h-3 text-purple-400" />}
                {template === 'Microbiology' && <Bug className="w-3 h-3 text-pink-400" />}
                {template === 'Stability' && <Thermometer className="w-3 h-3 text-amber-400" />}
                {template === 'Field' && <MapPin className="w-3 h-3 text-emerald-400" />}
                Template: {template}
              </span>
              <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${getOutcomeBadge(outcomeStatus)}`}>
                Verdict: {outcomeStatus || 'Pending'}
              </span>
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight">{item.name || item.title || item.batchNo}</h2>
            <p className="text-xs text-gray-300 mt-1 max-w-2xl">{item.description || 'Specialized Scientific R&D Experiment'}</p>

            {/* Live Progress Bar */}
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs text-gray-300 mb-1">
                  <span>Protocol Checklist Progress</span>
                  <span className="font-bold text-emerald-400">{item.progress}% Completed</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[72vh] overflow-y-auto">
            {/* Left Column: Specialized Template Widgets (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* 🎯 Hypothesis & Objective */}
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-emerald-600" />
                  Scientific Hypothesis & Objective
                </h3>
                <p className="text-xs text-gray-700 dark:text-gray-300 italic leading-relaxed">
                  "{item.hypothesis || 'Evaluate formulation & treatment parameters to achieve target efficacy and stability thresholds.'}"
                </p>
              </div>

              {/* SPECIALIZED TEMPLATE WIDGET 1: Formulation Recipe & Volume Makeup */}
              {template === 'Formulation' && (
                <div className="p-4 bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 rounded-2xl space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                    <Beaker className="w-4 h-4 text-purple-600" />
                    Formulation Composition & Volume Makeup Calculator
                  </h3>

                  {/* Volume Makeup Calculator */}
                  <div className="grid grid-cols-3 gap-2 bg-white dark:bg-gray-800 p-3 rounded-xl border border-purple-100 dark:border-purple-900 text-xs">
                    <div>
                      <label className="text-[10px] text-gray-400 block font-semibold">Initial Vol (mL)</label>
                      <input
                        type="number"
                        value={initialVol}
                        onChange={(e) => setInitialVol(e.target.value)}
                        className="w-full mt-0.5 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 rounded font-bold text-purple-700 dark:text-purple-300"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block font-semibold">Target Vol (mL)</label>
                      <input
                        type="number"
                        value={targetVol}
                        onChange={(e) => setTargetVol(e.target.value)}
                        className="w-full mt-0.5 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 rounded font-bold text-purple-700 dark:text-purple-300"
                      />
                    </div>
                    <div className="bg-purple-100 dark:bg-purple-900/40 p-2 rounded flex flex-col justify-center">
                      <span className="text-[10px] text-purple-600 dark:text-purple-300 font-bold">Solvent Makeup</span>
                      <span className="text-sm font-extrabold text-purple-900 dark:text-purple-100">+{makeupVolNeeded} mL</span>
                    </div>
                  </div>

                  {/* Batch Recipe Ingredients Table */}
                  <div className="border border-purple-100 dark:border-purple-900 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left bg-white dark:bg-gray-900">
                      <thead className="bg-purple-100/50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-bold text-[11px]">
                        <tr>
                          <th className="p-2">Ingredient</th>
                          <th className="p-2">Function / Purpose</th>
                          <th className="p-2">Target Quantity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-50 dark:divide-purple-900/30">
                        <tr>
                          <td className="p-2 font-semibold">BioShield Bio-Active Spores</td>
                          <td className="p-2 text-gray-500">Active Fungicide Agent</td>
                          <td className="p-2 font-bold text-purple-600">25.0 g/L</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold">Polyoxyethylene Sorbitan (Tween 80)</td>
                          <td className="p-2 text-gray-500">Emulsifier & Surfactant</td>
                          <td className="p-2 font-bold text-purple-600">4.5 % w/v</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold">Citric Acid / Sodium Citrate</td>
                          <td className="p-2 text-gray-500">pH Buffer System (pH 6.2)</td>
                          <td className="p-2 font-bold text-purple-600">1.2 % w/v</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold">Deionized Water (DI Water)</td>
                          <td className="p-2 text-gray-500">Solvent / Volume Makeup</td>
                          <td className="p-2 font-bold text-purple-600">q.s. to {targetVol} mL</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SPECIALIZED TEMPLATE WIDGET 2: Microbiology & Efficacy */}
              {template === 'Microbiology' && (
                <div className="p-4 bg-pink-50/40 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/40 rounded-2xl space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-pink-800 dark:text-pink-300 flex items-center gap-1.5">
                    <Bug className="w-4 h-4 text-pink-600" />
                    Microbiological Pathogen Assay Parameters
                  </h3>

                  <div className="grid grid-cols-2 gap-3 bg-white dark:bg-gray-800 p-3 rounded-xl border border-pink-100 dark:border-pink-900 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 block font-semibold">Target Pathogen</span>
                      <span className="font-extrabold text-pink-700 dark:text-pink-300">Botrytis cinerea / Fusarium</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-semibold">Plating Assay Method</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">Agar Well Diffusion Assay</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SPECIALIZED TEMPLATE WIDGET 3: CIPAC Stability */}
              {template === 'Stability' && (
                <div className="p-4 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-amber-600" />
                    CIPAC Thermal Degradation Mapping
                  </h3>

                  <div className="grid grid-cols-3 gap-2 bg-white dark:bg-gray-800 p-3 rounded-xl border border-amber-100 dark:border-amber-900 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 block font-semibold">Chamber Temp</span>
                      <span className="font-extrabold text-amber-700 dark:text-amber-300">{item.chamberTemp || '54°C (Accelerated)'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-semibold">Active Retention %</span>
                      <span className="font-extrabold text-emerald-600">{item.activeRetention || 95.8}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-semibold">pH Stability</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{item.pH || 6.5} pH</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 📋 Interactive Protocol Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-500" />
                    Scientific Protocol Checklist
                  </h3>
                  <span className="text-[11px] text-gray-400 font-mono">
                    {(item.protocolSteps || []).filter((s: any) => s.completed).length} /{' '}
                    {(item.protocolSteps || []).length} Steps
                  </span>
                </div>

                <div className="space-y-2">
                  {(item.protocolSteps || []).map((step: any) => (
                    <div
                      key={step.id}
                      onClick={() => toggleProtocolStep(category, item.id, step.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                        step.completed
                          ? 'bg-emerald-50/70 border-emerald-200 text-gray-800 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-gray-200'
                          : 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800/40 dark:border-gray-800 dark:text-gray-300 hover:border-emerald-400'
                      }`}
                    >
                      {step.completed ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400 shrink-0" />
                      )}
                      <span className={`text-xs font-medium ${step.completed ? 'line-through text-gray-500' : ''}`}>
                        {step.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 📊 Raw Data Readings Table */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Table className="w-4 h-4 text-blue-500" />
                  Experimental Readings & Parameter Log
                </h3>

                <form onSubmit={handleAddReading} className="grid grid-cols-12 gap-2 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-200 dark:border-gray-800">
                  <input
                    type="text"
                    placeholder="Parameter (e.g. pH, Viscosity)"
                    value={paramName}
                    onChange={(e) => setParamName(e.target.value)}
                    className="col-span-5 px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. 6.2)"
                    value={paramValue}
                    onChange={(e) => setParamValue(e.target.value)}
                    className="col-span-3 px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Unit (e.g. cPs)"
                    value={paramUnit}
                    onChange={(e) => setParamUnit(e.target.value)}
                    className="col-span-2 px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs"
                  />
                  <button
                    type="submit"
                    className="col-span-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </form>

                {(item.dataReadings || []).length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No numeric data readings logged yet.</p>
                ) : (
                  <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-semibold">
                        <tr>
                          <th className="p-2.5">Parameter</th>
                          <th className="p-2.5">Value</th>
                          <th className="p-2.5">Unit</th>
                          <th className="p-2.5">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {(item.dataReadings || []).map((rd: any) => (
                          <tr key={rd.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                            <td className="p-2.5 font-bold text-gray-900 dark:text-white">{rd.parameter}</td>
                            <td className="p-2.5 text-emerald-600 font-bold">{rd.value}</td>
                            <td className="p-2.5 text-gray-500">{rd.unit}</td>
                            <td className="p-2.5 text-[10px] text-gray-400">{rd.timestamp}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Scientific Conclusion & Verdict (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800/40 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Scientific Conclusion & Verdict
                </h3>

                <form onSubmit={handleSaveConclusion} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Scientific Verdict / Outcome
                    </label>
                    <select
                      value={outcomeStatus}
                      onChange={(e: any) => setOutcomeStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
                    >
                      <option value="Pending">⏳ Pending Evaluation</option>
                      <option value="Passed">✅ PASSED / Approved for Scale-Up</option>
                      <option value="Failed">❌ FAILED / Requires Reformulation</option>
                      <option value="Inconclusive">⚠️ INCONCLUSIVE / Re-Run Protocol</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Scientific Summary & Key Findings
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Record detailed conclusions, observations, and recommendations for the formulation team..."
                      value={conclusionText}
                      onChange={(e) => setConclusionText(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 hover:from-emerald-600 hover:to-teal-600 transition-all"
                  >
                    <Award className="w-4 h-4" />
                    Save Scientific Conclusion
                  </button>

                  {savedSuccess && (
                    <p className="text-xs text-emerald-600 font-bold text-center">
                      ✓ Scientific conclusion saved successfully!
                    </p>
                  )}
                </form>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
