import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FlaskConical, Plus, GitBranch, ChevronDown, ChevronRight, Trash2,
  CheckCircle, AlertTriangle, XCircle, Clock, Info, BarChart2, Edit3,
  Building2, Search, ArrowRight, Layers, Sparkles, RefreshCw, Check,
  SlidersHorizontal, Tag, Scale, DollarSign, Activity, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  ScientificFormulation,
  FormulationDecision,
  FormulationPhysicalAppearance,
  FormulationSolubility,
  FormulationCompatibility,
  FormulationStability,
} from '../types/experimentTypes';
import { 
  MainProduct, 
  ProductVersion, 
  ProductCategory, 
  ProductVariantType, 
  CATEGORY_VARIANTS_MAP,
  RecipeIngredient
} from '../types/productVersionTypes';
import { 
  getMainProducts, 
  getProductVersions, 
  promoteActiveVersion, 
  deleteProductVersion, 
  deleteMainProduct,
  subscribeToProductChanges
} from '../services/productVersionStore';
import { 
  getSyncedFormulations, 
  saveSyncedFormulationsList, 
  fetchFormulationsFromFirebaseCloud, 
  readFormulationsFromIndexedDB,
  getSavedFirebaseConfig, 
  ExternalFormulation 
} from '../services/trialManagerSync';
import { loadScientificFormulations, saveScientificFormulations } from '../services/experimentStore';
import { useAuth } from '../contexts/AuthContext';
import { LinkVersionModal } from '../components/LinkVersionModal';

// ── Constants for 14-Field Tracker ───────────────────────────────────────────
const APPEARANCE_OPTIONS: FormulationPhysicalAppearance[] = [
  'Clear Liquid', 'Emulsion', 'Suspension', 'Powder', 'Granule', 'Paste', 'Gel',
];
const SOLUBILITY_OPTIONS: FormulationSolubility[] = ['Complete', 'Partial', 'Poor', 'Insoluble'];
const COMPAT_OPTIONS: FormulationCompatibility[] = ['Compatible', 'Incompatible', 'Conditional'];
const STABILITY_OPTIONS: FormulationStability[] = [
  'Stable', 'Unstable', 'Under Accelerated Testing', 'Conditionally Stable',
];
const DECISION_OPTIONS: FormulationDecision[] = [
  'Continue', 'Modify', 'Stop', 'Under Review', 'Advance to Field Trial', 'Advance to Registration',
];
const CATEGORY_OPTIONS = ['herbicide', 'fungicide', 'pesticide', 'nutrition', 'biostimulant'] as const;

const decisionBadge = (d: FormulationDecision) => {
  const map: Record<FormulationDecision, string> = {
    'Continue': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'Modify': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    'Stop': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    'Under Review': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    'Advance to Field Trial': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    'Advance to Registration': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  };
  return map[d] || 'bg-gray-100 text-gray-600';
};

const DecisionIcon = ({ d }: { d: FormulationDecision }) => {
  if (d === 'Advance to Registration' || d === 'Advance to Field Trial')
    return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />;
  if (d === 'Stop') return <XCircle className="w-3.5 h-3.5 text-red-500" />;
  if (d === 'Modify') return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
  return <Clock className="w-3.5 h-3.5 text-gray-400" />;
};

// ── Blank Formulation Template ────────────────────────────────────────────────
const blankFormulation = (): Omit<ScientificFormulation, 'id' | 'formulationId' | 'createdAt' | 'updatedAt' | 'createdBy'> => ({
  name: '',
  version: 'V1',
  parentVersionId: undefined,
  reasonForRevision: '',
  batchNo: '',
  keyActivesComposition: '',
  physicalAppearance: 'Clear Liquid',
  solubilityDispersibility: 'Complete',
  compatibility: 'Compatible',
  compatibilityNotes: '',
  pH: undefined,
  stabilityStatus: 'Under Accelerated Testing',
  stabilityNotes: '',
  problemIdentified: '',
  correctiveAction: '',
  trialResultEfficacy: undefined,
  trialResultNotes: '',
  finalDecision: 'Under Review',
  finalDecisionNotes: '',
  category: 'herbicide',
});

