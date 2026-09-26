import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Plus, Send, ChevronDown, ChevronUp, CheckCircle, AlertTriangle,
  Clock, Trash2, Star, ArrowRight, HelpCircle, TrendingUp, ListChecks,
  BarChart2, Shield, RefreshCw, Edit3, Download,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type {
  WeeklyMISReport,
  ActionItem,
  ProblemRiskItem,
  ManagementDecisionItem,
  FormulationEfficacyRankingEntry,
  FormulationDecision,
} from '../types/experimentTypes';
import { loadMISReports, saveMISReports } from '../services/experimentStore';
import { useAuth } from '../contexts/AuthContext';

// ── Helpers ────────────────────────────────────────────────────────────────────
const inputCls = 'w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40';
const textAreaCls = `${inputCls} resize-none`;

const statusColors: Record<WeeklyMISReport['status'], string> = {
  Draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  Submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Reviewed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

const DECISION_OPTIONS: FormulationDecision[] = [
  'Continue', 'Modify', 'Stop', 'Under Review', 'Advance to Field Trial', 'Advance to Registration',
];

const getISOWeek = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const getWeekDates = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
    week: getISOWeek(today),
  };
};

const blankReport = (preparedBy: string): Omit<WeeklyMISReport, 'id'> => {
  const { start, end, week } = getWeekDates();
  return {
    weekNumber: week,
    reportingPeriodStart: start,
    reportingPeriodEnd: end,
    preparedBy,
    preparedAt: new Date().toISOString(),
    whatDidWeLearn: '',
    whatDoesDataMeanScientifically: '',
    whatDecisionFollows: '',
    keyAchievements: [''],
    keyScientificFindings: [''],
    formulationEfficacyRanking: [],
    problemsRisks: [],
    decisionsRequiredFromManagement: [],
    actionsForNextWeek: [],
    status: 'Draft',
    managementFeedback: '',
  };
};

// ── Reusable List Editor (string arrays) ────────────────────────────────────────
const ListEditor: React.FC<{
  label: string;
  icon: React.ReactNode;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}> = ({ label, icon, items, onChange, placeholder }) => (
  <div>
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{label}</p>
    </div>
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-2">
          <input
            className={inputCls}
            value={item}
            onChange={e => {
              const next = [...items];
              next[idx] = e.target.value;
              onChange(next);
            }}
            placeholder={placeholder}
          />
          <button
            onClick={() => onChange(items.filter((_, i) => i !== idx))}
            className="text-gray-300 hover:text-red-500 transition p-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, ''])}
        className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-semibold"
      >
        <Plus className="w-3 h-3" /> Add
      </button>
    </div>
  </div>
);

