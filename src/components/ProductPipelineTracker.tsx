import React, { useMemo } from 'react';
import { Layers, CheckCircle2, AlertTriangle, Clock, FlaskConical, Beaker, ShieldCheck, ChevronRight, Award } from 'lucide-react';
import { useExperiments } from '../contexts/ExperimentContext';
import { getSyncedTrials, getSyncedFormulations } from '../services/trialManagerSync';

export const ProductPipelineTracker: React.FC = () => {
  const { experiments, labTests, stabilityLogs, fieldTrials, allProducts } = useExperiments();
  const syncedTrials = useMemo(() => getSyncedTrials(), []);
  const syncedFormulations = useMemo(() => getSyncedFormulations(), []);

  // Compute product R&D milestone progress
  const productPipelines = useMemo(() => {
    // Combine all known product names dynamically
    const productSet = new Set<string>();
    allProducts.forEach(p => productSet.add(p));
    syncedTrials.forEach(t => { if (t.productName) productSet.add(t.productName); });
    syncedFormulations.forEach(f => { if (f.name) productSet.add(f.name); });

    const products = Array.from(productSet);

    if (products.length === 0) {
      return [];
    }

    return products.map((prodName) => {
      const prodSynced = syncedTrials.filter(t => (t.productName || '').toLowerCase().includes(prodName.toLowerCase()) || (t.title || '').toLowerCase().includes(prodName.toLowerCase()));
      const prodExps = experiments.filter(e => (e.productName || '').toLowerCase().includes(prodName.toLowerCase()));
      const prodLab = labTests.filter(l => (l.productName || '').toLowerCase().includes(prodName.toLowerCase()));
      const prodStab = stabilityLogs.filter(s => (s.productName || '').toLowerCase().includes(prodName.toLowerCase()));

      // Gates completion check
      const gate1Design = true; // Always designed
      const gate2Lab = prodLab.length > 0 || prodExps.length > 0 || prodSynced.length > 0;
      const gate3Stability = prodStab.length > 0 || prodSynced.length > 0;
      const gate4Field = prodSynced.length > 0;
      const gate5Commercial = prodSynced.some(t => t.isCompleted && (t.resultRating === 'Excellent' || t.resultRating === 'Good'));

      let currentStageName = 'Gate 1: Formula Design';
      let progressPct = 20;

      if (gate5Commercial) {
        currentStageName = 'Gate 5: Approved for Scale-Up';
        progressPct = 100;
      } else if (gate4Field) {
        currentStageName = 'Gate 4: Field Evaluation';
        progressPct = 80;
      } else if (gate3Stability) {
        currentStageName = 'Gate 3: CIPAC Stability Assay';
        progressPct = 60;
      } else if (gate2Lab) {
        currentStageName = 'Gate 2: Lab Assay & Titration';
        progressPct = 40;
      }

      // Compute overall verdict
      let verdict = 'Pending Evaluation';
      let verdictColor = 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300';

      if (gate5Commercial) {
        verdict = 'PASSED / Commercial Clearance';
        verdictColor = 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300';
      } else if (prodSynced.some(t => t.resultRating === 'Poor')) {
        verdict = 'FAILED / Reformulation Required';
        verdictColor = 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300';
      } else if (prodSynced.length > 0) {
        verdict = 'Active Field Testing';
        verdictColor = 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300';
      }

      return {
        productName: prodName,
        currentStageName,
        progressPct,
        verdict,
        verdictColor,
        gates: [
          { name: '1. Formula Design', completed: gate1Design },
          { name: '2. Lab Assay', completed: gate2Lab },
          { name: '3. Stability', completed: gate3Stability },
          { name: '4. Field Trial', completed: gate4Field },
          { name: '5. Scale-Up', completed: gate5Commercial },
        ],
        trialsCount: prodSynced.length,
      };
    });
  }, [allProducts, syncedTrials, syncedFormulations, experiments, labTests, stabilityLogs]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-500" />
            Product R&D Stage Progression & Milestone Pipeline
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
            Visual tracking of formulations through the 5 core R&D stage gates
          </p>
        </div>

        <span className="text-xs font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-3 py-1.5 rounded-xl border border-purple-200 shrink-0">
          {productPipelines.length} Active Formulations
        </span>
      </div>

      {/* Product List */}
      <div className="space-y-4">
        {productPipelines.length > 0 ? (
          productPipelines.map((prod) => (
            <div
              key={prod.productName}
              className="p-4 bg-gray-50/50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3"
            >
              {/* Product Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                    {prod.productName}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${prod.verdictColor}`}>
                      {prod.verdict}
                    </span>
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Current Stage: <strong className="text-purple-600 dark:text-purple-400">{prod.currentStageName}</strong> ({prod.trialsCount} linked field trials)
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-gray-900 dark:text-white">
                    {prod.progressPct}% Complete
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${prod.progressPct}%` }}
                />
              </div>

              {/* 5 Stage Gates Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-[11px]">
                {prod.gates.map((g, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-xl border font-bold text-center flex items-center justify-center gap-1.5 ${
                      g.completed
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800 dark:text-gray-500'
                    }`}
                  >
                    {g.completed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    )}
                    <span className="truncate">{g.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-400 italic text-center py-6">
            No active product formulations found in database.
          </p>
        )}
      </div>
    </div>
  );
};