// ── Build Version Tree ─────────────────────────────────────────────────────────
interface VersionNode {
  formulation: ScientificFormulation;
  children: VersionNode[];
}
function buildTree(formulations: ScientificFormulation[]): VersionNode[] {
  const map = new Map<string, VersionNode>();
  formulations.forEach(f => map.set(f.id, { formulation: f, children: [] }));
  const roots: VersionNode[] = [];
  formulations.forEach(f => {
    if (f.parentVersionId && map.has(f.parentVersionId)) {
      map.get(f.parentVersionId)!.children.push(map.get(f.id)!);
    } else {
      roots.push(map.get(f.id)!);
    }
  });
  return roots;
}

const TreeNode: React.FC<{
  node: VersionNode;
  depth: number;
  onSelect: (f: ScientificFormulation) => void;
  selected: string | null;
  onBranch: (parentId: string) => void;
  onDelete: (id: string) => void;
}> = ({ node, depth, onSelect, selected, onBranch, onDelete }) => {
  const [expanded, setExpanded] = useState(true);
  const f = node.formulation;

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-3' : ''}`}>
      <div
        className={`flex items-center gap-2 p-2.5 rounded-xl mb-1 cursor-pointer transition-all group
          ${selected === f.id
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
        onClick={() => onSelect(f)}
      >
        {node.children.length > 0 ? (
          <button onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : <span className="w-3.5 h-3.5 inline-block" />}

        <GitBranch className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{f.name} <span className="text-emerald-600">{f.version}</span></p>
          <p className="text-[10px] text-gray-400 truncate">{f.batchNo || 'No batch'}</p>
        </div>

        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${decisionBadge(f.finalDecision)}`}>
          <DecisionIcon d={f.finalDecision} />
          {f.finalDecision}
        </span>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
          <button
            title="Create child version"
            onClick={e => { e.stopPropagation(); onBranch(f.id); }}
            className="p-1 text-gray-400 hover:text-emerald-600 rounded-lg"
          ><Plus className="w-3.5 h-3.5" /></button>
          <button
            title="Delete version"
            onClick={e => { e.stopPropagation(); onDelete(f.id); }}
            className="p-1 text-gray-400 hover:text-red-500 rounded-lg"
          ><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {expanded && node.children.map(child => (
        <TreeNode key={child.formulation.id} node={child} depth={depth + 1}
          onSelect={onSelect} selected={selected} onBranch={onBranch} onDelete={onDelete} />
      ))}
    </div>
  );
};

