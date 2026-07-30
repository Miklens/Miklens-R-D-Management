import React, { useState, useMemo, useEffect } from 'react';
import {
  Clock, Plus, Trash2, CheckCircle2, Save,
  Zap, AlertTriangle, ShieldCheck, Package2, Pencil, X
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import {
  getLogsByUser,
  addLog,
  updateLog,
  deleteLog,
  subscribeToStoreChanges
} from '../services/localStore';
import type { DailyLog } from '../types';
import { useExperiments } from '../contexts/ExperimentContext';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface DailyActivityRow {
  id: string;
  category: string;
  customCategory: string;
  productId: string;
  productName: string;
  customProductName: string;  // used when productId === 'new_product' OR non-product
  startTime: string;
  endTime: string;
  durationMinutes: number;
  description: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/** Work TYPE categories (left dropdown) */
const WORK_TYPE_OPTIONS = [
  // --- Lab / R&D ---
  { group: '🔬 Lab & R&D', value: 'lab',         label: 'Laboratory Experiment' },
  { group: '🔬 Lab & R&D', value: 'formulation',  label: 'Formulation & Stability' },
  { group: '🔬 Lab & R&D', value: 'trials',        label: 'Field Trial / Sampling' },
  { group: '🔬 Lab & R&D', value: 'maintenance',   label: 'Equipment Maintenance & Calibration' },
  { group: '🔬 Lab & R&D', value: 'safety',        label: 'Lab Safety & Protocol Audit' },
  { group: '🔬 Lab & R&D', value: 'literature',    label: 'Research & Literature Review' },
  // --- Software / App ---
  { group: '💻 Software', value: 'app_dev',       label: 'App Development & Coding' },
  { group: '💻 Software', value: 'app_upgrade',   label: 'App Upgradation & Bug Fixes' },
  // --- Documentation ---
  { group: '📄 Documents', value: 'doc_prep',     label: 'Document / Dossier Preparation' },
  { group: '📄 Documents', value: 'label_prep',   label: 'Label & Packaging Design' },
  { group: '📄 Documents', value: 'report',       label: 'Report Writing & Analysis' },
  // --- Communication ---
  { group: '🗣️ Communication', value: 'vendor_talk',  label: 'Talk to Vendors & Suppliers' },
  { group: '🗣️ Communication', value: 'client_talk',  label: 'Talk to Clients & Customers' },
  { group: '🗣️ Communication', value: 'discussion',   label: 'Discussions & Brainstorming' },
  { group: '🗣️ Communication', value: 'meeting',      label: 'Team Meetings & Sync' },
  // --- General ---
  { group: '⚙️ General', value: 'admin',           label: 'General R&D Admin' },
  { group: '⚙️ General', value: 'custom',          label: '+ Custom Work Type...' },
];

/**
 * Product / Work Scope (right dropdown)
 * Work Type (left) captures WHAT kind of work.
 * This captures WHICH product it was done ON.
 */
const SCOPE_OPTIONS = [
  { group: '🧪 Products',   id: 'p1',          name: 'BioShield Alpha (Bio-fungicide)' },
  { group: '🧪 Products',   id: 'new_product', name: '➕ Add New / Custom Product...' },
  { group: '⚙️ Non-Product', id: 'non_product', name: '🏢 N/A — Non-Product Work' },
];

/** IDs that require a custom text input below */
const REQUIRES_CUSTOM_INPUT = new Set(['new_product']);

/** Quick-pick 1-hour time slots (10 AM – 6 PM) */
const QUICK_SLOTS = [
  { label: '10–11 AM', start: '10:00', end: '11:00' },
  { label: '11–12 PM', start: '11:00', end: '12:00' },
  { label: '12–1 PM',  start: '12:00', end: '13:00' },
  { label: '1–2 PM',   start: '13:00', end: '14:00' },
  { label: '2–3 PM',   start: '14:00', end: '15:00' },
  { label: '3–4 PM',   start: '15:00', end: '16:00' },
  { label: '4–5 PM',   start: '16:00', end: '17:00' },
  { label: '5–6 PM',   start: '17:00', end: '18:00' },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
export const formatTime12h = (time24?: string): string => {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
};

export const calcDurationMinutes = (startTime: string, endTime: string): number => {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const endMins = eh * 60 + em;
  const startMins = sh * 60 + sm;
  return endMins > startMins ? endMins - startMins : 0;
};

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT SESSIONS
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_SESSIONS: DailyActivityRow[] = [
  {
    id: 'row-1', category: 'lab', customCategory: '',
    productId: 'p1', productName: 'BioShield Alpha (Bio-fungicide)', customProductName: '',
    startTime: '09:00', endTime: '12:00', durationMinutes: 180,
    description: 'Ran fungal pathogen inhibition assays across 6 agar plates for BioShield Alpha. Evaluated colony growth radius.',
  },
  {
    id: 'row-2', category: 'formulation', customCategory: '',
    productId: 'p1', productName: 'BioShield Alpha (Bio-fungicide)', customProductName: '',
    startTime: '13:00', endTime: '15:30', durationMinutes: 150,
    description: 'Measured emulsification stability after 54°C heat stress for BioShield Alpha. Recorded phase separation viscosity.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export const ResearchLog: React.FC = () => {
  const { profile } = useAuth();
  const userId = profile?.id || 'sci-1';
  const { experiments, addDailyRun } = useExperiments();

  const [logDate, setLogDate]   = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dayFocus, setDayFocus] = useState('');
  const [activities, setActivities] = useState<DailyActivityRow[]>(DEFAULT_SESSIONS);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [collisionError, setCollisionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<DailyLog[]>([]);

  /* ---------- store sync ---------- */
  const loadLogs = () => setHistoryLogs(getLogsByUser(userId));
  useEffect(() => {
    loadLogs();
    const unsub = subscribeToStoreChanges(loadLogs);
    return () => { unsub(); };
  }, [userId]);

  /* ---------- derived ---------- */
  const logsOnDate = useMemo(
    () => historyLogs.filter((l) => l.date?.split('T')[0] === logDate),
    [historyLogs, logDate]
  );
  const totalMinutes = useMemo(() => activities.reduce((a, c) => a + c.durationMinutes, 0), [activities]);
  const totalHours   = (totalMinutes / 60).toFixed(1);

  /* ---------- validation ---------- */
  const toMins = (t: string) => { const [h,m] = t.split(':').map(Number); return h*60+m; };

  const validateTimeSlots = (): string | null => {
    for (let i = 0; i < activities.length; i++) {
      const a = activities[i];
      if (toMins(a.endTime) <= toMins(a.startTime))
        return `Session #${i+1}: End Time must be after Start Time (${formatTime12h(a.startTime)} → ${formatTime12h(a.endTime)}).`;
    }
    for (let i = 0; i < activities.length; i++) {
      for (let j = i+1; j < activities.length; j++) {
        const [a1,a2] = [activities[i], activities[j]];
        const [s1,e1,s2,e2] = [toMins(a1.startTime),toMins(a1.endTime),toMins(a2.startTime),toMins(a2.endTime)];
        if (s1 < e2 && e1 > s2)
          return `Session #${i+1} (${formatTime12h(a1.startTime)}-${formatTime12h(a1.endTime)}) overlaps Session #${j+1} (${formatTime12h(a2.startTime)}-${formatTime12h(a2.endTime)}). Adjust times.`;
      }
    }
    for (const act of activities) {
      const [s1,e1] = [toMins(act.startTime), toMins(act.endTime)];
      for (const saved of logsOnDate) {
        if (saved.startTime && saved.endTime && saved.id !== editingLogId) {
          const [s2,e2] = [toMins(saved.startTime), toMins(saved.endTime)];
          if (s1 < e2 && e1 > s2)
            return `${formatTime12h(act.startTime)}-${formatTime12h(act.endTime)} overlaps an already saved log (${formatTime12h(saved.startTime)}-${formatTime12h(saved.endTime)}) on ${logDate}. Duplicate entries not allowed.`;
        }
      }
    }
    return null;
  };

  /* ---------- row mutations ---------- */
  const addRow = () => {
    const lastEnd = activities.at(-1)?.endTime ?? '13:00';
    const [h,m] = lastEnd.split(':').map(Number);
    const ns = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
    const ne = `${((h+2)%24).toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
    setActivities(p => [...p, {
      id: `row-${Date.now()}`, category: 'lab', customCategory: '',
      productId: 'p1', productName: 'BioShield Alpha (Bio-fungicide)', customProductName: '',
      startTime: ns, endTime: ne, durationMinutes: calcDurationMinutes(ns, ne), description: '',
    }]);
    setCollisionError(null);
  };

  const updateRow = (id: string, patch: Partial<DailyActivityRow>) => {
    setActivities(prev => prev.map(act => {
      if (act.id !== id) return act;
      const updated = { ...act, ...patch };
      if (patch.startTime !== undefined || patch.endTime !== undefined)
        updated.durationMinutes = calcDurationMinutes(updated.startTime, updated.endTime);
      return updated;
    }));
    setCollisionError(null);
  };

  const removeRow = (id: string) => {
    if (activities.length <= 1) return;
    setActivities(p => p.filter(a => a.id !== id));
    setCollisionError(null);
  };

  /* ---------- quick-slot picker ---------- */
  const addQuickSlot = (start: string, end: string) => {
    const alreadyInForm = activities.some(a => a.startTime === start && a.endTime === end);
    const alreadySaved  = logsOnDate.some(l => l.startTime === start && l.endTime === end);
    if (alreadyInForm || alreadySaved) {
      setCollisionError(`Slot ${formatTime12h(start)} – ${formatTime12h(end)} is already added or saved for ${logDate}.`);
      return;
    }
    setActivities(p => [...p, {
      id: `row-${Date.now()}`,
      category: 'lab', customCategory: '',
      productId: 'p1', productName: 'BioShield Alpha (Bio-fungicide)', customProductName: '',
      startTime: start, endTime: end,
      durationMinutes: calcDurationMinutes(start, end),
      description: '',
    }]);
    setCollisionError(null);
  };

  /* ---------- edit saved log ---------- */
  const handleEditLog = (log: DailyLog) => {
    setEditingLogId(log.id);
    setLogDate(log.date?.split('T')[0] || logDate);
    setDayFocus(log.objective || '');
    setActivities([{
      id: `edit-${log.id}`,
      category: 'lab', customCategory: '',
      productId: 'p1', productName: 'BioShield Alpha (Bio-fungicide)', customProductName: '',
      startTime: log.startTime || '09:00',
      endTime:   log.endTime   || '10:00',
      durationMinutes: log.timeSpentMinutes || calcDurationMinutes(log.startTime || '09:00', log.endTime || '10:00'),
      description: log.activities || '',
    }]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingLogId(null);
    setActivities(DEFAULT_SESSIONS);
    setDayFocus('');
    setCollisionError(null);
  };

  /* ---------- submit ---------- */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateTimeSlots();
    if (err) { setCollisionError(err); return; }

    setIsSubmitting(true);
    setCollisionError(null);

    activities.forEach(act => {
      const workType = act.category === 'custom'
        ? (act.customCategory || 'Custom R&D')
        : (WORK_TYPE_OPTIONS.find(c => c.value === act.category)?.label || act.category);

      // Build the scope title
      let scopeTitle: string;
      if (act.productId === 'p1') {
        scopeTitle = 'BioShield Alpha (Bio-fungicide)';
      } else if (act.productId === 'new_product') {
        scopeTitle = act.customProductName.trim() || 'New Product';
      } else {
        // non_product — scope is captured by Work Type
        scopeTitle = 'Non-Product Work';
      }

      const logData: Partial<DailyLog> = {
        date: logDate, userId,
        startTime: act.startTime, endTime: act.endTime,
        timeSpentMinutes: act.durationMinutes,
        objective: dayFocus.trim() || `${workType} – ${formatTime12h(act.startTime)} to ${formatTime12h(act.endTime)}`,
        activities: `[${workType}] ${scopeTitle}: ${act.description.trim()}`,
        completionStatus: 'Completed', confidenceLevel: 90,
      };

      editingLogId ? updateLog(editingLogId, logData) : addLog(logData as Omit<DailyLog,'id'|'createdAt'|'updatedAt'>);

      // Auto-sync only BioShield product to experiments timeline
      if (act.productId === 'p1' && experiments.length > 0) {
        const exp = experiments.find(e => e.name?.includes('BioShield') || e.productName?.includes('BioShield')) ?? experiments[0];
        if (exp) {
          addDailyRun('exp', exp.id, {
            dayNumber: (exp.dailyRuns?.length ?? 0) + 1,
            date: logDate,
            scientistName: profile?.name ?? 'Dr. Sarah Jenkins',
            activityPerformed: `[${formatTime12h(act.startTime)}-${formatTime12h(act.endTime)}] ${act.description.trim()}`,
            observationResult: 'Target met, physical specs verified',
            runStatus: 'Passed',
          });
        }
      }
    });

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setEditingLogId(null);
      loadLogs();
      setTimeout(() => setSubmitSuccess(false), 3500);
    }, 400);
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
            <Clock className="w-5 h-5" />
          </div>
          Daily R&D Work Log & Session Timesheet
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
          Log product R&D, app work, docs, labels, vendor/client calls, meetings and any custom non-product activity
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT: Form ── */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl space-y-6">

            {/* Date + Focus */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-purple-500/10 border border-emerald-100/50 dark:border-emerald-900/30 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="w-full md:w-1/2">
                  <label className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block mb-1">Work Date</label>
                  <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold" />
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-gray-400 font-semibold block">Total Logged Time</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalHours} Hours</span>
                  <span className="text-[10px] text-gray-400 block">({totalMinutes} mins)</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Main Focus / Objective of the Day</label>
                <input type="text" placeholder="e.g. BioShield volume makeup, App update v2.1, Label design for BioCide Pro, Vendor call..."
                  value={dayFocus} onChange={e => setDayFocus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium" />
              </div>
            </div>

            {/* Collision Error */}
            {collisionError && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
                <span>{collisionError}</span>
              </div>
            )}

            {/* Edit mode banner */}
            {editingLogId && (
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                  <Pencil className="w-4 h-4" />
                  Editing saved session — modify below and click Save to update
                </div>
                <button type="button" onClick={cancelEdit}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-red-500 font-bold transition-colors">
                  <X className="w-3.5 h-3.5" /> Cancel Edit
                </button>
              </div>
            )}

            {/* Quick-pick time slots */}
            <div className="space-y-2 p-4 rounded-2xl bg-gray-50/70 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">⚡ Quick Add 1-Hour Time Slot</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_SLOTS.map(slot => {
                  const used = activities.some(a => a.startTime === slot.start && a.endTime === slot.end)
                    || logsOnDate.some(l => l.startTime === slot.start && l.endTime === slot.end);
                  return (
                    <button key={slot.label} type="button"
                      onClick={() => addQuickSlot(slot.start, slot.end)}
                      disabled={used}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                        used
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 line-through cursor-not-allowed opacity-60'
                          : 'bg-white dark:bg-gray-900 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 shadow-sm'
                      }`}>
                      {slot.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400">Used / already saved slots are greyed out. Click any slot to add it to your session list.</p>
            </div>

            {/* Sessions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  Work Sessions & Time Breakdown ({activities.length} Sessions)
                </h3>
                <button type="button" onClick={addRow}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold shadow hover:bg-emerald-600 transition-all">
                  <Plus className="w-3.5 h-3.5" /> + Add Manually
                </button>
              </div>

              {activities.map((act, idx) => {
                const isValid      = act.durationMinutes > 0;
                const needsCustom  = REQUIRES_CUSTOM_INPUT.has(act.productId);

                return (
                  <div key={act.id} className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 space-y-3">
                    {/* Session header */}
                    <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black">
                          {idx + 1}
                        </span>
                        Session #{idx + 1}
                      </span>
                      {activities.length > 1 && (
                        <button type="button" onClick={() => removeRow(act.id)}
                          className="text-red-500 hover:text-red-700 flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>

                    {/* Time + Work Type + Scope row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {/* Start */}
                      <div>
                        <label className="text-[11px] font-semibold text-gray-500 block mb-1">Start Time</label>
                        <input type="time" value={act.startTime}
                          onChange={e => updateRow(act.id, { startTime: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold" />
                      </div>
                      {/* End */}
                      <div>
                        <label className="text-[11px] font-semibold text-gray-500 block mb-1">End Time</label>
                        <input type="time" value={act.endTime}
                          onChange={e => updateRow(act.id, { endTime: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold" />
                      </div>
                      {/* Work Type */}
                      <div>
                        <label className="text-[11px] font-semibold text-gray-500 block mb-1">Work Type</label>
                        <select value={act.category}
                          onChange={e => updateRow(act.id, { category: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold">
                          {(() => {
                            const groups = [...new Set(WORK_TYPE_OPTIONS.map(o => o.group))];
                            return groups.map(g => (
                              <optgroup key={g} label={g}>
                                {WORK_TYPE_OPTIONS.filter(o => o.group === g).map(o => (
                                  <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                              </optgroup>
                            ));
                          })()}
                        </select>
                      </div>
                      {/* Scope / Product */}
                      <div>
                        <label className="text-[11px] font-semibold text-gray-500 block mb-1">
                          Product / Work Scope
                        </label>
                        <select value={act.productId}
                          onChange={e => {
                            const found = SCOPE_OPTIONS.find(s => s.id === e.target.value);
                            updateRow(act.id, {
                              productId: e.target.value,
                              productName: found?.name ?? '',
                              customProductName: '',
                            });
                          }}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold">
                          {(() => {
                            const groups = [...new Set(SCOPE_OPTIONS.map(o => o.group))];
                            return groups.map(g => (
                              <optgroup key={g} label={g}>
                                {SCOPE_OPTIONS.filter(o => o.group === g).map(o => (
                                  <option key={o.id} value={o.id}>{o.name}</option>
                                ))}
                              </optgroup>
                            ));
                          })()}
                        </select>
                      </div>
                    </div>

                    {/* Custom work type input */}
                    {act.category === 'custom' && (
                      <input type="text" placeholder="Specify custom work type name..."
                        value={act.customCategory}
                        onChange={e => updateRow(act.id, { customCategory: e.target.value })}
                        className="w-full px-3 py-2 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl text-xs font-semibold" />
                    )}

                    {/* Custom scope input — only for Add New Product */}
                    {needsCustom && (
                      <div className="p-3 rounded-xl border space-y-1 bg-purple-50/60 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/50">
                        <label className="text-[11px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                          <Package2 className="w-3.5 h-3.5" /> New Product Name
                        </label>
                        <input type="text"
                          placeholder="e.g. BioCide Pro, BioNeem Gold, HerbaSafe Plus..."
                          value={act.customProductName}
                          onChange={e => updateRow(act.id, { customProductName: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-semibold text-gray-900 dark:text-white" />
                      </div>
                    )}

                    {/* Duration + Description */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-gray-500">Session Activity Description</label>
                        <span className={`text-[11px] font-bold ${isValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                          {isValid
                            ? `Duration: ${(act.durationMinutes / 60).toFixed(1)} hrs (${act.durationMinutes} mins)`
                            : '⚠ End Time must be after Start Time'}
                        </span>
                      </div>
                      <textarea rows={2}
                        placeholder="Describe the work performed, measurements, meeting outcomes, code changes, label specs..."
                        value={act.description}
                        onChange={e => updateRow(act.id, { description: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/30" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Submit */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
              {submitSuccess ? (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" /> All sessions saved successfully!
                </div>
              ) : (
                <span className="text-xs text-gray-400 font-medium">🔒 De-duplication enabled — overlapping time slots are blocked</span>
              )}
              <button type="submit"
                disabled={isSubmitting || activities.some(a => !a.description.trim() || a.durationMinutes <= 0)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl text-xs font-black shadow-lg hover:from-emerald-600 hover:to-teal-700 disabled:opacity-40 transition-all whitespace-nowrap">
                <Save className="w-4 h-4" /> Save Daily Session Logs
              </button>
            </div>
          </form>
        </div>

        {/* ── RIGHT: Logged Sessions ── */}
        <div>
          <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Logged Sessions
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {logsOnDate.length} on {logDate}
              </span>
            </div>

            {logsOnDate.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                <Clock className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-medium">No sessions logged for {logDate}. Add morning / afternoon / evening sessions using the form.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logsOnDate.map(log => (
                  <div key={log.id} className="p-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded font-mono text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                        {log.startTime && log.endTime
                          ? `${formatTime12h(log.startTime)} – ${formatTime12h(log.endTime)}`
                          : `${((log.timeSpentMinutes || 60) / 60).toFixed(1)}h`}
                      </span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEditLog(log)}
                          className="p-1 text-blue-400 hover:text-blue-600 transition-colors" title="Edit this session">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteLog(log.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors" title="Delete this session">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{log.objective}</p>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 line-clamp-2">{log.activities}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};