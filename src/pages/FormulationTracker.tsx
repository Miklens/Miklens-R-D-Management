import React, { useState, useEffect, useCallback } from 'react';
import {
  FlaskConical, Plus, GitBranch, ChevronDown, ChevronRight, Trash2,
  CheckCircle, AlertTriangle, XCircle, Clock, Info, BarChart2, Edit3,
} from 'lucide-react';
import type {
  ScientificFormulation,
  FormulationDecision,
  FormulationPhysicalAppearance,
  FormulationSolubility,
  FormulationCompatibility,
  FormulationStability,
} from '../types/experimentTypes';
import { loadScientificFormulations, saveScientificFormulations } from '../services/experimentStore';
import { useAuth } from '../contexts/AuthContext';

// ── Constants ─────────────────────────────────────────────────────────────────
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
const CATEGORY_OPTIONS = ['herbicide', 'fungicide', 'pesticide', 'nutrition', 'biostimulant', 'other'] as const;

type FormulationCategory = typeof CATEGORY_OPTIONS[number];

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

// ── Version Tree Node ──────────────────────────────────────────────────────────
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

// ── Add/Edit Modal ─────────────────────────────────────────────────────────────
interface FormulationFormProps {
  initial: Partial<ScientificFormulation>;
  formulations: ScientificFormulation[];
  onSave: (data: Omit<ScientificFormulation, 'id' | 'formulationId' | 'createdAt' | 'updatedAt' | 'createdBy'> & { parentVersionId?: string }) => void;
  onCancel: () => void;
}

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode; hint?: string }> = ({ label, required, children, hint }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {hint && <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>}
  </div>
);

const inputCls = 'w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40';
const textAreaCls = `${inputCls} resize-none`;

