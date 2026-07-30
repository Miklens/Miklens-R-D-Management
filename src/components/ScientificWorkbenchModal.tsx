import React, { useState } from 'react';
import { 
  X, Plus, FlaskConical, Award, Lightbulb, 
  Beaker, Bug, MapPin, Thermometer, Calendar, Clock, CheckCircle2, History, User 
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
  const { addDailyRun, updateScientificConclusion } = useExperiments();

  // New Daily Run form state
  const existingRuns = item?.dailyRuns || [];
  const nextDayNum = existingRuns.length > 0 ? Math.max(...existingRuns.map((r: any) => r.dayNumber || 0)) + 1 : 1;

  const [dayNum, setDayNum] = useState<number>(nextDayNum);
  const [activity, setActivity] = useState('');
  const [result, setResult] = useState('');
  const [runStatus, setRunStatus] = useState<'Passed' | 'In Progress' | 'Needs Re-Run'>('Passed');
  const [showRunForm, setShowRunForm] = useState(false);

  // Conclusion state
  const [conclusionText, setConclusionText] = useState(item?.conclusion || '');
  const [outcomeStatus, setOutcomeStatus] = useState<ScientificOutcomeStatus>(item?.outcomeStatus || 'Pending');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!item) return null;

  const template: TemplateType = item.templateType || (category === 'lab' ? 'Microbiology' : category === 'stability' ? 'Stability' : category === 'field' ? 'Field' : 'Formulation');

  const handleAddRun = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity.trim()) return;

    addDailyRun(category, item.id, {
      dayNumber: Number(dayNum) || 1,
      date: new Date().toISOString().split('T')[0],
      scientistName: 'Dr. Sarah Jenkins',
      activityPerformed: activity.trim(),
      observationResult: result.trim() || 'Activity completed successfully.',
      runStatus,
    });

    setActivity('');
    setResult('');
    setShowRunForm(false);
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

  const getRunBadge = (status: string) => {
    switch (status) {
      case 'Passed':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300';
      case 'Needs Re-Run':
        return 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300';
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
            <p className="text-xs text-gray-300 mt-1 max-w-2xl">{item.description || 'Scientific R&D Experiment & Testing Operations'}</p>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-300">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  Started: {item.startDate || '2026-07-28'}
                </span>
                <span className="flex items-center gap-1 font-bold text-emerald-400">
                  <History className="w-4 h-4" />
                  {existingRuns.length} Multi-Day Execution Runs Logged
                </span>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[72vh] overflow-y-auto">
            {/* Left Column: Chronological Multi-Day Execution Traceability Timeline (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Hypothesis */}
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-emerald-600" />
                  Scientific Hypothesis & Target Goal
                </h3>
                <p className="text-xs text-gray-700 dark:text-gray-300 italic leading-relaxed">
                  "{item.hypothesis || 'Evaluate formulation & treatment parameters to achieve target efficacy and stability thresholds.'}"
                </p>
              </div>

              {/* 📜 CHRONOLOGICAL MULTI-DAY EXECUTION TRACEABILITY TIMELINE */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <History className="w-4.5 h-4.5 text-emerald-500" />
                    Multi-Day Execution Traceability Timeline
                  </h3>
                  <button
                    onClick={() => setShowRunForm(!showRunForm)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Log Today's Run
                  </button>
                </div>

                {/* Log Today's Run Form */}
                {showRunForm && (
                  <motion.form
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleAddRun}
                    className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-2xl space-y-3"
                  >
                    <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      Add Execution Entry for Day #{dayNum}
                    </h4>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-gray-600 dark:text-gray-400">Day Number</label>
                        <input
                          type="number"
                          value={dayNum}
                          onChange={(e) => setDayNum(Number(e.target.value))}
                          className="w-full mt-0.5 px-3 py-1.5 bg-white dark:bg-gray-900 border rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-semibold text-gray-600 dark:text-gray-400">Run Verdict</label>
                        <select
                          value={runStatus}
                          onChange={(e: any) => setRunStatus(e.target.value)}
                          className="w-full mt-0.5 px-3 py-1.5 bg-white dark:bg-gray-900 border rounded-lg text-xs font-bold"
                        >
                          <option value="Passed">✅ Passed / Target Met</option>
                          <option value="In Progress">⏳ In Progress / Incubating</option>
                          <option value="Needs Re-Run">❌ Needs Re-Run / Deviation</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 dark:text-gray-400">Activity & Method Performed *</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Adjusted pH from 7.4 to 6.2 using 12 mL 1M HCl buffer, brought volume to 1000 mL..."
                        value={activity}
                        onChange={(e) => setActivity(e.target.value)}
                        required
                        className="w-full mt-0.5 px-3 py-1.5 bg-white dark:bg-gray-900 border rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 dark:text-gray-400">Result & Measured Parameters</label>
                      <input
                        type="text"
                        placeholder="e.g. Viscosity 145 cPs, pH 6.2, zero precipitate observed."
                        value={result}
                        onChange={(e) => setResult(e.target.value)}
                        className="w-full mt-0.5 px-3 py-1.5 bg-white dark:bg-gray-900 border rounded-lg text-xs"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowRunForm(false)}
                        className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-200/50 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1 bg-emerald-600 text-white font-bold text-xs rounded-lg shadow"
                      >
                        Save Entry
                      </button>
                    </div>
                  </motion.form>
                )}

                {/* Timeline Feed */}
                {existingRuns.length === 0 ? (
                  <p className="text-xs text-gray-400 italic p-4 border border-dashed rounded-xl text-center">
                    No daily execution runs logged yet. Click "Log Today's Run" to record Day 1 work.
                  </p>
                ) : (
                  <div className="relative pl-6 border-l-2 border-emerald-500/30 space-y-4">
                    {existingRuns.map((run: any) => (
                      <div key={run.id} className="relative group">
                        {/* Timeline Node Icon */}
                        <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900 flex items-center justify-center text-white text-[9px] font-bold">
                          ✓
                        </div>

                        <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 bg-emerald-600 text-white font-black rounded-lg text-xs">
                                Day #{run.dayNumber}
                              </span>
                              <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                {run.date}
                              </span>
                            </div>

                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getRunBadge(run.runStatus)}`}>
                              {run.runStatus}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-900 dark:text-white leading-relaxed">
                              {run.activityPerformed}
                            </p>
                            {run.observationResult && (
                              <div className="p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                                📊 <strong>Outcome:</strong> {run.observationResult}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-[10px] text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-800">
                            <User className="w-3 h-3 text-gray-400" />
                            <span>Recorded by {run.scientistName || 'Dr. Sarah Jenkins'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Scientific Conclusion & Verdict (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800/40 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Final Scientific Verdict & Conclusion
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
                      rows={6}
                      placeholder="Record overall conclusions across all daily runs, formulation recommendations, and next steps..."
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
                    Save Final Verdict
                  </button>

                  {savedSuccess && (
                    <p className="text-xs text-emerald-600 font-bold text-center">
                      ✓ Scientific verdict saved successfully!
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