// ── 14-Field Detail Panel ─────────────────────────────────────────────────────
const DetailPanel: React.FC<{ formulation: ScientificFormulation; parent?: ScientificFormulation }> = ({ formulation: f, parent }) => {
  const Row = ({ label, value, highlight }: { label: string; value?: string | number; highlight?: boolean }) => (
    <div className="grid grid-cols-5 gap-2 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
      <span className="col-span-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`col-span-3 text-xs ${highlight ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-gray-800 dark:text-gray-200'}`}>
        {value ?? '—'}
      </span>
    </div>
  );

  return (
    <div className="space-y-4">
      {parent && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <GitBranch className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[11px] text-amber-700 dark:text-amber-300">Derived from: <strong>{parent.name} {parent.version}</strong></span>
        </div>
      )}

      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Fields 1–7 · Identity &amp; Composition</p>
        <Row label="Formulation ID" value={f.formulationId} />
        <Row label="Product Name" value={f.name} highlight />
        <Row label="Version" value={f.version} highlight />
        <Row label="Category" value={f.category.toUpperCase()} />
        <Row label="Batch No" value={f.batchNo} />
        <Row label="Key Actives / Composition" value={f.keyActivesComposition} />
        <Row label="Reason for Revision" value={f.reasonForRevision} />
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Fields 8–12 · Physical &amp; Chemical Properties</p>
        <Row label="Physical Appearance" value={f.physicalAppearance} />
        <Row label="Solubility" value={f.solubilityDispersibility} />
        <Row label="Compatibility" value={`${f.compatibility}${f.compatibilityNotes ? ` — ${f.compatibilityNotes}` : ''}`} />
        <Row label="pH" value={f.pH !== undefined ? String(f.pH) : '—'} />
        <Row label="Stability Status" value={`${f.stabilityStatus}${f.stabilityNotes ? ` — ${f.stabilityNotes}` : ''}`} />
      </div>

      <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 border border-red-100 dark:border-red-900/30">
        <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-3">Fields 13–14 · Problem → Corrective Action</p>
        <Row label="Problem Identified" value={f.problemIdentified || '—'} />
        <Row label="Corrective Action" value={f.correctiveAction || '—'} />
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/30">
        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-3">Trial Result &amp; Decision</p>
        <Row label="Efficacy at Final DAA" value={f.trialResultEfficacy !== undefined ? `${f.trialResultEfficacy}%` : '—'} highlight />
        <Row label="Trial Notes" value={f.trialResultNotes || '—'} />
        <Row label="Final Decision" value={f.finalDecision} highlight />
        <Row label="Decision Notes" value={f.finalDecisionNotes || '—'} />
      </div>

      <div className="text-[10px] text-gray-400 mt-2">
        Created: {new Date(f.createdAt).toLocaleString()} · Updated: {new Date(f.updatedAt).toLocaleString()}
      </div>
    </div>
  );
};

// ── Version Comparison Modal ──────────────────────────────────────────────────
interface VersionCompareProps {
  product: MainProduct;
  versions: ProductVersion[];
  onClose: () => void;
}

