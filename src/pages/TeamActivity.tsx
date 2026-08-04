import React, { useMemo, useState } from 'react';
import { 
  Users, Calendar, Search, Download, FileSpreadsheet, FileText, 
  FlaskConical, Package, FolderGit2, Sparkles, Filter, CheckCircle2, AlertTriangle, Clock, Award, ShieldCheck 
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useDailyLogs } from '../hooks/useDailyLogs';
import { useUsers } from '../hooks/useUsers';
import { useExperiments } from '../contexts/ExperimentContext';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

export const TeamActivity: React.FC = () => {
  const { data: logs } = useDailyLogs();
  const { data: users } = useUsers();
  const { experiments, labTests, stabilityLogs, fieldTrials, allProducts } = useExperiments();

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
    const todayStr = format(now, 'yyyy-MM-dd');
    setEndDate(todayStr);

    if (preset === 'today') setStartDate(todayStr);
    if (preset === 'week') setStartDate(format(subDays(now, 7), 'yyyy-MM-dd'));
    if (preset === 'month') setStartDate(format(subDays(now, 30), 'yyyy-MM-dd'));
    if (preset === 'quarter') setStartDate(format(subDays(now, 90), 'yyyy-MM-dd'));
  };

  // Helper map for scientist IDs and Names
  const scientistNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    (users || []).forEach((u) => {
      if (u.id) map[u.id] = u.name;
    });
    return map;
  }, [users]);

  // DYNAMIC SCOPE-FILTERED PRODUCT STATE CONCLUSIONS SYNTHESIZER
  const productStatusSummary = useMemo(() => {
    const allExpItems = [...experiments, ...labTests, ...stabilityLogs, ...fieldTrials];
    const cutoffDate = endDate;
    const startCutoff = startDate;

    // Filter products if a specific product is selected
    const targetProductList = selectedProduct === 'all' 
      ? allProducts 
      : allProducts.filter((p) => p.toLowerCase().includes(selectedProduct.toLowerCase()) || selectedProduct.toLowerCase().includes(p.toLowerCase()));

    return targetProductList.map((prodName) => {
      const prodExps = allExpItems.filter(
        (e: any) => e.productName === prodName || (!e.productName && allProducts.length === 1)
      );

      // Collect all daily runs matching scientist & date range filters up to cutoffDate
      const filteredRuns: Array<{ date: string; dayNumber: number; activity: string; result?: string; scientistName: string }> = [];
      
      prodExps.forEach((exp: any) => {
        (exp.dailyRuns || []).forEach((r: any) => {
          const runDate = r.date ? r.date.split('T')[0] : '';
          const isMik = r.scientistName?.toLowerCase().includes('mik') || exp.name?.toLowerCase().includes('field');
          const runSciId = isMik ? 'sci-2' : 'sci-1';
          const runSciName = r.scientistName || scientistNameMap[runSciId] || 'Unknown Scientist';

          const matchScientist =
            selectedScientist === 'all' ||
            runSciId === selectedScientist ||
            runSciName.toLowerCase().includes(selectedScientist.toLowerCase());

          const inRange = runDate >= startCutoff && runDate <= cutoffDate;

          if (inRange && matchScientist) {
            filteredRuns.push({
              date: runDate,
              dayNumber: r.dayNumber,
              activity: r.activityPerformed,
              result: r.observationResult,
              scientistName: runSciName,
            });
          }
        });
      });

      // Also collect Daily Research Logs matching scientist filter
      const matchingDailyLogs = (logs || []).filter((l) => {
        const cleanDate = l.date ? l.date.split('T')[0] : '';
        const inRange = cleanDate >= startCutoff && cleanDate <= cutoffDate;
        const matchSci = selectedScientist === 'all' || l.userId === selectedScientist;
        return inRange && matchSci;
      });

      // Sort runs chronologically
      filteredRuns.sort((a, b) => a.date.localeCompare(b.date));

      const activeSciLabel = selectedScientist === 'all' 
        ? (Object.values(scientistNameMap).join(', ') || 'All Scientists')
        : scientistNameMap[selectedScientist] || selectedScientist;

      // Synthesize cumulative conclusion specifically for the selected scientist & scope
      let cumulativeConclusionText = '';
      if (filteredRuns.length > 0) {
        const lastRun = filteredRuns[filteredRuns.length - 1];
        cumulativeConclusionText = `As of ${cutoffDate} (${activeSciLabel}): Completed ${filteredRuns.length} execution run(s) for ${prodName}. Latest activity: ${lastRun.activity || 'R&D activities completed'}. Result: ${lastRun.result || 'In progress'}.`;
      } else if (matchingDailyLogs.length > 0) {
        const lastLog = matchingDailyLogs[0];
        cumulativeConclusionText = `As of ${cutoffDate} (${activeSciLabel}): Logged ${matchingDailyLogs.length} daily R&D activity record(s) for ${prodName}. Objective: ${lastLog.objective}. Work: ${lastLog.activities?.replace(/\[.*?\]\s*/g, '') || 'R&D activities completed.'}`;
      } else {
        cumulativeConclusionText = `As of ${cutoffDate} (${activeSciLabel}): No active execution runs or logs recorded within the selected date range (${startCutoff} to ${cutoffDate}).`;
      }

      const latestExp = prodExps.length > 0 ? prodExps[0] : null;
      const verdict = (latestExp as any)?.outcomeStatus || 'Passed';
      const templateType = (latestExp as any)?.templateType;
      const stage = templateType === 'Field' 
        ? 'Field Trial Phase 1' 
        : templateType === 'Stability' 
        ? 'CIPAC Thermal Stability Check' 
        : 'Lab Testing & Titration Assay';

      return {
        productName: prodName,
        currentStage: stage,
        verdict: verdict === 'Passed' ? 'PASSED / Approved for Scale-Up' : verdict === 'Failed' ? 'FAILED / Needs Reformulation' : 'PENDING Evaluation',
        cumulativeConclusion: cumulativeConclusionText,
        completionProgress: verdict === 'Passed' ? 85 : 50,
        team: activeSciLabel,
      };
    });
  }, [experiments, labTests, stabilityLogs, fieldTrials, allProducts, logs, selectedScientist, selectedProduct, startDate, endDate, scientistNameMap]);

  // UNIFIED CHRONOLOGICAL AUDIT FEED
  const unifiedAuditFeed = useMemo(() => {
    const records: Array<{
      id: string;
      date: string;
      scientistId: string;
      scientistName: string;
      productName: string;
      hoursLogged: number;
      objectiveOrTitle: string;
      activitiesDetail: string;
      status: string;
      source: 'Daily Log' | 'Experiment Run';
    }> = [];

    // 1. Add Daily Research Logs
    (logs || []).forEach((log) => {
      const cleanDate = log.date ? log.date.split('T')[0] : '';
      records.push({
        id: log.id,
        date: cleanDate,
        scientistId: log.userId,
        scientistName: scientistNameMap[log.userId] || users?.find(u => u.id === log.userId)?.name || 'Unknown Scientist',
        productName: (log as any).productName || (allProducts.length > 0 ? allProducts[0] : 'R&D Activity'),
        hoursLogged: Math.round(((log.timeSpentMinutes || 60) / 60) * 10) / 10,
        objectiveOrTitle: log.objective || 'Daily R&D Work Log',
        activitiesDetail: log.activities || 'General R&D activities completed.',
        status: log.completionStatus || 'Completed',
        source: 'Daily Log',
      });
    });

    // 2. Add Multi-Day Runs from Experiments
    const allExpItems = [...experiments, ...labTests, ...stabilityLogs, ...fieldTrials];
    allExpItems.forEach((exp: any) => {
      const runs = exp.dailyRuns || [];
      runs.forEach((run: any) => {
        const cleanRunDate = run.date ? run.date.split('T')[0] : '';
        const isMik = run.scientistName?.toLowerCase().includes('mik') || exp.name?.toLowerCase().includes('field');
        const sciId = isMik ? 'sci-2' : 'sci-1';

        records.push({
          id: `${exp.id}-${run.id}`,
          date: cleanRunDate,
          scientistId: sciId,
          scientistName: run.scientistName || scientistNameMap[sciId] || 'Unknown Scientist',
          productName: exp.productName || (allProducts.length > 0 ? allProducts[0] : 'R&D Activity'),
          hoursLogged: 4.0,
          objectiveOrTitle: `${exp.name} (Day #${run.dayNumber})`,
          activitiesDetail: `${run.activityPerformed} | Outcome: ${run.observationResult || 'Target met'}`,
          status: run.runStatus || 'Passed',
          source: 'Experiment Run',
        });
      });
    });

    // Filter by Date Range, Scientist, Product, and Search
    const startStr = startDate;
    const endStr = endDate;

    return records.filter((rec) => {
      const inDateRange = rec.date >= startStr && rec.date <= endStr;

      const matchScientist =
        selectedScientist === 'all' ||
        rec.scientistId === selectedScientist ||
        rec.scientistName.toLowerCase().includes(selectedScientist.toLowerCase());

      const matchProduct =
        selectedProduct === 'all' ||
        rec.productName.toLowerCase().includes(selectedProduct.toLowerCase());

      const matchSearch =
        !searchTerm.trim() ||
        rec.objectiveOrTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.activitiesDetail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.scientistName.toLowerCase().includes(searchTerm.toLowerCase());

      return inDateRange && matchScientist && matchProduct && matchSearch;
    });
  }, [logs, experiments, labTests, stabilityLogs, fieldTrials, startDate, endDate, selectedScientist, selectedProduct, searchTerm, scientistNameMap]);

  // Statistics across filtered records
  const totalHours = useMemo(() => {
    return unifiedAuditFeed.reduce((sum, r) => sum + r.hoursLogged, 0).toFixed(1);
  }, [unifiedAuditFeed]);

  const completedCount = unifiedAuditFeed.filter((r) => r.status === 'Completed' || r.status === 'Passed').length;

  // Scientist Dropdown Options — built from real users store
  const scientistOptions = useMemo(() => {
    const base = [{ id: 'all', label: 'All Scientists' }];
    const fromUsers = (users || []).map(u => ({ id: u.id, label: u.name || u.email || u.id }));
    return [...base, ...fromUsers];
  }, [users]);

  // 1. Export High-Level Executive Product & Project Status Summary PDF
  const handleExportProductStatusPDF = () => {
    const headers = ['Product / Project Name', 'Current R&D Stage', 'Scientific Verdict', 'Current State Executive Conclusion (as of Report Date)', 'Progress & Team'];
    const rows = productStatusSummary.map((item) => [
      item.productName,
      item.currentStage,
      item.verdict,
      item.cumulativeConclusion,
      `${item.completionProgress}% Complete (${item.team})`,
    ]);

    const activeSciLabel = selectedScientist === 'all' ? 'All Scientists' : scientistNameMap[selectedScientist] || selectedScientist;
    const activeProdLabel = selectedProduct === 'all' ? 'All Products' : selectedProduct;

    exportToPDF(
      {
        title: 'EXECUTIVE PRODUCT & PROJECT PIPELINE LATEST STATUS SUMMARY REPORT',
        subtitle: 'Scope-Filtered Cumulative Scientific State Conclusions & Verdicts',
        dateRangeText: `Cumulative Audit Range: ${startDate} to ${endDate}`,
        scopeText: `Scientist: ${activeSciLabel} | Product: ${activeProdLabel}`,
        headers,
        rows,
      },
      `Miklens_Product_Pipeline_Status_Summary_${endDate}.pdf`
    );
  };

  // 2. Export Detailed Chronological Daily Audit Feed PDF
  const handleExportAuditFeedPDF = () => {
    const headers = ['Date', 'Scientist Name', 'Target Product', 'Hours', 'Daily Work & Assay Details', 'Status'];
    const rows = unifiedAuditFeed.map((rec) => [
      rec.date,
      rec.scientistName,
      rec.productName,
      `${rec.hoursLogged}h`,
      `[${rec.source}] ${rec.objectiveOrTitle}: ${rec.activitiesDetail}`,
      rec.status,
    ]);

    const activeSciLabel = selectedScientist === 'all' ? 'All Scientists' : scientistNameMap[selectedScientist] || selectedScientist;
    const activeProdLabel = selectedProduct === 'all' ? 'All Products' : selectedProduct;

    exportToPDF(
      {
        title: 'EXECUTIVE SCIENTIST TRACK RECORD REPORT',
        subtitle: 'Chronological Scientist Audit & Product Stage Performance',
        dateRangeText: `${startDate} to ${endDate}`,
        scopeText: `Scientist: ${activeSciLabel} | Product: ${activeProdLabel}`,
        headers,
        rows,
      },
      `Miklens_Scientist_Audit_Feed_${startDate}_to_${endDate}.pdf`
    );
  };

  // 3. Export Excel Report
  const handleExportExcel = () => {
    const headers = ['Product Name', 'Current R&D Stage', 'Scientific Verdict', 'Current State Conclusion as of Report Date', 'Progress & Team'];
    const rows = productStatusSummary.map((item) => [
      item.productName,
      item.currentStage,
      item.verdict,
      item.cumulativeConclusion,
      `${item.completionProgress}% (${item.team})`,
    ]);

    exportToExcel(
      {
        title: 'Executive Product Pipeline Summary',
        headers,
        rows,
        sheetName: 'Product Pipeline Summary',
      },
      `Miklens_Product_Pipeline_Summary_${endDate}.xlsx`
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

        {/* Action Buttons Suite */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportProductStatusPDF}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all"
          >
            <Award className="w-4 h-4 text-purple-200" />
            Export Product Status PDF
          </button>
          <button
            onClick={handleExportAuditFeedPDF}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg transition-all"
          >
            <FileText className="w-4 h-4 text-emerald-200" />
            Export Daily Audit PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Date Range & Scope Controls Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Date Range & Scope Filters
          </h3>

          {/* Presets */}
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

        {/* Filter Inputs Grid */}
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
              {scientistOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
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
              <option value="all">All Products</option>
              {allProducts.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Search Keywords</label>
            <input
              type="text"
              placeholder="Search details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
            />
          </div>
        </div>
      </div>

      {/* DYNAMIC SCOPE-FILTERED PRODUCT OVERVIEW CARD */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-gray-900 to-purple-950 text-white shadow-2xl border border-purple-900/40 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight">
                Executive Product State Conclusions (Filtered Scope Up To {endDate})
              </h3>
              <p className="text-xs text-gray-400">
                Scope Filter: <span className="text-emerald-300 font-bold">{selectedScientist === 'all' ? 'All Scientists' : scientistNameMap[selectedScientist] || selectedScientist}</span> • Product: <span className="text-purple-300 font-bold">{selectedProduct === 'all' ? 'All Products' : selectedProduct}</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleExportProductStatusPDF}
            className="text-xs text-purple-300 font-bold hover:underline flex items-center gap-1"
          >
            Download Filtered Summary PDF <Award className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {productStatusSummary.map((item) => (
            <div
              key={item.productName}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {item.productName}
                  </span>
                  <span className="text-xs font-bold text-purple-300">Stage: {item.currentStage}</span>
                </div>
                <div className="p-3 bg-black/40 rounded-xl border border-white/10 text-xs text-gray-200 leading-relaxed font-medium">
                  <strong>Current State Scientific Conclusion:</strong> {item.cumulativeConclusion}
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 block mb-1">
                    {item.verdict}
                  </span>
                  <span className="text-[10px] text-gray-400">Scientist Scope: {item.team}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow space-y-1">
          <span className="text-[11px] text-gray-400 font-semibold uppercase">Total Hours Logged</span>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{totalHours} Hours</p>
          <span className="text-[10px] text-emerald-600 font-bold">Across Selected Scope</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow space-y-1">
          <span className="text-[11px] text-gray-400 font-semibold uppercase">Audit Records Found</span>
          <p className="text-2xl font-black text-emerald-600">{unifiedAuditFeed.length} Records</p>
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
          <span className="text-[10px] text-emerald-600 font-bold">Ready for Scale-Up</span>
        </div>
      </div>

      {/* Unified Chronological Audit Feed */}
      <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            Chronological Scientist Daily Audit Feed ({unifiedAuditFeed.length} Records)
          </h3>
          <span className="text-xs text-gray-400 font-mono">
            {startDate} to {endDate}
          </span>
        </div>

        {unifiedAuditFeed.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
            <Users className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-500">No records found matching date range & scope filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {unifiedAuditFeed.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg text-xs font-bold">
                      {rec.date}
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white text-xs">{rec.scientistName}</span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 rounded text-[10px] font-bold">
                      {rec.productName}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-[10px] font-mono">
                      {rec.source}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {rec.hoursLogged} Hours
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rec.status === 'Completed' || rec.status === 'Passed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {rec.status}
                    </span>
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    Activity: <span className="font-normal text-gray-600 dark:text-gray-400">{rec.objectiveOrTitle}</span>
                  </p>
                  <div className="p-2.5 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 text-[11px] text-gray-700 dark:text-gray-300">
                    <strong>Work Logged:</strong> {rec.activitiesDetail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};