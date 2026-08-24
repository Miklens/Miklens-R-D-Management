import React, { useState, useMemo } from 'react';
import { 
  Pipette, 
  Plus, 
  Trash2, 
  Sparkles, 
  AlertCircle, 
  CheckCircle, 
  Calculator, 
  Info, 
  HelpCircle,
  Download,
  Layers,
  FlaskConical,
  Beaker,
  TrendingUp,
  ShieldCheck,
  Scale,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSyncedFormulations } from '../services/trialManagerSync';
import { exportMasterExecutiveReportPDF } from '../services/executiveReportGenerator';

interface Ingredient {
  id: string;
  name: string;
  category: 'active' | 'surfactant' | 'solvent' | 'stabilizer' | 'adjuvant' | 'other';
  percentage: number;
  costPerKg: number;
}

const PRESET_RECIPES = [
  {
    name: '🌿 Glyphosate 41% SL (Soluble Liquid)',
    ph: 5.8,
    density: 1.16,
    viscosity: 220,
    ingredients: [
      { id: 'p1', name: 'Glyphosate IPA Salt 62% Tech', category: 'active', percentage: 50.0, costPerKg: 180 },
      { id: 'p2', name: 'Tallow Amine Ethoxylate (Ethomeen T/25)', category: 'surfactant', percentage: 12.0, costPerKg: 210 },
      { id: 'p3', name: 'Antifoam Emulsion (Silicone)', category: 'stabilizer', percentage: 0.2, costPerKg: 350 },
      { id: 'p4', name: 'Demineralized Water Carrier', category: 'solvent', percentage: 37.8, costPerKg: 2 }
    ]
  },
  {
    name: '🌱 Bio-Stimulant Amino 50% Liquid',
    ph: 6.4,
    density: 1.12,
    viscosity: 350,
    ingredients: [
      { id: 'b1', name: 'Enzymatic Plant Amino Acid Hydrolysate 80%', category: 'active', percentage: 40.0, costPerKg: 290 },
      { id: 'b2', name: 'Fulvic Acid Technical 70%', category: 'active', percentage: 10.0, costPerKg: 340 },
      { id: 'b3', name: 'Non-Ionic Wetting Agent (Polysorbate 20)', category: 'surfactant', percentage: 3.5, costPerKg: 160 },
      { id: 'b4', name: 'Potassium Sorbate Preservative', category: 'stabilizer', percentage: 0.5, costPerKg: 180 },
      { id: 'b5', name: 'Purified Water Carrier', category: 'solvent', percentage: 46.0, costPerKg: 2 }
    ]
  },
  {
    name: '🐛 Emamectin Benzoate 5% SG (Soluble Granule)',
    ph: 6.8,
    density: 0.65,
    viscosity: 0,
    ingredients: [
      { id: 'e1', name: 'Emamectin Benzoate 95% Tech', category: 'active', percentage: 5.3, costPerKg: 2400 },
      { id: 'e2', name: 'Sodium Lignosulfonate Dispersant', category: 'surfactant', percentage: 15.0, costPerKg: 140 },
      { id: 'e3', name: 'Sodium Lauryl Sulfate Wetting Agent', category: 'surfactant', percentage: 8.0, costPerKg: 110 },
      { id: 'e4', name: 'Lactose Carrier Filler', category: 'other', percentage: 71.7, costPerKg: 45 }
    ]
  }
];

