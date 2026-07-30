import React, { useState, useMemo } from 'react';
import { 
  Clock, Calendar, Plus, Trash2, CheckCircle2, AlertCircle, Save, Sparkles, 
  Brain, FileText, MapPin, FlaskConical, Microscope, Users, Building2, 
  ChevronRight, RefreshCw, Zap, Tag, Link2, CheckSquare, Layers 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useTasks } from '../contexts/TaskContext';
import { addLog } from '../services/localStore';

interface DailyActivityRow {
  id: string;
  category: string;
  productId: string;
  productName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  description: string;
  hasFollowUpTask: boolean;
  followUpTaskTitle?: string;
  followUpPriority?: 'Low' | 'Medium' | 'High' | 'Urgent';
}

const CATEGORY_OPTIONS = [
  { value: 'lab', label: 'Laboratory Experiment', icon: Microscope, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40' },
  { value: 'formulation', label: 'Formulation & Stability', icon: FlaskConical, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' },
  { value: 'trials', label: 'Field Trial / Sampling', icon: MapPin, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' },
  { value: 'meetings', label: 'Team Sync / Meeting', icon: Users, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40' },
  { value: 'document', label: 'Report / Documentation', icon: FileText, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' },
  { value: 'admin', label: 'General R&D Admin', icon: Building2, color: 'text-gray-500 bg-gray-50 dark:bg-gray-800' },
];

const PRODUCTS_LIST = [
  { id: 'p1', name: 'BioShield Alpha (Bio-fungicide)' },
  { id: 'p2', name: 'NemaKill Pro (Bio-nematicide)' },
  { id: 'p3', name: 'RootBoost X (Bio-stimulant)' },
  { id: 'p4', name: 'AeroSpore V2 (Bio-insecticide)' },
  { id: 'general', name: 'General R&D / Non-Product Work' },
];

const DEFAULT_STANDARD_DAY: DailyActivityRow[] = [
  {
    id: 'row-1',
    category: 'lab',
    productId: 'p1',
    productName: 'BioShield Alpha (Bio-fungicide)',
    startTime: '09:00',
    endTime: '11:30',
    durationMinutes: 150,
    description: 'Ran fungal pathogen inhibition assays across 6 agar plates. Evaluated colony growth radius.',
    hasFollowUpTask: false,
  },
  {
    id: 'row-2',
    category: 'formulation',
    productId: 'p2',
    productName: 'NemaKill Pro (Bio-nematicide)',
    startTime: '11:30',
    endTime: '13:00',
    durationMinutes: 90,
    description: 'Measured emulsification stability after 54°C heat stress. Recorded phase separation viscosity.',
    hasFollowUpTask: true,
    followUpTaskTitle: 'Re-check viscosity at day 14 heat stability test',
    followUpPriority: 'High',
  },
  {
    id: 'row-3',
    category: 'trials',
    productId: 'p3',
    productName: 'RootBoost X (Bio-stimulant)',
    startTime: '14:00',
    endTime: '16:00',
    durationMinutes: 120,
    description: 'Field plot sampling at test site B. Collected root biomass data and logged soil pH levels.',
    hasFollowUpTask: false,
  },
  {
    id: 'row-4',
    category: 'document',
    productId: 'general',
    productName: 'General R&D / Non-Product Work',
    startTime: '16:00',
    endTime: '17:30',
    durationMinutes: 90,
    description: 'Updated daily data logs, summarized laboratory findings, and prepared tomorrow’s reagent list.',
    hasFollowUpTask: false,
  },
];

export const ResearchLog: React.FC = () => {
  const { profile } = useAuth();
  const { addTask } = useTasks();

  const [logDate, setLogDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dayFocus, setDayFocus] = useState('');
  const [overallAchievements, setOverallAchievements] = useState('');
  const [overallBlockers, setOverallBlockers] = useState('');
  const [activities, setActivities] = useState<DailyActivityRow[]>(DEFAULT_STANDARD_DAY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedLogs, setSubmittedLogs] = useState<any[]>([]);

  // Total calculated time
  const totalMinutesLogged = useMemo(() => {
    return activities.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  }, [activities]);

  const totalHoursLogged = (totalMinutesLogged / 60).toFixed(1);
  const targetHours = 8;
  const progressPercent = Math.min(100, Math.round((totalMinutesLogged / (targetHours * 60)) * 100));

  // Add new blank row
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

  // Remove row
  const handleRemoveRow = (id: string) => {
    setActivities(activities.filter(a => a.id !== id));
  };

  // Update row
  const handleUpdateRow = (id: string, updates: Partial<DailyActivityRow>) => {
    setActivities(activities.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  // Quick preset fills
  const handleAutoFillStandardDay = () => {
    setActivities(DEFAULT_STANDARD_DAY);
  };

  const handleClearRows = () => {
    setActivities([]);
  };

  // Form Submission
  const handleSubmitDayLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (activities.length === 0) {
      alert('Please add at least one activity entry for your day log.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create main log entry
      const logEntry = {
        id: `log-${Date.now()}`,
        userId: profile?.id || 'scientist-1',
        scientistName: profile?.name || 'Dr. Sarah Jenkins',
        date: logDate,
        dayFocus: dayFocus.trim() || 'Daily R&D Work',
        activitiesCount: activities.length,
        totalMinutes: totalMinutesLogged,
        totalHours: totalHoursLogged,
        achievements: overallAchievements,
        blockers: overallBlockers,
        activities,
        createdAt: new Date().toISOString(),
      };

      addLog({
        userId: profile?.id || 'sci-1',
        productId: activities[0]?.productId || 'p1',
        experimentId: 'exp-daily',
        objective: dayFocus || 'Daily R&D Work Log',
        activities: activities.map(a => `[${a.startTime}-${a.endTime}] ${a.description}`).join('\n'),
        problems: overallBlockers,
        achievements: overallAchievements,
        timeSpentMinutes: totalMinutesLogged,
        completionStatus: overallBlockers ? 'Blocked' : 'Completed',
        confidenceLevel: 85,
      });

      // 2. Process auto follow-up tasks if checked
      activities.forEach((act) => {
        if (act.hasFollowUpTask && act.followUpTaskTitle) {
          addTask({
            title: act.followUpTaskTitle,
            description: `Auto-created from daily research log on ${logDate}: ${act.description}`,
            status: 'Pending',
            priority: act.followUpPriority || 'Medium',
            type: 'Task',
            entityType: 'product',
            entityName: act.productName.split(' (')[0],
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            Daily R&D Timesheet & Work Log
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Log your complete day's activities, experiments, field trials, and admin tasks in one comprehensive submission.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAutoFillStandardDay}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-all"
          >
            <Zap className="w-4 h-4 text-emerald-500" />
            Auto-Fill 8-Hour Schedule
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
        {/* Main Work Log Form (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmitDayLog} className="space-y-6">
            {/* Day Header Box */}
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Work Date</label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white"
                  />
                </div>

                {/* Day Progress Indicator */}
                <div className="sm:text-right">
                  <div className="flex items-center sm:justify-end gap-2 text-sm font-bold text-gray-900 dark:text-white">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    <span>{totalHoursLogged} / {targetHours} Hours Logged</span>
                  </div>
                  <div className="w-48 bg-gray-100 dark:bg-gray-800 rounded-full h-2 mt-1.5 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        progressPercent >= 100
                          ? 'bg-emerald-500'
                          : progressPercent >= 50
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Overall Focus / Objective of the Day
                </label>
                <input
                  type="text"
                  placeholder="e.g. Conduct BioShield Alpha efficacy tests & RootBoost X field sampling"
                  value={dayFocus}
                  onChange={(e) => setDayFocus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Dynamic Activity Rows Section */}
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-lg space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  Day Work Breakdown ({activities.length} Work Blocks)
                </h3>

                <button
                  type="button"
                  onClick={handleAddRow}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Activity Block
                </button>
              </div>

              {activities.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                  <Clock className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">No activity blocks added yet.</p>
                  <p className="text-xs text-gray-400 mt-1 mb-4">Click below to add your first work item or use the 8-hour auto-fill.</p>
                  <button
                    type="button"
                    onClick={handleAutoFillStandardDay}
                    className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-semibold"
                  >
                    Auto-Fill 8-Hour Schedule
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((act, index) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={act.id}
                      className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 space-y-3 relative group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {index + 1}
                          </span>

                          {/* Category Selector */}
                          <select
                            value={act.category}
                            onChange={(e) => handleUpdateRow(act.id, { category: e.target.value })}
                            className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-white"
                          >
                            {CATEGORY_OPTIONS.map((cat) => (
                              <option key={cat.value} value={cat.value}>
                                {cat.label}
                              </option>
                            ))}
                          </select>

                          {/* Target Product Selector */}
                          <select
                            value={act.productId}
                            onChange={(e) => {
                              const p = PRODUCTS_LIST.find((item) => item.id === e.target.value);
                              handleUpdateRow(act.id, {
                                productId: e.target.value,
                                productName: p?.name || 'General Work',
                              });
                            }}
                            className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300"
                          >
                            {PRODUCTS_LIST.map((prod) => (
                              <option key={prod.id} value={prod.id}>
                                {prod.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Time & Duration */}
                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <input
                              type="time"
                              value={act.startTime}
                              onChange={(e) => handleUpdateRow(act.id, { startTime: e.target.value })}
                              className="bg-transparent outline-none text-[11px] font-semibold"
                            />
                            <span>-</span>
                            <input
                              type="time"
                              value={act.endTime}
                              onChange={(e) => handleUpdateRow(act.id, { endTime: e.target.value })}
                              className="bg-transparent outline-none text-[11px] font-semibold"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="15"
                              max="480"
                              step="15"
                              value={act.durationMinutes}
                              onChange={(e) => handleUpdateRow(act.id, { durationMinutes: Number(e.target.value) })}
                              className="w-14 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-center font-bold"
                            />
                            <span className="text-gray-400 text-[10px]">mins</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveRow(act.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                            title="Remove block"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Description */}
                      <textarea
                        rows={2}
                        placeholder="What work was performed? Describe key protocols, observations, or outputs..."
                        value={act.description}
                        onChange={(e) => handleUpdateRow(act.id, { description: e.target.value })}
                        className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                      />

                      {/* Follow-up Task Creation Checkbox */}
                      <div className="pt-1 flex items-center justify-between text-xs">
                        <label className="flex items-center gap-2 cursor-pointer text-gray-600 dark:text-gray-400">
                          <input
                            type="checkbox"
                            checked={act.hasFollowUpTask}
                            onChange={(e) => handleUpdateRow(act.id, { hasFollowUpTask: e.target.checked })}
                            className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                          />
                          <span className="font-medium text-[11px] flex items-center gap-1">
                            <CheckSquare className="w-3 h-3 text-emerald-500" />
                            Create follow-up task in Global Task Center
                          </span>
                        </label>

                        {act.hasFollowUpTask && (
                          <div className="flex items-center gap-2 flex-1 max-w-xs ml-4">
                            <input
                              type="text"
                              placeholder="Follow-up task title..."
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
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Day Synthesis (Achievements & Blockers) */}
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-lg space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">Day Summary & Output Synthesis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Key Achievements / Deliverables (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Confirmed 85% efficacy rate, finished field plot B sampling..."
                    value={overallAchievements}
                    onChange={(e) => setOverallAchievements(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Problems / Blockers / Support Needed (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Reagent batch #402 degraded, requested lab supervisor signoff..."
                    value={overallBlockers}
                    onChange={(e) => setOverallBlockers(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                {submitSuccess ? (
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    Full Day Research Log successfully submitted & tasks linked!
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">
                    Will log <span className="font-bold text-emerald-600">{totalHoursLogged} hours</span> of R&D work for {logDate}.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || activities.length === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  Submit Entire Day Log
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Sidebar - Submitted Day Logs Timeline */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-lg space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              Recent Daily Log Entries
            </h3>

            {submittedLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400 border border-gray-100 dark:border-gray-800 rounded-xl">
                No entries submitted in this session yet. Your logs will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {submittedLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-gray-900 dark:text-white">
                      <span>{log.date}</span>
                      <span className="text-emerald-600">{log.totalHours} hrs</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 font-semibold">{log.dayFocus}</p>
                    <div className="text-[10px] text-gray-400 flex items-center gap-2">
                      <span>{log.activitiesCount} activity blocks</span>
                      <span>•</span>
                      <span>{log.scientistName}</span>
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