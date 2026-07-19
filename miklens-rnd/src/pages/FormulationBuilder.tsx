import React, { useState, useMemo } from 'react';
import { Pipette, Plus, Trash2, Sparkles, AlertCircle, CheckCircle, Calculator, Info, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Ingredient {
  id: string;
  name: string;
  category: 'active' | 'surfactant' | 'solvent' | 'stabilizer' | 'adjuvant' | 'other';
  percentage: number;
  costPerKg: number;
}

const DEFAULT_INGREDIENTS: Ingredient[] = [
  { id: '1', name: 'Pseudomonas fluorescens (Active strain)', category: 'active', percentage: 10.0, costPerKg: 350 },
  { id: '2', name: 'Al alkylbenzenesulfonate (Surfactant)', category: 'surfactant', percentage: 4.5, costPerKg: 120 },
  { id: '3', name: 'Xanthan Gum (Thickener/Stabilizer)', category: 'stabilizer', percentage: 0.15, costPerKg: 450 },
  { id: '4', name: 'Propylene Glycol (Antifreeze)', category: 'adjuvant', percentage: 5.0, costPerKg: 180 },
  { id: '5', name: 'Demineralized Water (Carrier)', category: 'solvent', percentage: 80.35, costPerKg: 10 },
];

export const FormulationBuilder: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>(DEFAULT_INGREDIENTS);
  const [name, setName] = useState('Bio-Pesticide Pseudomonas SC (Flowable)');
  const [ph, setPh] = useState(6.2);
  const [viscosity, setViscosity] = useState(480); // in cP
  const [density, setDensity] = useState(1.05); // g/mL
  const [suspensibility, setSuspensibility] = useState(62.0); // %
  const [emulsionStability, setEmulsionStability] = useState('partial'); // pass, fail, partial

  const [newIngName, setNewIngName] = useState('');
  const [newIngCategory, setNewIngCategory] = useState<Ingredient['category']>('active');
  const [newIngPct, setNewIngPct] = useState<number>(0);
  const [newIngCost, setNewIngCost] = useState<number>(0);

  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[] | null>(null);

  // Totals calculations
  const totalPercentage = useMemo(() => {
    return ingredients.reduce((sum, ing) => sum + ing.percentage, 0);
  }, [ingredients]);

  const rawMaterialCost = useMemo(() => {
    // cost per kg of formulation
    return ingredients.reduce((sum, ing) => sum + (ing.percentage / 100) * ing.costPerKg, 0);
  }, [ingredients]);

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

  const triggerAiAnalysis = () => {
    setAiAnalyzing(true);
    setTimeout(() => {
      const suggestions: string[] = [];
      
      // Analyze pH
      if (ph < 5.5) {
        suggestions.push("⚠️ Low pH detected (Current: " + ph + "). Microbial strains like Pseudomonas may experience rapid cell death in acidic conditions. Consider adjusting pH to 6.5 - 7.2 using 0.5% Potassium Hydroxide (KOH) buffer.");
      } else if (ph > 8.0) {
        suggestions.push("⚠️ High pH detected (Current: " + ph + "). High alkalinity can degrade active bio-molecules. Buffer with Citric Acid to stabilize.");
      }

      // Analyze suspensibility & viscosity
      if (suspensibility < 75.0) {
        const xanthan = ingredients.find(ing => ing.name.toLowerCase().includes('xanthan') || ing.category === 'stabilizer');
        if (!xanthan || xanthan.percentage < 0.25) {
          suggestions.push("💡 Low Suspensibility (Current: " + suspensibility + "%). To achieve the target standard of >80%, increase the concentration of thickener/suspending agent (e.g., Xanthan Gum) from " + (xanthan?.percentage || 0) + "% to 0.28% w/w.");
        }
      }

      // Analyze viscosity relative to flowability
      if (viscosity > 800) {
        suggestions.push("⚠️ Viscosity is high (" + viscosity + " cP). This could cause severe flowability and packaging problems. Consider decreasing carrier polymer concentration or adding 0.8% PEG surfactant.");
      }

      // Analyze raw material cost
      if (rawMaterialCost > 150) {
        suggestions.push("💰 Formulation raw material cost ($" + rawMaterialCost.toFixed(2) + "/kg) is high. Consider substituting expensive synthetic surfactants with bio-surfactants or reducing active concentration if efficacy remains stable.");
      }

      if (suggestions.length === 0) {
        suggestions.push("✅ Formulation parameters (pH, viscosity, suspensibility) appear well-balanced. Efficacy projection is stable. Proceed to Accelerated Heat Stability (AHS) logs.");
      }

      setAiSuggestions(suggestions);
      setAiAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Pipette className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Formulation Recipe Builder</h1>
              <p className="text-sm text-gray-500">Design, analyze, and optimize agricultural chemical & biological mixtures.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle: Recipe & Properties (Takes 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Formulation Meta & Ingredients */}
          <div className="bg-white dark:bg-gray-800/80 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800/50 p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Formulation Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="Enter formulation code or name..."
              />
            </div>

            {/* Ingredients Table */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-purple-500" />
                  Recipe Ingredients
                </h3>
                {Math.abs(totalPercentage - 100) > 0.01 && (
                  <button
                    onClick={handleNormalize}
                    className="px-3 py-1.5 text-xs font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-100 transition-all border border-amber-200/50"
                  >
                    Normalize to 100%
                  </button>
                )}
              </div>

              <div className="overflow-x-auto border border-gray-100 dark:border-gray-700/50 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                      <th className="p-4">Ingredient Name</th>
                      <th className="p-4">Category</th>
                      <th className="p-4 text-right">Percentage (%)</th>
                      <th className="p-4 text-right">Cost ($/kg)</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredients.map((ing) => (
                      <tr key={ing.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 text-sm text-gray-700 dark:text-gray-300">
                        <td className="p-4 font-medium text-gray-900 dark:text-white">{ing.name}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full capitalize ${
                            ing.category === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' :
                            ing.category === 'surfactant' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400' :
                            ing.category === 'stabilizer' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-950/20 dark:text-gray-400'
                          }`}>
                            {ing.category}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono font-semibold">{ing.percentage.toFixed(2)}%</td>
                        <td className="p-4 text-right font-mono">${ing.costPerKg.toFixed(2)}</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleRemoveIngredient(ing.id)}
                            className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50/50 dark:bg-gray-900/20 font-bold border-t border-gray-100 dark:border-gray-700 text-sm text-gray-900 dark:text-white">
                      <td className="p-4">Total</td>
                      <td className="p-4"></td>
                      <td className={`p-4 text-right font-mono ${Math.abs(totalPercentage - 100) > 0.01 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {totalPercentage.toFixed(2)}%
                      </td>
                      <td className="p-4 text-right font-mono">${rawMaterialCost.toFixed(2)}/kg</td>
                      <td className="p-4"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Add Ingredient Form */}
            <form onSubmit={handleAddIngredient} className="bg-gray-50 dark:bg-gray-950/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-4">
              <h4 className="text-sm font-bold text-gray-800 dark:text-white">Add Raw Material Ingredient</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Ingredient Name..."
                  value={newIngName}
                  onChange={(e) => setNewIngName(e.target.value)}
                  className="md:col-span-2 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                />
                <select
                  value={newIngCategory}
                  onChange={(e: any) => setNewIngCategory(e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="active">Active Ingredient</option>
                  <option value="surfactant">Surfactant</option>
                  <option value="stabilizer">Stabilizer / Thickener</option>
                  <option value="solvent">Solvent / Carrier</option>
                  <option value="adjuvant">Adjuvant / Antifreeze</option>
                  <option value="other">Other Additive</option>
                </select>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="%"
                    value={newIngPct || ''}
                    onChange={(e) => setNewIngPct(Number(e.target.value))}
                    className="w-1/2 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Cost"
                    value={newIngCost || ''}
                    onChange={(e) => setNewIngCost(Number(e.target.value))}
                    className="w-1/2 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-500/10"
                >
                  <Plus className="w-4 h-4" /> Add Ingredient
                </button>
              </div>
            </form>
          </div>

          {/* Physical Properties Tracking */}
          <div className="bg-white dark:bg-gray-800/80 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800/50 p-6 space-y-6">
            <h3 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Pipette className="w-5 h-5 text-purple-500" />
              Physical & Stability Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">pH Level</label>
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{ph}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="14"
                  step="0.1"
                  value={ph}
                  onChange={(e) => setPh(Number(e.target.value))}
                  className="w-full accent-purple-600 bg-gray-100 dark:bg-gray-700 rounded-lg appearance-none h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Viscosity (cP)</label>
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{viscosity} cP</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="10"
                  value={viscosity}
                  onChange={(e) => setViscosity(Number(e.target.value))}
                  className="w-full accent-purple-600 bg-gray-100 dark:bg-gray-700 rounded-lg appearance-none h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Density (g/mL)</label>
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{density} g/mL</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.6"
                  step="0.01"
                  value={density}
                  onChange={(e) => setDensity(Number(e.target.value))}
                  className="w-full accent-purple-600 bg-gray-100 dark:bg-gray-700 rounded-lg appearance-none h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Suspensibility (%)</label>
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{suspensibility}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  step="0.5"
                  value={suspensibility}
                  onChange={(e) => setSuspensibility(Number(e.target.value))}
                  className="w-full accent-purple-600 bg-gray-100 dark:bg-gray-700 rounded-lg appearance-none h-2"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Emulsion Stability</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['pass', 'partial', 'fail'] as const).map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setEmulsionStability(status)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                        emulsionStability === status
                          ? status === 'pass' ? 'bg-emerald-50 text-emerald-600 border-emerald-500 dark:bg-emerald-950/20' :
                            status === 'partial' ? 'bg-amber-50 text-amber-600 border-amber-500 dark:bg-amber-950/20' :
                            'bg-red-50 text-red-600 border-red-500 dark:bg-red-950/20'
                          : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-900'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI Advisor Panels (1 col) */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-purple-900 via-indigo-950 to-indigo-900 text-white rounded-2xl shadow-xl p-6 border border-indigo-950 flex flex-col justify-between min-h-[350px]">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-300" />
                </div>
                <h3 className="font-bold text-lg">Gemini AI Formulation Optimizer</h3>
              </div>
              <p className="text-xs text-purple-200 leading-relaxed">
                Click analyze to verify active strain stability, emulsification structures, viscosity, and raw material pricing.
              </p>
              
              <AnimatePresence mode="wait">
                {aiAnalyzing ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-10 space-y-3"
                  >
                    <div className="w-8 h-8 rounded-full border-4 border-t-purple-400 border-r-purple-300 border-b-transparent border-l-transparent animate-spin"></div>
                    <span className="text-xs text-purple-300">Analyzing physicochemical properties...</span>
                  </motion.div>
                ) : aiSuggestions ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3 max-h-[300px] overflow-y-auto pr-1"
                  >
                    {aiSuggestions.map((sug, index) => (
                      <div
                        key={index}
                        className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                          sug.startsWith('✅') ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200' :
                          sug.startsWith('💰') ? 'bg-amber-950/40 border-amber-500/30 text-amber-200' :
                          'bg-indigo-950/50 border-indigo-500/20 text-purple-100'
                        }`}
                      >
                        {sug}
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-purple-300">
                    <Info className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-xs">No analysis has been run on this recipe yet.</span>
                  </div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={triggerAiAnalysis}
              disabled={aiAnalyzing}
              className="mt-6 w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 border border-purple-400/20"
            >
              <Sparkles className="w-4 h-4 text-purple-200" />
              Run Efficacy & Cost Audit
            </button>
          </div>

          {/* Quick Info Card */}
          <div className="bg-white dark:bg-gray-800/80 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800/50 p-6 space-y-4 text-sm text-gray-600 dark:text-gray-300">
            <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-purple-500" />
              Formulation Guidelines
            </h4>
            <ul className="list-disc pl-4 space-y-2 text-xs leading-relaxed">
              <li>Active biological agents must be stable across pH chambers (ideally 6.0 - 7.5).</li>
              <li>A suspensibility percentage of above 75% ensures uniform spray distribution on foliage.</li>
              <li>Stability testing at 54°C for 14 days acts as the primary accelerated gate before launching greenhouse trials.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
