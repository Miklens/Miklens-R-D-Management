import React, { useMemo, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, FlaskConical, Beaker, BarChart3, Shield, Leaf, Bug, Sprout,
  CheckCircle2, Clock, AlertTriangle, ChevronDown, ChevronUp,
  Search, X, Eye, Star, Target, Activity, GitBranch,
  MapPin, Calendar, User, ArrowRight, Maximize2,
  Minimize2, Filter, Zap, Package, ClipboardList, ShieldCheck,
  ThumbsUp, ThumbsDown, ExternalLink, TestTube, CheckSquare, FolderGit2,
  Layers, ArrowUpRight, Award, AlertCircle, Sparkles
} from 'lucide-react';
import { useUsers } from '../hooks/useUsers';
import { useDailyLogs } from '../hooks/useDailyLogs';
import { useExperiments } from '../contexts/ExperimentContext';
import { useTasks } from '../contexts/TaskContext';
import { getSyncedTrials, getSyncedProjects, formatCleanScientistName } from '../services/trialManagerSync';
import { getTotalTokensSaved } from '../services/geminiEngine';
import { getEffectiveAvatar } from '../utils/avatarHelper';
import { calculateLogMinutes, calculateTotalHours } from '../utils/timeTracking';
import {
  loadScientificFormulations,
  loadScientificEvaluations,
  loadMISReports,
  saveMISReports,
  loadStabilityLogs,
} from '../services/experimentStore';
import {
  matchesScientist,
  getScientistTrials,
  getScientistLabWork,
  getScientistFormulations,
  getScientistMISReports,
  getScientistProjects,
  getScientistTasks,
} from '../utils/scientistMatcher';
import {
  analyzeScientistBottlenecks,
  analyzeScientistInnovations,
} from '../services/executiveAnalytics';
import type { ExternalFieldTrial, TrialCategory, ExternalProject } from '../types/trialIntegrationTypes';
import type { AppUser, DailyLog, Task } from '../types';
import type {
  ScientificFormulation,
  WeeklyMISReport,
  ExperimentItem,
  LabTestItem,
  StabilityLogItem
} from '../types/experimentTypes';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, subDays, isToday, parseISO } from 'date-fns';

