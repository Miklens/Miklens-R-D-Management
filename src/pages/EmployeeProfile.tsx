import React, { useMemo, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  Mail, CheckCircle, FileText, AlertTriangle, Clock, Download, FileSpreadsheet,
  Award, Target, TrendingUp, Leaf, Shield, Bug, Beaker, Sprout, ShieldCheck,
  Activity as ActivityIcon, Calendar, Camera, Trash2, ChevronRight, CheckCircle2,
  AlertCircle, Sparkles, Filter, ExternalLink, RefreshCw, Zap, GitBranch,
  Layers, CheckSquare, Eye, ArrowUpRight, HelpCircle, MapPin
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../hooks/useUsers';
import { useDailyLogs } from '../hooks/useDailyLogs';
import { useExperiments } from '../contexts/ExperimentContext';
import { useTasks } from '../contexts/TaskContext';
import { getProductName, getExperimentName } from '../constants';
import { formatDate } from '../utils/formatters';
import { Badge } from '../components/ui/Badge';
import { format, subDays, parseISO, isToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getSyncedTrials,
  getSyncedProjects,
  formatCleanScientistName,
} from '../services/trialManagerSync';
import {
  loadScientificFormulations,
  loadScientificEvaluations,
  loadMISReports,
} from '../services/experimentStore';
import {
  getEffectiveAvatar,
  setUserCustomAvatar,
  removeUserCustomAvatar,
} from '../utils/avatarHelper';
import {
  DateFilterRange,
  TrialCategory,
  ExternalFieldTrial,
} from '../types/trialIntegrationTypes';
import {
  buildScientistExecutiveProfile,
  filterTrialsByDateRange,
} from '../services/executiveAnalytics';
import {
  exportScientistToExcel,
  exportScientistToPDF,
} from '../services/executiveReportGenerator';
import {
  getScientistTrials,
  getScientistLogs,
  getScientistLabWork,
  getScientistFormulations,
  getScientistMISReports,
  getScientistProjects,
  getScientistTasks,
  getScientistObservations,
  matchesScientist,
} from '../utils/scientistMatcher';
import { calculateLogMinutes, calculateTotalHours } from '../utils/timeTracking';
import type { ScientificFormulation, WeeklyMISReport } from '../types/experimentTypes';

const buildMonthlyTrend = (logs: { createdAt?: string; date?: string; completionStatus?: string; confidenceLevel?: number }[]) => {
  const months: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en-US', { month: 'short' }) });
  }

  return months.map(({ key, label }) => {
    const [y, m] = key.split('-').map(Number);
    const monthLogs = logs.filter(l => {
      const d = new Date(l.date || l.createdAt || '');
      return d.getFullYear() === y && d.getMonth() === m;
    });
    const avgConfidence = monthLogs.length
      ? Math.round(monthLogs.reduce((s, l) => s + (l.confidenceLevel || 85), 0) / monthLogs.length)
      : 0;
    return { month: label, knowledge: monthLogs.length, innovation: avgConfidence };
  });
};

