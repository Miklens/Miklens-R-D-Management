import React, { useState, useMemo, useEffect } from 'react';
import { 
  Clock, Calendar, Plus, Trash2, CheckCircle2, Save, 
  FlaskConical, Microscope, Users, Building2, MapPin, FileText, 
  Zap, Layers, Edit2, X, AlertCircle
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

interface DailyActivityRow {
  id: string;
  category: string;
  customCategory?: string;
  productId: string;
  productName: string;
  isCustomProduct?: boolean;
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

const DEFAULT_INITIAL_ACTIVITIES: DailyActivityRow[] = [
  {
    id: 'row-1',
    category: 'lab',
    productId: 'p1',
    productName: 'BioShield Alpha (Bio-fungicide)',
    durationMinutes: 180,
    description: 'Ran fungal pathogen inhibition assays across 6 agar plates for BioShield Alpha. Evaluated colony growth radius.',
  },
  {
    id: 'row-2',
    category: 'formulation',
    productId: 'p1',
    productName: 'BioShield Alpha (Bio-fungicide)',
    durationMinutes: 150,
    description: 'Measured emulsification stability after 54°C heat stress for BioShield Alpha. Recorded phase separation viscosity.',
  },
];

export const ResearchLog: React.FC = () => {
  const { profile } = useAuth();
  const userId = profile?.id || 'sci-1';

  const [logDate, setLogDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dayFocus, setDayFocus] = useState('');
  const [overallAchievements, setOverallAchievements] = useState('');
  const [overallBlockers, setOverallBlockers] = useState('');
  const [activities, setActivities] = useState<DailyActivityRow[]>(DEFAULT_INITIAL_ACTIVITIES);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  
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

  // Total time calculation (unlimited, supports overtime)
  const totalMinutesLogged = useMemo(() => {
    return activities.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  }, [activities]);

  const totalHoursNum = totalMinutesLogged / 60;
  const totalHoursFormatted = totalHoursNum.toFixed(1);
  const standardHours = 8.0;
  const overtimeHours = totalHoursNum > standardHours ? (totalHoursNum - standardHours).toFixed(1) : null;

  // Add new activity row
  const handleAddRow = () => {
    const newRow: DailyActivityRow = {
      id: `row-${Date.now()}`,
      category: 'lab',
      productId: 'p1',
      productName: PRODUCTS_LIST[0].name,
      durationMinutes: 60,
      description: '',
    };
    setActivities([...activities, newRow]);
  };

  // Remove activity row
  const handleRemoveRow = (id: string) => {
    setActivities(activities.filter(a => a.id !== id));
  };

  // Update activity row
  const handleUpdateRow = (id: string, updates: Partial<DailyActivityRow>) => {
    setActivities(activities.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  // Presets
  const handleAutoFillSampleDay = () => {
    setActivities([
      ...DEFAULT_INITIAL_ACTIVITIES,
      {
        id: `row-${Date.now()}`,
        category: 'trials',
        productId: 'p3',
        productName: 'RootBoost X (Bio-stimulant)',
        durationMinutes: 150,
        description: 'Field plot sampling at test site B. Collected root biomass data and logged soil pH levels.',
      },
    ]);
  };

  const handleClearRows = () => {
    setEditingLogId(null);
    setDayFocus('');
    setOverallAchievements('');
    setOverallBlockers('');
    setActivities([]);
  };

  // Edit existing historical log
  const handleEditLog = (log: DailyLog) => {
    setEditingLogId(log.id);
    setLogDate(log.date.split('T')[0]);
    setDayFocus(log.objective || '');
    setOverallAchievements(log.achievements || '');
    setOverallBlockers(log.problems || '');

    // Parse activities string into rows
    const lines = log.activities ? log.activities.split('\n') : [];
    if (lines.length > 0) {
      const parsedRows: DailyActivityRow[] = lines.map((line, idx) => ({
        id: `edit-row-${idx}-${Date.now()}`,
        category: 'lab',
        productId: log.productId || 'p1',
        productName: log.productId || 'R&D Product',
        durationMinutes: Math.round((log.timeSpentMinutes || 60) / lines.length),
        description: line.replace(/^\[.*?\]\s*/, ''),
      }));
      setActivities(parsedRows);
    } else {
      setActivities(DEFAULT_INITIAL_ACTIVITIES);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete historical log
  const handleDeleteLog = (logId: string) => {
    if (window.confirm('Are you sure you want to delete this daily research log entry?')) {
      deleteLog(logId);
      if (editingLogId === logId) {
        handleClearRows();
      }
    }
  };

  // Submit Form (Create or Update)
  const handleSubmitDayLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (activities.length === 0) {
      alert('Please add at least one work entry for your day log.');
      return;
    }

    setIsSubmitting(true);

    try {
      const activitiesSummary = activities
        .map(a => `[${a.customCategory || a.category} - ${a.productName}] ${a.description} (${a.durationMinutes}m)`)
        .join('\n');

      if (editingLogId) {
        // Update existing log
        updateLog(editingLogId, {
          date: logDate,
          productId: activities[0]?.productName || 'p1',
          objective: dayFocus || 'Daily R&D Work Log',
          activities: activitiesSummary,
          problems: overallBlockers,
          achievements: overallAchievements,
          timeSpentMinutes: totalMinutesLogged,
          completionStatus: overallBlockers ? 'Blocked' : 'Completed',
        });
      } else {
        // Add new log
        addLog({
          userId,
          date: logDate,
          productId: activities[0]?.productName || 'p1',
          experimentId: 'exp-daily',
          objective: dayFocus || 'Daily R&D Work Log',
          activities: activitiesSummary,
          problems: overallBlockers,
          achievements: overallAchievements,
          timeSpentMinutes: totalMinutesLogged,
          completionStatus: overallBlockers ? 'Blocked' : 'Completed',
          confidenceLevel: 85,
        });
      }

      setSubmitSuccess(true);
      setEditingLogId(null);
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err) {
      console.error('Error submitting log:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            Daily R&D Work Log & Timesheet
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Log your complete day's tasks, experiments, custom products, and overtime work in a single form.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAutoFillSampleDay}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-all"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-500" />
            Load Sample Day
          </button>
          <button
            type="button"
            onClick={handleClearRows}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl text-xs font-medium hover:bg-gray-200 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Form
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {editingLogId && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs font-semibold text-amber-800 dark:text-amber-300">
              <span className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-600" />
                Editing Log Entry ({editingLogId})
              </span>
              <button
                type="button"
                onClick={handleClearRows}
                className="text-amber-700 dark:text-amber-400 underline hover:no-underline"
              >
                Cancel Edit Mode
              </button>
            </div>
          )}

          <form onSubmit={handleSubmitDayLog} className="space-y-6">
            {/* Step 1: Date & Overall Day Goal */}
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Work Date</label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="px-3.5 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white"
                  />
                </div>

                {/* Total Time & Overtime Badge */}
                <div className="text-right">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block font-medium">Total Logged Time</span>
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      {totalHoursFormatted} Hours
                    </span>
                    {overtimeHours && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                        +{overtimeHours}h Overtime
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Main Focus / Objective of the Day
                </label>
                <input
                  type="text"
                  placeholder="e.g. Conduct BioShield Alpha efficacy tests & RootBoost X field sampling"
                  value={dayFocus}
                  onChange={(e) => setDayFocus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>

            {/* Step 2: Work Breakdown & Activities */}
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  Work Breakdown ({activities.length} Activities)
                </h3>

                <button
                  type="button"
                  onClick={handleAddRow}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Activity
                </button>
              </div>

              {activities.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                  <p className="text-sm font-semibold text-gray-500">No activities added yet.</p>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="mt-3 px-4 py-2 bg-emerald-500 text-white text-xs font-semibold rounded-xl"
                  >
                    + Add Your First Activity
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((act) => (
                    <div
                      key={act.id}
                      className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 space-y-3"
                    >
                      {/* Top Row: Category, Product, Duration & Remove */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                        {/* Work Category */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Work Type</label>
                          <select
                            value={act.category === 'custom' ? 'custom' : act.category}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleUpdateRow(act.id, { 
                                category: val,
                                customCategory: val === 'custom' ? '' : undefined 
                              });
                            }}
                            className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold"
                          >
                            {CATEGORY_OPTIONS.map((cat) => (
                              <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                          </select>
                          {act.category === 'custom' && (
                            <input
                              type="text"
                              placeholder="Type custom work type..."
                              value={act.customCategory || ''}
                              onChange={(e) => handleUpdateRow(act.id, { customCategory: e.target.value })}
                              className="mt-1.5 w-full px-3 py-1 bg-white dark:bg-gray-800 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs"
                            />
                          )}
                        </div>

                        {/* Product / Project */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Product / Trial</label>
                          <select
                            value={act.isCustomProduct ? 'custom' : act.productId}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'custom') {
                                handleUpdateRow(act.id, {
                                  isCustomProduct: true,
                                  productId: 'custom',
                                  productName: '',
                                });
                              } else {
                                const found = PRODUCTS_LIST.find((p) => p.id === val);
                                handleUpdateRow(act.id, {
                                  isCustomProduct: false,
                                  productId: val,
                                  productName: found?.name || 'General Work',
                                });
                              }
                            }}
                            className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium"
                          >
                            {PRODUCTS_LIST.map((prod) => (
                              <option key={prod.id} value={prod.id}>{prod.name}</option>
                            ))}
                          </select>
                          {act.isCustomProduct && (
                            <input
                              type="text"
                              placeholder="Type custom product/trial name..."
                              value={act.productName}
                              onChange={(e) => handleUpdateRow(act.id, { productName: e.target.value })}
                              className="mt-1.5 w-full px-3 py-1 bg-white dark:bg-gray-800 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs"
                            />
                          )}
                        </div>

                        {/* Duration & Delete */}
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Duration</label>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="15"
                                max="720"
                                step="15"
                                value={act.durationMinutes}
                                onChange={(e) => handleUpdateRow(act.id, { durationMinutes: Number(e.target.value) })}
                                className="w-16 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-center"
                              />
                              <span className="text-xs text-gray-500 font-medium">mins</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveRow(act.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors self-end mb-0.5"
                            title="Remove activity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Work Description */}
                      <div>
                        <textarea
                          rows={2}
                          placeholder="Describe tasks performed, key observations, or outputs..."
                          value={act.description}
                          onChange={(e) => handleUpdateRow(act.id, { description: e.target.value })}
                          className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 3: Synthesis & Submission */}
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-md space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">Day Summary (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Key Achievements</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Confirmed 85% efficacy rate, completed plot sampling..."
                    value={overallAchievements}
                    onChange={(e) => setOverallAchievements(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Problems / Blockers</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Reagent batch #402 degraded, waiting on approval..."
                    value={overallBlockers}
                    onChange={(e) => setOverallBlockers(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                {submitSuccess ? (
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    {editingLogId ? 'Log entry updated successfully!' : 'Work Log submitted and saved!'}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    Logging <span className="font-bold text-emerald-600">{totalHoursFormatted} hours</span> of R&D work for {logDate}.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || activities.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {editingLogId ? 'Update Log Entry' : 'Submit Day Work Log'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Sidebar: Persistent History of Submitted Logs with Edit/Delete */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                Submitted Daily Logs History
              </h3>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                {historyLogs.length} Saved
              </span>
            </div>

            {historyLogs.length === 0 ? (
              <p className="text-xs text-gray-400 text-center p-6 border border-gray-100 dark:border-gray-800 rounded-xl">
                No saved daily logs yet. Submitted entries will persist here.
              </p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {historyLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 space-y-2 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-900 dark:text-white">{log.date.split('T')[0]}</span>
                      <span className="text-emerald-600 font-extrabold">
                        {((log.timeSpentMinutes || 0) / 60).toFixed(1)} hrs
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-1">
                      {log.objective || 'Daily R&D Log'}
                    </p>

                    {log.activities && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 bg-white dark:bg-gray-900 p-2 rounded-md border border-gray-100 dark:border-gray-800">
                        {log.activities}
                      </p>
                    )}

                    {/* Actions: Edit & Delete */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => handleEditLog(log)}
                        className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit Log
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteLog(log.id)}
                        className="flex items-center gap-1 text-red-500 hover:text-red-600 hover:underline"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
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