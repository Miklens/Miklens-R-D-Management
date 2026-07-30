import React, { useMemo, useState } from 'react';
import { 
  Users, Calendar, Search, Download, FileSpreadsheet, FileText, 
  FlaskConical, Package, FolderGit2, Sparkles, Filter, CheckCircle2, AlertTriangle, Clock, ArrowUpRight 
} from 'lucide-react';
import { format, subDays, isWithinInterval, parseISO } from 'date-fns';
import { useDailyLogs } from '../hooks/useDailyLogs';
import { useExperiments } from '../contexts/ExperimentContext';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

export const TeamActivity: React.FC = () => {
  const { data: logs } = useDailyLogs();
  const { experiments, labTests, stabilityLogs, fieldTrials } = useExperiments();

  // Filters State
  const [presetPeriod, setPresetPeriod] = useState<'today' | 'week' | 'month' | 'quarter' | 'custom'>('month');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [selectedScientist, setSelectedScientist] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Handle Preset Clicks
  const handlePresetChange = (preset: 'today' | 'week' | 'month' | 'quarter') => {
    setPresetPeriod(preset);
    const now = new Date();
    setEndDate(format(now, 'yyyy-MM-dd'));

    if (preset === 'today') setStartDate(format(now, 'yyyy-MM-dd'));
    if (preset === 'week') setStartDate(format(subDays(now, 7), 'yyyy-MM-dd'));
    if (preset === 'month') setStartDate(format(subDays(now, 30), 'yyyy-MM-dd'));
    if (preset === 'quarter') setStartDate(format(subDays(now, 90), 'yyyy-MM-dd'));
  };

  // Scientist Options
  const SCIENTISTS = [
    { id: 'all', name: 'All Scientists' },
    { id: 'sci-1', name: 'Dr. Sarah Jenkins' },
    { id: 'sci-2', name: 'Dr. Mik (Head of R&D Operations)' },
  ];

  // Product Options
  const PRODUCTS = [
    { id: 'all', name: 'All Products' },
    { id: 'p1', name: 'BioShield Alpha (Bio-fungicide)' },
  ];

  // Project Options
  const PROJECTS = [
    { id: 'all', name: 'All Projects' },
    { id: 'proj-1', name: 'BioShield Alpha Commercialization Project' },
    { id: 'proj-2', name: 'BioShield Alpha Wheat Field Efficacy Trial' },
  ];

  // Filtered Daily Research Logs
  const filteredLogs = useMemo(() => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    end.setHours(23, 59, 59, 999);

    return logs.filter((log) => {
      const logDate = parseISO(log.date);
      const inDateRange = logDate >= start && logDate <= end;
      const matchScientist = selectedScientist === 'all' || log.userId === selectedScientist;
      const matchProduct = selectedProduct === 'all' || log.productId?.includes(selectedProduct) || selectedProduct === 'p1';
      const matchSearch =
        !searchTerm.trim() ||
        log.objective?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.activities?.toLowerCase().includes(searchTerm.toLowerCase());

      return inDateRange && matchScientist && matchProduct && matchSearch;
    });
  }, [logs, startDate, endDate, selectedScientist, selectedProduct, searchTerm]);

  // Total Hours & Statistics in Filtered Date Range
  const totalMinutes = useMemo(() => {
    return filteredLogs.reduce((sum, l) => sum + (l.timeSpentMinutes || 0), 0);
  }, [filteredLogs]);

  const totalHours = (totalMinutes / 60).toFixed(1);
  const completedCount = filteredLogs.filter((l) => l.completionStatus === 'Completed').length;
  const blockedCount = filteredLogs.filter((l) => l.completionStatus === 'Blocked').length;

  // Export Executive PDF Report
  const handleExportPDF = () => {
    const headers = ['Date', 'Scientist', 'Target Product', 'Hours Logged', 'Daily Work Performed', 'Outcome Status'];
    const rows = filteredLogs.map((log) => [
      log.date,
      log.userId === 'sci-2' ? 'Dr. Mik' : 'Dr. Sarah Jenkins',
      'BioShield Alpha (Bio-fungicide)',
      `${((log.timeSpentMinutes || 60) / 60).toFixed(1)}h`,
      log.activities ? log.activities.replace(/\[.*?\]\s*/g, '').substring(0, 50) + '...' : log.objective,
      log.completionStatus || 'Completed',
    ]);

    exportToPDF(
      {
        title: 'EXECUTIVE SCIENTIST TRACK RECORD REPORT',
        subtitle: 'Chronological Scientist Audit & Product Stage Performance',
        dateRangeText: `${startDate} to ${endDate}`,
        scopeText: `Scientist: ${selectedScientist === 'all' ? 'All Scientists' : selectedScientist} | Product: ${selectedProduct}`,
        headers,
        rows,
      },
      `Miklens_Executive_Report_${startDate}_to_${endDate}.pdf`
    );
  };

  // Export Excel Report
  const handleExportExcel = () => {
    const headers = ['Date', 'Scientist ID', 'Target Product', 'Duration (Hours)', 'Daily Objective', 'Activities Detail', 'Blockers', 'Status'];
    const rows = filteredLogs.map((log) => [
      log.date,
      log.userId === 'sci-2' ? 'Dr. Mik' : 'Dr. Sarah Jenkins',
      'BioShield Alpha (Bio-fungicide)',
      ((log.timeSpentMinutes || 60) / 60).toFixed(1),
      log.objective,
      log.activities,
      log.problems || 'None',
      log.completionStatus || 'Completed',
    ]);

    exportToExcel(
      {
        title: 'Executive Scientist Audit',
        headers,
        rows,
        sheetName: 'Scientist Audit Logs',
      },
      `Miklens_Scientist_Audit_${startDate}_to_${endDate}.xlsx`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
              <Users className="w-5 h-5" />
            </div>
            Executive Track Record & Date-Range Reporting Hub
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            Multi-perspective historical audit across custom date ranges, scientists, products, and project stages
          </p>
        </div>

        {/* Export Executive Reports Action Suite */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg transition-all"
          >
            <FileText className="w-4 h-4" />
            Export Executive PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Date Range & Filter Controls Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Date Range & Scope Filters
          </h3>

          {/* Quick Period Presets */}
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: '7 Days' },
              { id: 'month', label: '30 Days' },
              { id: 'quarter', label: 'Quarter' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handlePresetChange(p.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  presetPeriod === p.id
                    ? 'bg-emerald-500 text-white shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Start Date */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPresetPeriod('custom');
              }}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 block mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPresetPeriod('custom');
              }}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
            />
          </div>

          {/* Scientist Filter */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Filter Scientist</label>
            <select
              value={selectedScientist}
              onChange={(e) => setSelectedScientist(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
            >
              {SCIENTISTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Target Product Filter */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Target Product</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
            >
              {PRODUCTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* R&D Project Filter */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 block mb-1">R&D Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
            >
              {PROJECTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Audit Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow space-y-1">
          <span className="text-[11px] text-gray-400 font-semibold uppercase">Total Hours Logged</span>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{totalHours} Hours</p>
          <span className="text-[10px] text-emerald-600 font-bold">Across Selected Date Range</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow space-y-1">
          <span className="text-[11px] text-gray-400 font-semibold uppercase">Daily Logs Submitted</span>
          <p className="text-2xl font-black text-emerald-600">{filteredLogs.length} Entries</p>
          <span className="text-[10px] text-gray-400">{completedCount} Completed cleanly</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow space-y-1">
          <span className="text-[11px] text-gray-400 font-semibold uppercase">Active Experiments</span>
          <p className="text-2xl font-black text-amber-500">{experiments.length} Active</p>
          <span className="text-[10px] text-amber-600 font-bold">BioShield Alpha Testing</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow space-y-1">
          <span className="text-[11px] text-gray-400 font-semibold uppercase">Passed Scientific Verdicts</span>
          <p className="text-2xl font-black text-emerald-500">2 Approved</p>
          <span className="text-[10px] text-emerald-600 font-bold">Ready for Commercial Scale-Up</span>
        </div>
      </div>

      {/* Chronological Scientist Audit Log Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            Chronological Scientist Daily Audit Feed ({filteredLogs.length} Records)
          </h3>
          <span className="text-xs text-gray-400 font-mono">
            {startDate} to {endDate}
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
            <Users className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-500">No logs found within selected date range or filter set.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg text-xs font-bold">
                      {log.date}
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white text-xs">
                      {log.userId === 'sci-2' ? 'Dr. Mik (Head of R&D)' : 'Dr. Sarah Jenkins (Lead Microbiologist)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {((log.timeSpentMinutes || 60) / 60).toFixed(1)} Hours
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.completionStatus === 'Completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {log.completionStatus || 'Completed'}
                    </span>
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    Objective: <span className="font-normal text-gray-600 dark:text-gray-400">{log.objective}</span>
                  </p>
                  {log.activities && (
                    <div className="p-2.5 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 text-[11px] text-gray-700 dark:text-gray-300">
                      <strong>Work Logged:</strong> {log.activities}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};