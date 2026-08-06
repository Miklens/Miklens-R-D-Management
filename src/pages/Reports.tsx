import React, { useState, useMemo } from 'react';
import { FileText, Download, Clock, Plus, Sparkles, CheckCircle2, Calendar, User, Filter, ArrowUpDown, Layers, ShieldCheck, Beaker } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Analytics } from './Analytics';
import { TeamActivity } from './TeamActivity';
import { AIInsights } from './AIInsights';
import { AuditLogs } from './AuditLogs';
import { useDailyLogs } from '../hooks/useDailyLogs';
import { useUsers } from '../hooks/useUsers';
import { useExperiments } from '../contexts/ExperimentContext';
import { getSyncedTrials, getSyncedFormulations } from '../services/trialManagerSync';
import { calculateTotalHours, calculateLogMinutes } from '../utils/timeTracking';
import { 
  exportMasterExecutiveReportPDF, 
  exportScientistTimesheetAuditPDF, 
  exportProductPipelineReportPDF, 
  exportFieldTrialsEfficacyReportPDF, 
  exportMasterExcelWorkbook
} from '../services/executiveReportGenerator';

export const Reports: React.FC = () => {
  const { data: logs } = useDailyLogs();
  const { data: users } = useUsers();
  
  const [activeTab, setActiveTab] = useState<'reports' | 'analytics' | 'team' | 'ai' | 'audit'>('reports');
  const [selectedScientist, setSelectedScientist] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'hours_high'>('newest');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const resolveScientistName = (userId?: string): string => {
    if (!userId) return 'Scientist';
    const target = userId.toLowerCase();

    const matched = (users || []).find(u => {
      const uId = (u.id || '').toLowerCase();
      const uUid = ((u as any).uid || '').toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      const uHandle = uEmail ? uEmail.split('@')[0] : '';
      return uId === target || uUid === target || uEmail === target || (uHandle && target.includes(uHandle));
    });

    if (matched) {
      if (matched.name) return matched.name;
      if (matched.email) {
        const handle = matched.email.split('@')[0];
        return handle.charAt(0).toUpperCase() + handle.slice(1);
      }
    }

    if (target.includes('@')) return target.split('@')[0];
    if (target.includes('.')) return target.split('.')[0];
    return userId;
  };

  const handleExportCSV = (exportScope: 'all' | 'filtered') => {
    let sourceLogs = logs || [];
    let filteredLogs = [...sourceLogs];

    if (exportScope === 'filtered') {
      if (selectedScientist !== 'all') {
        const sf = selectedScientist.toLowerCase();
        const handle = sf.split('@')[0].split('.')[0];
        filteredLogs = filteredLogs.filter(l => {
          const lu = (l.userId || '').toLowerCase();
          const un = ((l as any).userName || (l as any).scientistName || '').toLowerCase();
          return lu === sf || (handle && lu.includes(handle)) || (handle && un.includes(handle));
        });
      }

      if (selectedMonth !== 'all') {
        filteredLogs = filteredLogs.filter(l => (l.date || '').startsWith(selectedMonth));
      }

      if (startDate) {
        filteredLogs = filteredLogs.filter(l => (l.date || '').split('T')[0] >= startDate);
      }

      if (endDate) {
        filteredLogs = filteredLogs.filter(l => (l.date || '').split('T')[0] <= endDate);
      }
    }

    if (filteredLogs.length === 0) {
      alert('No genuine daily research log records found for the selected scope.');
      return;
    }

    // Sort
    if (sortOrder === 'newest') {
      filteredLogs.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    } else if (sortOrder === 'oldest') {
      filteredLogs.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    } else if (sortOrder === 'hours_high') {
      filteredLogs.sort((a, b) => calculateLogMinutes(b) - calculateLogMinutes(a));
    }

    const headers = [
      'Date', 
      'Scientist Name', 
      'User Email / Handle', 
      'Time Slot', 
      'Duration (Mins)', 
      'Logged Hours', 
      'Work Objective / Focus', 
      'Activity Details', 
      'Completion Status'
    ];

    const rows = filteredLogs.map(l => {
      const mins = calculateLogMinutes(l);
      return [
        `"${l.date || ''}"`,
        `"${resolveScientistName(l.userId)}"`,
        `"${l.userId || ''}"`,
        `"${l.startTime && l.endTime ? `${l.startTime} - ${l.endTime}` : 'N/A'}"`,
        `"${mins}"`,
        `"${(mins / 60).toFixed(1)}"`,
        `"${(l.objective || '').replace(/"/g, '""')}"`,
        `"${(l.activities || '').replace(/"/g, '""')}"`,
        `"${l.completionStatus || 'Completed'}"`
      ];
    });

    const scopeLabel = selectedScientist !== 'all' ? selectedScientist.split('@')[0] : 'All_Scientists';
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Miklens_Daily_Work_Log_Report_${scopeLabel}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const { experiments, labTests } = useExperiments();
  const syncedTrials = useMemo(() => getSyncedTrials(), []);
  const syncedFormulations = useMemo(() => getSyncedFormulations(), []);

  const productsSummary = useMemo(() => {
    const productSet = new Set<string>();
    syncedTrials.forEach(t => { if (t.productName) productSet.add(t.productName); });
    syncedFormulations.forEach(f => { if (f.name) productSet.add(f.name); });
    experiments.forEach(e => { if (e.productName) productSet.add(e.productName); });

    return Array.from(productSet).map(prodName => {
      const pTrials = syncedTrials.filter(t => (t.productName || '').toLowerCase().includes(prodName.toLowerCase()));
      const isCompleted = pTrials.some(t => t.isCompleted);
      return {
        productName: prodName,
        currentStage: isCompleted ? 'Approved for Scale-Up' : 'Field Trial Evaluation',
        verdict: isCompleted ? 'PASSED / Commercial' : 'Active Field Testing',
        cumulativeConclusion: `Evaluation across ${pTrials.length} field trials and lab tests.`,
        completionProgress: isCompleted ? 100 : 75,
        team: pTrials.length > 0 ? pTrials[0].scientistName : 'R&D Team',
      };
    });
  }, [syncedTrials, syncedFormulations, experiments]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            Executive Governance & Scientist Work Log Export Center
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            Download comprehensive R&D timesheets, monthly reports, and individual scientist activity audits
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
        {[
          { id: 'reports', label: '📊 Timesheet & Executive Reports' },
          { id: 'analytics', label: '📈 Analytics Deep-Dive' },
          { id: 'team', label: '👥 Scientist Workload' },
          { id: 'ai', label: '🤖 AI Governance Briefings' },
          { id: 'audit', label: '🛡️ Compliance Audit Logs' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Render Switch */}
      {activeTab === 'analytics' ? (
        <Analytics />
      ) : activeTab === 'team' ? (
        <TeamActivity />
      ) : activeTab === 'ai' ? (
        <AIInsights />
      ) : activeTab === 'audit' ? (
        <AuditLogs />
      ) : (
        <div className="space-y-6">
          {/* Executive Multi-Report Export Cards Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">
              Executive Multi-Format Downloadable Reports
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Report Card 1 */}
              <div className="p-4 bg-white dark:bg-gray-900 rounded-3xl border border-emerald-500/30 shadow-md space-y-3 flex flex-col justify-between hover:border-emerald-500 transition-all">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-black text-gray-900 dark:text-white">Master Executive Report</h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">High-level KPIs, risk alerts, category breakdown & scorecards.</p>
                </div>
                <button
                  onClick={() => exportMasterExecutiveReportPDF(syncedTrials, (users || []).length, (experiments.length + labTests.length), logs || [])}
                  className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
              </div>

              {/* Report Card 2 */}
              <div className="p-4 bg-white dark:bg-gray-900 rounded-3xl border border-blue-500/30 shadow-md space-y-3 flex flex-col justify-between hover:border-blue-500 transition-all">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center font-bold">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-black text-gray-900 dark:text-white">Timesheet Audit</h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Daily scientist work sessions, logged hours & deliverables.</p>
                </div>
                <button
                  onClick={() => exportScientistTimesheetAuditPDF(logs || [], users || [], selectedScientist)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
              </div>

              {/* Report Card 3 */}
              <div className="p-4 bg-white dark:bg-gray-900 rounded-3xl border border-purple-500/30 shadow-md space-y-3 flex flex-col justify-between hover:border-purple-500 transition-all">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center font-bold">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-black text-gray-900 dark:text-white">Product Pipeline</h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Formulation stage gate progress, pass rates & verdicts.</p>
                </div>
                <button
                  onClick={() => exportProductPipelineReportPDF(productsSummary)}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
              </div>

              {/* Report Card 4 */}
              <div className="p-4 bg-white dark:bg-gray-900 rounded-3xl border border-teal-500/30 shadow-md space-y-3 flex flex-col justify-between hover:border-teal-500 transition-all">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 flex items-center justify-center font-bold">
                    <Beaker className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-black text-gray-900 dark:text-white">Field Trials Efficacy</h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">GPS locations, crops, efficacy % & phytotoxicity safety.</p>
                </div>
                <button
                  onClick={() => exportFieldTrialsEfficacyReportPDF(syncedTrials)}
                  className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
              </div>

              {/* Report Card 5 */}
              <div className="p-4 bg-white dark:bg-gray-900 rounded-3xl border border-amber-500/30 shadow-md space-y-3 flex flex-col justify-between hover:border-amber-500 transition-all">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-black text-gray-900 dark:text-white">Master Excel Workbook</h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Multi-tab workbook containing all raw & aggregated data.</p>
                </div>
                <button
                  onClick={() => exportMasterExcelWorkbook(syncedTrials, logs || [], users || [], productsSummary)}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download Excel
                </button>
              </div>
            </div>
          </div>

          {/* Main Controls Card */}
          <div className="p-6 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <Download className="w-5 h-5 text-emerald-500" />
                  Custom Scientist Daily Research Log Exporter
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Export master timesheets for all scientists or filter by specific scientist, month, date range, and sort order.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportCSV('all')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl text-xs font-black shadow-lg hover:from-emerald-700 hover:to-teal-700 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download Master CSV (All Scientists)
                </button>
              </div>
            </div>

            {/* Filter Bar Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Scientist Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-500" /> Select Scientist
                </label>
                <select
                  value={selectedScientist}
                  onChange={(e) => setSelectedScientist(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="all">👥 All Scientists at Once</option>
                  {(users || []).map(u => (
                    <option key={u.id} value={u.email || u.id}>👤 {u.name || u.email}</option>
                  ))}
                </select>
              </div>

              {/* Month Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" /> Select Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="all">📅 All Months</option>
                  <option value="2026-08">August 2026</option>
                  <option value="2026-07">July 2026</option>
                  <option value="2026-06">June 2026</option>
                </select>
              </div>

              {/* Date Sort Order */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5 text-purple-500" /> Date Sort Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="newest">⬆️ Date: Newest First</option>
                  <option value="oldest">⬇️ Date: Oldest First</option>
                  <option value="hours_high">⏱️ Hours: Highest Logged First</option>
                </select>
              </div>

              {/* Export Filtered Action */}
              <div className="space-y-1.5 flex flex-col justify-end">
                <button
                  onClick={() => handleExportCSV('filtered')}
                  className="w-full py-2 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5" /> Export Filtered CSV Report
                </button>
              </div>
            </div>

            {/* Custom Date Range Picker */}
            <div className="p-4 bg-gray-50/50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-4">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Custom Date Range:</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium"
                />
              </div>
              {(startDate || endDate) && (
                <button
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="text-xs text-rose-500 font-bold hover:underline"
                >
                  Reset Range
                </button>
              )}
            </div>
          </div>

          {/* Quick Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Total Work Logs</span>
                <Clock className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{(logs || []).length} Entries</p>
              <p className="text-xs text-gray-500">Live verified entries in database</p>
            </div>

            <div className="p-5 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Active Scientists</span>
                <User className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{(users || []).length} Scientists</p>
              <p className="text-xs text-gray-500">R&D team scorecards</p>
            </div>

            <div className="p-5 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Total Hours Logged</span>
                <Sparkles className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">
                {calculateTotalHours(logs || [])} Hours
              </p>
              <p className="text-xs text-gray-500">Accumulated research time</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
