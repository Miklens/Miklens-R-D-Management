import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Clock, 
  Calendar,
  X,
  Trash2,
  Edit2,
  FileText,
  Brain,
  FlaskConical,
  Microscope,
  Users,
  MapPin,
  MoreHorizontal,
  ChevronDown,
  Briefcase,
  Building2,
  AlertTriangle,
  Check
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createDailyLog } from '../services/researchLogs';
import { createTimeMotionEntry, getEntriesByScientist } from '../services/timeTracking';
import { addLog } from '../services/localStore';
import { isFirebaseConfigured } from '../config/firebase';
import { format, subDays, addDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import type { TimeMotionEntry, ActivityCategory } from '../types/timeTracking';

// Activity categories with icons
const ACTIVITY_CATEGORIES = [
  { value: 'research', icon: Brain, label: 'Research', color: '#8B5CF6' },
  { value: 'document', icon: FileText, label: 'Documents', color: '#3B82F6' },
  { value: 'trials', icon: MapPin, label: 'Field Trials', color: '#10B981' },
  { value: 'experiments', icon: FlaskConical, label: 'Experiments', color: '#F59E0B' },
  { value: 'lab', icon: Microscope, label: 'Laboratory', color: '#EC4899' },
  { value: 'meetings', icon: Users, label: 'Meetings', color: '#6366F1' },
  { value: 'discussions', icon: Users, label: 'Discussions', color: '#14B8A6' },
  { value: 'field_visits', icon: MapPin, label: 'Field Visits', color: '#84CC16' },
  { value: 'admin', icon: Building2, label: 'Admin Work', color: '#78716C' },
  { value: 'other', icon: MoreHorizontal, label: 'Other', color: '#6B7280' },
];

// Schema - made everything optional for flexibility
const logSchema = z.object({
  // Optional - can work without projects
  productId: z.string().optional(),
  experimentId: z.string().optional(),
  // Work type - can be company work not related to projects
  workType: z.enum(['project', 'company', 'personal']),
  // Main fields
  objective: z.string().min(1, 'What did you work on?'),
  activities: z.string().min(1, 'Describe your activities'),
  problems: z.string().optional(),
  achievements: z.string().optional(),
  // Time tracking
  date: z.string(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  durationMinutes: z.number().min(1, 'Minimum 1 minute').max(720, 'Max 12 hours'),
  // Status (removed confidence - not needed)
  completionStatus: z.enum(['InProgress', 'Completed', 'Blocked']),
});

type LogFormValues = z.infer<typeof logSchema>;

export const ResearchLog: React.FC = () => {
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showTimeEntry, setShowTimeEntry] = useState(false);
  const [showPastEntry, setShowPastEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeMotionEntry | null>(null);
  const [pastDate, setPastDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [timeEntries, setTimeEntries] = useState<TimeMotionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { currentUser, profile } = useAuth();

  const { 
    register, 
    handleSubmit, 
    watch, 
    formState: { errors, isSubmitting }, 
    reset,
    setValue
  } = useForm<LogFormValues>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      completionStatus: 'InProgress',
      workType: 'company',
      date: format(new Date(), 'yyyy-MM-dd'),
      durationMinutes: 60,
      startTime: '09:00',
      endTime: '10:00'
    }
  });

  const selectedProductId = watch('productId');
  const selectedWorkType = watch('workType');

  // Load recent time entries
  useEffect(() => {
    if (profile?.id) {
      getEntriesByScientist(profile.id)
        .then(setTimeEntries)
        .catch(console.error);
    }
  }, [profile?.id]);

  const onSubmit = async (data: LogFormValues) => {
    setIsLoading(true);
    try {
      const userId = currentUser?.uid || profile?.id || 'unknown-user';

      // Create time motion entry
      const timeEntryData = {
        scientistId: userId,
        scientistName: profile?.name || profile?.email || 'Unknown',
        date: data.date,
        category: 'other' as ActivityCategory,
        description: `${data.objective} - ${data.activities}`,
        startTime: data.startTime || '09:00',
        endTime: data.endTime || '10:00',
        durationMinutes: data.durationMinutes,
        projectId: data.productId || undefined,
        projectName: data.productId ? 'Selected Project' : undefined,
        projectStage: 'development' as any,
        attachments: [],
        isBillable: false,
        isDraft: false,
      };

      if (!isFirebaseConfigured) {
        addLog({
          userId,
          productId: data.productId || 'company-work',
          experimentId: data.experimentId || 'general',
          objective: data.objective,
          activities: data.activities,
          problems: data.problems,
          achievements: data.achievements,
          timeSpentMinutes: data.durationMinutes,
          completionStatus: data.completionStatus,
          confidenceLevel: 80,
        });
      } else {
        await createDailyLog(userId, {
          productId: data.productId || 'company-work',
          experimentId: data.experimentId || 'general',
          todaysObjective: data.objective,
          activitiesPerformed: data.activities,
          observations: '',
          problems: data.problems || '',
          achievements: data.achievements || '',
          nextSteps: '',
          timeSpentMinutes: data.durationMinutes,
          completionStatus: data.completionStatus,
          estimatedProductStage: 'Lab Testing',
          confidenceLevel: 80
        });
        
        // Also create time entry
        await createTimeMotionEntry(timeEntryData);
      }

      setSubmitStatus('success');
      reset();
      setTimeout(() => {
        setSubmitStatus('idle');
        // Refresh entries
        if (profile?.id) {
          getEntriesByScientist(profile.id).then(setTimeEntries);
        }
      }, 2000);
    } catch (err) {
      console.error("Failed to save log:", err);
      setSubmitStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick time entry for today
  const handleQuickEntry = async () => {
    const now = new Date();
    const startTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
    
    const entry = {
      scientistId: profile?.id || '',
      scientistName: profile?.name || profile?.email || 'Unknown',
      date: format(now, 'yyyy-MM-dd'),
      category: 'other' as ActivityCategory,
      description: 'Quick entry',
      startTime: format(startTime, 'HH:mm'),
      endTime: format(now, 'HH:mm'),
      durationMinutes: 60,
      projectId: undefined,
      projectName: undefined,
      projectStage: 'development' as any,
      attachments: [] as any[],
      isBillable: false,
      isDraft: false,
    };

    try {
      await createTimeMotionEntry(entry);
      if (profile?.id) {
        const entries = await getEntriesByScientist(profile.id);
        setTimeEntries(entries);
      }
      setSubmitStatus('success');
      setTimeout(() => setSubmitStatus('idle'), 2000);
    } catch (err) {
      console.error(err);
      setSubmitStatus('error');
    }
  };

  // Get max date (today - can't add future entries)
  const maxDate = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Daily Research Log
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Log your daily activities and track time spent on research
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPastEntry(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Add Past Entry
          </button>
          <button
            onClick={handleQuickEntry}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Clock className="w-4 h-4" />
            Quick Log 1h
          </button>
        </div>
      </div>

      {/* Main Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Form */}
        <div className="lg:col-span-2">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-6"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Work Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  What type of work is this?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'project', label: 'Project Work', icon: FlaskConical },
                    { value: 'company', label: 'Company Work', icon: Building2 },
                    { value: 'personal', label: 'Personal', icon: Brain }
                  ].map((type) => {
                    const Icon = type.icon;
                    return (
                      <label
                        key={type.value}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedWorkType === type.value
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          value={type.value}
                          {...register('workType')}
                          className="sr-only"
                        />
                        <Icon className={`w-6 h-6 ${selectedWorkType === type.value ? 'text-emerald-500' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${selectedWorkType === type.value ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'}`}>
                          {type.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Project/Experiment - only show for project work */}
              {selectedWorkType === 'project' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Product/Project <span className="text-gray-400">(optional)</span>
                    </label>
                    <select
                      {...register('productId')}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    >
                      <option value="">Select product...</option>
                      <option value="p1">BioShield Alpha</option>
                      <option value="p2">NemaKill Pro</option>
                      <option value="p3">RootBoost X</option>
                      <option value="p4">AeroSpore V2</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Experiment <span className="text-gray-400">(optional)</span>
                    </label>
                    <select
                      {...register('experimentId')}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    >
                      <option value="">Select experiment...</option>
                      <option value="e1">Lab Testing Phase 1</option>
                      <option value="e2">Field Trial Batch A</option>
                      <option value="e3">Validation Studies</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Date Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    {...register('date')}
                    max={maxDate}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    {...register('durationMinutes', { valueAsNumber: true })}
                    min={1}
                    max={720}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Time (optional) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Start Time <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="time"
                    {...register('startTime')}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    End Time <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="time"
                    {...register('endTime')}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Objective */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  What did you work on? <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('objective')}
                  placeholder="Brief description of your work..."
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
                {errors.objective && (
                  <p className="mt-1 text-sm text-red-500">{errors.objective.message}</p>
                )}
              </div>

              {/* Activities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Describe your activities <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('activities')}
                  rows={4}
                  placeholder="What exactly did you do? What were the key tasks?"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
                />
                {errors.activities && (
                  <p className="mt-1 text-sm text-red-500">{errors.activities.message}</p>
                )}
              </div>

              {/* Problems & Achievements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Problems/Challenges <span className="text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    {...register('problems')}
                    rows={3}
                    placeholder="Any issues faced?"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Achievements <span className="text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    {...register('achievements')}
                    rows={3}
                    placeholder="What did you accomplish?"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <div className="flex gap-3">
                  {[
                    { value: 'InProgress', label: 'In Progress', color: 'blue' },
                    { value: 'Completed', label: 'Completed', color: 'green' },
                    { value: 'Blocked', label: 'Blocked', color: 'red' }
                  ].map((status) => (
                    <label
                      key={status.value}
                      className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        watch('completionStatus') === status.value
                          ? `border-${status.color}-500 bg-${status.color}-50 dark:bg-${status.color}-900/20`
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <input
                        type="radio"
                        value={status.value}
                        {...register('completionStatus')}
                        className="sr-only"
                      />
                      {status.value === 'Completed' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                      {status.value === 'InProgress' && <div className="w-5 h-5 rounded-full border-2 border-blue-500" />}
                      {status.value === 'Blocked' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                      <span className="text-sm font-medium">{status.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Log Entry
                  </>
                )}
              </button>

              {/* Status Message */}
              <AnimatePresence>
                {submitStatus === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-xl"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Log saved successfully!
                  </motion.div>
                )}
                {submitStatus === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl"
                  >
                    <AlertCircle className="w-5 h-5" />
                    Failed to save. Please try again.
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>
        </div>

        {/* Right - Recent Entries */}
        <div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-6"
          >
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-500" />
              Recent Time Entries
            </h3>
            
            {timeEntries.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No entries yet</p>
                <p className="text-gray-400 text-xs mt-1">Start logging your work</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {timeEntries.slice(0, 10).map((entry) => {
                  const cat = ACTIVITY_CATEGORIES.find(c => c.value === entry.category);
                  const CatIcon = cat?.icon || MoreHorizontal;
                  return (
                    <div
                      key={entry.id}
                      className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: (cat?.color || '#6B7280') + '20' }}
                          >
                            <CatIcon className="w-4 h-4" style={{ color: cat?.color }} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                              {entry.description || 'No description'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {entry.date} • {entry.durationMinutes}m
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Past Entry Modal */}
      <AnimatePresence>
        {showPastEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowPastEntry(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add Entry for Past Date</h3>
                  <button
                    onClick={() => setShowPastEntry(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Select Date
                  </label>
                  <input
                    type="date"
                    {...register('date')}
                    max={maxDate}
                    defaultValue={pastDate}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Start Time
                    </label>
                    <input
                      type="time"
                      {...register('startTime')}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      End Time
                    </label>
                    <input
                      type="time"
                      {...register('endTime')}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    What did you work on? <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('objective')}
                    placeholder="Description of work..."
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                  />
                </div>

                <button
                  type="submit"
                  onClick={() => setShowPastEntry(false)}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  Save Entry
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};