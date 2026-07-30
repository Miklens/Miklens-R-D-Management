import React, { useState, useMemo, useEffect } from 'react';
import { 
  Clock, Calendar, Plus, Trash2, CheckCircle2, Save, 
  FlaskConical, Microscope, Users, Building2, MapPin, FileText, 
  Zap, Layers, Edit2, X, AlertCircle, AlertTriangle, ShieldCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

interface DailyActivityRow {
  id: string;
  category: string;
  customCategory?: string;
  productId: string;
  productName: string;
  isCustomProduct?: boolean;
  startTime: string; // HH:mm (24-hour format)
  endTime: string;   // HH:mm (24-hour format)
  durationMinutes: number;
  description: string;
}

const CATEGORY_OPTIONS = [
  { value: 'lab', label: 'Laboratory Experiment' },
  { value: 'formulation', label: 'Formulation & Stability' },
  { value: 'trials', label: 'Field Trial / Sampling' },
  { value: 'meetings', label: 'Team Sync / Meeting' },
  { value: 'document', label: 'Report / Documentation' },
  { value: 'admin', label: 'General R&D Admin' },
  { value: 'custom', label: '+ Custom Category...' },
];

const PRODUCTS_LIST = [
  { id: 'p1', name: 'BioShield Alpha (Bio-fungicide)' },
  { id: 'general', name: 'General R&D / Non-Product Work' },
  { id: 'custom', name: '+ Add New / Custom Product...' },
];

// Helper to format 24h "13:00" to 12h "01:00 PM"
export const formatTime12h = (time24?: string): string => {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
};

// Calculate duration in minutes strictly enforcing End Time > Start Time
export const calcDurationMinutes = (startTime: string, endTime: string): number => {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;

  if (endMins <= startMins) return 0; // End time must be after start time
  return endMins - startMins;
};

const DEFAULT_INITIAL_ACTIVITIES: DailyActivityRow[] = [
  {
    id: 'row-1',
    category: 'lab',
    productId: 'p1',
    productName: 'BioShield Alpha (Bio-fungicide)',
    startTime: '09:00',
    endTime: '12:00',
    durationMinutes: 180,
    description: 'Ran fungal pathogen inhibition assays across 6 agar plates for BioShield Alpha. Evaluated colony growth radius.',
  },
  {
    id: 'row-2',
    category: 'formulation',
    productId: 'p1',
    productName: 'BioShield Alpha (Bio-fungicide)',
    startTime: '13:00',
    endTime: '15:30',
    durationMinutes: 150,
    description: 'Measured emulsification stability after 54°C heat stress for BioShield Alpha. Recorded phase separation viscosity.',
  },
];

export const ResearchLog: React.FC = () => {
  const { profile } = useAuth();
  const userId = profile?.id || 'sci-1';
  const { experiments, addDailyRun } = useExperiments();

  const [logDate, setLogDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dayFocus, setDayFocus] = useState('');
  const [overallAchievements, setOverallAchievements] = useState('');
  const [overallBlockers, setOverallBlockers] = useState('');
  const [activities, setActivities] = useState<DailyActivityRow[]>(DEFAULT_INITIAL_ACTIVITIES);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [collisionError, setCollisionError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<DailyLog[]>([]);

  // Load persistent logs from localStore
  const loadLogs = () => {
    const logs = getLogsByUser(userId);
    setHistoryLogs(logs);
  };

  useEffect(() => {
    loadLogs();
    const unsubscribe = subscribeToStoreChanges(loadLogs);
    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Existing submitted logs for the selected logDate
  const logsOnSelectedDate = useMemo(() => {
    return historyLogs.filter((l) => l.date?.split('T')[0] === logDate);
  }, [historyLogs, logDate]);

  // Total time calculation
  const totalMinutesLogged = useMemo(() => {
    return activities.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  }, [activities]);

  const totalHoursLogged = (totalMinutesLogged / 60).toFixed(1);

  // Time slot collision checker enforcing End Time > Start Time and no overlapping
  const validateTimeSlots = (): string | null => {
    // 1. Check for invalid end times (End <= Start)
    for (let i = 0; i < activities.length; i++) {
      const act = activities[i];
      const sMins = act.startTime.split(':').map(Number)[0] * 60 + act.startTime.split(':').map(Number)[1];
      const eMins = act.endTime.split(':').map(Number)[0] * 60 + act.endTime.split(':').map(Number)[1];

      if (eMins <= sMins) {
        return `Session #${i + 1} has an invalid time range (${formatTime12h(act.startTime)} to ${formatTime12h(act.endTime)}). End time must be strictly after Start time.`;
      }
    }

    // 2. Check for internal overlap within current activity rows
    for (let i = 0; i < activities.length; i++) {
      for (let j = i + 1; j < activities.length; j++) {
        const a1 = activities[i];
        const a2 = activities[j];

        const s1 = a1.startTime.split(':').map(Number)[0] * 60 + a1.startTime.split(':').map(Number)[1];
        const e1 = a1.endTime.split(':').map(Number)[0] * 60 + a1.endTime.split(':').map(Number)[1];
        const s2 = a2.startTime.split(':').map(Number)[0] * 60 + a2.startTime.split(':').map(Number)[1];
        const e2 = a2.endTime.split(':').map(Number)[0] * 60 + a2.endTime.split(':').map(Number)[1];

        // Interval collision check
        if (s1 < e2 && e1 > s2) {
          return `Time slot overlap between Session #${i + 1} (${formatTime12h(a1.startTime)} - ${formatTime12h(a1.endTime)}) and Session #${j + 1} (${formatTime12h(a2.startTime)} - ${formatTime12h(a2.endTime)}). Please adjust your session times.`;
        }
      }
    }

    // 3. Check for overlap with previously submitted logs on logDate
    for (const act of activities) {
      const s1 = act.startTime.split(':').map(Number)[0] * 60 + act.startTime.split(':').map(Number)[1];
      const e1 = act.endTime.split(':').map(Number)[0] * 60 + act.endTime.split(':').map(Number)[1];

      for (const savedLog of logsOnSelectedDate) {
        if (savedLog.startTime && savedLog.endTime && savedLog.id !== editingLogId) {
          const s2 = savedLog.startTime.split(':').map(Number)[0] * 60 + savedLog.startTime.split(':').map(Number)[1];
          const e2 = savedLog.endTime.split(':').map(Number)[0] * 60 + savedLog.endTime.split(':').map(Number)[1];

          if (s1 < e2 && e1 > s2) {
            return `Time slot ${formatTime12h(act.startTime)} - ${formatTime12h(act.endTime)} overlaps with an already submitted log (${formatTime12h(savedLog.startTime)} - ${formatTime12h(savedLog.endTime)}) for ${logDate}. Duplicate time entries are not allowed.`;
          }
        }
      }
    }

    return null;
  };

  // Add new activity row
  const handleAddActivityRow = () => {
    // Pick next logical start time (end time of last row)
    const lastEnd = activities.length > 0 ? activities[activities.length - 1].endTime : '13:00';
    const [h, m] = lastEnd.split(':').map(Number);
    const endH = (h + 2) % 24;
    const nextStart = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    const nextEnd = `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

    const newRow: DailyActivityRow = {
      id: `row-${Date.now()}`,
      category: 'lab',
      productId: 'p1',
      productName: 'BioShield Alpha (Bio-fungicide)',
      startTime: nextStart,
      endTime: nextEnd,
      durationMinutes: calcDurationMinutes(nextStart, nextEnd),
      description: '',
    };
    setActivities([...activities, newRow]);
    setCollisionError(null);
  };

  // Update activity row fields
  const handleUpdateActivityRow = (id: string, updates: Partial<DailyActivityRow>) => {
    setActivities((prev) =>
      prev.map((act) => {
        if (act.id !== id) return act;
        const updated = { ...act, ...updates };

        // Recalculate duration if startTime or endTime changed
        if (updates.startTime || updates.endTime) {
          updated.durationMinutes = calcDurationMinutes(updated.startTime, updated.endTime);
        }
        return updated;
      })
    );
    setCollisionError(null);
  };

  // Remove activity row
  const handleRemoveActivityRow = (id: string) => {
    if (activities.length === 1) return; // Keep at least one
    setActivities(activities.filter((a) => a.id !== id));
    setCollisionError(null);
  };

  // Submit complete day log
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activities.length === 0) return;

    // Validate time collision and End > Start
    const errorMsg = validateTimeSlots();
    if (errorMsg) {
      setCollisionError(errorMsg);
      return;
    }

    setIsSubmitting(true);
    setCollisionError(null);

    // Save each activity as a discrete time session
    activities.forEach((act) => {
      const finalCategory = act.category === 'custom' ? act.customCategory || 'Custom R&D' : act.category;
      const finalProduct = act.productId === 'custom' ? act.productName || 'Custom Product' : act.productName;

      const newLogData: Partial<DailyLog> = {
        date: logDate,
        userId,
        timeSpentMinutes: act.durationMinutes,
        startTime: act.startTime,
        endTime: act.endTime,
        objective: dayFocus.trim() || `R&D Session (${formatTime12h(act.startTime)} - ${formatTime12h(act.endTime)})`,
        activities: `[${finalCategory.toUpperCase()}] ${finalProduct}: ${act.description.trim()}`,
        completionStatus: 'Completed',
        confidenceLevel: 90,
        achievements: overallAchievements.trim() || undefined,
        blockers: overallBlockers.trim() || undefined,
      };

      if (editingLogId) {
        updateLog(editingLogId, newLogData);
      } else {
        addLog(newLogData as Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>);
      }

      // Auto-sync run to BioShield Alpha Multi-Day Traceability Timeline
      if (experiments.length > 0) {
        const bioshieldExp = experiments.find((e) => e.name.includes('BioShield') || e.productName?.includes('BioShield')) || experiments[0];
        if (bioshieldExp) {
          const runNumber = (bioshieldExp.dailyRuns?.length || 0) + 1;
          addDailyRun('exp', bioshieldExp.id, {
            dayNumber: runNumber,
            date: logDate,
            scientistName: profile?.name || 'Dr. Sarah Jenkins',
            activityPerformed: `[${formatTime12h(act.startTime)} - ${formatTime12h(act.endTime)}] ${act.description.trim()}`,
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

      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3500);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
              <Clock className="w-5 h-5" />
            </div>
            Daily R&D Work Log & Session Timesheet
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            Log morning and evening sessions with explicit start/end times and zero time overlap
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2-Cols: Log Entry Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl space-y-6">
            {/* Top Date & Objective Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-purple-500/10 border border-emerald-100/50 dark:border-emerald-900/30 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="w-full md:w-1/2">
                  <label className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block mb-1">Work Date</label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs text-gray-400 font-semibold block">Total Logged Time</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalHoursLogged} Hours</span>
                  <span className="text-[10px] text-gray-400 block">({totalMinutesLogged} Minutes)</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Main Focus / Objective of the Session</label>
                <input
                  type="text"
                  placeholder="e.g. BioShield Alpha volume makeup & CIPAC thermal stability check"
                  value={dayFocus}
                  onChange={(e) => setDayFocus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            {/* Time Slot Overlap / Collision Error Warning */}
            {collisionError && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
                <span>{collisionError}</span>
              </div>
            )}

            {/* Work Breakdown Activities List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  Work Sessions & Time Breakdown ({activities.length} Sessions)
                </h3>
                <button
                  type="button"
                  onClick={handleAddActivityRow}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold shadow hover:bg-emerald-600 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> + Add Session
                </button>
              </div>

              {activities.map((act, index) => {
                const isValidDuration = act.durationMinutes > 0;

                return (
                  <div key={act.id} className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                      <span>Session #{index + 1}</span>
                      {activities.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveActivityRow(act.id)}
                          className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>

                    {/* Start Time, End Time & Product Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {/* Start Time */}
                      <div>
                        <label className="text-[11px] font-semibold text-gray-500 block mb-1">Start Time</label>
                        <input
                          type="time"
                          value={act.startTime}
                          onChange={(e) => handleUpdateActivityRow(act.id, { startTime: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
                        />
                      </div>

                      {/* End Time */}
                      <div>
                        <label className="text-[11px] font-semibold text-gray-500 block mb-1">End Time</label>
                        <input
                          type="time"
                          value={act.endTime}
                          onChange={(e) => handleUpdateActivityRow(act.id, { endTime: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
                        />
                      </div>

                      {/* Work Category */}
                      <div>
                        <label className="text-[11px] font-semibold text-gray-500 block mb-1">Work Type</label>
                        <select
                          value={act.category}
                          onChange={(e) => handleUpdateActivityRow(act.id, { category: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold"
                        >
                          {CATEGORY_OPTIONS.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Target Product */}
                      <div>
                        <label className="text-[11px] font-semibold text-gray-500 block mb-1">Product / Trial</label>
                        <select
                          value={act.productId}
                          onChange={(e) => {
                            const p = PRODUCTS_LIST.find((item) => item.id === e.target.value);
                            handleUpdateActivityRow(act.id, {
                              productId: e.target.value,
                              productName: p ? p.name : 'BioShield Alpha (Bio-fungicide)',
                            });
                          }}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold"
                        >
                          {PRODUCTS_LIST.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Calculated Duration & Description */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-gray-500">Session Activity Description</label>
                        <span className={`text-[11px] font-bold ${isValidDuration ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                          {isValidDuration
                            ? `Duration: ${(act.durationMinutes / 60).toFixed(1)} Hours (${act.durationMinutes} mins)`
                            : 'Invalid Range (End Time must be after Start Time)'}
                        </span>
                      </div>

                      <textarea
                        rows={2}
                        placeholder="Describe work performed, physical measurements (pH, viscosity), agar growth..."
                        value={act.description}
                        onChange={(e) => handleUpdateActivityRow(act.id, { description: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Submit Button */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              {submitSuccess ? (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" /> Session logs saved successfully & synced to traceability timeline!
                </div>
              ) : (
                <span className="text-xs text-gray-400 font-medium">De-duplication enabled: Overlapping time slots are prevented</span>
              )}

              <button
                type="submit"
                disabled={isSubmitting || activities.some((a) => !a.description.trim() || a.durationMinutes <= 0)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl text-xs font-black shadow-lg hover:from-emerald-600 hover:to-teal-700 disabled:opacity-40 transition-all"
              >
                <Save className="w-4 h-4" /> Save Daily Session Logs
              </button>
            </div>
          </form>
        </div>

        {/* Right 1-Col: Submitted Session History for Selected Date */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Logged Sessions on {logDate}
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {logsOnSelectedDate.length} Sessions Saved
              </span>
            </div>

            {logsOnSelectedDate.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                <Clock className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-medium">No sessions logged yet for {logDate}. Fill the form on the left to add morning or evening sessions.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logsOnSelectedDate.map((log) => (
                  <div key={log.id} className="p-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-mono">
                        {log.startTime && log.endTime ? `${formatTime12h(log.startTime)} - ${formatTime12h(log.endTime)}` : `${((log.timeSpentMinutes || 60) / 60).toFixed(1)}h`}
                      </span>
                      <button
                        onClick={() => deleteLog(log.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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