const DECISION_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  'Continue':                { bg: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300', text: 'text-emerald-700 dark:text-emerald-400', label: 'Continue' },
  'Modify':                  { bg: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300',       text: 'text-amber-700 dark:text-amber-400',       label: 'Modify' },
  'Stop':                    { bg: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300',             text: 'text-red-700 dark:text-red-400',             label: 'Stop' },
  'Under Review':            { bg: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300',           text: 'text-blue-700 dark:text-blue-400',           label: 'Under Review' },
  'Advance to Field Trial':  { bg: 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300',           text: 'text-teal-700 dark:text-teal-400',           label: 'Advance to Field' },
  'Advance to Registration': { bg: 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300',     text: 'text-purple-700 dark:text-purple-400',     label: 'Advance to Registration' },
};

const getEfficacyStyle = (pct: number) => {
  if (pct >= 80) return { text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950/60', bar: '#059669', label: 'High Efficacy' };
  if (pct >= 65) return { text: 'text-blue-700 dark:text-blue-400',       bg: 'bg-blue-100 dark:bg-blue-950/60',       bar: '#3b82f6', label: 'Satisfactory' };
  if (pct >= 50) return { text: 'text-amber-700 dark:text-amber-400',     bg: 'bg-amber-100 dark:bg-amber-950/60',     bar: '#f59e0b', label: 'Moderate' };
  return             { text: 'text-red-700 dark:text-red-400',            bg: 'bg-red-100 dark:bg-red-950/60',         bar: '#ef4444', label: 'Low Efficacy' };
};

export const EmployeeProfile: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const { profile: currentProfile } = useAuth();
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: allLogs, isLoading: logsLoading } = useDailyLogs();
  const { experiments, labTests, stabilityLogs, observations } = useExperiments();
  const { tasks, toggleTaskStatus } = useTasks();

  const [execFilter, setExecFilter] = useState<DateFilterRange>({ preset: '30d' });
  const [selectedHorizon, setSelectedHorizon] = useState<'today' | '7d' | '30d' | '6m' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'trials' | 'formulations' | 'logs' | 'lab' | 'mis' | 'time' | 'projects' | 'timeline'
  >('overview');
  const [trialCategoryFilter, setTrialCategoryFilter] = useState<'all' | TrialCategory>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [avatarTick, setAvatarTick] = useState(0);

  const syncedTrials = useMemo(() => getSyncedTrials(), []);
  const formulations = useMemo(() => loadScientificFormulations(), []);
  const evaluations = useMemo(() => loadScientificEvaluations(), []);
  const misReports = useMemo(() => loadMISReports(), []);
  const syncedProjects = useMemo(() => getSyncedProjects(), []);

  const targetId = userId || currentProfile?.id;
  const isSelf = targetId === currentProfile?.id;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (currentProfile?.email) setUserCustomAvatar(currentProfile.email, base64);
      if (currentProfile?.id) setUserCustomAvatar(currentProfile.id, base64);
      setAvatarTick(t => t + 1);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoDelete = () => {
    if (currentProfile?.email) removeUserCustomAvatar(currentProfile.email);
    if (currentProfile?.id) removeUserCustomAvatar(currentProfile.id);
    setAvatarTick(t => t + 1);
  };

  const person = useMemo(() => {
    if (!targetId) return currentProfile;
    const tid = targetId.toLowerCase().trim();
    const matched = users?.find(u => {
      const uId = (u.id || '').toLowerCase();
      const uUid = ((u as any).uid || '').toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      const uHandle = uEmail ? uEmail.split('@')[0].split('.')[0] : '';
      const uName = (u.name || '').toLowerCase();
      return (
        uId === tid ||
        uUid === tid ||
        uEmail === tid ||
        (uHandle && (tid.includes(uHandle) || uHandle.includes(tid))) ||
        (uName && (tid.includes(uName) || uName.includes(tid)))
      );
    });

    if (matched) return matched;

    if (targetId.includes('@') || targetId.length > 5) {
      const cleanName = formatCleanScientistName(targetId);
      return {
        id: targetId,
        name: cleanName,
        email: targetId.includes('@') ? targetId : `${targetId}@miklensbio.com`,
        role: 'Scientist',
        designation: 'Research Scientist',
        department: 'R&D Field Operations',
        location: 'R&D Station',
        isActive: true,
        skills: ['Agronomy', 'Field Trials', 'Efficacy Testing'],
      } as any;
    }

    return isSelf ? currentProfile : undefined;
  }, [users, targetId, isSelf, currentProfile, avatarTick]);

  // Universal linking identity
  const scientistIdentity = useMemo(() => ({
    id: person?.id,
    email: person?.email,
    name: person?.name,
    displayName: person?.name,
  }), [person]);

  // 1. Field Trials (from Trial Manager)
  const personTrials = useMemo(() => {
    if (!person) return [];
    return getScientistTrials(scientistIdentity, syncedTrials);
  }, [person, scientistIdentity, syncedTrials]);

  // 2. Daily Research Logs (from R&D app)
  const personLogs = useMemo(() => {
    if (!person) return [];
    return getScientistLogs(scientistIdentity, allLogs || []).sort(
      (a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
    );
  }, [person, scientistIdentity, allLogs]);

  // 3. Laboratory Assays & Quality Control
  const personLabWork = useMemo(() => {
    if (!person) return { experiments: [], labTests: [], stabilityLogs: [] };
    return getScientistLabWork(scientistIdentity, experiments, labTests, stabilityLogs);
  }, [person, scientistIdentity, experiments, labTests, stabilityLogs]);

  // 4. Formulations (Developed or Field-Tested)
  const personFormulations = useMemo(() => {
    if (!person) return [];
    return getScientistFormulations(scientistIdentity, formulations, personTrials);
  }, [person, scientistIdentity, formulations, personTrials]);

  // 5. Weekly MIS Reports & Decisions
  const personMISReports = useMemo(() => {
    if (!person) return [];
    return getScientistMISReports(scientistIdentity, misReports);
  }, [person, scientistIdentity, misReports]);

  // 6. Synced Projects
  const personProjects = useMemo(() => {
    if (!person) return [];
    return getScientistProjects(scientistIdentity, syncedProjects);
  }, [person, scientistIdentity, syncedProjects]);

  // 7. Global Tasks
  const personTasks = useMemo(() => {
    if (!person) return [];
    return getScientistTasks(scientistIdentity, tasks);
  }, [person, scientistIdentity, tasks]);

  // 8. Field Observations
  const personObservations = useMemo(() => {
    if (!person) return [];
    return getScientistObservations(scientistIdentity, observations, personTrials);
  }, [person, scientistIdentity, observations, personTrials]);

  // Executive Profile with multi-horizon progress & bottleneck detection
  const executiveProfile = useMemo(() => {
    if (!person) return null;
    return buildScientistExecutiveProfile(
      person.name || person.email || '',
      syncedTrials,
      allLogs || [],
      experiments,
      labTests,
      stabilityLogs,
      formulations,
      misReports,
      syncedProjects,
      tasks
    );
  }, [person, syncedTrials, allLogs, experiments, labTests, stabilityLogs, formulations, misReports, syncedProjects, tasks]);

  // Filtered trials based on selected date range & category filter
  const dateFilteredTrials = useMemo(() => {
    const timeFiltered = filterTrialsByDateRange(personTrials, execFilter);
    if (trialCategoryFilter === 'all') return timeFiltered;
    return timeFiltered.filter(t => t.category === trialCategoryFilter);
  }, [personTrials, execFilter, trialCategoryFilter]);

  const trendData = useMemo(() => buildMonthlyTrend(personLogs), [personLogs]);

  // Time & Motion Breakdown derived from Daily Logs
  const timeBreakdown = useMemo(() => {
    const categories: Record<string, { minutes: number; count: number; color: string }> = {
      'Field Trials & Efficacy':  { minutes: 0, count: 0, color: '#10b981' },
      'Formulations & Lab QC':   { minutes: 0, count: 0, color: '#8b5cf6' },
      'Research & Protocol Log': { minutes: 0, count: 0, color: '#3b82f6' },
      'Station Ops & Meetings':  { minutes: 0, count: 0, color: '#f59e0b' },
    };

    personLogs.forEach(log => {
      const mins = calculateLogMinutes(log) || (log.timeSpentMinutes || 60);
      const act = (log.activities || log.objective || '').toLowerCase();
      if (act.includes('trial') || act.includes('spray') || act.includes('efficacy') || act.includes('field') || act.includes('plot')) {
        categories['Field Trials & Efficacy'].minutes += mins;
        categories['Field Trials & Efficacy'].count += 1;
      } else if (act.includes('formulat') || act.includes('lab') || act.includes('assay') || act.includes('stability') || act.includes('qc') || act.includes('sample')) {
        categories['Formulations & Lab QC'].minutes += mins;
        categories['Formulations & Lab QC'].count += 1;
      } else if (act.includes('meet') || act.includes('visit') || act.includes('station') || act.includes('audit')) {
        categories['Station Ops & Meetings'].minutes += mins;
        categories['Station Ops & Meetings'].count += 1;
      } else {
        categories['Research & Protocol Log'].minutes += mins;
        categories['Research & Protocol Log'].count += 1;
      }
    });

    const totalMins = Object.values(categories).reduce((s, c) => s + c.minutes, 0);

    return {
      categories: Object.entries(categories).map(([name, data]) => ({
        name,
        hours: Math.round((data.minutes / 60) * 10) / 10,
        percent: totalMins > 0 ? Math.round((data.minutes / totalMins) * 100) : 0,
        count: data.count,
        color: data.color,
      })),
      totalHours: Math.round((totalMins / 60) * 10) / 10,
    };
  }, [personLogs]);

  // Combined Scientist timeline events across all data sources
  const scientistTimelineEvents = useMemo(() => {
    const events: { date: string; type: string; title: string; desc: string; icon: string; color: string }[] = [];

    // 1. Trial Start dates
    personTrials.forEach((t) => {
      if (t.startDate) {
        events.push({
          date: t.startDate,
          type: 'trial_start',
          title: `Trial Initiated: ${t.trialCode || t.title}`,
          desc: `Started ${t.category.toUpperCase()} trial on ${t.cropName} targeting ${t.targetWeedOrPathogen} (Product: ${t.productName}) at ${t.location}.`,
          icon: 'play',
          color: 'bg-emerald-500 text-white',
        });
      }

      // Evaluations
      t.evaluations?.forEach((ev, idx) => {
        if (ev.evalDate) {
          events.push({
            date: ev.evalDate,
            type: 'eval',
            title: `Evaluation Recorded: ${t.trialCode || t.title}`,
            desc: `Assessment #${idx + 1}: ${ev.daysAfterTreatment} DAT evaluation. Efficacy: ${ev.efficacyPercent}% with phytotoxicity score ${ev.phytotoxicityScore || 0}/10. Notes: "${ev.notes || 'N/A'}"`,
            icon: 'clipboard',
            color: 'bg-blue-500 text-white',
          });
        }
      });

      // Concluded trials
      if (t.isCompleted) {
        events.push({
          date: t.rawDateStr || t.startDate,
          type: 'trial_complete',
          title: `Trial Concluded: ${t.trialCode || t.title}`,
          desc: `Final field assessment completed. Verdict: ${t.resultRating || 'Good'}. Notes: "${t.summaryConclusion || 'N/A'}"`,
          icon: 'check',
          color: 'bg-violet-600 text-white',
        });
      }
    });

    // 2. Daily Work Logs
    personLogs.forEach((log) => {
      if (log.date) {
        events.push({
          date: log.date,
          type: 'work_log',
          title: `Daily Research Log: ${getProductName(log.productId || '') || log.objective || 'Protocol Work'}`,
          desc: `Objective: "${log.objective || 'N/A'}". Achievements: "${log.achievements || log.activities || 'N/A'}". Status: ${log.completionStatus}.`,
          icon: 'edit',
          color: 'bg-amber-500 text-white',
        });
      }
    });

    // 3. Formulations
    personFormulations.forEach((f) => {
      if (f.updatedAt || f.createdAt) {
        events.push({
          date: (f.updatedAt || f.createdAt).split('T')[0],
          type: 'formulation',
          title: `Formulation Milestone: ${f.name} (${f.version})`,
          desc: `Batch #${f.batchNo}. Actives: ${f.keyActivesComposition}. Final Decision: ${f.finalDecision}. Efficacy: ${f.trialResultEfficacy ? `${f.trialResultEfficacy}%` : 'Pending'}.`,
          icon: 'flask',
          color: 'bg-indigo-500 text-white',
        });
      }
    });

    // 4. Lab Tests
    personLabWork.labTests.forEach((l) => {
      if (l.createdAt) {
        events.push({
          date: l.createdAt.split('T')[0],
          type: 'lab_test',
          title: `Lab Assay Completed: ${l.name}`,
          desc: `Outcome Status: ${l.outcomeStatus || 'Passed'}. Target Product: ${l.productName}. Notes: "${l.conclusion || l.hypothesis || 'Target QA verified'}"`,
          icon: 'beaker',
          color: 'bg-purple-500 text-white',
        });
      }
    });

    // 5. Weekly MIS Reports
    personMISReports.forEach((m) => {
      if (m.reportingPeriodEnd || m.preparedAt || m.preparedDate) {
        events.push({
          date: m.reportingPeriodEnd || (m.preparedAt ? m.preparedAt.split('T')[0] : (m.preparedDate || new Date().toISOString().split('T')[0])),
          type: 'mis_report',
          title: `MIS Report Submitted: Week ${m.weekNumber}`,
          desc: `Learning: "${(m.whatDidWeLearn || '').slice(0, 90)}...". Decisions requested: ${m.decisionsRequiredFromManagement.length}.`,
          icon: 'clipboard-list',
          color: 'bg-teal-500 text-white',
        });
      }
    });

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 30);
  }, [personTrials, personLogs, personFormulations, personLabWork, personMISReports]);

  // Overall metric calculations
  const totalMinutes = personLogs.reduce((sum, l) => sum + (calculateLogMinutes(l) || l.timeSpentMinutes || 0), 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const advancingFmlsCount = personFormulations.filter(f => ['Advance to Field Trial', 'Advance to Registration'].includes(f.finalDecision)).length;
  const labAssaysCount = personLabWork.experiments.length + personLabWork.labTests.length + personLabWork.stabilityLogs.length;

  const handleHorizonChange = (horizon: 'today' | '7d' | '30d' | '6m' | '1y') => {
    setSelectedHorizon(horizon);
    setExecFilter({ preset: horizon });
  };

  // Comparative progress for selected horizon
  const activeComparativeProgress = useMemo(() => {
    if (!executiveProfile) return null;
    switch (selectedHorizon) {
      case '7d':
        return {
          title: '1-Week Progress (This Week vs Previous Week)',
          current: executiveProfile.weeklyProgress.currentWeek,
          previous: executiveProfile.weeklyProgress.previousWeek,
        };
      case '30d':
        return {
          title: '1-Month Progress (This Month vs Previous Month)',
          current: executiveProfile.monthlyProgress.currentMonth,
          previous: executiveProfile.monthlyProgress.previousMonth,
        };
      case '6m':
        return {
          title: '6-Month Progress (Past 180 Days vs Prior 180 Days)',
          current: executiveProfile.sixMonthProgress.currentPeriod,
          previous: executiveProfile.sixMonthProgress.previousPeriod,
        };
      case '1y':
        return {
          title: '1-Year Progress (Past 365 Days vs Prior 365 Days)',
          current: executiveProfile.yearlyProgress.currentYear,
          previous: executiveProfile.yearlyProgress.previousYear,
        };
      default:
        return null;
    }
  }, [executiveProfile, selectedHorizon]);

  if (usersLoading || logsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-2 text-center py-20">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Scientist Profile Not Found</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Please check the employee directory or try refreshing.</p>
        <Link to="/employees" className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">
          Return to Scientist Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ── 1. Profile Header & Quick Identity ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/50 shadow-2xl border border-gray-100/50 dark:border-gray-800/50"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-400/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="relative group">
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 p-1 shadow-2xl shadow-emerald-500/25">
                  <img
                    className="w-full h-full rounded-3xl object-cover"
                    src={getEffectiveAvatar(person.id, person.email, person.avatar) || `https://i.pravatar.cc/150?u=${person.id}`}
                    alt={person.name}
                  />
                </div>
                {isSelf && (
                  <div className="mt-3 flex items-center gap-2">
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{getEffectiveAvatar(person.id, person.email) ? 'Change Photo' : 'Upload Photo'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>

                    {getEffectiveAvatar(person.id, person.email) && (
                      <button
                        onClick={handlePhotoDelete}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-950 dark:text-red-300 rounded-xl text-xs font-bold transition-all active:scale-95"
                        title="Remove custom photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                      {person.name}
                    </h1>
                    {executiveProfile?.todayProgress.hasActiveWorkToday ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                        Active Today
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        Field Standby
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                      {person.role || 'Scientist'}
                    </span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-0.5">{person.designation || 'Research Scientist'}</p>

                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 font-semibold bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-xl">
                      <Target className="w-3.5 h-3.5 text-emerald-500" />
                      {person.department || 'R&D Field Operations'}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 font-semibold bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-xl">
                      <Mail className="w-3.5 h-3.5 text-emerald-500" />
                      {person.email}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-950/40 px-3 py-1 rounded-xl border border-purple-100 dark:border-purple-900">
                      <Zap className="w-3.5 h-3.5 text-purple-500" />
                      Workload Score: {executiveProfile?.currentWorkloadScore || 50}/100
                    </span>
                  </div>
                </div>

                {/* Executive Actions */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {!isSelf && person.email && (
                    <a
                      href={`mailto:${person.email}`}
                      className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-600 transition-all"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email</span>
                    </a>
                  )}
                  <button
                    onClick={() => executiveProfile && exportScientistToPDF(executiveProfile, personTrials, { preset: selectedHorizon })}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    title="Export Executive PDF Report"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={() => executiveProfile && exportScientistToExcel(executiveProfile, personTrials, { preset: selectedHorizon })}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    title="Export Executive Excel Report"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Excel</span>
                  </button>
                  <Link
                    to="/employees"
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all"
                  >
                    Roster
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 2. Top 6 Key Performance Indicators (Universal Dual-App Picture) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 shadow-md border border-gray-100 dark:border-gray-800 space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase block truncate">Field Trials</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-gray-900 dark:text-white">{personTrials.length}</span>
            <Leaf className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-[10px] text-gray-500 block truncate">
            {personTrials.filter(t => !t.isCompleted).length} active · {personTrials.filter(t => t.isCompleted).length} done
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 shadow-md border border-gray-100 dark:border-gray-800 space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase block truncate">Total Hours</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-gray-900 dark:text-white">{totalHours}h</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-[10px] text-gray-500 block truncate">
            {personLogs.length} logs filed
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 shadow-md border border-gray-100 dark:border-gray-800 space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase block truncate">Formulations</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-gray-900 dark:text-white">{personFormulations.length}</span>
            <GitBranch className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block truncate">
            {advancingFmlsCount} advancing
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 shadow-md border border-gray-100 dark:border-gray-800 space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase block truncate">Lab & QC Assays</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-gray-900 dark:text-white">{labAssaysCount}</span>
            <Beaker className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-[10px] text-gray-500 block truncate">
            {personLabWork.experiments.length} exp · {personLabWork.labTests.length} tests
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 shadow-md border border-gray-100 dark:border-gray-800 space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase block truncate">Weekly MIS</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-gray-900 dark:text-white">{personMISReports.length}</span>
            <FileText className="w-4 h-4 text-teal-500" />
          </div>
          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold block truncate">
            {executiveProfile?.pendingDecisionsCount || 0} decisions
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 shadow-md border border-emerald-100 dark:border-emerald-900/40 space-y-1">
          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase block truncate">Field Efficacy</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
              {executiveProfile?.successRate || 88}%
            </span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block truncate">
            WCE benchmark
          </span>
        </div>
      </div>

      {/* ── 3. TODAY'S LIVE DISPATCH ── */}
      {executiveProfile && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-emerald-50/30 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-gray-900 border border-emerald-100 dark:border-emerald-900/40 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                  Live Executive Dispatch
                </span>
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                  Today's Operational Pulse ({format(new Date(), 'EEEE, MMMM d, yyyy')})
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-black">
                {executiveProfile.todayProgress.todayHours}h Logged Today
              </span>
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 rounded-xl text-xs font-black">
                {executiveProfile.todayProgress.todayLogsCount} Log Entries
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-emerald-200/40 dark:border-emerald-900/30">
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-gray-800/60 border border-emerald-100/60 dark:border-gray-700/50 space-y-1">
              <span className="text-[10px] font-black uppercase text-gray-400">Core Objective</span>
              <p className="text-xs font-bold text-gray-900 dark:text-white leading-relaxed">
                "{executiveProfile.todayProgress.latestObjective}"
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-gray-800/60 border border-emerald-100/60 dark:border-gray-700/50 space-y-1">
              <span className="text-[10px] font-black uppercase text-gray-400">Latest Accomplishments</span>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-relaxed">
                {executiveProfile.todayProgress.latestAchievements}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-gray-800/60 border border-emerald-100/60 dark:border-gray-700/50 space-y-1">
              <span className="text-[10px] font-black uppercase text-gray-400">Operational Status</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={executiveProfile.todayProgress.hasActiveWorkToday ? 'success' : 'info'}>
                  {executiveProfile.todayProgress.latestStatus}
                </Badge>
                <span className="text-xs text-gray-500 font-semibold">
                  {executiveProfile.todayProgress.todayTrialsVisited} Field Trial(s) evaluated
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── 4. PERFORMANCE HORIZON COMPARATIVE MATRIX ── */}
      {activeComparativeProgress && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              {activeComparativeProgress.title}
            </h3>

            {/* Quick Horizon Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl shrink-0">
              {[
                { id: 'today', label: 'Today' },
                { id: '7d',    label: '1-Week' },
                { id: '30d',   label: '1-Month' },
                { id: '6m',    label: '6-Months' },
                { id: '1y',    label: '1-Year' },
              ].map((h) => (
                <button
                  key={h.id}
                  onClick={() => handleHorizonChange(h.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedHorizon === h.id
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              {
                label: 'Trials Started',
                cur: activeComparativeProgress.current.trialsStarted,
                prev: activeComparativeProgress.previous.trialsStarted,
                diff: activeComparativeProgress.current.startedDiffPercent,
              },
              {
                label: 'Trials Completed',
                cur: activeComparativeProgress.current.trialsCompleted,
                prev: activeComparativeProgress.previous.trialsCompleted,
                diff: activeComparativeProgress.current.completedDiffPercent,
              },
              {
                label: 'Pending Trials',
                cur: activeComparativeProgress.current.pendingTrials,
                prev: activeComparativeProgress.previous.pendingTrials,
              },
              {
                label: 'Evaluations Done',
                cur: activeComparativeProgress.current.evaluationsDone,
                prev: activeComparativeProgress.previous.evaluationsDone,
              },
              {
                label: 'Avg Efficacy',
                cur: `${activeComparativeProgress.current.efficacyAvg}%`,
                prev: `${activeComparativeProgress.previous.efficacyAvg}%`,
              },
            ].map((item) => (
              <div key={item.label} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-gray-400 block truncate">{item.label}</span>
                <span className="text-xl font-black text-gray-900 dark:text-white block">{item.cur}</span>
                <span className="text-[10px] text-gray-400 font-medium block">
                  vs {item.prev} prior period
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── 5. WHERE THEY ARE LACKING / BOTTLENECKS & RISKS RADAR ── */}
      {executiveProfile && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bottlenecks Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    Where Scientist is Lacking / Bottlenecks
                  </h3>
                  <p className="text-[11px] text-gray-400">Issues requiring management assistance</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                {executiveProfile.bottlenecks.length} Flagged
              </span>
            </div>

            {executiveProfile.bottlenecks.length === 0 ? (
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/30 text-center space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300">Zero Critical Bottlenecks</h4>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Scientist is maintaining expected evaluation cadences, formulation stability, and logs.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {executiveProfile.bottlenecks.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-amber-900 dark:text-amber-200">{b.title}</span>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                          b.severity === 'high'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {b.severity} priority
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{b.description}</p>
                    <div className="p-2.5 bg-white dark:bg-gray-900 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
                      <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 block uppercase">
                        Management Action:
                      </span>
                      <span className="text-xs text-gray-800 dark:text-gray-200 font-semibold">{b.actionRecommendation}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upgradations & Innovations Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    R&D Upgradations & Innovations
                  </h3>
                  <p className="text-[11px] text-gray-400">High-performing formulations & breakthroughs</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                {executiveProfile.innovations.length} Breakthroughs
              </span>
            </div>

            {executiveProfile.innovations.length === 0 ? (
              <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/30 text-center space-y-1">
                <Sprout className="w-8 h-8 text-gray-400 mx-auto" />
                <h4 className="text-xs font-black text-gray-700 dark:text-gray-300">Formulations Under Evaluation</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Breakthrough ratings will appear here once evaluation efficacy exceeds 80% or formulations advance.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {executiveProfile.innovations.map((inno) => (
                  <div
                    key={inno.id}
                    className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-purple-950 dark:text-purple-200">{inno.title}</span>
                      {inno.metric && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-200/80 text-purple-900 dark:bg-purple-900 dark:text-purple-200">
                          {inno.metric}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">{inno.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 6. Category Trial Breakdown Bar ── */}
      {executiveProfile && (
        <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 shadow-md border border-gray-100 dark:border-gray-800 space-y-3">
          <span className="text-xs font-black uppercase text-gray-700 dark:text-gray-300 tracking-wider block">
            Field Trials Across 5 Agricultural Categories ({personTrials.length} Total Linked)
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'herbicide',    label: 'Herbicide',    icon: Leaf,   count: executiveProfile.categoryWorkload.herbicide,    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900', desc: 'Weed Control' },
              { id: 'fungicide',    label: 'Fungicide',    icon: Shield, count: executiveProfile.categoryWorkload.fungicide,    color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900',       desc: 'Disease Control' },
              { id: 'pesticide',    label: 'Pesticide',    icon: Bug,    count: executiveProfile.categoryWorkload.pesticide,    color: 'text-red-600 bg-red-50 dark:bg-red-950/40 border-red-100 dark:border-red-900',                   desc: 'Pest Control' },
              { id: 'nutrition',    label: 'Nutrition',    icon: Beaker, count: executiveProfile.categoryWorkload.nutrition,    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900',           desc: 'Yield Booster' },
              { id: 'biostimulant', label: 'Biostimulant', icon: Sprout, count: executiveProfile.categoryWorkload.biostimulant, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40 border-teal-100 dark:border-teal-900',             desc: 'Growth Index' },
            ].map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.id} className={`p-3 rounded-2xl border ${cat.color} space-y-1`}>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1"><Icon className="w-3.5 h-3.5" /> {cat.label}</span>
                    <span className="font-mono text-sm font-black">{cat.count}</span>
                  </div>
                  <span className="text-[10px] opacity-80 block">{cat.desc}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 7. Detailed Multi-App Data Tabs ── */}
      <div className="space-y-4">
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl overflow-x-auto gap-1">
          {[
            { id: 'overview',     label: '📊 Analytics & Trends',        count: null },
            { id: 'trials',       label: '🌱 Field Trials',               count: personTrials.length },
            { id: 'formulations', label: '🧪 Formulations & Products',     count: personFormulations.length },
            { id: 'logs',         label: '📝 Research Logs',              count: personLogs.length },
            { id: 'lab',          label: '🔬 Lab Assays & QC',            count: labAssaysCount },
            { id: 'mis',          label: '📋 Weekly MIS & Decisions',     count: personMISReports.length },
            { id: 'time',         label: '⏱️ Time & Motion',              count: `${totalHours}h` },
            { id: 'projects',     label: '📁 Projects & Tasks',           count: personProjects.length + personTasks.length },
            { id: 'timeline',     label: '🗓️ Milestone Timeline',         count: scientistTimelineEvents.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── TAB 1: OVERVIEW & CHARTS ── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 space-y-4">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                Research Velocity & Efficacy Trend
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorInnovation" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorKnowledge" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Area type="monotone" dataKey="innovation" stroke="#10b981" fillOpacity={1} fill="url(#colorInnovation)" name="Innovation Index" />
                    <Area type="monotone" dataKey="knowledge" stroke="#3b82f6" fillOpacity={1} fill="url(#colorKnowledge)" name="Research Logs" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 space-y-3">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                Overall Career Output
              </h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
                  <span className="text-xs font-semibold text-gray-500">Total Hours Logged</span>
                  <span className="text-sm font-black text-gray-900 dark:text-white">{totalHours}h</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
                  <span className="text-xs font-semibold text-gray-500">Research Logs Filed</span>
                  <span className="text-sm font-black text-gray-900 dark:text-white">{personLogs.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl">
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Formulations Developed</span>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{personFormulations.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Field Trial Success Rate</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{executiveProfile?.successRate || 88}%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl">
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Lab Assays & QC</span>
                  <span className="text-sm font-black text-purple-600 dark:text-purple-400">
                    {labAssaysCount}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-teal-50 dark:bg-teal-950/30 rounded-xl">
                  <span className="text-xs font-bold text-teal-700 dark:text-teal-300">Weekly MIS Reports</span>
                  <span className="text-sm font-black text-teal-600 dark:text-teal-400">{personMISReports.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: LINKED FIELD TRIALS ── */}
        {activeTab === 'trials' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-500" />
                Linked Trials from Trial Manager 7 ({dateFilteredTrials.length} Shown)
              </h3>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-1">
                {(['all', 'herbicide', 'fungicide', 'pesticide', 'nutrition', 'biostimulant'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setTrialCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      trialCategoryFilter === cat
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {cat.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {dateFilteredTrials.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Leaf className="w-12 h-12 text-gray-300 mx-auto" />
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">No Trials Found for This Filter</h4>
                <p className="text-xs text-gray-500">Try changing the category or date range above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dateFilteredTrials.map((t) => {
                  const latEv = t.evaluations?.length > 0 ? t.evaluations[t.evaluations.length - 1] : null;
                  const effPct = latEv ? Math.round(latEv.efficacyPercent) : null;
                  const effStyle = effPct !== null ? getEfficacyStyle(effPct) : null;

                  return (
                    <div
                      key={t.id}
                      className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-3 hover:border-emerald-500/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              {t.category}
                            </span>
                            <span className="text-xs font-mono font-bold text-gray-500">{t.trialCode}</span>
                          </div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-1">{t.title}</h4>
                        </div>
                        <Badge variant={t.isCompleted ? 'success' : 'info'}>
                          {t.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400 font-semibold block text-[10px] uppercase">Crop & Target</span>
                          <span className="font-bold text-gray-800 dark:text-gray-200">{t.cropName} — {t.targetWeedOrPathogen}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-semibold block text-[10px] uppercase">Product Form</span>
                          <span className="font-bold text-gray-800 dark:text-gray-200">{t.productName}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-semibold block text-[10px] uppercase">Location</span>
                          <span className="text-gray-700 dark:text-gray-300">{t.location || 'Field Station'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-semibold block text-[10px] uppercase">Evaluations</span>
                          <span className="text-emerald-600 font-bold">{t.evaluations?.length || 0} Assessments</span>
                        </div>
                      </div>

                      {/* Efficacy Progress Bar */}
                      {effPct !== null && effStyle && (
                        <div className="space-y-1 pt-1 border-t border-gray-200/50 dark:border-gray-700/50">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 dark:text-gray-400">Observed Control Efficacy:</span>
                            <span className={`font-bold ${effStyle.text}`}>{effPct}% WCE ({effStyle.label})</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${effPct}%`, backgroundColor: effStyle.bar }} />
                          </div>
                        </div>
                      )}

                      {/* Photos Preview */}
                      {t.photos && t.photos.length > 0 && (
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-200/50 dark:border-gray-700/50 overflow-x-auto">
                          {t.photos.slice(0, 3).map((ph, pidx) => (
                            <a key={pidx} href={ph.url} target="_blank" rel="noopener noreferrer" className="block relative group shrink-0">
                              <img
                                src={ph.thumbnailUrl || ph.url}
                                alt={ph.caption || 'Field evaluation photo'}
                                className="w-14 h-14 rounded-xl object-cover border border-gray-200 dark:border-gray-700 group-hover:scale-105 transition-transform"
                              />
                            </a>
                          ))}
                          {t.photos.length > 3 && (
                            <span className="text-[10px] text-gray-400 font-bold">+{t.photos.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: SCIENTIFIC FORMULATIONS (FROM TRIAL MANAGER & R&D) ── */}
        {activeTab === 'formulations' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-indigo-500" />
                  Scientific Formulations Developed & Validated ({personFormulations.length})
                </h3>
                <p className="text-[11px] text-gray-400">14-field management standard tracking from recipe to field</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Advancing:</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                  {advancingFmlsCount} Recipes
                </span>
              </div>
            </div>

            {personFormulations.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <GitBranch className="w-12 h-12 text-gray-300 mx-auto" />
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">No Formulations Linked</h4>
                <p className="text-xs text-gray-500">Formulations created by or tested by this scientist will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personFormulations.map((f) => {
                  const decBadge = DECISION_BADGES[f.finalDecision] || DECISION_BADGES['Under Review'];
                  const eff = typeof f.trialResultEfficacy === 'number' ? f.trialResultEfficacy : null;
                  const effStyle = eff !== null ? getEfficacyStyle(eff) : null;

                  return (
                    <div
                      key={f.id}
                      className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-3 hover:border-indigo-500/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                              {f.formulationId} · {f.version}
                            </span>
                            <span className="text-[11px] text-gray-400">Batch #{f.batchNo || 'N/A'}</span>
                          </div>
                          <h4 className="text-base font-bold text-gray-900 dark:text-white mt-1">{f.name}</h4>
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 capitalize">{f.category}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${decBadge.bg}`}>
                          {decBadge.label}
                        </span>
                      </div>

                      <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 space-y-1 text-xs">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Key Actives / Composition</span>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{f.keyActivesComposition || 'Standard formulation actives'}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px]">
                        <div className="p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 text-center">
                          <span className="text-[9px] text-gray-400 uppercase block font-semibold">Appearance</span>
                          <span className="font-bold text-gray-800 dark:text-gray-200">{f.physicalAppearance || 'Clear Liquid'}</span>
                        </div>
                        <div className="p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 text-center">
                          <span className="text-[9px] text-gray-400 uppercase block font-semibold">Stability</span>
                          <span className="font-bold text-gray-800 dark:text-gray-200">{f.stabilityStatus || 'Stable'}</span>
                        </div>
                        <div className="p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 text-center">
                          <span className="text-[9px] text-gray-400 uppercase block font-semibold">pH</span>
                          <span className="font-bold text-gray-800 dark:text-gray-200">{f.pH ?? '6.5'}</span>
                        </div>
                      </div>

                      {/* Efficacy & Result */}
                      {eff !== null && effStyle && (
                        <div className="space-y-1 pt-1 border-t border-gray-200/50 dark:border-gray-700/50">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 dark:text-gray-400">Trial Efficacy:</span>
                            <span className={`font-bold ${effStyle.text}`}>{eff}% WCE Control</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${eff}%`, backgroundColor: effStyle.bar }} />
                          </div>
                        </div>
                      )}

                      {/* Problem & Corrective Action */}
                      {f.problemIdentified && (
                        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/50 dark:border-amber-900/30 text-xs space-y-0.5">
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase block">Issue & Corrective Action:</span>
                          <p className="text-gray-700 dark:text-gray-300 font-medium">{f.problemIdentified}</p>
                          {f.correctiveAction && (
                            <p className="text-gray-600 dark:text-gray-400 text-[11px] italic">Action: {f.correctiveAction}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: DAILY RESEARCH LOGS ── */}
        {activeTab === 'logs' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                Synchronized Daily Research Logs ({personLogs.length})
              </h3>
              <span className="text-[11px] font-bold text-gray-400">Live Dual-Write System</span>
            </div>

            {personLogs.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <FileText className="w-12 h-12 text-gray-300 mx-auto" />
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">No Research Logs Recorded</h4>
                <p className="text-xs text-gray-500">Logs submitted by this scientist will appear here instantly.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {personLogs.map((log) => {
                  const mins = calculateLogMinutes(log) || log.timeSpentMinutes || 0;
                  return (
                    <div
                      key={log.id}
                      className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-gray-900 dark:text-white">
                            {getProductName(log.productId || '') || log.objective || 'Research Entry'}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">({formatDate(log.date)})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={log.completionStatus === 'Completed' ? 'success' : log.completionStatus === 'Blocked' ? 'warning' : 'info'}>
                            {log.completionStatus}
                          </Badge>
                          <span className="text-xs font-bold text-emerald-600">{(mins / 60).toFixed(1)} hrs</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 font-medium leading-relaxed">{log.achievements || log.activities}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 5: LAB ASSAYS, STABILITY & QUALITY CONTROL ── */}
        {activeTab === 'lab' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 space-y-4">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
              <Beaker className="w-4 h-4 text-purple-500" />
              Connected Laboratory Assays, QC & Stability Logs ({labAssaysCount})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Experiments */}
              {personLabWork.experiments.map((e) => (
                <div key={e.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{e.name}</span>
                    <Badge variant={e.outcomeStatus === 'Passed' ? 'success' : 'info'}>{e.outcomeStatus || 'In Progress'}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">{e.productName || 'Lab Experiment'} · Type: {e.type}</p>
                  {e.hypothesis && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 italic">"{e.hypothesis}"</p>
                  )}
                </div>
              ))}

              {/* Lab Tests */}
              {personLabWork.labTests.map((l) => (
                <div key={l.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{l.name}</span>
                    <Badge variant={l.outcomeStatus === 'Passed' ? 'success' : l.outcomeStatus === 'Failed' ? 'error' : 'info'}>
                      {l.outcomeStatus || 'Passed'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">{l.productName || 'CIPAC Quality Assay'}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{(l as any).notes || l.hypothesis || 'Standard QA analytical testing.'}</p>
                </div>
              ))}

              {/* Stability Logs */}
              {personLabWork.stabilityLogs.map((s) => (
                <div key={s.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">Stability: {s.productName} (Batch #{s.batchNo})</span>
                    <Badge variant={s.status === 'completed' ? 'success' : 'info'}>{s.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>Temp: {s.chamberTemp || '40°C'}</span>
                    <span>pH: {s.pH || 6.5}</span>
                    <span>Retention: {s.activeRetention || 98}%</span>
                  </div>
                </div>
              ))}

              {labAssaysCount === 0 && (
                <div className="col-span-2 text-center py-8 text-xs text-gray-400">
                  No linked laboratory experiments recorded for this scientist yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 6: WEEKLY MIS & MANAGEMENT DECISIONS ── */}
        {activeTab === 'mis' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-500" />
                  Weekly MIS Submissions & Management Decisions ({personMISReports.length})
                </h3>
                <p className="text-[11px] text-gray-400">Formal scientific reports submitted to executive leadership</p>
              </div>
            </div>

            {personMISReports.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <FileText className="w-12 h-12 text-gray-300 mx-auto" />
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">No MIS Reports Filed</h4>
                <p className="text-xs text-gray-500">Weekly MIS summaries prepared by this scientist will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {personMISReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-4"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                          Week {report.weekNumber} Report
                        </span>
                        <span className="text-xs text-gray-400 ml-2">Period: {report.reportingPeriodStart} to {report.reportingPeriodEnd}</span>
                      </div>
                      <Badge variant={report.status === 'Approved' ? 'success' : report.status === 'Reviewed' ? 'info' : 'warning'}>
                        {report.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">1. What Did We Learn?</span>
                        <p className="text-xs text-gray-800 dark:text-gray-200">{report.whatDidWeLearn}</p>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">2. What Does Data Mean?</span>
                        <p className="text-xs text-gray-800 dark:text-gray-200">{report.whatDoesDataMeanScientifically}</p>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">3. What Decision Follows?</span>
                        <p className="text-xs text-gray-800 dark:text-gray-200">{report.whatDecisionFollows}</p>
                      </div>
                    </div>

                    {/* Decisions Required */}
                    {report.decisionsRequiredFromManagement.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                        <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 block">
                          Decisions Required from Management ({report.decisionsRequiredFromManagement.length}):
                        </span>
                        {report.decisionsRequiredFromManagement.map((d) => (
                          <div key={d.id} className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{d.decisionRequired}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              d.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {d.status} ({d.urgency} Urgency)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 7: TIME & MOTION TRACKING ── */}
        {activeTab === 'time' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  Time & Motion Work Distribution ({timeBreakdown.totalHours} Hours Total)
                </h3>
                <p className="text-[11px] text-gray-400">Activity breakdown based on verified research logs</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {timeBreakdown.categories.map((c) => (
                <div key={c.name} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{c.name}</span>
                    <span className="text-xs font-black text-gray-900 dark:text-white">{c.hours}h</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${c.percent}%`, backgroundColor: c.color }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <span>{c.percent}% allocation</span>
                    <span>{c.count} sessions</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Time entries list */}
            <div className="space-y-2">
              <span className="text-xs font-black uppercase text-gray-700 dark:text-gray-300 tracking-wider block">
                Detailed Logged Work Sessions
              </span>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {personLogs.slice(0, 15).map((log) => {
                  const mins = calculateLogMinutes(log) || log.timeSpentMinutes || 0;
                  return (
                    <div key={log.id} className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-gray-800 dark:text-gray-200 block">{log.activities || log.objective}</span>
                        <span className="text-[10px] text-gray-400">{log.date} · {log.completionStatus}</span>
                      </div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs flex-shrink-0">
                        {(mins / 60).toFixed(1)} hrs
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 8: PROJECTS & TASKS ── */}
        {activeTab === 'projects' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 space-y-6">
            {/* Synced Projects */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-500" />
                Led / Assigned Projects ({personProjects.length})
              </h3>
              {personProjects.length === 0 ? (
                <p className="text-xs text-gray-400">No synced projects currently assigned to this scientist.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {personProjects.map((p) => (
                    <div key={p.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{p.name}</span>
                        <Badge variant="info">{p.status || 'Active'}</Badge>
                      </div>
                      <p className="text-xs text-gray-500">{p.description || `Project code: ${p.code || p.id}`}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Global Tasks */}
            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-500" />
                Assigned Tasks & Action Items ({personTasks.length})
              </h3>
              {personTasks.length === 0 ? (
                <p className="text-xs text-gray-400">No pending tasks currently assigned to this scientist.</p>
              ) : (
                <div className="space-y-2">
                  {personTasks.map((t) => (
                    <div key={t.id} className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleTaskStatus(t.id)}
                          className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer ${
                            t.status === 'Completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300'
                          }`}
                        >
                          {t.status === 'Completed' && <CheckCircle className="w-3 h-3" />}
                        </button>
                        <span className={`font-semibold ${t.status === 'Completed' ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                          {t.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">{t.priority} Priority</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 9: MILESTONE TIMELINE ── */}
        {activeTab === 'timeline' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 space-y-6">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
              <ActivityIcon className="w-4 h-4 text-emerald-500" />
              Chronological Research & Field Activity Timeline ({scientistTimelineEvents.length} Events)
            </h3>

            {scientistTimelineEvents.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">No activity events recorded.</div>
            ) : (
              <div className="relative border-l-2 border-gray-100 dark:border-gray-800 pl-6 ml-3 space-y-6">
                {scientistTimelineEvents.map((ev, index) => (
                  <div key={`${ev.type}-${index}`} className="relative">
                    <div className="absolute -left-[35px] top-0 w-6 h-6 rounded-full border-4 border-white dark:border-gray-900 bg-emerald-500 flex items-center justify-center shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                    <div className="space-y-1 bg-gray-50 dark:bg-gray-800/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-black text-gray-900 dark:text-white">{ev.title}</span>
                        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-100/50 dark:border-emerald-800/30">
                          {formatDate(ev.date)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">{ev.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
