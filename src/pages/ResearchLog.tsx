import React, { useState, useMemo } from 'react';
import {
  Clock, Plus, Trash2, CheckCircle2, Save,
  Zap, AlertTriangle, ShieldCheck, Package2, Pencil, X,
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search, Filter,
  FileSpreadsheet, List, Sparkles, ArrowRight
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isSameMonth, addMonths, subMonths, subDays, addDays, isToday
} from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import {
  addLog,
  updateLog,
  deleteLog,
} from '../services/localStore';
import { useDailyLogs } from '../hooks/useDailyLogs';
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
 */
const SCOPE_OPTIONS = [
  { group: '⚙️ Non-Product', id: 'non_product', name: '🏢 N/A — Non-Product Work' },
  { group: '🧪 Products',   id: 'new_product', name: '➕ Add New / Custom Product...' },
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
// BLANK DEFAULT ROW
// ─────────────────────────────────────────────────────────────────────────────
const blankRow = (): DailyActivityRow => ({
  id: `row-${Date.now()}`,
  category: 'lab', customCategory: '',
  productId: 'non_product', productName: '', customProductName: '',
  startTime: '', endTime: '',
  durationMinutes: 0,
  description: '',
});

const DEFAULT_SESSIONS: DailyActivityRow[] = [blankRow()];


// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export const ResearchLog: React.FC = () => {
  const { profile } = useAuth();
  const userId = profile?.id || 'sci-1';
  const { experiments, addDailyRun, allProducts } = useExperiments();

  const [logDate, setLogDate]   = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dayFocus, setDayFocus] = useState('');
  const [activities, setActivities] = useState<DailyActivityRow[]>(DEFAULT_SESSIONS);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [collisionError, setCollisionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // View Mode: 'form' | 'calendar' | 'history'
  const [viewMode, setViewMode] = useState<'form' | 'calendar' | 'history'>('form');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [searchFilter, setSearchFilter] = useState('');

  // Use Firestore-backed hook so sessions saved to Firebase are visible here
  const { data: allLogs } = useDailyLogs();
  const historyLogs = useMemo(
    () => allLogs.filter(l => (l.userId || '') === userId ||
          (l.userId || '').toLowerCase() === (profile?.email || '').toLowerCase()),
    [allLogs, userId, profile?.email]
  );

  /* ---------- derived ---------- */
  const logsOnDate = useMemo(
    () => historyLogs.filter((l) => l.date?.split('T')[0] === logDate),
    [historyLogs, logDate]
  );
  const pastLogs = useMemo(
    () => historyLogs.filter((l) => l.date?.split('T')[0] !== logDate)
      .sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [historyLogs, logDate]
  );

  // Daily totals map for calendar rendering
  const logsByDateMap = useMemo(() => {
    const map: Record<string, { count: number; totalMinutes: number; logs: DailyLog[] }> = {};
    historyLogs.forEach((l) => {
      const d = l.date ? l.date.split('T')[0] : '';
      if (!d) return;
      if (!map[d]) map[d] = { count: 0, totalMinutes: 0, logs: [] };
      map[d].count += 1;
      map[d].totalMinutes += l.timeSpentMinutes || 60;
      map[d].logs.push(l);
    });
    return map;
  }, [historyLogs]);

  // Recent 14 days strip generator
  const recentDaysStrip = useMemo(() => {
    const days: Array<{ dateStr: string; dateObj: Date; label: string; hours: number; count: number }> = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = subDays(today, i);
      const dStr = format(d, 'yyyy-MM-dd');
      const stats = logsByDateMap[dStr] || { count: 0, totalMinutes: 0 };
      days.push({
        dateStr: dStr,
        dateObj: d,
        label: format(d, 'EEE, MMM d'),
        hours: Math.round((stats.totalMinutes / 60) * 10) / 10,
        count: stats.count,
      });
    }
    return days;
  }, [logsByDateMap]);

  // Calendar days grid generator for currentMonth
  const calendarGrid = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start, end });

    // Calculate leading padding empty slots for weekday alignment (0 = Sun, 1 = Mon...)
    const firstDayOfWeek = start.getDay();
    const leadingPadding = Array.from({ length: firstDayOfWeek });

    return { daysInMonth, leadingPadding };
  }, [currentMonth]);

  const handleDeleteAll = () => {
    if (!window.confirm(`Delete ALL ${historyLogs.length} of your logged sessions? This cannot be undone.`)) return;
    historyLogs.forEach(l => deleteLog(l.id));
  };

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
      productId: 'p1', productName: (allProducts[0] || 'Active Formulation'), customProductName: '',
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
    if (activities.length <= 1) {
      setActivities([blankRow()]);
    } else {
      setActivities(p => p.filter(a => a.id !== id));
    }
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
      productId: 'p1', productName: (allProducts[0] || 'Active Formulation'), customProductName: '',
      startTime: start, endTime: end,
      durationMinutes: calcDurationMinutes(start, end),
      description: '',
    }]);
    setCollisionError(null);
  };

  const handleCopyYesterdayLog = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = format(yesterday, 'yyyy-MM-dd');
    const yLogs = historyLogs.filter(l => (l.date || '').split('T')[0] === yStr);

    if (yLogs.length === 0) {
      setCollisionError(`No work session records found for yesterday (${yStr}).`);
      return;
    }

    const copiedRows: DailyActivityRow[] = yLogs.map((l, idx) => ({
      id: `copy-${Date.now()}-${idx}`,
      category: 'lab',
      customCategory: '',
      productId: 'p1',
      productName: (allProducts[0] || 'Active Formulation'),
      customProductName: '',
      startTime: l.startTime || '09:00',
      endTime: l.endTime || '10:00',
      durationMinutes: l.timeSpentMinutes || 60,
      description: l.activities || ''
    }));

    setActivities(copiedRows);
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
      productId: 'p1', productName: (allProducts[0] || 'Active Formulation'), customProductName: '',
      startTime: log.startTime || '09:00',
      endTime:   log.endTime   || '10:00',
      durationMinutes: log.timeSpentMinutes || calcDurationMinutes(log.startTime || '09:00', log.endTime || '10:00'),
      description: log.activities || '',
    }]);
    setViewMode('form');
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

    const validSessions = activities.filter(a => a.description.trim().length > 0 && a.durationMinutes > 0);
    if (validSessions.length === 0) {
      setCollisionError('⚠️ Please enter an activity description for your work session before saving.');
      return;
    }

    setIsSubmitting(true);
    setCollisionError(null);

    validSessions.forEach(act => {
      const workType = act.category === 'custom'
        ? (act.customCategory || 'Custom R&D')
        : (WORK_TYPE_OPTIONS.find(c => c.value === act.category)?.label || act.category);

      let scopeTitle: string;
      if (act.productId === 'new_product') {
        scopeTitle = act.customProductName.trim() || 'New Product';
      } else if (act.productId === 'non_product') {
        scopeTitle = 'Non-Product Work';
      } else {
        scopeTitle = act.productName || act.customProductName.trim() || 'R&D Activity';
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

      if (experiments.length > 0) {
        const matchingExp = act.productName
          ? experiments.find(e => e.productName === act.productName || e.productName?.includes(act.productName || ''))
          : null;
        const expToSync = matchingExp ?? null;
        if (expToSync) {
          addDailyRun('exp', expToSync.id, {
            dayNumber: (expToSync.dailyRuns?.length ?? 0) + 1,
            date: logDate,
            scientistName: profile?.name ?? 'Scientist',
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
      setTimeout(() => setSubmitSuccess(false), 3500);
    }, 400);
  };

  // Filtered master history logs
  const filteredMasterLogs = useMemo(() => {
    if (!searchFilter.trim()) return historyLogs;
    const q = searchFilter.toLowerCase();
    return historyLogs.filter(l => 
      (l.objective || '').toLowerCase().includes(q) ||
      (l.activities || '').toLowerCase().includes(q) ||
      (l.date || '').toLowerCase().includes(q)
    );
  }, [historyLogs, searchFilter]);

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page Title & View Switch Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
              <Clock className="w-5 h-5" />
            </div>
            Daily R&D Work Log & Session Timesheet
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            Log product R&D, app work, docs, labels, vendor calls, meetings and view your complete calendar history
          </p>
        </div>

        {/* View Switch Buttons */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700 shrink-0">
          <button
            onClick={() => setViewMode('form')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'form'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Daily Logger
          </button>

          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'calendar'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" /> Calendar View
          </button>

          <button
            onClick={() => setViewMode('history')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'history'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <List className="w-3.5 h-3.5" /> Master History ({historyLogs.length})
          </button>
        </div>
      </div>

      {/* ── INTERACTIVE 14-DAY RECENT STRIP (Shown on Form View) ── */}
      {viewMode === 'form' && (
        <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-500" />
              1-Tap Quick Date Switcher (Last 14 Days)
            </span>
            <span className="text-xs text-emerald-600 font-bold">
              Selected: {logDate}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
            {recentDaysStrip.map((day) => {
              const isSelected = day.dateStr === logDate;
              const hasLogs = day.count > 0;

              return (
                <button
                  key={day.dateStr}
                  onClick={() => setLogDate(day.dateStr)}
                  className={`px-3 py-2 rounded-2xl border text-center transition-all cursor-pointer shrink-0 min-w-[95px] ${
                    isSelected
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20 font-black'
                      : hasLogs
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400'
                      : 'bg-gray-50 dark:bg-gray-800/40 text-gray-500 border-gray-100 dark:border-gray-800 hover:border-gray-300'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold block opacity-80">{day.label}</span>
                  <span className="text-xs font-black block mt-0.5">
                    {hasLogs ? `${day.hours}h (${day.count})` : '0h'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CALENDAR VIEW MODAL / TAB ── */}
      {viewMode === 'calendar' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xl space-y-6">
          {/* Calendar Header Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-emerald-500" />
                Monthly Interactive Research Log Calendar
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Click on any calendar day to inspect logged hours or jump directly to log work for that date
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
                className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>

              <span className="text-sm font-black text-gray-900 dark:text-white min-w-[140px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>

              <button
                onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>

              <button
                onClick={() => { setCurrentMonth(new Date()); setLogDate(format(new Date(), 'yyyy-MM-dd')); setViewMode('form'); }}
                className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 text-xs font-bold rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                Today
              </button>
            </div>
          </div>

          {/* 7 Days Weekday Header */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-black text-gray-400 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Leading padding empty cells */}
            {calendarGrid.leadingPadding.map((_, i) => (
              <div key={`pad-${i}`} className="h-24 bg-gray-50/40 dark:bg-gray-850/20 rounded-2xl border border-dashed border-gray-100 dark:border-gray-800/40 opacity-40" />
            ))}

            {/* Actual Month Days */}
            {calendarGrid.daysInMonth.map((dayObj) => {
              const dStr = format(dayObj, 'yyyy-MM-dd');
              const stats = logsByDateMap[dStr];
              const isSelected = dStr === logDate;
              const isTodayDate = isToday(dayObj);
              const hrs = stats ? Math.round((stats.totalMinutes / 60) * 10) / 10 : 0;

              return (
                <div
                  key={dStr}
                  onClick={() => {
                    setLogDate(dStr);
                    setViewMode('form');
                  }}
                  className={`h-24 p-2 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer hover:border-emerald-500 shadow-sm relative overflow-hidden ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/30'
                      : isTodayDate
                      ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800'
                      : stats
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40'
                      : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-black ${isTodayDate ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                      {format(dayObj, 'd')}
                    </span>
                    {isTodayDate && (
                      <span className="text-[9px] font-black bg-blue-500 text-white px-1.5 py-0.2 rounded-md">TODAY</span>
                    )}
                  </div>

                  {stats && stats.count > 0 ? (
                    <div className="space-y-1">
                      <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-lg block text-center shadow-sm">
                        ⏱️ {hrs}h ({stats.count} logs)
                      </span>
                      <p className="text-[9px] text-gray-500 line-clamp-1 italic font-medium">
                        "{stats.logs[0].objective || stats.logs[0].activities}"
                      </p>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-300 italic font-medium">No logs</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MASTER HISTORY TABLE VIEW ── */}
      {viewMode === 'history' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <List className="w-5 h-5 text-emerald-500" />
                Master Timesheet History Audit Trail
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Complete searchable record of all your logged research sessions
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search past logs by keyword..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredMasterLogs.length > 0 ? (
              filteredMasterLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 hover:border-emerald-500 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs font-extrabold">
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                        📅 {log.date?.split('T')[0] || 'N/A'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-mono">
                        ⏱️ {log.startTime && log.endTime ? `${formatTime12h(log.startTime)} - ${formatTime12h(log.endTime)}` : `${((log.timeSpentMinutes || 60) / 60).toFixed(1)}h`}
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-gray-900 dark:text-white mt-1">
                      {log.objective || 'Daily Work Session'}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                      {log.activities}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleEditLog(log)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => deleteLog(log.id)}
                      className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic text-center py-8">
                No matching research log entries found.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── FORM VIEW LAYOUT ── */}
      {viewMode === 'form' && (
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
                  <input type="text" placeholder="e.g. Formulation volume makeup, App update v2.1, Label design for Active Product, Vendor call..."
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
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={handleCopyYesterdayLog}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold shadow-sm hover:bg-blue-100 transition-all">
                      📋 Copy Yesterday's Sessions
                    </button>
                    <button type="button" onClick={addRow}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold shadow hover:bg-emerald-600 transition-all">
                      <Plus className="w-3.5 h-3.5" /> + Add Manually
                    </button>
                  </div>
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
                          className={`w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border rounded-xl text-xs font-medium outline-none focus:ring-2 ${
                            !act.description.trim()
                              ? 'border-amber-300 dark:border-amber-800/80 focus:ring-amber-500/30'
                              : 'border-gray-200 dark:border-gray-700 focus:ring-emerald-500/30'
                          }`} />
                        {!act.description.trim() && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block mt-1">
                            ⚠️ Enter description above to save Session #{idx + 1}
                          </span>
                        )}
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
                  disabled={isSubmitting || activities.length === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl text-xs font-black shadow-lg disabled:opacity-40 transition-all cursor-pointer whitespace-nowrap">
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
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    {logsOnDate.length} on {logDate}
                  </span>
                  {historyLogs.length > 0 && (
                    <button onClick={handleDeleteAll}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-950 dark:text-red-400 transition-colors"
                      title="Delete all your logged sessions from Firestore">
                      🗑 Delete All ({historyLogs.length})
                    </button>
                  )}
                </div>
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

              {/* Past Sessions from Other Dates */}
              {pastLogs.length > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      📋 Past Sessions ({pastLogs.length} entries)
                    </span>
                    <button
                      type="button"
                      onClick={() => setViewMode('history')}
                      className="text-xs text-emerald-600 hover:underline font-extrabold flex items-center gap-1"
                    >
                      View All History <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {pastLogs.slice(0, 8).map(log => (
                      <div
                        key={log.id}
                        onClick={() => {
                          setLogDate(log.date?.split('T')[0] || logDate);
                        }}
                        className="p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/30 hover:border-emerald-500 cursor-pointer transition-colors space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                          <span className="text-emerald-600 dark:text-emerald-400">📅 {log.date?.split('T')[0]}</span>
                          <span>⏱️ {((log.timeSpentMinutes || 60) / 60).toFixed(1)}h</span>
                        </div>
                        <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 line-clamp-1">{log.objective}</p>
                        <p className="text-[10px] text-gray-500 line-clamp-1">{log.activities}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};