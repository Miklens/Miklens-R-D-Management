import React, { useState, useMemo } from 'react';
import { 
  Clock, Calendar, Plus, Trash2, CheckCircle2, Save, 
  FlaskConical, Microscope, Users, Building2, MapPin, FileText, 
  Zap, Layers, PlusCircle, Sparkles, CheckSquare, Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useTasks } from '../contexts/TaskContext';
import { addLog } from '../services/localStore';

interface DailyActivityRow {
  id: string;
  category: string;
  customCategory?: string;
  productId: string;
  productName: string;
  isCustomProduct?: boolean;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  description: string;
  hasFollowUpTask: boolean;
  followUpTaskTitle?: string;
  followUpPriority?: 'Low' | 'Medium' | 'High' | 'Urgent';
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
  { id: 'p2', name: 'NemaKill Pro (Bio-nematicide)' },
  { id: 'p3', name: 'RootBoost X (Bio-stimulant)' },
  { id: 'p4', name: 'AeroSpore V2 (Bio-insecticide)' },
  { id: 'general', name: 'General R&D / Non-Product Work' },
  { id: 'custom', name: '+ Add New / Custom Product...' },
];

const DEFAULT_INITIAL_ACTIVITIES: DailyActivityRow[] = [
  {
    id: 'row-1',
    category: 'lab',
    productId: 'p1',
    productName: 'BioShield Alpha (Bio-fungicide)',
    startTime: '09:00',
    endTime: '12:00',
    durationMinutes: 180,
    description: 'Ran fungal pathogen inhibition assays across 6 agar plates. Evaluated colony growth radius.',
    hasFollowUpTask: false,
  },
  {
    id: 'row-2',
    category: 'formulation',
    productId: 'p2',
    productName: 'NemaKill Pro (Bio-nematicide)',
    startTime: '12:30',
    endTime: '15:00',
    durationMinutes: 150,
    description: 'Measured emulsification stability after 54°C heat stress. Recorded phase separation viscosity.',
    hasFollowUpTask: true,
    followUpTaskTitle: 'Re-check viscosity at day 14 heat stability test',
    followUpPriority: 'High',
  },
];