// ── Efficacy Ranking Editor ────────────────────────────────────────────────────
const EfficacyRankingEditor: React.FC<{
  items: FormulationEfficacyRankingEntry[];
  onChange: (items: FormulationEfficacyRankingEntry[]) => void;
}> = ({ items, onChange }) => {
  const addRow = () => onChange([...items, {
    rank: items.length + 1, formulationName: '', wceAtLatestDaa: 0, latestDaa: 7, decision: 'Under Review', notes: '',
  }]);

  const updateRow = (idx: number, field: string, value: string | number) => {
    const next = items.map((it, i) => i === idx ? { ...it, [field]: value } : it);
    onChange(next);
  };

  const decisionColor = (d: FormulationDecision) => {
    if (d === 'Advance to Field Trial' || d === 'Advance to Registration') return 'text-emerald-600';
    if (d === 'Stop') return 'text-red-500';
    if (d === 'Modify') return 'text-amber-500';
    return 'text-gray-500';
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <BarChart2 className="w-4 h-4 text-emerald-500" />
        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Formulation Efficacy Ranking</p>
        <span className="text-[10px] text-gray-400 ml-auto">Rank by WCE % (highest = best)</span>
      </div>

      {items.length === 0 ? (
        <p className="text-[11px] text-gray-400 italic mb-2">No formulations ranked yet.</p>
      ) : (
        <div className="overflow-x-auto mb-2">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <th className="text-left py-1.5 pr-2 font-semibold">#</th>
                <th className="text-left py-1.5 pr-2 font-semibold">Formulation</th>
                <th className="text-left py-1.5 pr-2 font-semibold">WCE %</th>
                <th className="text-left py-1.5 pr-2 font-semibold">DAA</th>
                <th className="text-left py-1.5 pr-2 font-semibold">Decision</th>
                <th className="text-left py-1.5 pr-2 font-semibold">Notes</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx} className="border-b border-gray-50 dark:border-gray-800/50">
                  <td className="py-1.5 pr-2">
                    <input type="number" className={`${inputCls} w-12`} value={it.rank}
                      onChange={e => updateRow(idx, 'rank', Number(e.target.value))} min={1} />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input className={`${inputCls} w-28`} value={it.formulationName}
                      onChange={e => updateRow(idx, 'formulationName', e.target.value)} placeholder="e.g. CL-5-V3" />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input type="number" className={`${inputCls} w-16`} value={it.wceAtLatestDaa}
                      onChange={e => updateRow(idx, 'wceAtLatestDaa', Number(e.target.value))} min={0} max={100} />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input type="number" className={`${inputCls} w-14`} value={it.latestDaa}
                      onChange={e => updateRow(idx, 'latestDaa', Number(e.target.value))} min={0} />
                  </td>
                  <td className="py-1.5 pr-2">
                    <select className={`${inputCls} w-36`} value={it.decision}
                      onChange={e => updateRow(idx, 'decision', e.target.value)}>
                      {DECISION_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </td>
                  <td className="py-1.5 pr-2">
                    <input className={`${inputCls} w-48`} value={it.notes}
                      onChange={e => updateRow(idx, 'notes', e.target.value)} placeholder="observation notes" />
                  </td>
                  <td>
                    <button onClick={() => onChange(items.filter((_, i) => i !== idx))}
                      className="text-gray-300 hover:text-red-500 p-1">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button onClick={addRow}
        className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-semibold">
        <Plus className="w-3 h-3" /> Add Formulation to Ranking
      </button>
    </div>
  );
};

// ── Problems/Risks Editor ─────────────────────────────────────────────────────
const ProblemsEditor: React.FC<{
  items: ProblemRiskItem[];
  onChange: (items: ProblemRiskItem[]) => void;
}> = ({ items, onChange }) => {
  const addRow = () => onChange([...items, { id: `prb-${Date.now()}`, problem: '', impact: '', correctiveAction: '', status: 'Open' }]);
  const update = (id: string, field: string, value: string) => onChange(items.map(it => it.id === id ? { ...it, [field]: value } : it));

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Problems &amp; Risks → Corrective Action → Status</p>
      </div>
      <div className="space-y-3">
        {items.map(it => (
          <div key={it.id} className="grid grid-cols-4 gap-2 p-3 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20">
            <textarea className={`${textAreaCls} col-span-1`} rows={2} value={it.problem}
              onChange={e => update(it.id, 'problem', e.target.value)} placeholder="Problem description" />
            <input className={`${inputCls} col-span-1`} value={it.impact}
              onChange={e => update(it.id, 'impact', e.target.value)} placeholder="Impact / risk" />
            <textarea className={`${textAreaCls} col-span-1`} rows={2} value={it.correctiveAction}
              onChange={e => update(it.id, 'correctiveAction', e.target.value)} placeholder="Corrective action + status" />
            <div className="flex flex-col gap-2">
              <select className={inputCls} value={it.status} onChange={e => update(it.id, 'status', e.target.value)}>
                <option>Open</option>
                <option>Pending</option>
                <option>Closed</option>
              </select>
              <button onClick={() => onChange(items.filter(i => i.id !== it.id))}
                className="text-gray-300 hover:text-red-500 self-start p-1">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        <button onClick={addRow}
          className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 hover:text-amber-700 font-semibold">
          <Plus className="w-3 h-3" /> Add Problem / Risk
        </button>
      </div>
    </div>
  );
};

// ── Actions Editor ──────────────────────────────────────────────────────────────
const ActionsEditor: React.FC<{
  items: ActionItem[];
  onChange: (items: ActionItem[]) => void;
}> = ({ items, onChange }) => {
  const addRow = () => onChange([...items, {
    id: `act-${Date.now()}`, action: '', responsiblePerson: '', expectedCompletion: '', status: 'Pending',
  }]);
  const update = (id: string, field: string, value: string) => onChange(items.map(it => it.id === id ? { ...it, [field]: value } : it));

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <ListChecks className="w-4 h-4 text-emerald-500" />
        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Actions for Next Week — Specific Action + Expected Completion</p>
      </div>
      <div className="space-y-2">
        {items.map(it => (
          <div key={it.id} className="grid grid-cols-5 gap-2 items-start">
            <input className={`${inputCls} col-span-2`} value={it.action}
              onChange={e => update(it.id, 'action', e.target.value)} placeholder="Specific action (e.g. Run CL-5-V3 DAA-7 evaluation in Plot-3B)" />
            <input className={inputCls} value={it.responsiblePerson}
              onChange={e => update(it.id, 'responsiblePerson', e.target.value)} placeholder="Responsible person" />
            <input type="date" className={inputCls} value={it.expectedCompletion}
              onChange={e => update(it.id, 'expectedCompletion', e.target.value)} />
            <div className="flex gap-1">
              <select className={inputCls} value={it.status} onChange={e => update(it.id, 'status', e.target.value)}>
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
                <option>Overdue</option>
              </select>
              <button onClick={() => onChange(items.filter(i => i.id !== it.id))}
                className="text-gray-300 hover:text-red-500 p-1">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        <button onClick={addRow}
          className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-semibold">
          <Plus className="w-3 h-3" /> Add Action Item
        </button>
      </div>
    </div>
  );
};

// ── Management Decisions Editor ───────────────────────────────────────────────
const DecisionsEditor: React.FC<{
  items: ManagementDecisionItem[];
  onChange: (items: ManagementDecisionItem[]) => void;
}> = ({ items, onChange }) => {
  const addRow = () => onChange([...items, {
    id: `dec-${Date.now()}`, decisionRequired: '', urgency: 'Medium', deadline: '', status: 'Pending Approval',
  }]);
  const update = (id: string, field: string, value: string) => onChange(items.map(it => it.id === id ? { ...it, [field]: value } : it));

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-purple-500" />
        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Decisions Required from Management</p>
      </div>
      <div className="space-y-2">
        {items.map(it => (
          <div key={it.id} className="grid grid-cols-5 gap-2 items-start p-3 bg-purple-50/50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/20">
            <input className={`${inputCls} col-span-2`} value={it.decisionRequired}
              onChange={e => update(it.id, 'decisionRequired', e.target.value)} placeholder="Decision required" />
            <select className={inputCls} value={it.urgency} onChange={e => update(it.id, 'urgency', e.target.value)}>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
            <input type="date" className={inputCls} value={it.deadline}
              onChange={e => update(it.id, 'deadline', e.target.value)} />
            <div className="flex gap-1">
              <select className={inputCls} value={it.status} onChange={e => update(it.id, 'status', e.target.value)}>
                <option>Pending Approval</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
              <button onClick={() => onChange(items.filter(i => i.id !== it.id))}
                className="text-gray-300 hover:text-red-500 p-1">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        <button onClick={addRow}
          className="flex items-center gap-1.5 text-[11px] text-purple-600 dark:text-purple-400 hover:text-purple-700 font-semibold">
          <Plus className="w-3 h-3" /> Add Management Decision
        </button>
      </div>
    </div>
  );
};

// ── Report Form (create/edit) ──────────────────────────────────────────────────
const ReportForm: React.FC<{
  initial: Omit<WeeklyMISReport, 'id'>;
  reportId?: string;
  onSave: (report: Omit<WeeklyMISReport, 'id'>, id?: string) => void;
  onCancel: () => void;
}> = ({ initial, reportId, onSave, onCancel }) => {
  const [form, setForm] = useState(initial);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const [openSections, setOpenSections] = useState({ core: true, findings: true, ranking: true, problems: false, decisions: false, actions: true });
  const toggle = (k: keyof typeof openSections) => setOpenSections(s => ({ ...s, [k]: !s[k] }));

  const Section: React.FC<{ id: keyof typeof openSections; label: string; icon: React.ReactNode; children: React.ReactNode }> = ({ id, label, icon, children }) => (
    <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
      <button
        className="flex items-center justify-between w-full p-4 bg-gray-50 dark:bg-gray-800/50 text-left"
        onClick={() => toggle(id)}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{label}</span>
        </div>
        {openSections[id] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {openSections[id] && <div className="p-5 space-y-4">{children}</div>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Weekly MIS Report — Week {form.weekNumber}
              </h2>
              <p className="text-[10px] text-gray-400">{form.reportingPeriodStart} → {form.reportingPeriodEnd}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="text-[11px] px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              value={form.status}
              onChange={e => set('status', e.target.value)}
            >
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Approved">Approved</option>
            </select>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-700 dark:hover:text-white text-lg ml-2">✕</button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Basic info */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 block mb-1">Week #</label>
              <input type="number" className={inputCls} value={form.weekNumber} onChange={e => set('weekNumber', Number(e.target.value))} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 block mb-1">Period Start</label>
              <input type="date" className={inputCls} value={form.reportingPeriodStart} onChange={e => set('reportingPeriodStart', e.target.value)} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 block mb-1">Period End</label>
              <input type="date" className={inputCls} value={form.reportingPeriodEnd} onChange={e => set('reportingPeriodEnd', e.target.value)} />
            </div>
          </div>

          {/* Core 3 Scientific Questions — THE MOST IMPORTANT SECTION */}
          <Section id="core" label="The 3 Core Scientific Questions — Management Requires All 3 Answered" icon={<HelpCircle className="w-4 h-4 text-emerald-500" />}>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-700 dark:text-emerald-300 mb-3">
              ⚠️ Management will not accept a report that only says "Trial conducted and observations recorded."
              Every report MUST answer these 3 questions with data-backed statements.
            </div>

            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center">1</span>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Q1 — What did we LEARN this week? (Data-backed, not activities)</label>
              </div>
              <textarea className={textAreaCls} rows={3} value={form.whatDidWeLearn}
                onChange={e => set('whatDidWeLearn', e.target.value)}
                placeholder="e.g. CL-5-V3 achieved 82% WCE at DAA-14, a 14-point improvement over CL-5-V2 (68%). The increase in Surfactant-B from 3% to 5% v/v was the differentiating variable." />
            </div>

            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-[10px] font-black flex items-center justify-center">2</span>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Q2 — What does this data mean SCIENTIFICALLY?</label>
              </div>
              <textarea className={textAreaCls} rows={3} value={form.whatDoesDataMeanScientifically}
                onChange={e => set('whatDoesDataMeanScientifically', e.target.value)}
                placeholder="e.g. The progressive WCE from 45% (DAA-4) → 70% (DAA-7) → 82% (DAA-14) confirms V3 exhibits accumulative systemic herbicidal activity. The absence of phytotoxicity at the elevated surfactant level indicates an adequate crop safety margin." />
            </div>

            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white text-[10px] font-black flex items-center justify-center">3</span>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Q3 — What DECISION follows from this data?</label>
              </div>
              <textarea className={textAreaCls} rows={3} value={form.whatDecisionFollows}
                onChange={e => set('whatDecisionFollows', e.target.value)}
                placeholder="e.g. Recommend advancing CL-5-V3 to multi-location GLP field trial (3 sites, Sept season). Stop further lab modifications. Initiate regulatory dossier preparation." />
            </div>
          </Section>

          {/* Key Findings */}
          <Section id="findings" label="Key Achievements & Scientific Findings" icon={<Star className="w-4 h-4 text-amber-500" />}>
            <ListEditor
              label="Key Achievements"
              icon={<CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
              items={form.keyAchievements}
              onChange={v => set('keyAchievements', v)}
              placeholder="e.g. Completed DAA-14 evaluation for 4 treatment arms in Trial CL-5"
            />
            <ListEditor
              label="Key Scientific Findings"
              icon={<TrendingUp className="w-3.5 h-3.5 text-blue-500" />}
              items={form.keyScientificFindings}
              onChange={v => set('keyScientificFindings', v)}
              placeholder="e.g. V3 formulation shows superior systemic translocation compared to V2 at equivalent dose rates"
            />
          </Section>

          {/* Efficacy Ranking */}
          <Section id="ranking" label="Formulation Efficacy Ranking (Data-Based)" icon={<BarChart2 className="w-4 h-4 text-blue-500" />}>
            <EfficacyRankingEditor items={form.formulationEfficacyRanking} onChange={v => set('formulationEfficacyRanking', v)} />
          </Section>

          {/* Problems */}
          <Section id="problems" label="Problems & Risks → Corrective Action → Status" icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}>
            <ProblemsEditor items={form.problemsRisks} onChange={v => set('problemsRisks', v)} />
          </Section>

          {/* Management Decisions */}
          <Section id="decisions" label="Decisions Required from Management" icon={<Shield className="w-4 h-4 text-purple-500" />}>
            <DecisionsEditor items={form.decisionsRequiredFromManagement} onChange={v => set('decisionsRequiredFromManagement', v)} />
          </Section>

          {/* Actions */}
          <Section id="actions" label="Actions for Next Week — Specific Action + Expected Completion Date" icon={<ListChecks className="w-4 h-4 text-emerald-500" />}>
            <ActionsEditor items={form.actionsForNextWeek} onChange={v => set('actionsForNextWeek', v)} />
          </Section>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
          <button onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">
            Cancel
          </button>
          <button onClick={() => onSave({ ...form, status: 'Draft' }, reportId)}
            className="px-4 py-2 text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition">
            Save Draft
          </button>
          <button onClick={() => onSave({ ...form, status: 'Submitted' }, reportId)}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition shadow-lg shadow-emerald-500/30">
            <Send className="w-3.5 h-3.5" /> Submit Report
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Read-only Report Card ──────────────────────────────────────────────────────
const ReportCard: React.FC<{
  report: WeeklyMISReport;
  onEdit: () => void;
  onDelete: () => void;
  onExport: () => void;
}> = ({ report: r, onEdit, onDelete, onExport }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between p-4 cursor-pointer" onClick={() => setExpanded(v => !v)}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900 dark:text-white">
              Week {r.weekNumber} MIS Report
            </p>
            <p className="text-[10px] text-gray-400">{r.reportingPeriodStart} → {r.reportingPeriodEnd}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Prepared by: {r.preparedBy}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${statusColors[r.status]}`}>{r.status}</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-50 dark:border-gray-800 pt-4">
          {/* 3 Questions Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { q: 'What did we learn?', a: r.whatDidWeLearn, color: 'emerald' },
              { q: 'What does it mean scientifically?', a: r.whatDoesDataMeanScientifically, color: 'blue' },
              { q: 'What decision follows?', a: r.whatDecisionFollows, color: 'purple' },
            ].map(({ q, a, color }) => (
              <div key={q} className={`p-3 rounded-xl bg-${color}-50 dark:bg-${color}-900/10 border border-${color}-100 dark:border-${color}-900/20`}>
                <p className={`text-[10px] font-bold text-${color}-600 dark:text-${color}-400 mb-1.5`}>{q}</p>
                <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed">{a || '—'}</p>
              </div>
            ))}
          </div>

          {/* Efficacy Ranking */}
          {r.formulationEfficacyRanking.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Efficacy Ranking</p>
              <div className="space-y-1">
                {[...r.formulationEfficacyRanking].sort((a, b) => a.rank - b.rank).map(entry => (
                  <div key={entry.rank} className="flex items-center gap-3 text-[11px]">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center flex-shrink-0">
                      {entry.rank}
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200 w-28">{entry.formulationName}</span>
                    <span className="font-bold text-emerald-600">{entry.wceAtLatestDaa}%</span>
                    <span className="text-gray-400">@ DAA-{entry.latestDaa}</span>
                    <span className="text-gray-500 flex-1">{entry.notes}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {r.actionsForNextWeek.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Actions for Next Week</p>
              <div className="space-y-1">
                {r.actionsForNextWeek.map(a => (
                  <div key={a.id} className="flex items-start gap-2 text-[11px]">
                    <ArrowRight className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 flex-1">{a.action}</span>
                    <span className="text-gray-400 flex-shrink-0">{a.responsiblePerson} · {a.expectedCompletion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              <Edit3 className="w-3 h-3" /> Edit
            </button>
            <button onClick={onExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-emerald-600 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition">
              <Download className="w-3 h-3" /> Export Excel
            </button>
            <button onClick={onDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-red-500 border border-red-200 dark:border-red-900 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition ml-auto">
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Excel Export ───────────────────────────────────────────────────────────────
const exportMISToExcel = (r: WeeklyMISReport) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Decision Summary
  const summary = [
    ['MIKLENS BIOTECH — WEEKLY MIS DECISION SUMMARY'],
    ['Week Number', r.weekNumber],
    ['Period', `${r.reportingPeriodStart} → ${r.reportingPeriodEnd}`],
    ['Prepared By', r.preparedBy],
    ['Report Status', r.status],
    [],
    ['─── THE 3 CORE SCIENTIFIC QUESTIONS ───'],
    ['Q1: What did we learn?', r.whatDidWeLearn],
    ['Q2: What does it mean scientifically?', r.whatDoesDataMeanScientifically],
    ['Q3: What decision follows?', r.whatDecisionFollows],
    [],
    ['─── KEY ACHIEVEMENTS ───'],
    ...r.keyAchievements.filter(Boolean).map((a, i) => [`${i + 1}.`, a]),
    [],
    ['─── KEY SCIENTIFIC FINDINGS ───'],
    ...r.keyScientificFindings.filter(Boolean).map((f, i) => [`${i + 1}.`, f]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Decision Summary');

  // Sheet 2: Efficacy Ranking
  if (r.formulationEfficacyRanking.length > 0) {
    const rows = [
      ['Rank', 'Formulation', 'WCE %', 'DAA', 'Decision', 'Notes'],
      ...[...r.formulationEfficacyRanking].sort((a, b) => a.rank - b.rank).map(e => [
        e.rank, e.formulationName, `${e.wceAtLatestDaa}%`, e.latestDaa, e.decision, e.notes,
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Efficacy Ranking');
  }

  // Sheet 3: Problems & Actions
  const problems = [
    ['PROBLEMS & RISKS'],
    ['Problem', 'Impact', 'Corrective Action', 'Status'],
    ...r.problemsRisks.map(p => [p.problem, p.impact, p.correctiveAction, p.status]),
    [],
    ['ACTIONS FOR NEXT WEEK'],
    ['Action', 'Responsible', 'Expected Completion', 'Status'],
    ...r.actionsForNextWeek.map(a => [a.action, a.responsiblePerson, a.expectedCompletion, a.status]),
    [],
    ['MANAGEMENT DECISIONS'],
    ['Decision Required', 'Urgency', 'Deadline', 'Status'],
    ...r.decisionsRequiredFromManagement.map(d => [d.decisionRequired, d.urgency, d.deadline || '—', d.status]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(problems), 'Problems & Actions');

  XLSX.writeFile(wb, `MIS_Report_Week${r.weekNumber}_${r.reportingPeriodStart}.xlsx`);
};

// ── Main Page ──────────────────────────────────────────────────────────────────
export const WeeklyMIS: React.FC = () => {
  const { profile } = useAuth();
  const [reports, setReports] = useState<WeeklyMISReport[]>(() => loadMISReports());
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState<WeeklyMISReport | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => { saveMISReports(reports); }, [reports]);

  const handleSave = useCallback((data: Omit<WeeklyMISReport, 'id'>, id?: string) => {
    if (id) {
      setReports(prev => prev.map(r => r.id === id ? { ...data, id } : r));
    } else {
      setReports(prev => [{ ...data, id: `mis-${Date.now()}` }, ...prev]);
    }
    setShowForm(false);
    setEditingReport(null);
  }, []);

  const handleEdit = (report: WeeklyMISReport) => {
    setEditingReport(report);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this MIS report?')) return;
    setReports(prev => prev.filter(r => r.id !== id));
  };

  const filtered = filterStatus === 'all' ? reports : reports.filter(r => r.status === filterStatus);

  // Stats
  const statuses: WeeklyMISReport['status'][] = ['Draft', 'Submitted', 'Reviewed', 'Approved'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-500" />
            Weekly MIS Decision Summary
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Management-grade reporting — Observation → Measurement → Interpretation → Action
          </p>
        </div>
        <button
          onClick={() => { setEditingReport(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-500/30"
        >
          <Plus className="w-4 h-4" /> New Weekly Report
        </button>
      </div>

      {/* Management Note */}
      <div className="mb-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
        <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">📋 Management Reporting Standard</p>
        <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
          Each report MUST answer 3 scientific questions: <strong>What did we learn?</strong> · <strong>What does it mean?</strong> · <strong>What decision follows?</strong>
          Reports that only list activities (e.g. "Trial conducted") will be returned. Every finding must include Observation → Measurement → Scientific Interpretation → Decision.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {statuses.map(s => (
          <div key={s} className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-emerald-300 transition"
            onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}>
            <p className="text-2xl font-black text-gray-800 dark:text-gray-100">
              {reports.filter(r => r.status === s).length}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">{s}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['all', ...statuses].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition
              ${filterStatus === s
                ? 'bg-emerald-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
              }`}
          >
            {s === 'all' ? 'All Reports' : s}
          </button>
        ))}
      </div>

      {/* Reports */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FileText className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm font-medium">No MIS reports yet</p>
          <p className="text-xs mt-1">Create the first weekly report for management</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(report => (
            <ReportCard
              key={report.id}
              report={report}
              onEdit={() => handleEdit(report)}
              onDelete={() => handleDelete(report.id)}
              onExport={() => exportMISToExcel(report)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <ReportForm
          initial={editingReport ?? blankReport(profile?.name || 'Scientist')}
          reportId={editingReport?.id}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingReport(null); }}
        />
      )}
    </div>
  );
};