// ── Category config ─────────────────────────────────────────────────────────────
type CatConfig = { label: string; icon: React.ElementType; color: string; bg: string; text: string };
const CAT_CONFIG: Record<TrialCategory, CatConfig> = {
  herbicide:    { label: 'Herbicide',    icon: Leaf,   color: '#059669', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
  fungicide:    { label: 'Fungicide',    icon: Shield, color: '#4f46e5', bg: 'bg-indigo-100 dark:bg-indigo-900/30',   text: 'text-indigo-700 dark:text-indigo-400'   },
  pesticide:    { label: 'Pesticide',    icon: Bug,    color: '#dc2626', bg: 'bg-red-100 dark:bg-red-900/30',         text: 'text-red-700 dark:text-red-400'         },
  nutrition:    { label: 'Nutrition',    icon: Beaker, color: '#d97706', bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-700 dark:text-amber-400'     },
  biostimulant: { label: 'Biostimulant', icon: Sprout, color: '#0d9488', bg: 'bg-teal-100 dark:bg-teal-900/30',      text: 'text-teal-700 dark:text-teal-400'       },
};
const ALL_CATS: TrialCategory[] = ['herbicide', 'fungicide', 'pesticide', 'nutrition', 'biostimulant'];

const DECISION_COLORS: Record<string, string> = {
  'Continue':                'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  'Modify':                  'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  'Stop':                    'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  'Under Review':            'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'Advance to Field Trial':  'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  'Advance to Registration': 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
};

const getEff = (pct: number) => {
  if (pct >= 85) return { text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', bar: '#059669' };
  if (pct >= 70) return { text: 'text-blue-700 dark:text-blue-400',       bg: 'bg-blue-100 dark:bg-blue-900/30',       bar: '#3b82f6' };
  if (pct >= 50) return { text: 'text-amber-700 dark:text-amber-400',     bg: 'bg-amber-100 dark:bg-amber-900/30',     bar: '#f59e0b' };
  return             { text: 'text-red-700 dark:text-red-400',            bg: 'bg-red-100 dark:bg-red-900/30',         bar: '#ef4444' };
};

const fmtDate = (d?: string) => {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
};

const initials = (name: string) =>
  name.split(' ').map((p: string) => p[0] || '').join('').toUpperCase().slice(0, 2) || 'S';

// ── Complete Scientist Card Builder with Universal Cross-App Matching ─────────────
function buildCard(
  u: AppUser,
  trials: ExternalFieldTrial[],
  logs: DailyLog[],
  fmls: ScientificFormulation[],
  exps: ExperimentItem[],
  labs: LabTestItem[],
  stabs: StabilityLogItem[],
  misReports: WeeklyMISReport[],
  projects: ExternalProject[],
  tasks: Task[],
) {
  const em = (u.email || '').toLowerCase();
  const nm = u.name || em.split('@')[0] || 'Scientist';

  // 1. Universal Cross-App Matching
  const myTrials = getScientistTrials(u, trials);
  const myWork = getScientistLabWork(u, exps, labs, stabs);
  const myFmls = getScientistFormulations(u, fmls, myTrials);
  const myMIS = getScientistMISReports(u, misReports);
  const myProjects = getScientistProjects(u, projects, myTrials);
  const myTasks = getScientistTasks(u, tasks);

  const myLogs = logs.filter(l => {
    return matchesScientist(u, {
      userId: l.userId,
      email: l.userEmail,
      name: l.userName || l.userEmail,
    });
  });

  // 2. Time Motion
  const todayLogs = myLogs.filter(l => { try { return isToday(parseISO(l.date)); } catch { return false; } });
  const weekLogs  = myLogs.filter(l => { try { return parseISO(l.date) >= subDays(new Date(), 7); } catch { return false; } });
  const monthLogs = myLogs.filter(l => { try { return parseISO(l.date) >= subDays(new Date(), 30); } catch { return false; } });
  
  const weekHrs  = calculateTotalHours(weekLogs);
  const monthHrs = calculateTotalHours(monthLogs);
  const totalHrs = calculateTotalHours(myLogs);

  // 3. Field Trials
  const active    = myTrials.filter(t => !t.isCompleted);
  const completed = myTrials.filter(t => t.isCompleted);
  const withEvals = myTrials.filter(t => t.evaluations?.length > 0);
  const avgEff    = withEvals.length > 0
    ? Math.round(withEvals.reduce((s, t) => s + (t.evaluations[t.evaluations.length - 1]?.efficacyPercent || 0), 0) / withEvals.length)
    : null;

  const latestLog   = myLogs.length > 0 ? [...myLogs].sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0] : null;
  const loggedToday = todayLogs.length > 0;

  // 4. Formulations
  const advancingFmls = myFmls.filter(f => ['Advance to Field Trial', 'Advance to Registration'].includes(f.finalDecision));

  // 5. Lab Tests & Experiments
  const labTestsCount    = myWork.labTests.length;
  const failedLabs       = myWork.labTests.filter(t => t.result?.toLowerCase().includes('fail') || t.status === 'Failed');
  const experimentsCount = myWork.experiments.length;
  const stabilityCount   = myWork.stabilityLogs.length;

  // 6. Multi-Horizon Bottlenecks & Innovations
  const bottlenecks = analyzeScientistBottlenecks(u, myTrials, myLogs, myFmls, myMIS, myWork.labTests);
  const innovations = analyzeScientistInnovations(u, myTrials, myFmls, myWork.labTests, myWork.experiments);

  return {
    user: u,
    nm,
    em,
    loggedToday,
    weekHrs,
    monthHrs,
    totalHrs,
    myTrials,
    active,
    completed,
    myFmls,
    advancingFmls: advancingFmls.length,
    myExps: myWork.experiments,
    myLabs: myWork.labTests,
    myStability: myWork.stabilityLogs,
    myMIS,
    myProjects,
    myTasks,
    myLogs,
    todayLogs,
    avgEff,
    latestLog,
    bottlenecks,
    innovations,
    labTestsCount,
    failedLabsCount: failedLabs.length,
    experimentsCount,
    stabilityCount,
    projectsCount: myProjects.length,
    tasksCount: myTasks.length,
    byCat: ALL_CATS.reduce((acc, c) => {
      acc[c] = myTrials.filter(t => t.category === c).length;
      return acc;
    }, {} as Record<TrialCategory, number>),
  };
}

// ── Main Component ─────────────────────────────────────────────────────────────
export const ManagementCockpit: React.FC = () => {
  const navigate = useNavigate();
  const { data: users }           = useUsers();
  const { data: logs }            = useDailyLogs();
  const { experiments, labTests } = useExperiments();
  const { tasks }                 = useTasks();

  const syncedTrials    = useMemo(() => getSyncedTrials(), []);
  const syncedProjects  = useMemo(() => getSyncedProjects(), []);
  const formulations    = useMemo(() => loadScientificFormulations(), []);
  const evaluations     = useMemo(() => loadScientificEvaluations(), []);
  const stabilityLogs   = useMemo(() => loadStabilityLogs(), []);
  const [misReports, setMisReports] = useState<WeeklyMISReport[]>(() => loadMISReports());

  const [activeTab, setActiveTab]         = useState<'scientists' | 'trials' | 'formulations' | 'decisions'>('scientists');
  const [drawerTab, setDrawerTab]         = useState<'overview' | 'trials' | 'formulations' | 'labs' | 'logs' | 'decisions' | 'tasks'>('overview');
  const [presentMode, setPresentMode]     = useState(false);
  const [query, setQuery]                 = useState('');
  const [selSci, setSelSci]               = useState('all');
  const [selCat, setSelCat]               = useState<TrialCategory | 'all'>('all');
  const [horizon, setHorizon]             = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [drawerSci, setDrawerSci]         = useState<string | null>(null);
  const [expTrial, setExpTrial]           = useState<string | null>(null);
  const [expFml, setExpFml]               = useState<string | null>(null);
  const [expMIS, setExpMIS]               = useState<string | null>(null);

  // Complete cards for all active scientists
  const cards = useMemo(() =>
    (users || []).filter(u => u.isActive !== false)
      .map(u => buildCard(
        u,
        syncedTrials,
        logs || [],
        formulations,
        experiments,
        labTests,
        stabilityLogs,
        misReports,
        syncedProjects,
        tasks
      )),
    [users, syncedTrials, logs, formulations, experiments, labTests, stabilityLogs, misReports, syncedProjects, tasks]
  );

  const filteredTrials = useMemo(() => {
    let t = [...syncedTrials];
    if (selCat !== 'all') t = t.filter(x => x.category === selCat);
    if (selSci !== 'all') {
      const sh = selSci.toLowerCase();
      t = t.filter(x => (x.scientistName || '').toLowerCase().includes(sh) || (x.creatorEmail || '').toLowerCase().includes(sh));
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      t = t.filter(x => [x.trialCode, x.title, x.productName, x.cropName, x.scientistName].some(s => (s || '').toLowerCase().includes(q)));
    }
    return t;
  }, [syncedTrials, selCat, selSci, query]);

  const filteredFmls = useMemo(() => {
    let f = [...formulations];
    if (selCat !== 'all') f = f.filter(x => x.category === selCat);
    if (query.trim()) {
      const q = query.toLowerCase();
      f = f.filter(x => [x.name, x.formulationId, x.keyActivesComposition].some(s => (s || '').toLowerCase().includes(q)));
    }
    return f;
  }, [formulations, selCat, query]);

  const kpis = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const totalAdvancing = formulations.filter(f => ['Advance to Field Trial', 'Advance to Registration'].includes(f.finalDecision)).length;
    return {
      loggedToday:      (logs || []).filter(l => (l.date || '').startsWith(todayStr)).length,
      activeTrials:     syncedTrials.filter(t => !t.isCompleted).length,
      completedTrials:  syncedTrials.filter(t => t.isCompleted).length,
      formulationsCount: formulations.length,
      advancingFmls:    totalAdvancing,
      labTestsCount:    labTests.length,
      experimentsCount: experiments.length,
      avgEff:           evaluations.length > 0 ? Math.round(evaluations.reduce((s, e) => s + e.measurement.deltaControlPct, 0) / evaluations.length) : 84,
      openProblems:     formulations.filter(f => f.problemIdentified && f.finalDecision !== 'Stop').length +
                        misReports.reduce((s, r) => s + r.problemsRisks.filter(p => p.status === 'Open').length, 0),
      pendingDecisions: misReports.reduce((s, r) => s + r.decisionsRequiredFromManagement.filter(d => d.status === 'Pending Approval').length, 0),
    };
  }, [syncedTrials, formulations, evaluations, misReports, logs, labTests, experiments]);

  const brief = useMemo(() => {
    const top = cards.length > 0 ? cards.reduce((a, b) => b.myTrials.length > a.myTrials.length ? b : a) : null;
    const topFml = formulations.filter(f => typeof f.trialResultEfficacy === 'number' && (f.trialResultEfficacy as number) >= 80);
    const latMIS = [...misReports].sort((a, b) => b.weekNumber - a.weekNumber)[0];
    return [
      `Top Field Leader: ${top ? top.nm : 'No scientists yet'} — ${top ? top.myTrials.length : 0} field trial(s), ${top ? top.myFmls.length : 0} formulation(s)`,
      `Leading Product: ${topFml[0] ? `${topFml[0].name} ${topFml[0].version} (${topFml[0].trialResultEfficacy}% WCE)` : 'Top pipeline products in field testing'}`,
      `Open Risks & Bottlenecks: ${kpis.openProblems} issue(s) actively flagged for immediate corrective action`,
      latMIS ? `Latest MIS Week ${latMIS.weekNumber}: ${(latMIS.whatDecisionFollows || '').slice(0, 85)}${(latMIS.whatDecisionFollows || '').length > 85 ? '…' : ''}` : 'Weekly R&D MIS active and synchronized',
    ];
  }, [cards, formulations, misReports, kpis]);

  const handleDecision = useCallback((rId: string, dId: string, action: 'Approved' | 'Rejected') => {
    setMisReports(prev => {
      const updated = prev.map(r => r.id !== rId ? r : {
        ...r,
        decisionsRequiredFromManagement: r.decisionsRequiredFromManagement.map(d =>
          d.id === dId ? { ...d, status: action } : d
        ),
      });
      saveMISReports(updated);
      return updated;
    });
  }, []);

  const drawerCard = drawerSci ? cards.find(c => c.user.id === drawerSci || c.em === drawerSci) : null;

  const kpiDefs = [
    { label: 'Scientists',        value: cards.length,            sub: `${cards.filter(c => c.loggedToday).length} logged today`, icon: Users,        grad: 'from-emerald-500 to-teal-600'   },
    { label: 'Active Trials',     value: kpis.activeTrials,       sub: `${kpis.completedTrials} completed`,                       icon: MapPin,        grad: 'from-blue-500 to-indigo-600'    },
    { label: 'Formulations',      value: formulations.length,     sub: `${kpis.advancingFmls} advancing`,                         icon: GitBranch,     grad: 'from-violet-500 to-purple-600'  },
    { label: 'Lab Tests & Exps',  value: kpis.labTestsCount + kpis.experimentsCount, sub: `${kpis.labTestsCount} assays · ${kpis.experimentsCount} exps`, icon: TestTube,      grad: 'from-amber-500 to-orange-600'   },
    { label: 'Open Risks',        value: kpis.openProblems,       sub: 'need corrective action',                                  icon: AlertTriangle, grad: 'from-red-500 to-rose-600'       },
    { label: 'Pending Decisions', value: kpis.pendingDecisions,   sub: 'awaiting approval',                                       icon: ClipboardList, grad: 'from-teal-500 to-emerald-600'   },
  ];

  const EMOJIS = ['🔬', '🌿', '⚠️', '📋'];

  return (
    <div className={`space-y-6 ${presentMode ? 'fixed inset-0 z-50 bg-gray-950 overflow-y-auto p-8' : ''}`}>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-emerald-600 to-indigo-600 dark:from-emerald-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Executive Management Cockpit
            </span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Live 360° visibility across scientists, trials, formulations, lab assays, and decisions. Complete R&D operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/profile"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow transition-all active:scale-95"
          >
            <User className="w-4 h-4" />
            <span>My Scientist Profile</span>
          </Link>
          <button
            id="btn-boardroom"
            onClick={() => setPresentMode(p => !p)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-105"
          >
            {presentMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            {presentMode ? 'Exit Boardroom' : '📺 Boardroom Mode'}
          </button>
        </div>
      </div>

      {/* Zero-Token AI & Automation Command Bar */}
      <div className="rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-blue-500/10 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Zero-Token Local Intelligence Engine
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                100% Free of Cost
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              Over {getTotalTokensSaved().toLocaleString()} API tokens saved today across automated trial evaluations, task dispatches, and MIS drafting.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/tasks"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold hover:bg-gray-50 transition-all shadow-sm"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
            Auto-Task Dispatch
          </Link>
          <Link
            to="/weekly-mis"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            1-Click Automated MIS
          </Link>
          <Link
            to="/approvals"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Governance & Stage-Gates
          </Link>
        </div>
      </div>

      {/* Executive Brief */}
      <div className="rounded-2xl border border-indigo-200/50 dark:border-indigo-800/30 bg-gradient-to-r from-indigo-50/80 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/20 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Executive Brief — 30-Second Summary</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {brief.map((b, i) => (
            <div key={i} className="text-xs text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-900/40 rounded-xl px-4 py-2.5 border border-indigo-100 dark:border-indigo-900/30 flex items-start gap-2">
              <span className="flex-shrink-0">{EMOJIS[i]}</span>
              <span className="leading-relaxed">{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpiDefs.map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-sm overflow-hidden">
              <div className={`h-1 w-full bg-gradient-to-r ${k.grad}`} />
              <div className="p-4">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${k.grad} flex items-center justify-center shadow mb-2`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{k.value}</div>
                <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{k.label}</div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{k.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/50 dark:border-gray-800/50 p-4 shadow-sm">
        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            id="cockpit-search"
            type="text"
            placeholder="Search scientists, trials, formulations, lab assays…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
        <select
          id="cockpit-cat"
          value={selCat}
          onChange={e => setSelCat(e.target.value as any)}
          className="px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          <option value="all">All Categories</option>
          {ALL_CATS.map(c => <option key={c} value={c}>{CAT_CONFIG[c].label}</option>)}
        </select>
        <select
          id="cockpit-sci"
          value={selSci}
          onChange={e => setSelSci(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          <option value="all">All Scientists</option>
          {cards.map(c => <option key={c.user.id} value={c.em}>{c.nm}</option>)}
        </select>
        {(['today', 'week', 'month', 'all'] as const).map(h => (
          <button
            key={h}
            onClick={() => setHorizon(h)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${horizon === h ? 'bg-emerald-500 text-white shadow' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            {h === 'today' ? 'Today' : h === 'week' ? 'This Week' : h === 'month' ? 'Month' : 'All Time'}
          </button>
        ))}
        {(query || selSci !== 'all' || selCat !== 'all') && (
          <button
            onClick={() => { setQuery(''); setSelSci('all'); setSelCat('all'); }}
            className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:scale-110 transition-transform"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
        {[
          { id: 'scientists',   label: 'All Scientists',          emoji: '👥', count: cards.length           },
          { id: 'trials',       label: 'Field Trials',            emoji: '🌱', count: filteredTrials.length   },
          { id: 'formulations', label: 'Products & Formulations', emoji: '⚗️', count: filteredFmls.length     },
          { id: 'decisions',    label: 'Works & Decisions',       emoji: '📋', count: misReports.length       },
        ].map(tab => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === tab.id ? 'bg-emerald-500 text-white shadow' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            {tab.emoji} {tab.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>


      {/* ── PILLAR 1: SCIENTISTS ── */}
      {activeTab === 'scientists' && (
        <div className="space-y-4">
          {cards.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-semibold">No scientists found</p>
              <p className="text-sm mt-1">Connect Firebase or add team members in the Employees section</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {cards.map(card => {
              const av = getEffectiveAvatar(card.user.id, card.em, card.user.avatar || undefined);
              const ec = card.avgEff !== null ? getEff(card.avgEff) : null;
              return (
                <div
                  key={card.user.id}
                  id={`sci-card-${card.user.id}`}
                  className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/70 dark:border-gray-800/70 shadow-sm hover:shadow-xl hover:border-emerald-300 dark:hover:border-emerald-800/60 transition-all duration-300 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Avatar, Name, Role, Drawer Button */}
                    <div className="flex items-start gap-4 p-5 pb-3">
                      <div className="relative flex-shrink-0">
                        {av ? (
                          <img src={av} alt={card.nm} className="w-13 h-13 rounded-2xl object-cover border-2 border-emerald-100 dark:border-emerald-900 shadow-md" />
                        ) : (
                          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-black text-base shadow-md">
                            {initials(card.nm)}
                          </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${card.loggedToday ? 'bg-emerald-500 ring-2 ring-emerald-300' : 'bg-gray-300 dark:bg-gray-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-black text-gray-900 dark:text-white truncate">{formatCleanScientistName(card.nm)}</h3>
                          {card.loggedToday && (
                            <span className="flex-shrink-0 text-[9px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full px-2 py-0.5 font-black uppercase tracking-wider">
                              Live Today
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate">{card.user.designation || 'Research Scientist'}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{card.em}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          id={`btn-drawer-${card.user.id}`}
                          onClick={() => { setDrawerSci(card.user.id); setDrawerTab('overview'); }}
                          className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:scale-110 transition-transform"
                          title="Quick Inspect Drawer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/profile/${card.user.id}`}
                          className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Full 360° Profile"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>

                    {/* Multi-App Performance Metric Grid */}
                    <div className="grid grid-cols-3 gap-2 px-5 py-2">
                      <div className="p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/50 text-center">
                        <span className="text-[9px] font-bold text-gray-400 uppercase block">Trials</span>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <span className="text-sm font-black text-gray-900 dark:text-white">{card.myTrials.length}</span>
                          <span className="text-[10px] text-emerald-600 font-bold">({card.active.length} act)</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/50 text-center">
                        <span className="text-[9px] font-bold text-gray-400 uppercase block">Products</span>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{card.myFmls.length}</span>
                          {card.advancingFmls > 0 && (
                            <span className="text-[10px] text-purple-600 font-bold">({card.advancingFmls} adv)</span>
                          )}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/50 text-center">
                        <span className="text-[9px] font-bold text-gray-400 uppercase block">Lab Assays</span>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <span className="text-sm font-black text-teal-600 dark:text-teal-400">{card.labTestsCount}</span>
                          <span className="text-[10px] text-gray-400">({card.experimentsCount} exp)</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/50 text-center">
                        <span className="text-[9px] font-bold text-gray-400 uppercase block">Logged Hours</span>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <span className="text-sm font-black text-gray-900 dark:text-white">{card.weekHrs}h</span>
                          <span className="text-[10px] text-gray-400">wk</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/50 text-center">
                        <span className="text-[9px] font-bold text-gray-400 uppercase block">Avg WCE</span>
                        <span className={`text-sm font-black block mt-0.5 ${card.avgEff !== null ? getEff(card.avgEff).text : 'text-gray-400'}`}>
                          {card.avgEff !== null ? `${card.avgEff}%` : 'N/A'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/50 text-center">
                        <span className="text-[9px] font-bold text-gray-400 uppercase block">Tasks</span>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <span className="text-sm font-black text-gray-900 dark:text-white">{card.tasksCount}</span>
                          <span className="text-[10px] text-gray-400">({card.projectsCount} proj)</span>
                        </div>
                      </div>
                    </div>

                    {/* Category Distribution Tags */}
                    <div className="px-5 py-2 flex flex-wrap gap-1">
                      {ALL_CATS.filter(c => card.byCat[c] > 0).map(c => {
                        const cc = CAT_CONFIG[c]; const CI = cc.icon;
                        return (
                          <span key={c} className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cc.bg} ${cc.text}`}>
                            <CI className="w-2.5 h-2.5" />{cc.label}: {card.byCat[c]}
                          </span>
                        );
                      })}
                    </div>

                    {/* Bottleneck Alerts */}
                    {card.bottlenecks.length > 0 && (
                      <div className="mx-5 mb-2 space-y-1">
                        {card.bottlenecks.slice(0, 2).map((b, bi) => (
                          <div key={bi} className="flex items-start gap-2 text-[10px] font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 rounded-xl px-3 py-1.5 border border-amber-200/50 dark:border-amber-800/30">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5 text-amber-500" />
                            <span className="line-clamp-1">{b}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Latest Daily Activity Snapshot */}
                    {card.latestLog && (
                      <div className="bg-gray-50/80 dark:bg-gray-800/50 px-5 py-2.5 border-t border-gray-100 dark:border-gray-800/60 mt-2">
                        <div className="flex items-center justify-between mb-1 text-[10px] text-gray-400 font-semibold uppercase">
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <Activity className="w-3 h-3" />
                            Activity Log · {fmtDate(card.latestLog.date)}
                          </span>
                          <span>{(calculateLogMinutes(card.latestLog) / 60).toFixed(1)}h</span>
                        </div>
                        <p className="text-[11px] text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                          {card.latestLog.activities || card.latestLog.objective || 'Trial inspection & lab assay execution'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Action Footer */}
                  <div className="px-5 py-3 bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <button
                      onClick={() => { setDrawerSci(card.user.id); setDrawerTab('overview'); }}
                      className="text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-emerald-600 flex items-center gap-1"
                    >
                      <span>Quick View</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <Link
                      to={`/profile/${card.user.id}`}
                      className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                    >
                      <span>Full 360° Profile</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PILLAR 2: FIELD TRIALS ── */}
      {activeTab === 'trials' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelCat('all')}
              id="trial-cat-all"
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selCat === 'all' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
            >
              All ({syncedTrials.length})
            </button>
            {ALL_CATS.map(c => {
              const cc = CAT_CONFIG[c]; const CI = cc.icon;
              return (
                <button
                  key={c}
                  id={`trial-cat-${c}`}
                  onClick={() => setSelCat(selCat === c ? 'all' : c)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selCat === c ? `${cc.bg} ${cc.text} shadow` : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                >
                  <CI className="w-3 h-3" />{cc.label} ({syncedTrials.filter(t => t.category === c).length})
                </button>
              );
            })}
          </div>
          {filteredTrials.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-semibold">No field trials found</p>
              <p className="text-sm mt-1">Sync trials from the Trial Manager Sync page</p>
            </div>
          )}
          <div className="space-y-3">
            {filteredTrials.map(trial => {
              const cc = CAT_CONFIG[trial.category] || CAT_CONFIG.herbicide;
              const CI = cc.icon;
              const latEval = trial.evaluations?.length > 0 ? [...trial.evaluations].sort((a, b) => (b.daysAfterTreatment || 0) - (a.daysAfterTreatment || 0))[0] : null;
              const latEff  = latEval?.efficacyPercent ?? 0;
              const ec      = getEff(latEff);
              const isExp   = expTrial === trial.id;
              return (
                <div
                  key={trial.id}
                  id={`trial-${trial.id}`}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpTrial(isExp ? null : trial.id)}>
                    <div className={`w-10 h-10 rounded-xl ${cc.bg} flex items-center justify-center flex-shrink-0`}>
                      <CI className={`w-5 h-5 ${cc.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{trial.trialCode}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cc.bg} ${cc.text}`}>{cc.label}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${trial.isCompleted ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                          {trial.isCompleted ? 'Completed' : trial.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 truncate">{trial.title || trial.productName}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {latEval && (
                        <div className="text-center hidden sm:block">
                          <div className={`text-lg font-bold ${ec.text}`}>{Math.round(latEff)}%</div>
                          <div className="text-[9px] text-gray-400 uppercase">WCE@{latEval.daysAfterTreatment}D</div>
                        </div>
                      )}
                      {isExp ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 px-4 pb-3 text-[11px] text-gray-500 dark:text-gray-400 border-t border-gray-50 dark:border-gray-800 pt-2">
                    <span><MapPin className="inline w-3 h-3 mr-1" />{trial.location}, {trial.state}</span>
                    <span><Leaf className="inline w-3 h-3 mr-1" />{trial.cropName}</span>
                    <span><Target className="inline w-3 h-3 mr-1" />{trial.targetWeedOrPathogen}</span>
                    <span><Calendar className="inline w-3 h-3 mr-1" />{fmtDate(trial.startDate)}</span>
                    <span><User className="inline w-3 h-3 mr-1" />{formatCleanScientistName(trial.scientistName)}</span>
                    <span><Eye className="inline w-3 h-3 mr-1" />{trial.evaluations.length} evals</span>
                    <span><FlaskConical className="inline w-3 h-3 mr-1" />{trial.treatments.length} arms</span>
                  </div>
                  {isExp && (
                    <div className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                      {trial.evaluations.length > 0 && (
                        <div>
                          <h4 className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">DAA Efficacy Progression</h4>
                          <ResponsiveContainer width="100%" height={100}>
                            <BarChart data={[...trial.evaluations].sort((a, b) => a.daysAfterTreatment - b.daysAfterTreatment)}>
                              <XAxis dataKey="daysAfterTreatment" tick={{ fontSize: 10 }} tickFormatter={v => `${v}D`} />
                              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} width={28} tickFormatter={v => `${v}%`} />
                              <Tooltip formatter={(v: any) => [`${v}%`, 'WCE']} labelFormatter={l => `${l} DAA`} />
                              <Bar dataKey="efficacyPercent" radius={[3, 3, 0, 0]}>
                                {trial.evaluations.map((ev, idx) => <Cell key={idx} fill={getEff(ev.efficacyPercent).bar} />)}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                      {trial.treatments.length > 0 && (
                        <div>
                          <h4 className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Treatment Arms</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {trial.treatments.map(arm => (
                              <div key={arm.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-[11px]">
                                <div className="font-semibold text-gray-800 dark:text-gray-200">{arm.name}</div>
                                <div className="text-gray-500 dark:text-gray-400">{arm.productName} · {arm.doseRate}</div>
                                {arm.replicationsCount && <div className="text-gray-400">{arm.replicationsCount} replications</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {trial.summaryConclusion && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200/50 dark:border-emerald-800/30">
                          <div className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 mb-1">Scientific Conclusion</div>
                          <p className="text-xs text-emerald-800 dark:text-emerald-300">{trial.summaryConclusion}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* ── PILLAR 3: FORMULATIONS ── */}
      {activeTab === 'formulations' && (
        <div className="space-y-4">
          {formulations.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {(['Continue', 'Modify', 'Stop', 'Under Review', 'Advance to Field Trial', 'Advance to Registration'] as const).map(d => (
                <div key={d} className={`rounded-xl p-3 ${DECISION_COLORS[d]}`}>
                  <div className="text-2xl font-bold">{formulations.filter(f => f.finalDecision === d).length}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide mt-0.5 leading-tight">{d}</div>
                </div>
              ))}
            </div>
          )}
          {filteredFmls.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-semibold">No formulations tracked yet</p>
              <p className="text-sm mt-1">Scientists add entries in the Formulation Tracker page</p>
            </div>
          )}
          <div className="space-y-3">
            {filteredFmls.map(fml => {
              const cc = CAT_CONFIG[fml.category as TrialCategory] || CAT_CONFIG.herbicide;
              const isExp = expFml === fml.id;
              return (
                <div
                  key={fml.id}
                  id={`fml-${fml.id}`}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpFml(isExp ? null : fml.id)}>
                    <div className={`w-10 h-10 rounded-xl ${cc.bg} flex items-center justify-center flex-shrink-0`}>
                      <FlaskConical className={`w-5 h-5 ${cc.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{fml.formulationId}</span>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{fml.name}</span>
                        <span className="text-[10px] text-gray-400">v{fml.version}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DECISION_COLORS[fml.finalDecision] || 'bg-gray-100 text-gray-700'}`}>
                          {fml.finalDecision}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{fml.keyActivesComposition}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {fml.trialResultEfficacy !== undefined && (
                        <div className="text-center hidden sm:block">
                          <div className={`text-lg font-bold ${getEff(Number(fml.trialResultEfficacy)).text}`}>{fml.trialResultEfficacy}%</div>
                          <div className="text-[9px] text-gray-400 uppercase">Field WCE</div>
                        </div>
                      )}
                      {isExp ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 px-4 pb-3 text-[11px] text-gray-500 dark:text-gray-400 border-t border-gray-50 dark:border-gray-800 pt-2">
                    <span><strong>Stage:</strong> {fml.stage}</span>
                    <span><strong>Form:</strong> {fml.physicalForm}</span>
                    <span><strong>Target:</strong> {fml.targetCrops.join(', ') || 'Multi-crop'}</span>
                    <span><strong>Author:</strong> {fml.createdBy || 'R&D Team'}</span>
                    <span><strong>Created:</strong> {fmtDate(fml.createdDate)}</span>
                  </div>

                  {isExp && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-4 text-xs">
                      {fml.reasonForDecision && (
                        <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-3 border border-indigo-100 dark:border-indigo-900/40">
                          <span className="font-bold text-indigo-700 dark:text-indigo-400 block mb-0.5">Scientific Rationale:</span>
                          <p className="text-indigo-900 dark:text-indigo-300">{fml.reasonForDecision}</p>
                        </div>
                      )}
                      {fml.problemIdentified && (
                        <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-3 border border-red-100 dark:border-red-900/40">
                          <span className="font-bold text-red-700 dark:text-red-400 block mb-0.5">Identified Problem / Challenge:</span>
                          <p className="text-red-900 dark:text-red-300">{fml.problemIdentified}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* ── PILLAR 4: WORKS & DECISIONS ── */}
      {activeTab === 'decisions' && (
        <div className="space-y-4">
          {misReports.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-semibold">No MIS Reports Filed</p>
              <p className="text-sm mt-1">Submit weekly reports in the Weekly MIS section</p>
            </div>
          )}
          <div className="space-y-4">
            {misReports.map(report => {
              const isExp = expMIS === report.id;
              const pendingCount = report.decisionsRequiredFromManagement.filter(d => d.status === 'Pending Approval').length;
              return (
                <div
                  key={report.id}
                  className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/60 dark:border-gray-800/60 shadow-sm overflow-hidden"
                >
                  <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setExpMIS(isExp ? null : report.id)}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-gray-900 dark:text-white">Week {report.weekNumber} ({report.year})</span>
                        <span className="text-xs text-gray-500">· {report.preparedBy}</span>
                        {pendingCount > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 rounded-full">
                            {pendingCount} Pending Approvals
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">{report.whatDecisionFollows}</p>
                    </div>
                    {isExp ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>

                  {isExp && (
                    <div className="px-5 pb-5 space-y-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                      {report.decisionsRequiredFromManagement.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-2">Management Decisions Required</h4>
                          <div className="space-y-2">
                            {report.decisionsRequiredFromManagement.map(d => (
                              <div key={d.id} className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between gap-3 text-xs">
                                <div>
                                  <span className="font-bold text-gray-900 dark:text-white block">{d.decisionRequired}</span>
                                  <span className="text-[10px] text-gray-500">Urgency: {d.urgency} · Deadline: {fmtDate(d.deadline)}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {d.status === 'Pending Approval' ? (
                                    <>
                                      <button
                                        onClick={() => handleDecision(report.id, d.id, 'Approved')}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-all"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => handleDecision(report.id, d.id, 'Rejected')}
                                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow transition-all"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  ) : (
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${d.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                      {d.status}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* ── COMPREHENSIVE SCIENTIST INSPECTION DRAWER ── */}
      {drawerCard && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs" onClick={() => setDrawerSci(null)}>
          <div
            className="w-full max-w-2xl bg-white dark:bg-gray-900 h-full overflow-y-auto shadow-2xl border-l border-gray-200 dark:border-gray-800 flex flex-col justify-between"
            onClick={e => e.stopPropagation()}
          >
            <div>
              {/* Drawer Header */}
              <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-6 py-5 z-10 flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg flex-shrink-0">
                    {initials(drawerCard.nm)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                      {formatCleanScientistName(drawerCard.nm)}
                      {drawerCard.loggedToday && (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Active today" />
                      )}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{drawerCard.user.designation || 'Research Scientist'} · {drawerCard.user.department || 'R&D Operations'}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">{drawerCard.em}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/profile/${drawerCard.user.id}`}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95"
                  >
                    <span>Full 360° Profile</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                  <button
                    id="btn-close-drawer"
                    onClick={() => setDrawerSci(null)}
                    className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:scale-105 transition-transform"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Tab Navigation */}
              <div className="flex items-center gap-1 px-6 pt-4 border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
                {[
                  { id: 'overview',     label: 'Overview',      icon: Layers },
                  { id: 'trials',       label: `Trials (${drawerCard.myTrials.length})`, icon: MapPin },
                  { id: 'formulations', label: `Products (${drawerCard.myFmls.length})`, icon: GitBranch },
                  { id: 'labs',         label: `Lab & Assays (${drawerCard.labTestsCount})`, icon: TestTube },
                  { id: 'logs',         label: `Work Logs (${drawerCard.myLogs.length})`, icon: Activity },
                  { id: 'decisions',    label: `Decisions (${drawerCard.myMIS.length})`, icon: ClipboardList },
                  { id: 'tasks',        label: `Tasks (${drawerCard.tasksCount})`, icon: CheckSquare },
                ].map(t => {
                  const TI = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setDrawerTab(t.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${drawerTab === t.id ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                      <TI className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Drawer Content */}
              <div className="p-6 space-y-6">

                {/* OVERVIEW TAB */}
                {drawerTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Key Metric Tiles */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {[
                        { label: 'Field Trials', value: drawerCard.myTrials.length, sub: `${drawerCard.active.length} active` },
                        { label: 'Formulations', value: drawerCard.myFmls.length, sub: `${drawerCard.advancingFmls} advancing` },
                        { label: 'Lab Tests', value: drawerCard.labTestsCount, sub: `${drawerCard.myExps.length} exps` },
                        { label: 'Hours (Wk)', value: `${drawerCard.weekHrs}h`, sub: `${drawerCard.monthHrs}h month` },
                        { label: 'Avg WCE', value: drawerCard.avgEff !== null ? `${drawerCard.avgEff}%` : 'N/A', sub: 'Efficacy' },
                        { label: 'Projects', value: drawerCard.projectsCount, sub: 'Synced' },
                        { label: 'Tasks', value: drawerCard.tasksCount, sub: 'Assigned' },
                        { label: 'MIS Reports', value: drawerCard.myMIS.length, sub: 'Filed' },
                      ].map((item, idx) => (
                        <div key={idx} className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-3 border border-gray-100 dark:border-gray-800/60 text-center">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">{item.label}</span>
                          <span className="text-base font-black text-gray-900 dark:text-white mt-0.5 block">{item.value}</span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">{item.sub}</span>
                        </div>
                      ))}
                    </div>

                    {/* Bottlenecks */}
                    {drawerCard.bottlenecks.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Active Operational Bottlenecks ({drawerCard.bottlenecks.length})</span>
                        </h4>
                        <div className="space-y-1.5">
                          {drawerCard.bottlenecks.map((b, bi) => (
                            <div key={bi} className="bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/30 rounded-xl px-3 py-2 text-xs flex items-start gap-2">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{b}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Innovations */}
                    {drawerCard.innovations.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5" />
                          <span>Scientific Innovations & Breakthroughs ({drawerCard.innovations.length})</span>
                        </h4>
                        <div className="space-y-1.5">
                          {drawerCard.innovations.map((inv, ii) => (
                            <div key={ii} className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/30 rounded-xl px-3 py-2 text-xs flex items-start gap-2">
                              <Star className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{inv}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TRIALS TAB */}
                {drawerTab === 'trials' && (
                  <div className="space-y-3">
                    {drawerCard.myTrials.length === 0 ? (
                      <p className="text-xs text-gray-400 py-6 text-center">No field trials linked to this scientist.</p>
                    ) : (
                      drawerCard.myTrials.map(t => {
                        const cc = CAT_CONFIG[t.category] || CAT_CONFIG.herbicide;
                        const latEv = t.evaluations?.length > 0 ? t.evaluations[t.evaluations.length - 1] : null;
                        return (
                          <div key={t.id} className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${cc.bg} ${cc.text}`}>{t.trialCode}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                                {t.isCompleted ? 'Completed' : t.status}
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-gray-900 dark:text-white">{t.title || t.productName}</h5>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">{t.cropName} · {t.location} · {fmtDate(t.startDate)}</p>
                            {latEv && (
                              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                Latest WCE: {Math.round(latEv.efficacyPercent)}% ({latEv.daysAfterTreatment} DAA)
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* FORMULATIONS TAB */}
                {drawerTab === 'formulations' && (
                  <div className="space-y-3">
                    {drawerCard.myFmls.length === 0 ? (
                      <p className="text-xs text-gray-400 py-6 text-center">No formulations linked to this scientist.</p>
                    ) : (
                      drawerCard.myFmls.map(f => (
                        <div key={f.id} className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">{f.formulationId} (v{f.version})</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DECISION_COLORS[f.finalDecision] || 'bg-gray-100 text-gray-700'}`}>
                              {f.finalDecision}
                            </span>
                          </div>
                          <h5 className="text-xs font-bold text-gray-900 dark:text-white">{f.name}</h5>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">{f.keyActivesComposition}</p>
                          <div className="text-[10px] text-gray-400">
                            Stage: {f.stage} · Physical Form: {f.physicalForm}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* LAB & ASSAYS TAB */}
                {drawerTab === 'labs' && (
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-gray-500 uppercase">Lab Tests ({drawerCard.labTestsCount})</h5>
                    {drawerCard.myLabs.length === 0 ? (
                      <p className="text-xs text-gray-400">No lab tests run by this scientist.</p>
                    ) : (
                      drawerCard.myLabs.map(lab => (
                        <div key={lab.id} className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900 dark:text-white">{lab.testType}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lab.result?.toLowerCase().includes('pass') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {lab.result || lab.status}
                            </span>
                          </div>
                          <p className="text-gray-500 text-[11px] mt-0.5">Sample: {lab.sampleName} · {fmtDate(lab.date)}</p>
                        </div>
                      ))
                    )}

                    <h5 className="text-xs font-bold text-gray-500 uppercase pt-3">Experiments ({drawerCard.experimentsCount})</h5>
                    {drawerCard.myExps.length === 0 ? (
                      <p className="text-xs text-gray-400">No laboratory experiments authored.</p>
                    ) : (
                      drawerCard.myExps.map(exp => (
                        <div key={exp.id} className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 text-xs">
                          <span className="font-bold text-gray-900 dark:text-white">{exp.name}</span>
                          <p className="text-gray-500 text-[11px] mt-0.5">{exp.objective}</p>
                          <span className="text-[10px] text-gray-400 mt-1 block">Status: {exp.status} · Protocol: {exp.protocol}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* LOGS TAB */}
                {drawerTab === 'logs' && (
                  <div className="space-y-3">
                    {drawerCard.myLogs.length === 0 ? (
                      <p className="text-xs text-gray-400 py-6 text-center">No daily logs found for this scientist.</p>
                    ) : (
                      [...drawerCard.myLogs].sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(l => (
                        <div key={l.id} className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-1 text-xs">
                          <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase">
                            <span>{fmtDate(l.date)}</span>
                            <span className="text-emerald-600 dark:text-emerald-400">{(calculateLogMinutes(l) / 60).toFixed(1)}h</span>
                          </div>
                          <p className="text-gray-800 dark:text-gray-200 font-medium">{l.activities || l.objective || 'Routine research activity'}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* DECISIONS TAB */}
                {drawerTab === 'decisions' && (
                  <div className="space-y-3">
                    {drawerCard.myMIS.length === 0 ? (
                      <p className="text-xs text-gray-400 py-6 text-center">No MIS reports associated with this scientist.</p>
                    ) : (
                      drawerCard.myMIS.map(r => (
                        <div key={r.id} className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 text-xs space-y-1">
                          <span className="font-bold text-gray-900 dark:text-white">Week {r.weekNumber} Report</span>
                          <p className="text-gray-600 dark:text-gray-300">{r.whatDecisionFollows}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TASKS TAB */}
                {drawerTab === 'tasks' && (
                  <div className="space-y-3">
                    {drawerCard.myTasks.length === 0 ? (
                      <p className="text-xs text-gray-400 py-6 text-center">No tasks assigned to this scientist.</p>
                    ) : (
                      drawerCard.myTasks.map(t => (
                        <div key={t.id} className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 text-xs flex items-center justify-between">
                          <div>
                            <span className="font-bold text-gray-900 dark:text-white block">{t.title}</span>
                            <span className="text-[10px] text-gray-500">Priority: {t.priority} · Status: {t.status}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {t.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
              <span className="text-xs text-gray-500">Full dossier inspection</span>
              <Link
                to={`/profile/${drawerCard.user.id}`}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow transition-all active:scale-95"
              >
                <span>Open Complete Scientist Profile</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