export const ResearchLog: React.FC = () => {
  const { profile } = useAuth();
  const { addTask } = useTasks();

  const [logDate, setLogDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dayFocus, setDayFocus] = useState('');
  const [overallAchievements, setOverallAchievements] = useState('');
  const [overallBlockers, setOverallBlockers] = useState('');
  const [activities, setActivities] = useState<DailyActivityRow[]>(DEFAULT_INITIAL_ACTIVITIES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedLogs, setSubmittedLogs] = useState<any[]>([]);

  // Total time calculation (unlimited, supports overtime)
  const totalMinutesLogged = useMemo(() => {
    return activities.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  }, [activities]);

  const totalHoursNum = totalMinutesLogged / 60;
  const totalHoursFormatted = totalHoursNum.toFixed(1);
  const standardHours = 8.0;
  const overtimeHours = totalHoursNum > standardHours ? (totalHoursNum - standardHours).toFixed(1) : null;

  // Add new activity block
  const handleAddRow = () => {
    const newRow: DailyActivityRow = {
      id: `row-${Date.now()}`,
      category: 'lab',
      productId: 'p1',
      productName: PRODUCTS_LIST[0].name,
      startTime: '09:00',
      endTime: '10:00',
      durationMinutes: 60,
      description: '',
      hasFollowUpTask: false,
    };
    setActivities([...activities, newRow]);
  };

  // Remove activity block
  const handleRemoveRow = (id: string) => {
    setActivities(activities.filter(a => a.id !== id));
  };

  // Update activity block
  const handleUpdateRow = (id: string, updates: Partial<DailyActivityRow>) => {
    setActivities(activities.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  // Preset fills
  const handleAutoFillSampleDay = () => {
    setActivities([
      ...DEFAULT_INITIAL_ACTIVITIES,
      {
        id: `row-${Date.now()}`,
        category: 'trials',
        productId: 'p3',
        productName: 'RootBoost X (Bio-stimulant)',
        startTime: '15:30',
        endTime: '18:00',
        durationMinutes: 150,
        description: 'Field plot sampling at test site B. Collected root biomass data and logged soil pH levels.',
        hasFollowUpTask: false,
      },
    ]);
  };

  const handleClearRows = () => {
    setActivities([]);
  };

  // Submit Daily Log
  const handleSubmitDayLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (activities.length === 0) {
      alert('Please add at least one work entry for your day log.');
      return;
    }

    setIsSubmitting(true);

    try {
      const logEntry = {
        id: `log-${Date.now()}`,
        userId: profile?.id || 'sci-1',
        scientistName: profile?.name || 'Dr. Sarah Jenkins',
        date: logDate,
        dayFocus: dayFocus.trim() || 'Daily R&D Work',
        activitiesCount: activities.length,
        totalHours: totalHoursFormatted,
        overtime: overtimeHours,
        achievements: overallAchievements,
        blockers: overallBlockers,
        activities,
        createdAt: new Date().toISOString(),
      };

      addLog({
        userId: profile?.id || 'sci-1',
        productId: activities[0]?.productName || 'p1',
        experimentId: 'exp-daily',
        objective: dayFocus || 'Daily R&D Work Log',
        activities: activities.map(a => `[${a.startTime}-${a.endTime}] (${a.productName}) ${a.description}`).join('\n'),
        problems: overallBlockers,
        achievements: overallAchievements,
        timeSpentMinutes: totalMinutesLogged,
        completionStatus: overallBlockers ? 'Blocked' : 'Completed',
        confidenceLevel: 85,
      });

      // Process linked tasks
      activities.forEach((act) => {
        if (act.hasFollowUpTask && act.followUpTaskTitle) {
          addTask({
            title: act.followUpTaskTitle,
            description: `Auto-created from daily research log on ${logDate}: ${act.description}`,
            status: 'Pending',
            priority: act.followUpPriority || 'Medium',
            type: 'Task',
            entityType: 'product',
            entityName: act.productName,
            assignedToName: profile?.name || 'Dr. Sarah Jenkins',
            dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
          });
        }
      });

      setSubmittedLogs([logEntry, ...submittedLogs]);
      setSubmitSuccess(true);
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
            Daily R&D Work Log
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
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmitDayLog} className="space-y-6">
            {/* Step 1: Date & Overall Day Goal */}
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-3">
                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Work Date</label>
                    <input
                      type="date"
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                      className="px-3.5 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Total Time & Overtime Badge */}
                <div className="flex items-center gap-3">
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
                  {activities.map((act, index) => (
                    <div
                      key={act.id}
                      className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 space-y-3"
                    >
                      {/* Top Bar: Category, Product, Time */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                        {/* Category */}
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
                              placeholder="Enter custom work category..."
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

                        {/* Time & Remove */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
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

                      {/* Follow-up Task Toggle */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-1 border-t border-gray-100 dark:border-gray-800">
                        <label className="flex items-center gap-2 cursor-pointer text-gray-600 dark:text-gray-400">
                          <input
                            type="checkbox"
                            checked={act.hasFollowUpTask}
                            onChange={(e) => handleUpdateRow(act.id, { hasFollowUpTask: e.target.checked })}
                            className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                          />
                          <span className="font-medium text-[11px] flex items-center gap-1">
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                            Create follow-up task in Global Task Center
                          </span>
                        </label>

                        {act.hasFollowUpTask && (
                          <div className="flex items-center gap-2 flex-1 max-w-sm">
                            <input
                              type="text"
                              placeholder="Task title..."
                              value={act.followUpTaskTitle || ''}
                              onChange={(e) => handleUpdateRow(act.id, { followUpTaskTitle: e.target.value })}
                              className="w-full px-2.5 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-[11px]"
                            />
                            <select
                              value={act.followUpPriority || 'Medium'}
                              onChange={(e: any) => handleUpdateRow(act.id, { followUpPriority: e.target.value })}
                              className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-[10px] font-bold"
                            >
                              <option value="Low">Low</option>
                              <option value="Medium">Med</option>
                              <option value="High">High</option>
                              <option value="Urgent">Urgent</option>
                            </select>
                          </div>
                        )}
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
                    Work Log successfully submitted!
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
                  Submit Day Work Log
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Sidebar: Timeline of Submitted Logs */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-md space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              Submitted Session Logs
            </h3>

            {submittedLogs.length === 0 ? (
              <p className="text-xs text-gray-400 text-center p-4 border border-gray-100 dark:border-gray-800 rounded-xl">
                Submitted logs in this session will show up here.
              </p>
            ) : (
              <div className="space-y-3">
                {submittedLogs.map((log) => (
                  <div key={log.id} className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>{log.date}</span>
                      <span className="text-emerald-600 font-extrabold">{log.totalHours} hrs</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{log.dayFocus}</p>
                    <p className="text-[10px] text-gray-400">{log.activitiesCount} activity blocks logged</p>
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