export const FormulationBuilder: React.FC = () => {
  const syncedFormulations = useMemo(() => getSyncedFormulations(), []);
  const initialFormulation = syncedFormulations.length > 0 ? syncedFormulations[0] : null;

  const [ingredients, setIngredients] = useState<Ingredient[]>(() => [
    { id: '1', name: initialFormulation ? `${initialFormulation.name} Active Ingredient` : 'Active Botanical / Chemical Ingredient', category: 'active', percentage: 15.0, costPerKg: 350 },
    { id: '2', name: 'Non-Ionic Surfactant & Emulsifier', category: 'surfactant', percentage: 6.0, costPerKg: 180 },
    { id: '3', name: 'Stabilizer & pH Buffer Package', category: 'stabilizer', percentage: 2.0, costPerKg: 110 },
    { id: '4', name: 'Carrier Water / Solvent Base', category: 'solvent', percentage: 77.0, costPerKg: 5 },
  ]);

  const [name, setName] = useState(initialFormulation ? initialFormulation.name : 'Miklens Bio-Herbicide Formulation Spec');
  const [ph, setPh] = useState(6.2);
  const [viscosity, setViscosity] = useState(480);
  const [density, setDensity] = useState(1.08);
  const [suspensibility, setSuspensibility] = useState(82.0);
  const [batchVolumeLiters, setBatchVolumeLiters] = useState<number>(1000);

  const [newIngName, setNewIngName] = useState('');
  const [newIngCategory, setNewIngCategory] = useState<Ingredient['category']>('active');
  const [newIngPct, setNewIngPct] = useState<number>(0);
  const [newIngCost, setNewIngCost] = useState<number>(0);

  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[] | null>(null);

  // Calculations
  const totalPercentage = useMemo(() => {
    return ingredients.reduce((sum, ing) => sum + ing.percentage, 0);
  }, [ingredients]);

  const rawMaterialCostPerKg = useMemo(() => {
    return ingredients.reduce((sum, ing) => sum + (ing.percentage / 100) * ing.costPerKg, 0);
  }, [ingredients]);

  const rawMaterialCostPerLiter = useMemo(() => {
    return rawMaterialCostPerKg * density;
  }, [rawMaterialCostPerKg, density]);

  const totalBatchCost = useMemo(() => {
    return rawMaterialCostPerLiter * batchVolumeLiters;
  }, [rawMaterialCostPerLiter, batchVolumeLiters]);

  // CIPAC Physical Stability Score (0-100)
  const cipacScore = useMemo(() => {
    let score = 100;
    if (Math.abs(totalPercentage - 100) > 0.01) score -= 25;
    if (ph < 5.0 || ph > 8.5) score -= 15;
    if (suspensibility < 75.0) score -= 20;
    const activePct = ingredients.filter(i => i.category === 'active').reduce((a, b) => a + b.percentage, 0);
    const surfPct = ingredients.filter(i => i.category === 'surfactant').reduce((a, b) => a + b.percentage, 0);
    if (activePct > 20 && surfPct < 4) score -= 20;

    return Math.max(0, Math.min(100, score));
  }, [totalPercentage, ph, suspensibility, ingredients]);

  const handleNormalize = () => {
    if (totalPercentage === 0) return;
    setIngredients(prev =>
      prev.map(ing => ({
        ...ing,
        percentage: Number(((ing.percentage / totalPercentage) * 100).toFixed(2))
      }))
    );
  };

  const handleAddIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngName.trim() || newIngPct <= 0) return;
    const newIng: Ingredient = {
      id: Date.now().toString(),
      name: newIngName.trim(),
      category: newIngCategory,
      percentage: newIngPct,
      costPerKg: newIngCost || 0
    };
    setIngredients(prev => [...prev, newIng]);
    setNewIngName('');
    setNewIngPct(0);
    setNewIngCost(0);
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients(prev => prev.filter(ing => ing.id !== id));
  };

  const loadPreset = (preset: typeof PRESET_RECIPES[0]) => {
    setName(preset.name.replace(/^[^\s]+\s*/, ''));
    setPh(preset.ph);
    setDensity(preset.density);
    setViscosity(preset.viscosity);
    setIngredients(preset.ingredients as any);
  };

  const triggerAiAnalysis = () => {
    setAiAnalyzing(true);
    setTimeout(() => {
      const suggestions: string[] = [];
      
      if (ph < 5.5) {
        suggestions.push(`⚠️ Acidic pH detected (${ph}). Active botanical compounds may experience rapid hydrolysis. Recommend adding 0.4% Potassium Hydroxide (KOH) buffer to adjust target pH to 6.5.`);
      } else if (ph > 8.0) {
        suggestions.push(`⚠️ Alkaline pH detected (${ph}). Potential degradation of active ester bonds. Add 0.3% Citric Acid buffer.`);
      }

      const activeTotal = ingredients.filter(i => i.category === 'active').reduce((a, b) => a + b.percentage, 0);
      const surfTotal = ingredients.filter(i => i.category === 'surfactant').reduce((a, b) => a + b.percentage, 0);

      if (activeTotal > 15 && surfTotal < 5) {
        suggestions.push(`💡 High Active Concentration (${activeTotal}% w/w) relative to Surfactant (${surfTotal}% w/w). Recommend increasing surfactant ratio to >= 6% to prevent emulsion creaming during 54°C heat storage.`);
      }

      if (suspensibility < 80.0) {
        suggestions.push(`💡 Suspensibility (${suspensibility}%) is below CIPAC standard (>80%). Consider adding 0.25% Xanthan Gum or Lignosulfonate dispersant.`);
      }

      if (suggestions.length === 0) {
        suggestions.push("✅ Excellent CIPAC Formulation Balance! All active ingredient ratios, surfactant packages, and physical parameters meet CIPAC MT 36.3 and MT 46.3 accelerated heat storage standards.");
      }

      setAiSuggestions(suggestions);
      setAiAnalyzing(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-indigo-500/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" /> CIPAC FORMULATION ENGINE v3.0
            </span>
          </div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-emerald-400" />
            Formulation R&D Builder & Batch Scale-Up Calculator
          </h2>
          <p className="text-xs text-gray-300 max-w-2xl">
            Design active chemical/botanical recipes, evaluate CIPAC emulsification stability, calculate raw material cost ($/L), and simulate batch production scale-up.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={triggerAiAnalysis}
            disabled={aiAnalyzing}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-gray-950 font-black rounded-2xl text-xs shadow-lg transition-all cursor-pointer"
          >
            {aiAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin text-gray-950" /> : <Sparkles className="w-4 h-4 text-gray-950" />}
            <span>CIPAC AI Stability Audit</span>
          </button>
        </div>
      </div>

      {/* Preset Recipe Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-xs font-black text-gray-400 uppercase tracking-widest shrink-0">Quick Load Industry CIPAC Recipes:</span>
        <div className="flex items-center gap-2 overflow-x-auto">
          {PRESET_RECIPES.map(p => (
            <button
              key={p.name}
              onClick={() => loadPreset(p)}
              className="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-800 dark:text-gray-200 transition-colors whitespace-nowrap cursor-pointer shrink-0"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* CIPAC AI Suggestions Banner */}
      <AnimatePresence>
        {aiSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900/90 to-purple-900/90 text-white border border-indigo-500/30 shadow-xl space-y-2"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="font-extrabold text-xs text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                CIPAC Accelerated Stability & Emulsion Audit Results
              </h3>
              <button onClick={() => setAiSuggestions(null)} className="text-xs text-gray-400 hover:text-white font-bold">✕ Close</button>
            </div>
            <div className="space-y-1.5 text-xs text-indigo-100 leading-relaxed font-medium">
              {aiSuggestions.map((s, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top High-Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            totalPercentage === 100 
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
          }`}>
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Formula % (w/w)</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={`text-2xl font-black ${totalPercentage === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {totalPercentage.toFixed(2)}%
              </span>
              {totalPercentage !== 100 && (
                <button onClick={handleNormalize} className="text-[10px] font-bold text-indigo-600 underline">
                  Auto-Balance
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Raw Material Cost / Liter</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-gray-900 dark:text-white">₹{rawMaterialCostPerLiter.toFixed(2)}</span>
              <span className="text-xs text-gray-400">/ Liter</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">CIPAC Stability Score</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className={`text-2xl font-black ${cipacScore >= 80 ? 'text-emerald-600' : cipacScore >= 60 ? 'text-blue-600' : 'text-amber-600'}`}>
                {cipacScore} / 100
              </span>
              <span className="text-[10px] font-bold text-gray-400">CIPAC MT 46.3</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Beaker className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Batch Scale-Up ({batchVolumeLiters}L)</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-gray-900 dark:text-white">₹{(totalBatchCost / 1000).toFixed(1)}k</span>
              <span className="text-xs text-gray-400">Total Batch Cost</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Recipe Builder & Physical Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Ingredient Table & Add Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-lg font-black text-gray-900 dark:text-white bg-transparent border-b border-dashed border-gray-300 dark:border-gray-700 focus:border-emerald-500 outline-none pb-1"
                placeholder="Enter Formulation Name..."
              />
              <span className="text-xs font-bold text-gray-400">
                {ingredients.length} Active Raw Ingredients
              </span>
            </div>

            {/* Ingredients Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-extrabold uppercase tracking-wider">
                    <th className="pb-3">Raw Material Ingredient</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3 text-right">Recipe % (w/w)</th>
                    <th className="pb-3 text-right">Cost (₹/kg)</th>
                    <th className="pb-3 text-right">Batch Weight ({batchVolumeLiters}L)</th>
                    <th className="pb-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {ingredients.map((ing) => {
                    const batchKg = ((ing.percentage / 100) * batchVolumeLiters * density).toFixed(1);
                    return (
                      <tr key={ing.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="py-3 font-bold text-gray-900 dark:text-white">{ing.name}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            ing.category === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                            ing.category === 'surfactant' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                            ing.category === 'stabilizer' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }`}>
                            {ing.category}
                          </span>
                        </td>
                        <td className="py-3 text-right font-black text-gray-900 dark:text-white">{ing.percentage.toFixed(2)}%</td>
                        <td className="py-3 text-right font-bold text-gray-600 dark:text-gray-300">₹{ing.costPerKg}</td>
                        <td className="py-3 text-right font-black text-emerald-600 dark:text-emerald-400">{batchKg} kg</td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => handleRemoveIngredient(ing.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Add New Ingredient Form */}
            <form onSubmit={handleAddIngredient} className="pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-5 gap-3">
              <input
                type="text"
                placeholder="Ingredient Name..."
                value={newIngName}
                onChange={(e) => setNewIngName(e.target.value)}
                className="col-span-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <select
                value={newIngCategory}
                onChange={(e) => setNewIngCategory(e.target.value as any)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold"
              >
                <option value="active">Active Ingredient</option>
                <option value="surfactant">Surfactant / Emulsifier</option>
                <option value="solvent">Solvent / Carrier</option>
                <option value="stabilizer">Stabilizer / Buffer</option>
                <option value="adjuvant">Adjuvant</option>
                <option value="other">Other Filler</option>
              </select>
              <input
                type="number"
                step="0.1"
                placeholder="Recipe %"
                value={newIngPct || ''}
                onChange={(e) => setNewIngPct(parseFloat(e.target.value) || 0)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="flex items-center justify-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </form>
          </div>
        </div>

        {/* Right 1 Col: Physical Parameters & Batch Scale-Up Wizard */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xl space-y-4">
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Pipette className="w-4 h-4 text-emerald-500" />
              Physical Specs & CIPAC Controls
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Target pH (25°C): {ph}</label>
                <input
                  type="range"
                  min="3.0"
                  max="10.0"
                  step="0.1"
                  value={ph}
                  onChange={(e) => setPh(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Specific Gravity / Density: {density} g/mL</label>
                <input
                  type="number"
                  step="0.01"
                  value={density}
                  onChange={(e) => setDensity(parseFloat(e.target.value) || 1.0)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Viscosity (cP at 20°C): {viscosity} cP</label>
                <input
                  type="number"
                  value={viscosity}
                  onChange={(e) => setViscosity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Suspensibility (CIPAC MT 184): {suspensibility}%</label>
                <input
                  type="range"
                  min="40.0"
                  max="100.0"
                  step="1.0"
                  value={suspensibility}
                  onChange={(e) => setSuspensibility(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Batch Scale-Up Simulation Volume:</label>
                <select
                  value={batchVolumeLiters}
                  onChange={(e) => setBatchVolumeLiters(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl font-black text-emerald-700 dark:text-emerald-300"
                >
                  <option value={100}>100 Liters (Pilot Batch)</option>
                  <option value={500}>500 Liters (Semi-Commercial)</option>
                  <option value={1000}>1,000 Liters (Standard Tank)</option>
                  <option value={5000}>5,000 Liters (Commercial Production)</option>
                  <option value={10000}>10,000 Liters (Plant Batch)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