const FormulationForm: React.FC<FormulationFormProps> = ({ initial, formulations, onSave, onCancel }) => {
  const [form, setForm] = useState({
    name: initial.name ?? '',
    version: initial.version ?? 'V1',
    parentVersionId: initial.parentVersionId ?? '',
    reasonForRevision: initial.reasonForRevision ?? '',
    batchNo: initial.batchNo ?? '',
    keyActivesComposition: initial.keyActivesComposition ?? '',
    physicalAppearance: initial.physicalAppearance ?? 'Clear Liquid' as FormulationPhysicalAppearance,
    solubilityDispersibility: initial.solubilityDispersibility ?? 'Complete' as FormulationSolubility,
    compatibility: initial.compatibility ?? 'Compatible' as FormulationCompatibility,
    compatibilityNotes: initial.compatibilityNotes ?? '',
    pH: initial.pH ?? '',
    stabilityStatus: initial.stabilityStatus ?? 'Under Accelerated Testing' as FormulationStability,
    stabilityNotes: initial.stabilityNotes ?? '',
    problemIdentified: initial.problemIdentified ?? '',
    correctiveAction: initial.correctiveAction ?? '',
    trialResultEfficacy: initial.trialResultEfficacy ?? '',
    trialResultNotes: initial.trialResultNotes ?? '',
    finalDecision: initial.finalDecision ?? 'Under Review' as FormulationDecision,
    finalDecisionNotes: initial.finalDecisionNotes ?? '',
    category: initial.category ?? 'herbicide' as FormulationCategory,
  });

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim() || !form.batchNo.trim() || !form.version.trim()) {
      alert('Product name, batch no, and version are required.');
      return;
    }
    onSave({
      ...form,
      pH: form.pH !== '' ? Number(form.pH) : undefined,
      trialResultEfficacy: form.trialResultEfficacy !== '' ? Number(form.trialResultEfficacy) : undefined,
      parentVersionId: form.parentVersionId || undefined,
    } as any);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-emerald-500" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">14-Field Formulation Entry</h2>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-700 dark:hover:text-white text-lg">✕</button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          {/* Fields 1–3 */}
          <div className="grid grid-cols-3 gap-4">
            <Field label="Product Name" required>
              <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Goweed Ultra" />
            </Field>
            <Field label="Version" required hint="e.g. V1, V2, V2.2, V3">
              <input className={inputCls} value={form.version} onChange={e => set('version', e.target.value)} placeholder="V1" />
            </Field>
            <Field label="Category">
              <select className={inputCls} value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </Field>
          </div>

          {/* Field 4: Parent Version */}
          <Field label="Parent Version (for version lineage)" hint="Select the version this was derived from, if any.">
            <select className={inputCls} value={form.parentVersionId} onChange={e => set('parentVersionId', e.target.value)}>
              <option value="">-- None (Root Version) --</option>
              {formulations.map(f => (
                <option key={f.id} value={f.id}>{f.name} {f.version} ({f.batchNo})</option>
              ))}
            </select>
          </Field>

          {/* Field 5: Reason for revision */}
          <Field label="Reason for Revision — What changed + Why" required hint="Critical: explain specifically what was modified and the scientific rationale.">
            <textarea className={textAreaCls} rows={2} value={form.reasonForRevision}
              onChange={e => set('reasonForRevision', e.target.value)}
              placeholder="e.g. Increased surfactant concentration from 3% to 5% to improve rainfastness after 10 min post-spray." />
          </Field>

          {/* Fields 6 + 7 */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Batch Number" required>
              <input className={inputCls} value={form.batchNo} onChange={e => set('batchNo', e.target.value)} placeholder="e.g. BT-GWU-004" />
            </Field>
            <Field label="Key Actives / Composition" required>
              <input className={inputCls} value={form.keyActivesComposition} onChange={e => set('keyActivesComposition', e.target.value)}
                placeholder="e.g. Glyphosate 41% + Surfactant 5% + Carrier" />
            </Field>
          </div>

          {/* Fields 8–11 */}
          <div className="grid grid-cols-4 gap-4">
            <Field label="Physical Appearance">
              <select className={inputCls} value={form.physicalAppearance} onChange={e => set('physicalAppearance', e.target.value)}>
                {APPEARANCE_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Solubility">
              <select className={inputCls} value={form.solubilityDispersibility} onChange={e => set('solubilityDispersibility', e.target.value)}>
                {SOLUBILITY_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Compatibility">
              <select className={inputCls} value={form.compatibility} onChange={e => set('compatibility', e.target.value)}>
                {COMPAT_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="pH">
              <input className={inputCls} type="number" step="0.1" min="0" max="14" value={form.pH}
                onChange={e => set('pH', e.target.value)} placeholder="e.g. 6.5" />
            </Field>
          </div>

          {/* Field 12: Stability */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Stability Status">
              <select className={inputCls} value={form.stabilityStatus} onChange={e => set('stabilityStatus', e.target.value)}>
                {STABILITY_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Stability / Compatibility Notes">
              <input className={inputCls} value={form.stabilityNotes} onChange={e => set('stabilityNotes', e.target.value)}
                placeholder="e.g. Phase separation at >40°C after 2 weeks" />
            </Field>
          </div>

          {/* Fields 13 + 14 */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Problem Identified" hint="Be specific — state the observed failure mode.">
              <textarea className={textAreaCls} rows={2} value={form.problemIdentified}
                onChange={e => set('problemIdentified', e.target.value)}
                placeholder="e.g. Rapid evaporation of spray droplets at >32°C ambient temp causing 25% efficacy reduction at DAA-7." />
            </Field>
            <Field label="Corrective Action" hint="State action + expected outcome + status.">
              <textarea className={textAreaCls} rows={2} value={form.correctiveAction}
                onChange={e => set('correctiveAction', e.target.value)}
                placeholder="e.g. Added anti-evaporant adjuvant (Silwet L-77) at 2.5% v/v — pending re-trial in CL-6." />
            </Field>
          </div>

          {/* Trial results */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Trial Result Efficacy (%)" hint="WCE / DCE / PRE at final DAA evaluation">
              <input className={inputCls} type="number" min="0" max="100" value={form.trialResultEfficacy}
                onChange={e => set('trialResultEfficacy', e.target.value)} placeholder="e.g. 82" />
            </Field>
            <Field label="Trial Result Notes">
              <input className={inputCls} value={form.trialResultNotes} onChange={e => set('trialResultNotes', e.target.value)}
                placeholder="e.g. 82% WCE at DAA-14, superior to CL-4 (71%)" />
            </Field>
          </div>

          {/* Decision */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Final Decision">
              <select className={inputCls} value={form.finalDecision} onChange={e => set('finalDecision', e.target.value)}>
                {DECISION_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Decision Notes">
              <input className={inputCls} value={form.finalDecisionNotes} onChange={e => set('finalDecisionNotes', e.target.value)}
                placeholder="e.g. Advance to GLP field trial — 3 locations, Sept batch" />
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <button onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">
            Cancel
          </button>
          <button onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition shadow-lg shadow-emerald-500/30">
            Save Formulation
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Detail Panel ───────────────────────────────────────────────────────────────
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

// ── Main Page ──────────────────────────────────────────────────────────────────
export const FormulationTracker: React.FC = () => {
  const { profile } = useAuth();
  const [formulations, setFormulations] = useState<ScientificFormulation[]>(() => loadScientificFormulations());
  const [selected, setSelected] = useState<ScientificFormulation | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formInitial, setFormInitial] = useState<Partial<ScientificFormulation>>({});
  const [filterCat, setFilterCat] = useState<string>('all');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => { saveScientificFormulations(formulations); }, [formulations]);

  const addOrUpdate = useCallback((data: any) => {
    const now = new Date().toISOString();
    if (editMode && selected) {
      setFormulations(prev => prev.map(f => f.id === selected.id
        ? { ...f, ...data, updatedAt: now }
        : f
      ));
      setSelected(prev => prev ? { ...prev, ...data, updatedAt: now } : null);
    } else {
      const productCode = (data.name || 'FML').replace(/\s+/g, '').toUpperCase().slice(0, 6);
      const version = (data.version || 'V1').replace(/\s/g, '').toUpperCase();
      const newFormulation: ScientificFormulation = {
        ...data,
        id: `fml-${Date.now()}`,
        formulationId: `${productCode}-${version}-${Date.now().toString().slice(-4)}`,
        createdBy: profile?.name || 'Scientist',
        createdAt: now,
        updatedAt: now,
      };
      setFormulations(prev => [newFormulation, ...prev]);
    }
    setShowForm(false);
    setEditMode(false);
    setFormInitial({});
  }, [editMode, selected, profile]);

  const handleBranch = (parentId: string) => {
    const parent = formulations.find(f => f.id === parentId);
    if (!parent) return;
    setFormInitial({ ...parent, id: undefined, parentVersionId: parentId, version: '', reasonForRevision: '' });
    setEditMode(false);
    setShowForm(true);
  };

  const handleEdit = () => {
    if (!selected) return;
    setFormInitial(selected);
    setEditMode(true);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this formulation version? Child versions will become roots.')) return;
    setFormulations(prev => prev.filter(f => f.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const filtered = filterCat === 'all' ? formulations : formulations.filter(f => f.category === filterCat);
  const tree = buildTree(filtered);
  const parentFormulation = selected?.parentVersionId
    ? formulations.find(f => f.id === selected.parentVersionId)
    : undefined;

  // Summary stats
  const stats = {
    total: formulations.length,
    advancing: formulations.filter(f => f.finalDecision === 'Advance to Field Trial' || f.finalDecision === 'Advance to Registration').length,
    modify: formulations.filter(f => f.finalDecision === 'Modify').length,
    stopped: formulations.filter(f => f.finalDecision === 'Stop').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-emerald-500" />
            Scientific Formulation Tracker
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            14-field version-lineage tracker — What changed + Why + Result
          </p>
        </div>
        <button
          onClick={() => { setFormInitial(blankFormulation()); setEditMode(false); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-500/30"
        >
          <Plus className="w-4 h-4" /> New Formulation Version
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Versions', value: stats.total, color: 'text-gray-700 dark:text-gray-200' },
          { label: 'Advancing', value: stats.advancing, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Needs Modification', value: stats.modify, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Stopped', value: stats.stopped, color: 'text-red-600 dark:text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap mb-5">
        {['all', ...CATEGORY_OPTIONS].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition
              ${filterCat === cat
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-emerald-400'
              }`}
          >
            {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Main Layout */}
      <div className="flex gap-4 min-h-[500px]">
        {/* Left: Version Tree */}
        <div className="w-[380px] flex-shrink-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch className="w-4 h-4 text-emerald-500" />
            <h2 className="text-xs font-bold text-gray-700 dark:text-gray-300">Version Lineage Tree</h2>
            <span className="ml-auto text-[10px] text-gray-400">{filtered.length} versions</span>
          </div>

          {tree.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No formulations yet. Create the first version.</p>
            </div>
          ) : (
            tree.map(node => (
              <TreeNode key={node.formulation.id} node={node} depth={0}
                onSelect={setSelected} selected={selected?.id ?? null}
                onBranch={handleBranch} onDelete={handleDelete} />
            ))
          )}
        </div>

        {/* Right: Detail Panel */}
        <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 overflow-y-auto">
          {selected ? (
            <>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                    {selected.name} <span className="text-emerald-500">{selected.version}</span>
                  </h2>
                  <p className="text-[11px] text-gray-400">{selected.formulationId} · {selected.batchNo}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => handleBranch(selected.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-emerald-600 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition">
                    <GitBranch className="w-3 h-3" /> Branch Version
                  </button>
                </div>
              </div>
              <DetailPanel formulation={selected} parent={parentFormulation} />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-20">
              <Info className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">Select a formulation version to view details</p>
              <p className="text-xs mt-1">Click any version in the lineage tree to inspect all 14 fields</p>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <FormulationForm
          initial={formInitial}
          formulations={formulations}
          onSave={addOrUpdate}
          onCancel={() => { setShowForm(false); setEditMode(false); setFormInitial({}); }}
        />
      )}
    </div>
  );
};
