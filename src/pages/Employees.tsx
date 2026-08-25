import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail, Download, FileSpreadsheet, Calendar, Search, Filter, X, Users,
  Clock, FileText, ChevronDown, Eye, AlertTriangle, CheckCircle2, Sparkles,
  Leaf, Shield, Bug, Beaker, Sprout, TrendingUp, AlertCircle, ArrowUpRight, Zap
} from 'lucide-react';
import { useUsers } from '../hooks/useUsers';
import { useDailyLogs } from '../hooks/useDailyLogs';
import { useExperiments } from '../contexts/ExperimentContext';
import { getSyncedTrials } from '../services/trialManagerSync';
import { useAuth } from '../contexts/AuthContext';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { getEffectiveAvatar } from '../utils/avatarHelper';
import { buildScientistExecutiveProfile } from '../services/executiveAnalytics';
import { getScientistTrials, getScientistLogs, getScientistLabWork, formatCleanScientistName } from '../utils/scientistMatcher';
import { exportScientistToPDF, exportScientistToExcel } from '../services/executiveReportGenerator';
import { Badge } from '../components/ui/Badge';

export const Employees: React.FC = () => {
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: logs, isLoading: logsLoading } = useDailyLogs();
  const { experiments, labTests } = useExperiments();
  const { userRole } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHorizon, setSelectedHorizon] = useState<'today' | '7d' | '30d' | '6m' | '1y'>('30d');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active_today' | 'bottlenecks' | 'high_output'>('all');
  const [isExporting, setIsExporting] = useState(false);

  const syncedTrials = useMemo(() => getSyncedTrials(), []);
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Build comprehensive scorecard for every active scientist
  const scientistDossiers = useMemo(() => {
    const activeUsers = (users || []).filter(u => u.isActive !== false);

    return activeUsers.map((user) => {
      const execProfile = buildScientistExecutiveProfile(
        user.name || user.email,
        syncedTrials,
        logs || [],
        experiments,
        labTests
      );

      const userTrials = getScientistTrials(user, syncedTrials);
      const userLogs = getScientistLogs(user, logs || []);

      // Check today's activity
      const hasWorkToday = execProfile.todayProgress.hasActiveWorkToday;
      const bottleneckCount = execProfile.bottlenecks.length;

      // Horizon specific metrics
      let trialsCount = 0;
      let evalsCount = 0;
      let efficacyAvg = execProfile.successRate;
      let horizonHours = 0;

      switch (selectedHorizon) {
        case 'today':
          trialsCount = execProfile.todayProgress.todayTrialsVisited;
          horizonHours = execProfile.todayProgress.todayHours;
          break;
        case '7d':
          trialsCount = execProfile.weeklyProgress.currentWeek.trialsStarted + execProfile.weeklyProgress.currentWeek.trialsCompleted;
          evalsCount = execProfile.weeklyProgress.currentWeek.evaluationsDone;
          efficacyAvg = execProfile.weeklyProgress.currentWeek.efficacyAvg || execProfile.successRate;
          horizonHours = Math.round((userLogs.filter(l => (new Date().getTime() - new Date(l.date || l.createdAt).getTime()) <= 7 * 86400000).reduce((s, l) => s + (l.timeSpentMinutes || 0), 0) / 60) * 10) / 10;
          break;
        case '30d':
          trialsCount = execProfile.monthlyProgress.currentMonth.trialsStarted + execProfile.monthlyProgress.currentMonth.trialsCompleted;
          evalsCount = execProfile.monthlyProgress.currentMonth.evaluationsDone;
          efficacyAvg = execProfile.monthlyProgress.currentMonth.efficacyAvg || execProfile.successRate;
          horizonHours = Math.round((userLogs.filter(l => (new Date().getTime() - new Date(l.date || l.createdAt).getTime()) <= 30 * 86400000).reduce((s, l) => s + (l.timeSpentMinutes || 0), 0) / 60) * 10) / 10;
          break;
        case '6m':
          trialsCount = execProfile.sixMonthProgress.currentPeriod.trialsStarted + execProfile.sixMonthProgress.currentPeriod.trialsCompleted;
          evalsCount = execProfile.sixMonthProgress.currentPeriod.evaluationsDone;
          efficacyAvg = execProfile.sixMonthProgress.currentPeriod.efficacyAvg || execProfile.successRate;
          horizonHours = Math.round((userLogs.filter(l => (new Date().getTime() - new Date(l.date || l.createdAt).getTime()) <= 180 * 86400000).reduce((s, l) => s + (l.timeSpentMinutes || 0), 0) / 60) * 10) / 10;
          break;
        case '1y':
          trialsCount = execProfile.yearlyProgress.currentYear.trialsStarted + execProfile.yearlyProgress.currentYear.trialsCompleted;
          evalsCount = execProfile.yearlyProgress.currentYear.evaluationsDone;
          efficacyAvg = execProfile.yearlyProgress.currentYear.efficacyAvg || execProfile.successRate;
          horizonHours = Math.round((userLogs.filter(l => (new Date().getTime() - new Date(l.date || l.createdAt).getTime()) <= 365 * 86400000).reduce((s, l) => s + (l.timeSpentMinutes || 0), 0) / 60) * 10) / 10;
          break;
      }

      return {
        user,
        profile: execProfile,
        userTrials,
        userLogs,
        hasWorkToday,
        bottleneckCount,
        horizonMetrics: {
          trialsCount,
          evalsCount,
          efficacyAvg,
          hours: horizonHours,
        },
      };
    });
  }, [users, syncedTrials, logs, experiments, labTests, selectedHorizon]);

  // Filtered scientists
  const filteredDossiers = useMemo(() => {
    return scientistDossiers.filter((item) => {
      const nameMatch =
        item.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.user.department?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!nameMatch) return false;

      if (statusFilter === 'active_today') return item.hasWorkToday;
      if (statusFilter === 'bottlenecks') return item.bottleneckCount > 0;
      if (statusFilter === 'high_output') return item.profile.successRate >= 85;

      return true;
    });
  }, [scientistDossiers, searchTerm, statusFilter]);

  // Team summary KPIs
  const teamKPIs = useMemo(() => {
    const totalScientists = scientistDossiers.length;
    const activeTodayCount = scientistDossiers.filter(d => d.hasWorkToday).length;
    const totalBottlenecks = scientistDossiers.reduce((s, d) => s + d.bottleneckCount, 0);
    const avgTeamSuccess = totalScientists > 0
      ? Math.round(scientistDossiers.reduce((s, d) => s + d.profile.successRate, 0) / totalScientists)
      : 88;

    return {
      totalScientists,
      activeTodayCount,
      totalBottlenecks,
      avgTeamSuccess,
    };
  }, [scientistDossiers]);

  if (usersLoading || logsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ── 1. Header Banner ── */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200">
                Executive Command Center
              </span>
              <span className="text-xs text-gray-400 font-medium">{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mt-1">
              R&D Scientist Performance & Trial Output Roster
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Real-time tracking of scientist trial workloads, daily research logs, bottleneck alerts, and multi-horizon progress.
            </p>
          </div>

          {/* Quick Horizon Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl shrink-0">
            {[
              { id: 'today', label: '⚡ Today' },
              { id: '7d', label: '📅 1-Week' },
              { id: '30d', label: '📆 1-Month' },
              { id: '6m', label: '📈 6-Months' },
              { id: '1y', label: '🏆 1-Year' },
            ].map((h) => (
              <button
                key={h.id}
                onClick={() => setSelectedHorizon(h.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
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

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Total Active Scientists</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-gray-900 dark:text-white">{teamKPIs.totalScientists}</span>
              <Users className="w-5 h-5 text-emerald-500" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Active In Field Today</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{teamKPIs.activeTodayCount}</span>
              <Sparkles className="w-5 h-5 text-emerald-500" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 space-y-1">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">Bottlenecks Flagged</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-amber-700 dark:text-amber-300">{teamKPIs.totalBottlenecks}</span>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-1">
            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase">Team Success Average</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-purple-700 dark:text-purple-300">{teamKPIs.avgTeamSuccess}%</span>
              <Zap className="w-5 h-5 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Search & Status Filter Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search scientist by name, email, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-gray-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {[
            { id: 'all', label: 'All Scientists' },
            { id: 'active_today', label: '🟢 Active Today' },
            { id: 'bottlenecks', label: '🟡 Bottlenecks Flagged' },
            { id: 'high_output', label: '🏆 High Efficacy (>85%)' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. Scientist Grid Roster ── */}
      {filteredDossiers.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-2">
          <Users className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">No Scientists Found</h3>
          <p className="text-xs text-gray-400">Try adjusting your search query or filter selection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDossiers.map((dossier) => {
            const { user, profile, hasWorkToday, bottleneckCount, horizonMetrics } = dossier;
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl bg-white dark:bg-gray-900 shadow-lg border border-gray-100 dark:border-gray-800 hover:shadow-2xl transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                <div className="p-6 space-y-4">
                  {/* Scientist Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={getEffectiveAvatar(user.id, user.email, (user as any).avatar) || `https://i.pravatar.cc/150?u=${user.id}`}
                          alt={user.name}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-white dark:border-gray-800 shadow-md"
                        />
                        {hasWorkToday && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight">
                            {formatCleanScientistName(user.name || user.email)}
                          </h3>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.designation || 'Research Scientist'}</p>
                        <span className="text-[11px] text-gray-400 block">{user.department || 'R&D Field Operations'}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {hasWorkToday ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Active Today
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                          Standby
                        </span>
                      )}

                      {bottleneckCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {bottleneckCount} Bottleneck{bottleneckCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Today's Activity Pulse */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">
                      Today's Focus & Activity
                    </span>
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 leading-relaxed">
                      "{profile.todayProgress.latestObjective}"
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                      <span>{profile.todayProgress.todayHours}h Logged Today</span>
                      <span>{profile.todayProgress.todayLogsCount} Logs</span>
                    </div>
                  </div>

                  {/* Horizon Specific KPIs */}
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="p-2.5 bg-gray-50 dark:bg-gray-800/30 rounded-xl">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block truncate">Trials</span>
                      <span className="text-sm font-black text-gray-900 dark:text-white mt-0.5 block">{dossier.userTrials.length}</span>
                    </div>
                    <div className="p-2.5 bg-gray-50 dark:bg-gray-800/30 rounded-xl">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block truncate">Success Rate</span>
                      <span className="text-sm font-black text-emerald-600 mt-0.5 block">{profile.successRate}%</span>
                    </div>
                    <div className="p-2.5 bg-gray-50 dark:bg-gray-800/30 rounded-xl">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block truncate">Workload</span>
                      <span className="text-sm font-black text-purple-600 mt-0.5 block">{profile.currentWorkloadScore}/100</span>
                    </div>
                  </div>

                  {/* Category Distribution Tags */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded text-[10px] font-bold">
                      Herbicide: {profile.categoryWorkload.herbicide}
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded text-[10px] font-bold">
                      Fungicide: {profile.categoryWorkload.fungicide}
                    </span>
                    <span className="px-2 py-0.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded text-[10px] font-bold">
                      Pesticide: {profile.categoryWorkload.pesticide}
                    </span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => exportScientistToPDF(profile, dossier.userTrials, { preset: selectedHorizon })}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors cursor-pointer"
                      title="Export PDF Report"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => exportScientistToExcel(profile, dossier.userTrials, { preset: selectedHorizon })}
                      className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors cursor-pointer"
                      title="Export Excel Report"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                    </button>
                  </div>

                  <Link
                    to={`/profile/${user.id}`}
                    className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95"
                  >
                    <span>Inspect Dossier</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};