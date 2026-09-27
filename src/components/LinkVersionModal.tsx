import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  GitBranch, 
  Check, 
  Plus, 
  Layers, 
  FlaskConical, 
  MapPin, 
  Sparkles, 
  ChevronRight, 
  AlertCircle,
  TrendingUp,
  Tag,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MainProduct, ProductVersion, ProductCategory, ProductVariantType, CATEGORY_VARIANTS_MAP } from '../types/productVersionTypes';
import { ExternalFieldTrial } from '../types/trialIntegrationTypes';
import { ExternalFormulation, getSyncedTrials, getSyncedFormulations } from '../services/trialManagerSync';
import { 
  getMainProducts, 
  getProductVersions, 
  addMainProduct, 
  linkTrialAsVersion, 
  linkFormulaAsVersion, 
  addProductVersion,
  findProductForTrialOrFormula
} from '../services/productVersionStore';

interface LinkVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (version: ProductVersion, product: MainProduct) => void;
  initialTrial?: ExternalFieldTrial | null;
  initialFormula?: ExternalFormulation | null;
  initialProductId?: string | null;
}

export const LinkVersionModal: React.FC<LinkVersionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTrial,
  initialFormula,
  initialProductId
}) => {
  const [products, setProducts] = useState<MainProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isCreatingNewProduct, setIsCreatingNewProduct] = useState(false);

  // New product inputs
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState<ProductCategory>('herbicide');
  const [newProductVariant, setNewProductVariant] = useState<ProductVariantType>('IPM Herbicide');
  const [newProductDescription, setNewProductDescription] = useState('');

  // Source selection
  const [sourceType, setSourceType] = useState<'trial' | 'formula' | 'manual'>('trial');
  const [selectedTrialId, setSelectedTrialId] = useState<string>('');
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>('');

  // Version details inputs
  const [versionTag, setVersionTag] = useState('');
  const [versionName, setVersionName] = useState('');
  const [upgradeReason, setUpgradeReason] = useState('');
  const [dosage, setDosage] = useState('');
  const [status, setStatus] = useState<ProductVersion['status']>('Testing');
  const [stage, setStage] = useState<ProductVersion['stage']>('Multi-Loc Field Trial');
  const [notes, setNotes] = useState('');

  const syncedTrials = useMemo(() => getSyncedTrials(), [isOpen]);
  const syncedFormulations = useMemo(() => getSyncedFormulations(), [isOpen]);

  // Load and refresh products
  useEffect(() => {
    if (!isOpen) return;
    const loaded = getMainProducts();
    setProducts(loaded);

    // Smart default selection
    if (initialProductId) {
      setSelectedProductId(initialProductId);
    } else if (initialTrial) {
      setSourceType('trial');
      setSelectedTrialId(initialTrial.id);
      const match = findProductForTrialOrFormula(initialTrial.productName || initialTrial.title);
      if (match.product) {
        setSelectedProductId(match.product.id);
      } else if (loaded.length > 0) {
        setSelectedProductId(loaded[0].id);
      }
      setDosage(initialTrial.dosage || '35 ml/L');
      setVersionName(`${initialTrial.productName || initialTrial.title} (${initialTrial.dosage || 'Field Test'})`);
    } else if (initialFormula) {
      setSourceType('formula');
      setSelectedFormulaId(initialFormula.id);
      const match = findProductForTrialOrFormula(initialFormula.name);
      if (match.product) {
        setSelectedProductId(match.product.id);
      } else if (loaded.length > 0) {
        setSelectedProductId(loaded[0].id);
      }
      setVersionName(initialFormula.name);
      if (initialFormula.estimatedCost) {
        setNotes(`Recipe cost: ₹${initialFormula.estimatedCost.toFixed(2)}/L`);
      }
    } else if (loaded.length > 0) {
      setSelectedProductId(loaded[0].id);
    }
  }, [isOpen, initialProductId, initialTrial, initialFormula]);

  // Automatically suggest next version tag when product changes
  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId);
  }, [products, selectedProductId]);

  const existingVersions = useMemo(() => {
    if (!selectedProductId) return [];
    return getProductVersions(selectedProductId);
  }, [selectedProductId, isOpen]);

  useEffect(() => {
    if (selectedProduct && existingVersions.length > 0) {
      const nextNum = existingVersions.length + 1;
      setVersionTag(`V${nextNum}.0`);
    } else {
      setVersionTag('V1.0');
    }
  }, [selectedProduct, existingVersions.length]);

  // Handle source changes
  const handleSelectTrial = (trialId: string) => {
    setSelectedTrialId(trialId);
    const trial = syncedTrials.find(t => t.id === trialId);
    if (trial) {
      setVersionName(`${trial.productName || trial.title} (${trial.dosage || 'Plot Check'})`);
      setDosage(trial.dosage || '35 ml/L');
      setUpgradeReason(`Field trial observation: Observed ${trial.resultRating || 'active'} performance on ${trial.cropName || 'target crop'}.`);
    }
  };

  const handleSelectFormula = (formulaId: string) => {
    setSelectedFormulaId(formulaId);
    const formula = syncedFormulations.find(f => f.id === formulaId);
    if (formula) {
      setVersionName(formula.name);
      setUpgradeReason(formula.notes || `Formulation upgrade imported from Trial Manager. Contains ${(formula.ingredients || []).length} active recipe ingredients.`);
      if (formula.killRate) {
        setNotes(`Trial manager demonstrated ${formula.killRate}% efficacy.`);
      }
    }
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;

    const prod = addMainProduct({
      name: newProductName.trim(),
      code: `PRD-${newProductName.trim().slice(0, 3).toUpperCase()}`,
      category: newProductCategory,
      variantType: newProductVariant,
      description: newProductDescription.trim() || `${newProductVariant} product line.`,
      targetCrops: ['Agricultural Crops'],
      targetWeedsOrPests: ['Target Weeds / Pests'],
      commercialStatus: 'In Development'
    });

    const refreshed = getMainProducts();
    setProducts(refreshed);
    setSelectedProductId(prod.id);
    setIsCreatingNewProduct(false);
    setNewProductName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      alert('Please select or create a Main Product to link this version to.');
      return;
    }

    const targetProduct = products.find(p => p.id === selectedProductId);
    if (!targetProduct) return;

    let createdVersion: ProductVersion | null = null;

    if (sourceType === 'trial' && selectedTrialId) {
      const trial = syncedTrials.find(t => t.id === selectedTrialId);
      if (trial) {
        createdVersion = linkTrialAsVersion(trial, selectedProductId, {
          versionTag: versionTag.trim() || 'V1.0',
          versionName: versionName.trim() || trial.productName,
          upgradeReason: upgradeReason.trim() || 'Field trial evaluation of formulation variant.',
          status,
          stage,
          dosage: dosage.trim() || trial.dosage,
          notes
        });
      }
    } else if (sourceType === 'formula' && selectedFormulaId) {
      const formula = syncedFormulations.find(f => f.id === selectedFormulaId);
      if (formula) {
        createdVersion = linkFormulaAsVersion(formula, selectedProductId, {
          versionTag: versionTag.trim() || 'V1.0',
          versionName: versionName.trim() || formula.name,
          upgradeReason: upgradeReason.trim() || 'Formulation iteration imported from Trial Manager.',
          status,
          stage,
          dosage: dosage.trim()
        });
      }
    } else {
      // Manual formulation version
      createdVersion = addProductVersion({
        productId: selectedProductId,
        versionTag: versionTag.trim() || 'V1.0',
        versionName: versionName.trim() || `${targetProduct.name} Upgrade`,
        formulaNameOrCode: versionName.trim(),
        sourceType: 'manual',
        upgradeReason: upgradeReason.trim() || 'New formulation upgrade & recipe adjustment.',
        stage,
        status,
        dosage: dosage.trim(),
        notes,
        createdBy: 'Scientist R&D'
      });
    }

    if (createdVersion) {
      if (onSuccess) {
        onSuccess(createdVersion, targetProduct);
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  Link Trial / Formula as Product Version
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Connect experimental formulas & field trials as upgraded versions of your main products
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
            {/* Step 1: Main Product Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-500" />
                  1. Select Main Product Line (Parent)
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewProduct(!isCreatingNewProduct)}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  {isCreatingNewProduct ? '← Choose Existing Product' : '+ Create New Main Product'}
                </button>
              </div>

              {!isCreatingNewProduct ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {products.map(p => {
                    const isSelected = selectedProductId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProductId(p.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                            : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700/80 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-400'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-xs text-gray-900 dark:text-white truncate">{p.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              {p.category}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 truncate mt-0.5">
                            {p.variantType}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {p.totalVersionsCount || 0} versions • Active: {p.activeVersionTag || 'V1.0'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                  <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300">Create New Main Product</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">Product Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Goweed Ultra, Microweed, WeeDrop"
                        value={newProductName}
                        onChange={e => setNewProductName(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">Category</label>
                      <select
                        value={newProductCategory}
                        onChange={e => {
                          const cat = e.target.value as ProductCategory;
                          setNewProductCategory(cat);
                          setNewProductVariant(CATEGORY_VARIANTS_MAP[cat][0]);
                        }}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold"
                      >
                        <option value="herbicide">Herbicide</option>
                        <option value="fungicide">Fungicide</option>
                        <option value="pesticide">Pesticide</option>
                        <option value="nutrition">Nutrition</option>
                        <option value="biostimulant">Biostimulant</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                      Product Variant / Formulation Line
                    </label>
                    <select
                      value={newProductVariant}
                      onChange={e => setNewProductVariant(e.target.value as ProductVariantType)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold"
                    >
                      {CATEGORY_VARIANTS_MAP[newProductCategory].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">Description</label>
                    <textarea
                      rows={2}
                      placeholder="Scientific description of the product and mechanism of action..."
                      value={newProductDescription}
                      onChange={e => setNewProductDescription(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-medium"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateProduct}
                    disabled={!newProductName.trim()}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition disabled:opacity-50"
                  >
                    Save & Select Main Product
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Source Type (Trial vs Formula) */}
            <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <label className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <FlaskConical className="w-4 h-4 text-purple-500" />
                2. Select Formulation Source
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'trial', label: 'Field Trial (Trial Manager)', icon: MapPin },
                  { id: 'formula', label: 'Cloud Formulation Recipe', icon: FlaskConical },
                  { id: 'manual', label: 'New Version Iteration', icon: Plus },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSourceType(opt.id as any)}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition text-center ${
                      sourceType === opt.id
                        ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-700 dark:text-purple-300 shadow-sm'
                        : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700/80 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <opt.icon className="w-4 h-4" />
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>

              {/* Source Picker */}
              {sourceType === 'trial' && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                    Select Synced Field Trial (Showing {syncedTrials.length} trials)
                  </label>
                  <select
                    value={selectedTrialId}
                    onChange={e => handleSelectTrial(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-medium"
                  >
                    <option value="">-- Choose a Field Trial to link --</option>
                    {syncedTrials.map(t => (
                      <option key={t.id} value={t.id}>
                        [{t.trialCode}] {t.productName || t.title} • {t.dosage || 'No dose'} • {t.cropName} ({t.resultRating || 'Rating N/A'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {sourceType === 'formula' && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                    Select Synced Formulation (Showing {syncedFormulations.length} formulas)
                  </label>
                  <select
                    value={selectedFormulaId}
                    onChange={e => handleSelectFormula(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-medium"
                  >
                    <option value="">-- Choose a Formulation Recipe to link --</option>
                    {syncedFormulations.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.name} {f.code ? `(${f.code})` : ''} • {f.category} • {(f.ingredients || []).length} Ings • {f.killRate ? `${f.killRate}% Kill` : 'Untested'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Step 3: Version Tag & Upgrade Specification */}
            <div className="space-y-4 pt-3 border-t border-gray-100 dark:border-gray-800">
              <label className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-emerald-500" />
                3. Version Tag & Upgrade Scientific Specification
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                    Version Tag <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. V1.1, V2.0, V2.1"
                    value={versionTag}
                    onChange={e => setVersionTag(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold font-mono"
                  />
                  <span className="text-[10px] text-gray-400">e.g. V1.0, V1.1, V2.0 Flagship</span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                    Version Name / Sub-Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. F-p43 (35ml/L Test) or Goweed ultra +"
                    value={versionName}
                    onChange={e => setVersionName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Reason for Version Upgrade — What Changed Scientifically &amp; Why <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Detail the formulation modifications: e.g. Increased surfactant concentration from 3% to 5% to boost rainfastness; tested 35ml/L dosage vs 50ml/L; replaced synthetic solvent with bio-based carrier."
                  value={upgradeReason}
                  onChange={e => setUpgradeReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">Dosage</label>
                  <input
                    type="text"
                    placeholder="e.g. 35 ml/L or 2.5 L/ha"
                    value={dosage}
                    onChange={e => setDosage(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">Version Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold"
                  >
                    <option value="Testing">Testing / Field Trials</option>
                    <option value="Validated">Validated (Stage Passed)</option>
                    <option value="Active Commercial">Active Commercial Flagship</option>
                    <option value="Superseded">Superseded / Legacy</option>
                    <option value="Draft">Draft / Lab Stage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">R&amp;D Stage</label>
                  <select
                    value={stage}
                    onChange={e => setStage(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold"
                  >
                    <option value="Lab Synthesis">Phase 1: Lab Formulation</option>
                    <option value="Plot Screening">Phase 2: Plot Screening</option>
                    <option value="Multi-Loc Field Trial">Phase 3: Multi-Loc Field Trial</option>
                    <option value="Regulatory Testing">Phase 4: Regulatory Registration</option>
                    <option value="Commercial Ready">Phase 5: Commercial Ready</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/25 transition active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Save &amp; Link Version
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
