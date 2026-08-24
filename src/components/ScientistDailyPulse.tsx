import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  FlaskConical, 
  MapPin, 
  Sparkles, 
  Filter, 
  Search,
  ChevronRight,
  TrendingUp,
  FileText,
  Beaker,
  Layers,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useDailyLogs } from '../hooks/useDailyLogs';
import { useUsers } from '../hooks/useUsers';
import { getSyncedTrials } from '../services/trialManagerSync';
import { calculateLogMinutes } from '../utils/timeTracking';
import { getEffectiveAvatar } from '../utils/avatarHelper';
import { AIDailyDigestModal } from './AIDailyDigestModal';
import { exportDailyScientistActivityPDF } from '../services/executiveReportGenerator';
import { AppUser, DailyLog } from '../types';

export const ScientistDailyPulse: React.FC = () => {
  const { data: logs = [] } = useDailyLogs();
  const { data: users = [] } = useUsers();
  
  const [selectedScientist, setSelectedScientist] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAIDigestModal, setShowAIDigestModal] = useState<boolean>(false);

  const todayStr = new Date().toDateString();
  const todayISO = new Date().toISOString().split('T')[0];

  // Synced field trials from App 1
  const syncedTrials = useMemo(() => getSyncedTrials(), []);

  // Map users into scientist daily pulse data
  const scientistPulseData = useMemo(() => {
    const todayLogs = logs.filter(l => l.date && new Date(l.date).toDateString() === todayStr);

    return users.map(user => {
      const uId = (user.id || '').toLowerCase();
      const uEmail = (user.email || '').toLowerCase();
      const uHandle = uEmail ? uEmail.split('@')[0] : '';

      // Find logs for this user today
      const userTodayLogs = todayLogs.filter(l => {
        const logUser = (l.userId || '').toLowerCase();
        return logUser === uId || logUser === uEmail || (uHandle && logUser.includes(uHandle));
      });

      // Calculate total minutes today
      const totalMinutes = userTodayLogs.reduce((acc, l) => acc + calculateLogMinutes(l), 0);
      const totalHours = (totalMinutes / 60).toFixed(1);

      // Find user's synced field trial activity
      const userTrials = syncedTrials.filter(t => {
        const sName = (t.scientistName || t.creatorEmail || '').toLowerCase();
        return sName.includes(uHandle) || (user.name && sName.includes(user.name.toLowerCase()));
      });

      const fieldLogsCount = userTodayLogs.filter(l => (l.activities || '').toLowerCase().includes('field')).length;
      const labLogsCount = userTodayLogs.filter(l => (l.activities || '').toLowerCase().includes('lab') || (l.objective || '').toLowerCase().includes('assay')).length;

      let status: 'active' | 'sync_pending' | 'idle' = 'idle';
      if (userTodayLogs.length > 0) {
        status = 'active';
      } else if (userTrials.length > 0) {
        status = 'sync_pending';
      }

      return {
        user,
        todayLogs: userTodayLogs,
        totalMinutes,
        totalHours,
        status,
        fieldLogsCount,
        labLogsCount,
        syncedTrialsCount: userTrials.length,
        lastLog: userTodayLogs[userTodayLogs.length - 1] || null
      };
    });
  }, [users, logs, syncedTrials, todayStr]);

  // Overall KPIs for Management
  const kpis = useMemo(() => {
    const todayLogs = logs.filter(l => l.date && new Date(l.date).toDateString() === todayStr);
    const activeScientistsCount = scientistPulseData.filter(s => s.status === 'active').length;
    const totalMinutesToday = todayLogs.reduce((acc, l) => acc + calculateLogMinutes(l), 0);
    const totalHoursToday = (totalMinutesToday / 60).toFixed(1);

    const fieldMinutes = todayLogs.filter(l => (l.activities || '').toLowerCase().includes('field')).reduce((acc, l) => acc + calculateLogMinutes(l), 0);
    const fieldPct = totalMinutesToday > 0 ? Math.round((fieldMinutes / totalMinutesToday) * 100) : 50;

    return {
      activeScientistsCount,
      totalTeamCount: users.length || 1,
      totalHoursToday,
      fieldPct,
      labPct: 100 - fieldPct,
      totalSessionsToday: todayLogs.length
    };
  }, [logs, scientistPulseData, users, todayStr]);

  // Filtered scientists list
  const filteredScientists = useMemo(() => {
    return scientistPulseData.filter(item => {
      const nameMatch = !searchQuery || item.user.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const scientistMatch = selectedScientist === 'all' || item.user.id === selectedScientist || item.user.email === selectedScientist;
      const categoryMatch = selectedCategory === 'all' || item.todayLogs.some(l => (l.objective || '').toLowerCase().includes(selectedCategory.toLowerCase()));

      return nameMatch && scientistMatch && categoryMatch;
    });
  }, [scientistPulseData, searchQuery, selectedScientist, selectedCategory]);

  // Chronological Session Feed for Today
  const todaySessionsFeed = useMemo(() => {
    const todayLogs = logs.filter(l => l.date && new Date(l.date).toDateString() === todayStr);
    return todayLogs.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
  }, [logs, todayStr]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Management Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE EXECUTIVE PULSE
            </span>
            <span className="text-xs text-emerald-200 font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            Scientist Daily Activity Control Tower
          </h2>
          <p className="text-xs text-emerald-100/80 max-w-2xl">
            Real-time oversight into daily work sessions, field trials, lab hours, and milestone progress across your R&D team.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowAIDigestModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-600 hover:to-emerald-600 text-gray-950 font-black rounded-2xl text-xs shadow-lg hover:shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-gray-950 animate-bounce" />
            <span>1-Click AI Daily Brief</span>
          </button>

          <button
            onClick={() => exportDailyScientistActivityPDF(scientistPulseData, logs, todayISO)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-2xl text-xs backdrop-blur-md transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Export Today's Sheet</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Scientists Today</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-gray-900 dark:text-white">{kpis.activeScientistsCount}</span>
              <span className="text-xs font-bold text-gray-400">/ {kpis.totalTeamCount} active</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Logged Team Hours</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-gray-900 dark:text-white">{kpis.totalHoursToday} hrs</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">({kpis.totalSessionsToday} sessions)</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Field vs Lab Split</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black text-gray-900 dark:text-white">{kpis.fieldPct}% Field</span>
              <span className="text-xs text-gray-400">/ {kpis.labPct}% Lab</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pending Log Updates</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {kpis.totalTeamCount - kpis.activeScientistsCount}
              </span>
              <span className="text-xs font-bold text-gray-400">scientists</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search scientist or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedScientist}
            onChange={(e) => setSelectedScientist(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold"
          >
            <option value="all">All Scientists</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold"
          >
            <option value="all">All Categories</option>
            <option value="herbicide">Herbicide</option>
            <option value="fungicide">Fungicide</option>
            <option value="pesticide">Pesticide</option>
            <option value="nutrition">Nutrition</option>
            <option value="biostimulant">Biostimulant</option>
          </select>
        </div>
      </div>

      {/* Grid: Scientist Cards & Live Session Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Scientist Status Cards */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" />
            Scientist Today Status Roster
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredScientists.map((item) => {
              const avatar = getEffectiveAvatar(item.user.id, item.user.email, item.user.avatar);

              return (
                <motion.div
                  key={item.user.id}
                  whileHover={{ y: -2 }}
                  className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4 relative overflow-hidden"
                >
                  {/* Status accent bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                    item.status === 'active' ? 'bg-emerald-500' : item.status === 'sync_pending' ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-700'
                  }`} />

                  <div className="flex items-start justify-between gap-3 pt-1">
                    <div className="flex items-center gap-3 min-w-0">
                      {avatar ? (
                        <img src={avatar} alt="Avatar" className="w-11 h-11 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm shrink-0" />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-base shadow-sm shrink-0">
                          {item.user.name?.charAt(0) || 'S'}
                        </div>
                      )}

                      <div className="min-w-0">
                        <h4 className="font-black text-sm text-gray-900 dark:text-white truncate">{item.user.name}</h4>
                        <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 truncate">{item.user.designation || item.user.role || 'Scientist'}</p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                      item.status === 'active' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : item.status === 'sync_pending'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                    }`}>
                      {item.status === 'active' ? '🟢 Active Today' : item.status === 'sync_pending' ? '🟡 Sync Pending' : '⚪ No Entry'}
                    </span>
                  </div>

                  {/* Hours & Stats breakdown */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Today Hours</p>
                      <p className="text-sm font-black text-gray-900 dark:text-white mt-0.5">{item.totalHours}h</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Sessions</p>
                      <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{item.todayLogs.length}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Synced Trials</p>
                      <p className="text-sm font-black text-blue-600 dark:text-blue-400 mt-0.5">{item.syncedTrialsCount}</p>
                    </div>
                  </div>

                  {/* Latest Activity Snapshot */}
                  {item.lastLog ? (
                    <div className="p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
                        <span>LATEST OBJECTIVE</span>
                        <span>{item.lastLog.objective?.substring(0, 20) || 'Research Work'}</span>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white truncate">
                        {item.lastLog.activities?.substring(0, 70) || 'Work logged'}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400">
                      No sessions recorded today
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Live Chronological Session Feed */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-500" />
            Today's Chronological Log Feed
          </h3>

          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm max-h-[600px] overflow-y-auto space-y-4 divide-y divide-gray-100 dark:divide-gray-800">
            {todaySessionsFeed.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 font-medium">
                <Clock className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                No scientist sessions recorded today yet.
              </div>
            ) : (
              todaySessionsFeed.map((log, idx) => (
                <div key={log.id || idx} className="pt-3 first:pt-0 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-gray-900 dark:text-white">
                      {users.find(u => u.id === log.userId)?.name || 'Scientist'}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                      {(log.timeSpentMinutes / 60).toFixed(1)}h
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                    {log.activities || log.objective || 'Logged research activities'}
                  </p>

                  <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium pt-0.5">
                    <span>{log.objective || 'Session'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* AI Daily Briefing Modal */}
      <AIDailyDigestModal
        isOpen={showAIDigestModal}
        onClose={() => setShowAIDigestModal(false)}
        scientistPulseData={scientistPulseData}
        todaySessions={todaySessionsFeed}
      />
    </div>
  );
};
