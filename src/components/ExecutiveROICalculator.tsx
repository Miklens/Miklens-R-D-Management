import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, ShieldCheck, Award, AlertCircle, ArrowUpRight, Calculator, PieChart, Sparkles } from 'lucide-react';
import { getSyncedTrials } from '../services/trialManagerSync';

export const ExecutiveROICalculator: React.FC = () => {
  const syncedTrials = useMemo(() => getSyncedTrials(), []);
  const [adoptionRate, setAdoptionRate] = useState<number>(75); // % Market Adoption slider
  const [avgProductPrice, setAvgProductPrice] = useState<number>(450); // ₹/Liter or $/Unit

  const analyticsData = useMemo(() => {
    const totalTrials = syncedTrials.length;
    const completedTrials = syncedTrials.filter(t => t.isCompleted);
    const highEfficacyTrials = syncedTrials.filter(t => {
      const lastEval = t.evaluations && t.evaluations.length > 0 ? t.evaluations[t.evaluations.length - 1] : null;
      return (lastEval && lastEval.efficacyPercent >= 80) || t.resultRating === 'Excellent';
    });

    const pipelineProducts = [
      { name: 'BioCide Pro (Herbicide)', category: 'Herbicide', stage: 'Field Trial (Stage 4)', efficacy: 92, targetVolumeUnits: 120000 },
      { name: 'PhytoShield Ultra (Fungicide)', category: 'Fungicide', stage: 'Scale-Up (Stage 5)', efficacy: 88, targetVolumeUnits: 95000 },
      { name: 'BioNeem Gold (Pesticide)', category: 'Pesticide', stage: 'CIPAC Stability (Stage 3)', efficacy: 85, targetVolumeUnits: 75000 },
      { name: 'MicroNutri Max (Biostimulant)', category: 'Nutrition', stage: 'Lab Assay (Stage 2)', efficacy: 79, targetVolumeUnits: 150000 },
    ];

    const totalTargetUnits = pipelineProducts.reduce((sum, p) => sum + p.targetVolumeUnits, 0);
    const grossValuation = Math.round(totalTargetUnits * avgProductPrice * (adoptionRate / 100));
    const estimatedCost = Math.round(grossValuation * 0.35); // 35% COGS + R&D Spend
    const netProfitProjection = grossValuation - estimatedCost;
    const projectedROI = Math.round((netProfitProjection / estimatedCost) * 100);

    return {
      totalTrials,
      completedCount: completedTrials.length,
      highEfficacyCount: highEfficacyTrials.length,
      pipelineProducts,
      totalTargetUnits,
      grossValuation,
      estimatedCost,
      netProfitProjection,
      projectedROI,
    };
  }, [syncedTrials, adoptionRate, avgProductPrice]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-2xl border border-emerald-500/20 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              COMMERCIAL PIPELINE FINANCIAL MODEL
            </span>
            <h3 className="text-xl font-black text-white mt-1 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              Executive R&D ROI & Commercialization Valuation Engine
            </h3>
            <p className="text-xs text-gray-300 mt-0.5 font-medium">
              Forecasted market valuation and net profit projections based on active R&D formulation field efficacy
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-[10px] font-bold text-gray-400 block uppercase">Projected Net ROI</span>
              <span className="text-2xl font-black text-emerald-400">+{analyticsData.projectedROI}%</span>
            </div>
          </div>
        </div>

        {/* Dynamic Controls Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-white/10">
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span>Expected Market Adoption Rate:</span>
              <span className="text-emerald-400 font-black">{adoptionRate}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={adoptionRate}
              onChange={(e) => setAdoptionRate(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span>Average Unit Realization Price:</span>
              <span className="text-emerald-400 font-black">₹{avgProductPrice} / Unit</span>
            </div>
            <input
              type="range"
              min="100"
              max="1500"
              step="50"
              value={avgProductPrice}
              onChange={(e) => setAvgProductPrice(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl space-y-2">
          <span className="text-[10px] font-black uppercase text-gray-400 block">Gross Market Valuation</span>
          <p className="text-2xl font-black text-gray-900 dark:text-white">
            ₹{(analyticsData.grossValuation / 1000000).toFixed(2)} Cr
          </p>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Based on {analyticsData.totalTargetUnits.toLocaleString()} units
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl space-y-2">
          <span className="text-[10px] font-black uppercase text-gray-400 block">Estimated R&D + COGS Expense</span>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
            ₹{(analyticsData.estimatedCost / 1000000).toFixed(2)} Cr
          </p>
          <span className="text-[11px] font-semibold text-gray-400">35% estimated formulation cost</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl space-y-2">
          <span className="text-[10px] font-black uppercase text-gray-400 block">Projected Net Profit</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ₹{(analyticsData.netProfitProjection / 1000000).toFixed(2)} Cr
          </p>
          <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> High Margin R&D Pipeline
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl space-y-2">
          <span className="text-[10px] font-black uppercase text-gray-400 block">High-Efficacy Candidates</span>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {analyticsData.highEfficacyCount} Candidates
          </p>
          <span className="text-[11px] font-bold text-purple-500 flex items-center gap-1">
            <Award className="w-3.5 h-3.5" /> Efficacy Rating ≥ 80%
          </span>
        </div>
      </div>

      {/* Commercialization Candidate Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl space-y-4">
        <h4 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          Active R&D Commercialization Candidates & Valuation Breakdown
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 uppercase font-black">
                <th className="pb-3">Product Name</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">R&D Milestone Stage</th>
                <th className="pb-3">Field Efficacy</th>
                <th className="pb-3">Target Volume</th>
                <th className="pb-3 text-right">Projected Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-semibold text-gray-800 dark:text-gray-200">
              {analyticsData.pipelineProducts.map((p, idx) => {
                const estRev = Math.round(p.targetVolumeUnits * avgProductPrice * (adoptionRate / 100));

                return (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="py-3 font-black text-gray-900 dark:text-white">{p.name}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">{p.stage}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {p.efficacy}% WCE
                      </span>
                    </td>
                    <td className="py-3">{p.targetVolumeUnits.toLocaleString()} Units</td>
                    <td className="py-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                      ₹{(estRev / 100000).toFixed(2)} Lakhs
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