const VersionComparisonDrawer: React.FC<VersionCompareProps> = ({ product, versions, onClose }) => {
  const [baseVerId, setBaseVerId] = useState<string>(versions[0]?.id || '');
  const [targetVerId, setTargetVerId] = useState<string>(versions[versions.length - 1]?.id || '');

  const baseVer = versions.find(v => v.id === baseVerId) || versions[0];
  const targetVer = versions.find(v => v.id === targetVerId) || versions[versions.length - 1];

  const effDiff = (targetVer?.killRateOrEfficacy || 0) - (baseVer?.killRateOrEfficacy || 0);
  const costDiff = (targetVer?.estimatedCost || 0) - (baseVer?.estimatedCost || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <Scale className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-white">
                Version Upgrade Matrix: {product.name}
              </h3>
              <p className="text-xs text-gray-400 font-medium">
                Side-by-side scientific comparison of formulation iterations &amp; recipe changes
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-xl">✕</button>
        </div>

        {/* Selection Bar */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">Base Version (Earlier)</label>
            <select
              value={baseVerId}
              onChange={e => setBaseVerId(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
            >
              {versions.map(v => (
                <option key={v.id} value={v.id}>{v.versionTag} — {v.versionName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">Target Version (Upgraded)</label>
            <select
              value={targetVerId}
              onChange={e => setTargetVerId(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
            >
              {versions.map(v => (
                <option key={v.id} value={v.id}>{v.versionTag} — {v.versionName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Key Metrics Comparison Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
              <span className="text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-400">Efficacy / Kill Rate</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-black text-gray-900 dark:text-white">{targetVer?.killRateOrEfficacy || '—'}%</span>
                <span className="text-xs font-bold text-gray-400">vs {baseVer?.killRateOrEfficacy || '—'}%</span>
                {effDiff !== 0 && (
                  <span className={`text-xs font-black ${effDiff > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    ({effDiff > 0 ? `+${effDiff}` : effDiff}%)
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
              <span className="text-[10px] font-extrabold uppercase text-blue-700 dark:text-blue-400">Recipe Cost / Unit</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-black text-gray-900 dark:text-white">
                  {targetVer?.estimatedCost ? `₹${targetVer.estimatedCost.toFixed(2)}` : '—'}
                </span>
                <span className="text-xs font-bold text-gray-400">
                  vs {baseVer?.estimatedCost ? `₹${baseVer.estimatedCost.toFixed(2)}` : '—'}
                </span>
                {costDiff !== 0 && (
                  <span className={`text-xs font-black ${costDiff < 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    ({costDiff > 0 ? `+₹${costDiff.toFixed(2)}` : `-₹${Math.abs(costDiff).toFixed(2)}`})
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
              <span className="text-[10px] font-extrabold uppercase text-purple-700 dark:text-purple-400">Control Duration</span>
              <p className="text-sm font-black text-gray-900 dark:text-white mt-1">
                {targetVer?.controlLongevity || 'Standard'}
              </p>
            </div>
          </div>

          {/* Upgrade Reason & Scientific Rationale */}
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-1.5">
            <span className="text-[11px] font-black uppercase text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Scientific Upgrade Rationale ({targetVer?.versionTag})
            </span>
            <p className="text-xs font-medium text-amber-900 dark:text-amber-200 leading-relaxed">
              {targetVer?.upgradeReason || 'No specific upgrade notes recorded for this iteration.'}
            </p>
          </div>

          {/* Side by side recipes comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2">
              <h4 className="text-xs font-black text-gray-700 dark:text-gray-300">
                {baseVer?.versionTag}: {baseVer?.versionName}
              </h4>
              <p className="text-[11px] text-gray-400">Dosage: {baseVer?.dosage || 'Standard'}</p>
              <div className="space-y-1 pt-1">
                {(baseVer?.ingredients || []).length > 0 ? (
                  baseVer.ingredients?.map((ing, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 dark:border-gray-800">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{ing.name}</span>
                      <span className="font-mono text-gray-500">{ing.quantity} {ing.unit}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">No detailed ingredients listed.</p>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10 space-y-2">
              <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300">
                {targetVer?.versionTag}: {targetVer?.versionName}
              </h4>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">Dosage: {targetVer?.dosage || 'Standard'}</p>
              <div className="space-y-1 pt-1">
                {(targetVer?.ingredients || []).length > 0 ? (
                  targetVer.ingredients?.map((ing, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 dark:border-gray-800">
                      <span className="font-semibold text-gray-900 dark:text-white">{ing.name}</span>
                      <span className="font-mono text-emerald-600 font-bold">{ing.quantity} {ing.unit}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">No detailed ingredients listed.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300">
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Page Component ───────────────────────────────────────────────────────
export const FormulationTracker: React.FC = () => {
  const { profile } = useAuth();

  // Active top navigation tab:
  // 'versions': Main Products & Version Lineage (PRIMARY)
  // 'trial_manager_formulas': Trial Manager Formulations Mirror (Image 2)
  // 'lab_tracker': 14-Field R&D Tracker
  const [activeTab, setActiveTab] = useState<'versions' | 'trial_manager_formulas' | 'lab_tracker'>('versions');

  // Products & Versions State
  const [mainProducts, setMainProducts] = useState<MainProduct[]>(() => getMainProducts());
  const [productVersions, setProductVersions] = useState<ProductVersion[]>(() => getProductVersions());

  // Category & Variant Filters
  const [selectedCategory, setSelectedCategory] = useState<'all' | ProductCategory>('all');
  const [selectedVariant, setSelectedVariant] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Synced Formulations from Trial Manager
  const [syncedFormulations, setSyncedFormulations] = useState<ExternalFormulation[]>(() => getSyncedFormulations());
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  // Modals state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkModalInitialFormula, setLinkModalInitialFormula] = useState<ExternalFormulation | null>(null);
  const [linkModalInitialProductId, setLinkModalInitialProductId] = useState<string | null>(null);
  const [comparisonProduct, setComparisonProduct] = useState<MainProduct | null>(null);

  // 14-Field Tracker State
  const [formulations, setFormulations] = useState<ScientificFormulation[]>(() => loadScientificFormulations());
  const [selected14Field, setSelected14Field] = useState<ScientificFormulation | null>(null);
  const [show14Form, setShow14Form] = useState(false);
  const [form14Initial, setForm14Initial] = useState<Partial<ScientificFormulation>>({});
  const [filter14Cat, setFilter14Cat] = useState<string>('all');
  const [edit14Mode, setEdit14Mode] = useState(false);

  // Subscribe to changes in MainProducts & Versions store
  useEffect(() => {
    const unsub = subscribeToProductChanges(() => {
      setMainProducts(getMainProducts());
      setProductVersions(getProductVersions());
    });
    return unsub;
  }, []);

  // Auto load formulations from Dexie / Cloud on mount
  useEffect(() => {
    readFormulationsFromIndexedDB().then(idbForms => {
      if (idbForms && idbForms.length > 0) {
        setSyncedFormulations(idbForms);
        saveSyncedFormulationsList(idbForms);
      }
    });

    const cfg = getSavedFirebaseConfig();
    if (cfg?.projectId) {
      fetchFormulationsFromFirebaseCloud(cfg).then(cloudForms => {
        if (cloudForms && cloudForms.length > 0) {
          setSyncedFormulations(cloudForms);
          saveSyncedFormulationsList(cloudForms);
        }
      }).catch(e => console.warn('Could not auto fetch cloud formulas:', e));
    }
  }, []);

  const handleManualSyncFormulas = async () => {
    setIsSyncingCloud(true);
    try {
      const cfg = getSavedFirebaseConfig();
      if (cfg?.projectId) {
        const cloudForms = await fetchFormulationsFromFirebaseCloud(cfg);
        if (cloudForms && cloudForms.length > 0) {
          setSyncedFormulations(cloudForms);
          saveSyncedFormulationsList(cloudForms);
          window.dispatchEvent(new CustomEvent('app:toast', {
            detail: { msg: `Synced ${cloudForms.length} formulations from Trial Manager cloud!`, type: 'success' }
          }));
        } else {
          const idbForms = await readFormulationsFromIndexedDB();
          setSyncedFormulations(idbForms);
        }
      } else {
        const idbForms = await readFormulationsFromIndexedDB();
        if (idbForms.length > 0) setSyncedFormulations(idbForms);
      }
    } catch (err: any) {
      console.error('Failed to sync formulas:', err);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // ── Filtered Main Products & Versions ────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    return mainProducts.filter(p => {
      const matchesCat = selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesVar = selectedVariant === 'all' || p.variantType === selectedVariant;
      const matchesSearch = !searchTerm.trim() || 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.variantType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCat && matchesVar && matchesSearch;
    });
  }, [mainProducts, selectedCategory, selectedVariant, searchTerm]);

  // Variant options for active category
  const availableVariants = useMemo(() => {
    if (selectedCategory === 'all') {
      const set = new Set<string>();
      Object.values(CATEGORY_VARIANTS_MAP).forEach(list => list.forEach(v => set.add(v)));
      return Array.from(set);
    }
    return CATEGORY_VARIANTS_MAP[selectedCategory] || [];
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6 space-y-6">
      {/* ── Top Header Banner ── */}
      <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Formulation &amp; Version Architecture
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Trial Manager Sync Connected
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
            <FlaskConical className="w-7 h-7 text-emerald-500" />
            Formulation &amp; Version Management
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-3xl font-medium">
            Manage your Main Product lines (Organic, Inorganic, IPM, Microweed), upgrade formulation versions, track scientific changes, and gather live recipes from Trial Manager.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            onClick={() => {
              setLinkModalInitialFormula(null);
              setLinkModalInitialProductId(null);
              setShowLinkModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-500/25 transition active:scale-95"
          >
            <GitBranch className="w-4 h-4" />
            + Link Version
          </button>
        </div>
      </div>

      {/* ── Main Tab Navigation Bar ── */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
        <button
          onClick={() => setActiveTab('versions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
            activeTab === 'versions'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Main Products &amp; Version Lineage
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 text-white">
            {filteredProducts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('trial_manager_formulas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
            activeTab === 'trial_manager_formulas'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Trial Manager Cloud Formulations
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 text-white">
            {syncedFormulations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('lab_tracker')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
            activeTab === 'lab_tracker'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          14-Field R&amp;D Lab Tracker
        </button>
      </div>

      {/* ── TAB 1: MAIN PRODUCTS & VERSION LINEAGE (PRIMARY) ── */}
      {activeTab === 'versions' && (
        <div className="space-y-6">
          {/* Category & Variant Filter Toolbar */}
          <div className="p-4 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-md space-y-3">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => { setSelectedCategory('all'); setSelectedVariant('all'); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${
                  selectedCategory === 'all'
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                }`}
              >
                All Categories ({mainProducts.length})
              </button>

              {CATEGORY_OPTIONS.map(cat => {
                const count = mainProducts.filter(p => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); setSelectedVariant('all'); }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black capitalize transition ${
                      selectedCategory === cat
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            {/* Sub-Filters: Variant Type Dropdown & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Product Variant:
                </span>
                <select
                  value={selectedVariant}
                  onChange={e => setSelectedVariant(e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none text-gray-800 dark:text-gray-200 cursor-pointer"
                >
                  <option value="all">All Product Variants ({availableVariants.length})</option>
                  {availableVariants.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by product name, variant, or crops..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium outline-none"
                />
              </div>
            </div>
          </div>

          {/* Main Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-md space-y-3">
              <Building2 className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">No Products Found</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                No main products match the selected category or variant filter. Click "+ Link Version" to add or create one.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredProducts.map(product => {
                const versions = productVersions.filter(v => v.productId === product.id);
                // Sort versions: newest first or V-number
                const sortedVersions = [...versions].sort((a, b) => new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime());

                return (
                  <div
                    key={product.id}
                    className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xl space-y-4 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Product Header */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              {product.category}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              {product.variantType}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400 font-bold">{product.code}</span>
                          </div>
                          <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                            {product.name}
                          </h3>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          product.commercialStatus === 'Active Commercial'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {product.commercialStatus}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium line-clamp-2 leading-relaxed mb-3">
                        {product.description}
                      </p>

                      {/* Active Commercial Version Ribbon */}
                      {product.activeVersionTag && (
                        <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <div>
                              <p className="text-[11px] font-black text-gray-900 dark:text-white">
                                Active Flagship: <span className="text-emerald-600 dark:text-emerald-400 font-mono font-extrabold">{product.activeVersionTag}</span>
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {sortedVersions.find(v => v.versionTag === product.activeVersionTag)?.versionName || 'Current Formulation Candidate'}
                              </p>
                            </div>
                          </div>
                          {product.averageEfficacy && (
                            <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-1 rounded-xl">
                              {product.averageEfficacy}% WCE
                            </span>
                          )}
                        </div>
                      )}

                      {/* Version Lineage Evolution Timeline */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                            <GitBranch className="w-3.5 h-3.5 text-emerald-500" />
                            Formulation Upgrade Evolution ({sortedVersions.length} Iterations)
                          </h4>
                          {sortedVersions.length > 1 && (
                            <button
                              onClick={() => setComparisonProduct(product)}
                              className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                            >
                              <Scale className="w-3 h-3" /> Compare Versions
                            </button>
                          )}
                        </div>

                        <div className="space-y-2">
                          {sortedVersions.map(ver => {
                            const isFlagship = ver.status === 'Active Commercial' || ver.versionTag === product.activeVersionTag;
                            return (
                              <div
                                key={ver.id}
                                className={`p-3 rounded-2xl border transition-all ${
                                  isFlagship
                                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                                    : 'bg-gray-50/70 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-mono font-black text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800 px-2 py-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
                                        {ver.versionTag}
                                      </span>
                                      <span className="font-bold text-xs text-gray-900 dark:text-white">
                                        {ver.versionName}
                                      </span>
                                      {isFlagship && (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-600 text-white">
                                          Flagship
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
                                      Upgrade: {ver.upgradeReason}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {ver.killRateOrEfficacy && (
                                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                                        {ver.killRateOrEfficacy}% Kill
                                      </span>
                                    )}
                                    {ver.costPerUnitStr && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                        {ver.costPerUnitStr}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Ingredients Summary */}
                                {ver.ingredients && ver.ingredients.length > 0 && (
                                  <div className="flex items-center gap-1 flex-wrap mt-2 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                                    <span className="text-[10px] font-bold text-gray-400">Recipe:</span>
                                    {ver.ingredients.map((ing, i) => (
                                      <span key={i} className="text-[10px] bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                                        {ing.name} {ing.quantity ? `(${ing.quantity}${ing.unit})` : ''}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Action row */}
                                <div className="flex items-center justify-between mt-2 pt-1.5 text-[10px] text-gray-400 font-semibold">
                                  <span>{ver.dosage ? `Dose: ${ver.dosage}` : 'Standard dose'} • {ver.stage}</span>
                                  <div className="flex items-center gap-2">
                                    {!isFlagship && (
                                      <button
                                        onClick={() => promoteActiveVersion(product.id, ver.id)}
                                        className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                                      >
                                        Set Flagship
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        if (window.confirm(`Delete version ${ver.versionTag}?`)) {
                                          deleteProductVersion(ver.id);
                                        }
                                      }}
                                      className="text-red-400 hover:text-red-600"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Card Bottom Actions */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setLinkModalInitialFormula(null);
                          setLinkModalInitialProductId(product.id);
                          setShowLinkModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-xs border border-emerald-200 dark:border-emerald-800 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> + Add Version Iteration
                      </button>

                      {sortedVersions.length > 1 && (
                        <button
                          onClick={() => setComparisonProduct(product)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 font-bold text-xs border border-purple-200 dark:border-purple-800 transition"
                        >
                          <Scale className="w-3.5 h-3.5" /> Compare
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: TRIAL MANAGER CLOUD FORMULATIONS (MIRRORING IMAGE 2) ── */}
      {activeTab === 'trial_manager_formulas' && (
        <div className="space-y-6">
          {/* Top Info Bar with Sync Refresh */}
          <div className="p-4 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white">
                  Formulations Gathered from Trial Manager App ({syncedFormulations.length})
                </h3>
                <p className="text-xs text-gray-400 font-medium">
                  Live formulation recipes, active ingredients, kill rates, and estimated costs from Firestore collections
                </p>
              </div>
            </div>

            <button
              onClick={handleManualSyncFormulas}
              disabled={isSyncingCloud}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-md transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
              {isSyncingCloud ? 'Syncing...' : 'Sync Cloud Recipes'}
            </button>
          </div>

          {/* Formulations Grid matching Screenshot 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {syncedFormulations.map(f => {
              // Check if already linked to a main product version
              const match = mainProducts.find(p => {
                const versions = productVersions.filter(v => v.productId === p.id);
                return versions.some(v => v.formulaNameOrCode.toLowerCase() === f.name.toLowerCase() || v.sourceFormulaId === f.id);
              });

              return (
                <div
                  key={f.id}
                  className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-lg flex flex-col justify-between space-y-4 hover:border-purple-400 transition"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-base font-black text-gray-900 dark:text-white break-words">
                          {f.name}
                        </h4>
                        {f.code && (
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            {f.code}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 uppercase">
                        {f.category}
                      </span>
                    </div>

                    {/* Badges Bar (Kill rate, Control, etc.) */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {f.killRate && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                          🟢 {f.killRate}% — Excellent
                        </span>
                      )}
                      {f.controlLongevity && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200">
                          ⏳ {f.controlLongevity}
                        </span>
                      )}
                    </div>

                    {/* Ingredients List */}
                    <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-gray-400">
                        Ingredients ({(f.ingredients || []).length})
                      </span>
                      {(f.ingredients || []).length > 0 ? (
                        f.ingredients?.map((ing, i) => (
                          <div key={i} className="flex items-center justify-between text-xs py-0.5">
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{ing.name}</span>
                            <span className="font-mono text-gray-500 font-bold">{ing.quantity} {ing.unit}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 italic">No ingredients specified.</p>
                      )}
                    </div>

                    {/* Cost & Field Trials Metrics Bar */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                      <div>
                        <span className="text-[9px] font-bold uppercase text-gray-400">Est. Recipe Cost</span>
                        <p className="text-xs font-black text-gray-900 dark:text-white">
                          {f.estimatedCost ? `₹${f.estimatedCost.toFixed(2)} / L` : '₹0.00 / 1ml'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase text-gray-400">Linked Trials</span>
                        <p className="text-xs font-black text-purple-600 dark:text-purple-400">
                          {f.linkedTrialsCount || 0} Plot Checks
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Link to Main Product */}
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                    {match ? (
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                          ✓ Linked to: <strong>{match.name}</strong>
                        </span>
                        <button
                          onClick={() => {
                            setLinkModalInitialFormula(f);
                            setLinkModalInitialProductId(match.id);
                            setShowLinkModal(true);
                          }}
                          className="text-[10px] font-bold text-emerald-700 hover:underline"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setLinkModalInitialFormula(f);
                          setShowLinkModal(true);
                        }}
                        className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-1.5"
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        Link to Main Product as Version
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 3: 14-FIELD SCIENTIFIC FORMULATION LAB TRACKER ── */}
      {activeTab === 'lab_tracker' && (
        <div className="space-y-6">
          <div className="flex gap-4 min-h-[500px]">
            {/* Left: Version Tree */}
            <div className="w-[380px] flex-shrink-0 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 overflow-y-auto shadow-md">
              <div className="flex items-center gap-2 mb-4">
                <GitBranch className="w-4 h-4 text-emerald-500" />
                <h2 className="text-xs font-bold text-gray-700 dark:text-gray-300">14-Field Version Lineage Tree</h2>
                <span className="ml-auto text-[10px] text-gray-400">{formulations.length} versions</span>
              </div>

              {buildTree(formulations).length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No 14-field formulations logged yet.</p>
                </div>
              ) : (
                buildTree(formulations).map(node => (
                  <TreeNode
                    key={node.formulation.id}
                    node={node}
                    depth={0}
                    onSelect={setSelected14Field}
                    selected={selected14Field?.id ?? null}
                    onBranch={(parentId) => {
                      const parent = formulations.find(f => f.id === parentId);
                      if (parent) {
                        setForm14Initial({ ...parent, id: undefined, parentVersionId: parentId, version: '' });
                        setShow14Form(true);
                      }
                    }}
                    onDelete={(id) => {
                      if (window.confirm('Delete 14-field record?')) {
                        setFormulations(prev => prev.filter(f => f.id !== id));
                      }
                    }}
                  />
                ))
              )}
            </div>

            {/* Right: Detail Panel */}
            <div className="flex-1 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 overflow-y-auto shadow-md">
              {selected14Field ? (
                <DetailPanel formulation={selected14Field} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-20">
                  <Info className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">Select a formulation version to inspect all 14 parameters</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Link Formulation or Trial as Version Modal ── */}
      <LinkVersionModal
        isOpen={showLinkModal}
        onClose={() => {
          setShowLinkModal(false);
          setLinkModalInitialFormula(null);
          setLinkModalInitialProductId(null);
        }}
        initialFormula={linkModalInitialFormula}
        initialProductId={linkModalInitialProductId}
        onSuccess={(ver, prod) => {
          window.dispatchEvent(new CustomEvent('app:toast', {
            detail: { msg: `Successfully linked "${ver.versionTag} - ${ver.versionName}" under "${prod.name}" (${prod.variantType})!`, type: 'success' }
          }));
        }}
      />

      {/* ── Version Comparison Drawer ── */}
      {comparisonProduct && (
        <VersionComparisonDrawer
          product={comparisonProduct}
          versions={productVersions.filter(v => v.productId === comparisonProduct.id)}
          onClose={() => setComparisonProduct(null)}
        />
      )}
    </div>
  );
};
