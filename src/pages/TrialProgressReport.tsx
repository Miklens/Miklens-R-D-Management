import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, RefreshCw, Download, ChevronDown, ChevronUp,
  MapPin, User, Calendar, Beaker, Leaf, Shield, Bug, Sprout,
  FlaskConical, TrendingUp, CheckCircle2, Clock, AlertCircle,
  Eye, FileSpreadsheet, Filter, BarChart3, Thermometer, Wind,
  Droplets, Image as ImageIcon, ArrowUpRight, Target, Layers
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell
} from 'recharts';
import {
  getSyncedTrials,
  saveSyncedTrialsList,
  fetchTrialsFromFirebaseCloud,
  getSavedFirebaseConfig,
  formatCleanScientistName,
  parseFlexibleDateObj,
  parseFlexibleDateStr,
} from '../services/trialManagerSync';
import { ExternalFieldTrial, TrialCategory } from '../types/trialIntegrationTypes';
import * as XLSX from 'xlsx';

// ─── Category Config ─────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<TrialCategory, {
  label: string; icon: React.ElementType;
  color: string; lightBg: string; darkBg: string;
  borderLight: string; borderDark: string; textColor: string;
}> = {
  herbicide: { label: 'Herbicide', icon: Leaf, color: '#059669', lightBg: 'bg-emerald-50', darkBg: 'dark:bg-emerald-950/30', borderLight: 'border-emerald-200', borderDark: 'dark:border-emerald-900/50', textColor: 'text-emerald-700 dark:text-emerald-400' },
  fungicide: { label: 'Fungicide', icon: Shield, color: '#4f46e5', lightBg: 'bg-indigo-50', darkBg: 'dark:bg-indigo-950/30', borderLight: 'border-indigo-200', borderDark: 'dark:border-indigo-900/50', textColor: 'text-indigo-700 dark:text-indigo-400' },
  pesticide: { label: 'Pesticide', icon: Bug, color: '#dc2626', lightBg: 'bg-red-50', darkBg: 'dark:bg-red-950/30', borderLight: 'border-red-200', borderDark: 'dark:border-red-900/50', textColor: 'text-red-700 dark:text-red-400' },
  nutrition: { label: 'Nutrition', icon: Beaker, color: '#d97706', lightBg: 'bg-amber-50', darkBg: 'dark:bg-amber-950/30', borderLight: 'border-amber-200', borderDark: 'dark:border-amber-900/50', textColor: 'text-amber-700 dark:text-amber-400' },
  biostimulant: { label: 'Biostimulant', icon: Sprout, color: '#0d9488', lightBg: 'bg-teal-50', darkBg: 'dark:bg-teal-950/30', borderLight: 'border-teal-200', borderDark: 'dark:border-teal-900/50', textColor: 'text-teal-700 dark:text-teal-400' },
};

const ALL_CATEGORIES: TrialCategory[] = ['herbicide', 'fungicide', 'pesticide', 'nutrition', 'biostimulant'];

// ─── Result Rating Config ────────────────────────────────────────────────────
const RATING_CONFIG: Record<string, { badge: string; dot: string }> = {
  Excellent: { badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300', dot: 'bg-emerald-500' },
  Good:      { badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300', dot: 'bg-blue-500' },
  Fair:      { badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300', dot: 'bg-amber-500' },
  Poor:      { badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300', dot: 'bg-rose-500' },
  Control:   { badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', dot: 'bg-gray-400' },
  Unrated:   { badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', dot: 'bg-gray-300' },
  Pending:   { badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', dot: 'bg-gray-300' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (d?: string) => {
  if (!d) return '—';
  try {
    const iso = parseFlexibleDateStr(d);
    const dt = new Date(iso);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return d; }
};

const fmtName = (n: string) => formatCleanScientistName(n);

const getLatestEfficacy = (trial: ExternalFieldTrial): number => {
  if (!trial.evaluations?.length) return 0;
  const sorted = [...trial.evaluations].sort((a, b) => (b.daysAfterTreatment ?? 0) - (a.daysAfterTreatment ?? 0));
  return Math.round(sorted[0]?.efficacyPercent ?? 0);
};

const getEfficacyColor = (pct: number): string => {
  if (pct >= 80) return '#10b981';
  if (pct >= 60) return '#3b82f6';
  if (pct >= 40) return '#f59e0b';
  return '#ef4444';
};

// ─── Excel Export ─────────────────────────────────────────────────────────────
const exportTrialProgressExcel = (trials: ExternalFieldTrial[]) => {
  if (!trials.length) return;
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Summary ──────────────────────────────────────────────────────
  const summaryRows: any[][] = [
    ['MIKLENS R&D MANAGEMENT — TRIAL PROGRESS INTELLIGENCE REPORT'],
    [`Generated: ${new Date().toLocaleString('en-IN')}  |  Total Trials: ${trials.length}`],
    [],
    ['Trial Code', 'Category', 'Formulation / Product', 'Lead Scientist', 'Trial Date', 'Location', 'GPS Coordinates',
     'Crop / Site', 'Target Weed / Pathogen', 'Dosage / Rate', 'Design Type',
     'Status', 'Result Rating', 'Latest Efficacy (%)', 'Total Observations', 'Total Photos',
     'Synced At'],
  ];

  trials.forEach(t => {
    const latestEff = getLatestEfficacy(t);
    summaryRows.push([
      t.trialCode,
      (t.category || '').toUpperCase(),
      t.productName || t.title,
      fmtName(t.scientistName),
      fmtDate(t.startDate),
      t.location,
      (t.lat && t.lon) ? `${t.lat}, ${t.lon}` : '—',
      t.cropName,
      t.targetWeedOrPathogen,
      t.dosage || '—',
      t.designType || 'Individual',
      t.isCompleted ? 'Finalized' : 'Active',
      t.resultRating || 'Unrated',
      latestEff > 0 ? `${latestEff}%` : 'Pending',
      t.evaluations?.length ?? 0,
      t.photos?.filter(p => p.url).length ?? 0,
      fmtDate(t.syncedAt),
    ]);
  });

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
  summaryWs['!cols'] = [
    { wch: 14 }, { wch: 14 }, { wch: 30 }, { wch: 22 }, { wch: 14 }, { wch: 22 }, { wch: 22 },
    { wch: 18 }, { wch: 30 }, { wch: 14 }, { wch: 14 },
    { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 18 },
  ];
  // Style header rows
  summaryWs['A1'] = { v: summaryRows[0][0], t: 's', s: { font: { bold: true, sz: 14 }, fill: { fgColor: { rgb: '064E3B' } }, fontColor: { rgb: 'FFFFFF' } } };
  summaryWs['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 16 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 16 } }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Trial Summary');

  // ── Sheet 2: Observation Timeline ────────────────────────────────────────
  const obsRows: any[][] = [
    ['OBSERVATION TIMELINE — DAY-BY-DAY EFFICACY READINGS'],
    [],
    ['Trial Code', 'Category', 'Formulation', 'Lead Scientist', 'Crop', 'Target',
     'DAA (Days After Application)', 'Observation Date', 'Efficacy (%)', 'Phytotoxicity Score (0-10)',
     'Weed/Pathogen Control (%)', 'Evaluation Notes', 'Evaluated By'],
  ];

  trials.forEach(t => {
    if (!t.evaluations?.length) {
      obsRows.push([
        t.trialCode, (t.category || '').toUpperCase(), t.productName || t.title,
        fmtName(t.scientistName), t.cropName, t.targetWeedOrPathogen,
        'No observations recorded', '', '', '', '', '', '',
      ]);
      return;
    }
    const sorted = [...t.evaluations].sort((a, b) => (a.daysAfterTreatment ?? 0) - (b.daysAfterTreatment ?? 0));
    sorted.forEach((ev, idx) => {
      obsRows.push([
        idx === 0 ? t.trialCode : '',
        idx === 0 ? (t.category || '').toUpperCase() : '',
        idx === 0 ? (t.productName || t.title) : '',
        idx === 0 ? fmtName(t.scientistName) : '',
        idx === 0 ? t.cropName : '',
        idx === 0 ? t.targetWeedOrPathogen : '',
        `${ev.daysAfterTreatment ?? 0} DAA`,
        fmtDate(ev.evalDate),
        ev.efficacyPercent > 0 ? `${ev.efficacyPercent}%` : 'Pending',
        ev.phytotoxicityScore ?? 0,
        ev.weedOrPathogenControlPercent > 0 ? `${ev.weedOrPathogenControlPercent}%` : '—',
        ev.notes || '—',
        fmtName(ev.evaluatedBy || t.scientistName),
      ]);
    });
    // Blank row between trials
    obsRows.push([]);
  });

  const obsWs = XLSX.utils.aoa_to_sheet(obsRows);
  obsWs['!cols'] = [
    { wch: 14 }, { wch: 12 }, { wch: 28 }, { wch: 22 }, { wch: 16 }, { wch: 28 },
    { wch: 24 }, { wch: 16 }, { wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 36 }, { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, obsWs, 'Observation Timeline');

  // ── Per-Category Sheets ───────────────────────────────────────────────────
  ALL_CATEGORIES.forEach(cat => {
    const catTrials = trials.filter(t => t.category === cat);
    if (!catTrials.length) return;
    const catRows: any[][] = [
      [`${cat.toUpperCase()} TRIALS — DETAILED PROGRESS REPORT`],
      [],
      ['Trial Code', 'Formulation', 'Scientist', 'Date', 'Location', 'Crop', 'Target', 'Dosage',
       'Total DAA Readings', 'Latest Efficacy (%)', 'Best Efficacy (%)', 'Avg Efficacy (%)',
       'Status', 'Rating', 'Conclusion / Notes'],
    ];
    catTrials.forEach(t => {
      const evals = t.evaluations || [];
      const effs = evals.map(e => e.efficacyPercent).filter(e => e > 0);
      const best = effs.length ? Math.max(...effs) : 0;
      const avg = effs.length ? Math.round(effs.reduce((s, v) => s + v, 0) / effs.length) : 0;
      const latest = effs.length ? getLatestEfficacy(t) : 0;
      catRows.push([
        t.trialCode,
        t.productName || t.title,
        fmtName(t.scientistName),
        fmtDate(t.startDate),
        t.location,
        t.cropName,
        t.targetWeedOrPathogen,
        t.dosage || '—',
        evals.length,
        latest > 0 ? `${latest}%` : 'Pending',
        best > 0 ? `${best}%` : '—',
        avg > 0 ? `${avg}%` : '—',
        t.isCompleted ? 'Finalized' : 'Active',
        t.resultRating || 'Unrated',
        t.summaryConclusion || '—',
      ]);
    });
    const catWs = XLSX.utils.aoa_to_sheet(catRows);
    catWs['!cols'] = [
      { wch: 14 }, { wch: 28 }, { wch: 20 }, { wch: 14 }, { wch: 20 }, { wch: 16 }, { wch: 28 }, { wch: 12 },
      { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 40 },
    ];
    XLSX.utils.book_append_sheet(wb, catWs, `${cat.charAt(0).toUpperCase() + cat.slice(1)} Trials`);
  });

  const filename = `Miklens_Trial_Progress_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
};

// ─── Efficacy Sparkline ───────────────────────────────────────────────────────
const EfficacySparkline: React.FC<{ evaluations: ExternalFieldTrial['evaluations'] }> = ({ evaluations }) => {
  if (!evaluations?.length) {
    return (
      <div className="h-16 flex items-center justify-center text-xs text-gray-400 italic bg-gray-50 dark:bg-gray-800/30 rounded-xl">
        No observations recorded yet
      </div>
    );
  }
  const data = [...evaluations]
    .sort((a, b) => (a.daysAfterTreatment ?? 0) - (b.daysAfterTreatment ?? 0))
    .map(ev => ({
      name: `${ev.daysAfterTreatment ?? 0}DAA`,
      eff: ev.efficacyPercent ?? 0,
    }));

  return (
    <ResponsiveContainer width="100%" height={64}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
        <Line
          type="monotone"
          dataKey="eff"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 3, fill: '#10b981' }}
          activeDot={{ r: 4 }}
        />
        <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 100]} hide />
        <Tooltip
          contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb', padding: '4px 8px' }}
          formatter={(v: any) => [`${v}%`, 'Efficacy']}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// ─── Trial Progress Card ──────────────────────────────────────────────────────
const TrialCard: React.FC<{
  trial: ExternalFieldTrial;
  expanded: boolean;
  onToggle: () => void;
}> = ({ trial, expanded, onToggle }) => {
  const catCfg = CATEGORY_CONFIG[trial.category] || CATEGORY_CONFIG.herbicide;
  const CatIcon = catCfg.icon;
  const latestEfficacy = getLatestEfficacy(trial);
  const rating = trial.resultRating || 'Unrated';
  const ratingCfg = RATING_CONFIG[rating] || RATING_CONFIG.Unrated;
  const sortedEvals = [...(trial.evaluations || [])].sort(
    (a, b) => (a.daysAfterTreatment ?? 0) - (b.daysAfterTreatment ?? 0)
  );
  const realPhotos = (trial.photos || []).filter(p => p.url && p.url.length > 5);

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-3xl border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${catCfg.borderLight} ${catCfg.borderDark}`}
    >
      {/* ── Card Header ── */}
      <div className={`px-5 pt-5 pb-4 ${catCfg.lightBg} ${catCfg.darkBg} border-b ${catCfg.borderLight} ${catCfg.borderDark}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {/* Category Icon */}
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
              style={{ background: catCfg.color + '20' }}
            >
              <CatIcon className="w-5 h-5" style={{ color: catCfg.color }} />
            </div>

            <div className="min-w-0">
              {/* Trial Code + Category Chip */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-white/80 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                  {trial.trialCode}
                </span>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase"
                  style={{ background: catCfg.color + '20', color: catCfg.color }}
                >
                  {catCfg.label}
                </span>
                {trial.isCompleted ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    ✓ Finalized
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse inline-block" />
                    Active
                  </span>
                )}
                {trial.isControl && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gray-100 text-gray-600 dark:bg-gray-800">
                    Control
                  </span>
                )}
              </div>

              {/* Formulation Name */}
              <h3 className="font-black text-gray-900 dark:text-white text-base leading-tight truncate max-w-xs" title={trial.productName || trial.title}>
                {trial.productName || trial.title}
              </h3>
            </div>
          </div>

          {/* Latest Efficacy Badge */}
          <div className="text-right shrink-0">
            <div
              className="text-2xl font-black"
              style={{ color: latestEfficacy > 0 ? getEfficacyColor(latestEfficacy) : '#9ca3af' }}
            >
              {latestEfficacy > 0 ? `${latestEfficacy}%` : '—'}
            </div>
            <div className="text-[10px] text-gray-500 font-medium">Latest Efficacy</div>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-black ${ratingCfg.badge}`}>
              {rating}
            </span>
          </div>
        </div>
      </div>

      {/* ── Card Body ── */}
      <div className="px-5 py-4 space-y-4">
        {/* Key Info Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2">
            <User className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-gray-400 block font-bold uppercase text-[10px]">Lead Scientist</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{fmtName(trial.scientistName)}</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-gray-400 block font-bold uppercase text-[10px]">Trial Date</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{fmtDate(trial.startDate)}</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-gray-400 block font-bold uppercase text-[10px]">Location</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200 truncate block max-w-[130px]" title={trial.location}>
                {trial.location}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Leaf className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-gray-400 block font-bold uppercase text-[10px]">Crop / Site</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{trial.cropName}</span>
            </div>
          </div>
          <div className="flex items-start gap-2 col-span-2">
            <Target className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-gray-400 block font-bold uppercase text-[10px]">Target Weed / Pathogen</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200 line-clamp-2">{trial.targetWeedOrPathogen}</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <FlaskConical className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-gray-400 block font-bold uppercase text-[10px]">Dosage / Rate</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{trial.dosage || '—'}</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Layers className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-gray-400 block font-bold uppercase text-[10px]">Design Type</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{trial.designType || 'Individual'}</span>
            </div>
          </div>
        </div>

        {/* Observation Count Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-[11px] font-bold text-gray-700 dark:text-gray-300">
            <BarChart3 className="w-3 h-3" />
            {sortedEvals.length} Observation{sortedEvals.length !== 1 ? 's' : ''}
          </span>
          {realPhotos.length > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-[11px] font-bold text-gray-700 dark:text-gray-300">
              <ImageIcon className="w-3 h-3" />
              {realPhotos.length} Photo{realPhotos.length !== 1 ? 's' : ''}
            </span>
          )}
          {trial.lat && trial.lon && (
            <a
              href={`https://maps.google.com/?q=${trial.lat},${trial.lon}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 rounded-full text-[11px] font-bold hover:bg-blue-100 transition-colors"
            >
              <MapPin className="w-3 h-3" />
              View GPS
            </a>
          )}
        </div>

        {/* Efficacy Sparkline */}
        {sortedEvals.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Efficacy Trend (DAA Progression)</p>
            <EfficacySparkline evaluations={trial.evaluations} />
          </div>
        )}

        {/* Expand / Collapse Toggle */}
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-2xl bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xs font-black text-gray-600 dark:text-gray-300"
        >
          {expanded ? (
            <><ChevronUp className="w-4 h-4" /> Collapse Detail</>
          ) : (
            <><ChevronDown className="w-4 h-4" /> View Full Detail</>
          )}
        </button>

        {/* ── Expanded Detail Panel ── */}
        {expanded && (
          <div className="space-y-5 border-t border-gray-100 dark:border-gray-800 pt-4">

            {/* Observation History Table */}
            {sortedEvals.length > 0 && (
              <div>
                <h4 className="text-[10px] font-black uppercase text-gray-400 mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  Observation History
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/60">
                        <th className="text-left px-3 py-2 font-bold text-gray-500 whitespace-nowrap">DAA</th>
                        <th className="text-left px-3 py-2 font-bold text-gray-500 whitespace-nowrap">Obs. Date</th>
                        <th className="text-right px-3 py-2 font-bold text-gray-500 whitespace-nowrap">Efficacy %</th>
                        <th className="text-right px-3 py-2 font-bold text-gray-500 whitespace-nowrap">Phytotox.</th>
                        <th className="text-left px-3 py-2 font-bold text-gray-500">Notes</th>
                        <th className="text-left px-3 py-2 font-bold text-gray-500 whitespace-nowrap">Evaluated By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedEvals.map((ev, idx) => (
                        <tr
                          key={ev.id}
                          className={`border-t border-gray-100 dark:border-gray-800 ${idx % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-800/20'}`}
                        >
                          <td className="px-3 py-2 font-black whitespace-nowrap" style={{ color: catCfg.color }}>
                            {ev.daysAfterTreatment ?? 0} DAA
                          </td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {fmtDate(ev.evalDate)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span
                              className="font-black"
                              style={{ color: ev.efficacyPercent > 0 ? getEfficacyColor(ev.efficacyPercent) : '#9ca3af' }}
                            >
                              {ev.efficacyPercent > 0 ? `${ev.efficacyPercent}%` : 'Pending'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span className={`font-semibold ${ev.phytotoxicityScore > 3 ? 'text-rose-600' : 'text-gray-500'}`}>
                              {ev.phytotoxicityScore > 0 ? `${ev.phytotoxicityScore}/10` : '—'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-400 max-w-[160px]">
                            <span className="line-clamp-2">{ev.notes || '—'}</span>
                          </td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {fmtName(ev.evaluatedBy || trial.scientistName)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Summary Conclusion */}
            {trial.summaryConclusion && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Summary / Conclusion</p>
                <p className="text-xs text-gray-700 dark:text-gray-300">{trial.summaryConclusion}</p>
              </div>
            )}

            {/* Field Photos */}
            {realPhotos.length > 0 && (
              <div>
                <h4 className="text-[10px] font-black uppercase text-gray-400 mb-2 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
                  Field Photos ({realPhotos.length})
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {realPhotos.slice(0, 6).map((photo, idx) => (
                    <a
                      key={photo.id || idx}
                      href={photo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={photo.thumbnailUrl || photo.url}
                        alt={photo.caption || `Field Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </a>
                  ))}
                </div>
                {realPhotos.length > 6 && (
                  <p className="text-[11px] text-gray-400 text-center mt-1">+{realPhotos.length - 6} more photos in Trial Manager</p>
                )}
              </div>
            )}

            {/* Synced At Timestamp */}
            <p className="text-[10px] text-gray-400 text-right">
              Synced from Trial Manager: {fmtDate(trial.syncedAt)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const TrialProgressReport: React.FC = () => {
  const [trials, setTrials] = useState<ExternalFieldTrial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Time Horizon / Period Filter (default '7d' for Last Week)
  const [timeHorizon, setTimeHorizon] = useState<'7d' | '30d' | '90d' | 'all'>('7d');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | TrialCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'finalized'>('all');
  const [scientistFilter, setScientistFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');

  // Expanded cards
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) =>
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  // Load trials
  useEffect(() => {
    const local = getSyncedTrials();
    setTrials(local);

    const config = getSavedFirebaseConfig();
    if (config) {
      setIsLoading(true);
      fetchTrialsFromFirebaseCloud(config)
        .then(cloud => {
          if (cloud?.length > 0) {
            setTrials(cloud);
            saveSyncedTrialsList(cloud);
            setSyncNotice(`⚡ Live sync: ${cloud.length} trials loaded from Trial Manager cloud.`);
          }
        })
        .catch(() => setSyncNotice('⚠️ Auto-sync failed — showing last cached data.'))
        .finally(() => setIsLoading(false));
    }
  }, []);

  // Manual refresh
  const handleRefresh = () => {
    const config = getSavedFirebaseConfig();
    if (!config) { setSyncNotice('⚠️ No Firebase config set. Go to Trial Manager Sync to connect.'); return; }
    setIsLoading(true);
    fetchTrialsFromFirebaseCloud(config)
      .then(cloud => {
        if (cloud?.length > 0) {
          setTrials(cloud);
          saveSyncedTrialsList(cloud);
          setSyncNotice(`✅ Refreshed: ${cloud.length} trials synced at ${new Date().toLocaleTimeString('en-IN')}`);
        }
      })
      .catch(err => setSyncNotice(`❌ Sync failed: ${err?.message || 'Unknown error'}`))
      .finally(() => setIsLoading(false));
  };

  // Helper date cutoffs
  const cutoffDate = useMemo(() => {
    if (timeHorizon === 'all') return null;
    const days = timeHorizon === '7d' ? 7 : timeHorizon === '30d' ? 30 : 90;
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  }, [timeHorizon]);

  // Unique scientists
  const scientists = useMemo(() => {
    const names = new Set<string>();
    trials.forEach(t => { if (t.scientistName) names.add(t.scientistName); });
    return Array.from(names).sort();
  }, [trials]);

  // Filtered trials (incorporating Time Horizon)
  const filtered = useMemo(() => {
    return trials.filter(t => {
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (statusFilter === 'active' && t.isCompleted) return false;
      if (statusFilter === 'finalized' && !t.isCompleted) return false;
      if (scientistFilter !== 'all' && t.scientistName !== scientistFilter) return false;
      if (ratingFilter !== 'all' && (t.resultRating || 'Unrated') !== ratingFilter) return false;

      // Period Cutoff Check (either trial startDate or any observation date falls in cutoff)
      if (cutoffDate) {
        const startDt = parseFlexibleDateObj(t.startDate);
        const hasRecentStart = !isNaN(startDt.getTime()) && startDt >= cutoffDate;
        const hasRecentObs = t.evaluations?.some(e => {
          const eDt = parseFlexibleDateObj(e.evalDate);
          return !isNaN(eDt.getTime()) && eDt >= cutoffDate;
        });

        if (!hasRecentStart && !hasRecentObs) {
          return false;
        }
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          t.trialCode?.toLowerCase().includes(q) ||
          t.productName?.toLowerCase().includes(q) ||
          t.title?.toLowerCase().includes(q) ||
          t.scientistName?.toLowerCase().includes(q) ||
          t.cropName?.toLowerCase().includes(q) ||
          t.location?.toLowerCase().includes(q) ||
          t.targetWeedOrPathogen?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [trials, categoryFilter, statusFilter, scientistFilter, ratingFilter, searchTerm, cutoffDate]);

  // Executive Digest: Scientist Breakdown in Selected Period
  const scientistDigest = useMemo(() => {
    const map = new Map<string, {
      name: string;
      trialsWorked: Set<string>;
      obsCount: number;
      efficacies: number[];
      latestDate: string;
      finalizedCount: number;
      topFormulation: string;
    }>();

    trials.forEach(t => {
      const sName = fmtName(t.scientistName || 'Agronomist');
      const evals = t.evaluations || [];
      const trialDateObj = parseFlexibleDateObj(t.startDate);

      // If trial has observations, check each observation date
      if (evals.length > 0) {
        evals.forEach(ev => {
          if (cutoffDate) {
            const eDt = parseFlexibleDateObj(ev.evalDate);
            if (isNaN(eDt.getTime()) || eDt < cutoffDate) return;
          }

          if (!map.has(sName)) {
            map.set(sName, {
              name: sName,
              trialsWorked: new Set(),
              obsCount: 0,
              efficacies: [],
              latestDate: ev.evalDate,
              finalizedCount: 0,
              topFormulation: t.productName || t.title,
            });
          }
          const item = map.get(sName)!;
          item.trialsWorked.add(t.trialCode);
          item.obsCount += 1;
          if (ev.efficacyPercent > 0) item.efficacies.push(ev.efficacyPercent);
          if (new Date(parseFlexibleDateStr(ev.evalDate)) > new Date(parseFlexibleDateStr(item.latestDate))) {
            item.latestDate = ev.evalDate;
          }
          if (t.isCompleted) item.finalizedCount += 1;
        });
      } else {
        // If trial has 0 observations but was initiated in this period
        if (!cutoffDate || (!isNaN(trialDateObj.getTime()) && trialDateObj >= cutoffDate)) {
          if (!map.has(sName)) {
            map.set(sName, {
              name: sName,
              trialsWorked: new Set(),
              obsCount: 0,
              efficacies: [],
              latestDate: t.startDate,
              finalizedCount: 0,
              topFormulation: t.productName || t.title,
            });
          }
          const item = map.get(sName)!;
          item.trialsWorked.add(t.trialCode);
          if (t.isCompleted) item.finalizedCount += 1;
        }
      }
    });

    return Array.from(map.values()).map(item => {
      const avgEff = item.efficacies.length
        ? Math.round(item.efficacies.reduce((a, b) => a + b, 0) / item.efficacies.length)
        : 0;
      return { ...item, avgEff };
    }).sort((a, b) => b.obsCount - a.obsCount || b.trialsWorked.size - a.trialsWorked.size);
  }, [trials, cutoffDate]);

  // KPI Stats based on current filtered view
  const kpis = useMemo(() => {
    const active = filtered.filter(t => !t.isCompleted).length;
    const finalized = filtered.filter(t => t.isCompleted).length;

    // Filter evaluations by cutoff if set
    const periodObs = filtered.flatMap(t =>
      (t.evaluations || []).filter(e => {
        if (!cutoffDate) return true;
        const eDt = new Date(e.evalDate);
        return !isNaN(eDt.getTime()) && eDt >= cutoffDate;
      })
    );

    const periodEfjs = periodObs.map(e => e.efficacyPercent).filter(e => e > 0);
    const avgEff = periodEfjs.length ? Math.round(periodEfjs.reduce((s, v) => s + v, 0) / periodEfjs.length) : 0;
    return { total: filtered.length, active, finalized, avgEff, totalObs: periodObs.length };
  }, [filtered, cutoffDate]);

  // Category distribution for bar chart
  const catChartData = useMemo(() =>
    ALL_CATEGORIES.map(cat => ({
      name: CATEGORY_CONFIG[cat].label,
      count: filtered.filter(t => t.category === cat).length,
      color: CATEGORY_CONFIG[cat].color,
    })).filter(d => d.count > 0),
  [filtered]);

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            Trial Progress Intelligence
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Live management view of field trial progress and scientist activity across time horizons
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Time Horizon Selector */}
          <div className="bg-gray-100 dark:bg-gray-800/80 p-1 rounded-2xl flex items-center gap-1 border border-gray-200/60 dark:border-gray-700">
            {[
              { id: '7d', label: 'Last 7 Days (This Week)' },
              { id: '30d', label: 'Last 30 Days' },
              { id: '90d', label: 'Last 90 Days' },
              { id: 'all', label: 'All Time' },
            ].map(period => (
              <button
                key={period.id}
                onClick={() => setTimeHorizon(period.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  timeHorizon === period.id
                    ? 'bg-white dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Syncing…' : 'Refresh'}
          </button>
          <button
            onClick={() => exportTrialProgressExcel(filtered)}
            disabled={!filtered.length}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel ({filtered.length})
          </button>
        </div>
      </div>

      {/* ── Executive "At One Glance" Weekly Progress Brief ───────────────── */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl space-y-5 border border-emerald-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold uppercase tracking-wider mb-2 border border-emerald-400/30">
              <Activity className="w-3.5 h-3.5" />
              Executive Field Progress Brief ({timeHorizon === '7d' ? 'Last 7 Days' : timeHorizon === '30d' ? 'Last 30 Days' : timeHorizon === '90d' ? 'Last 90 Days' : 'All Time'})
            </div>
            <h2 className="text-xl font-black text-white">
              {timeHorizon === '7d' ? 'What Scientists Did This Week' : `Field Activity & Progress (${timeHorizon})`}
            </h2>
            <p className="text-xs text-emerald-200/80 font-medium mt-0.5">
              Complete breakdown of scientist observations, trial progress, and trial outcomes in one glance.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 shrink-0">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-emerald-300 block">Active Field Scientists</span>
              <span className="text-lg font-black text-white">{scientistDigest.length} Deployed</span>
            </div>
            <div className="h-7 w-px bg-white/20" />
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-emerald-300 block">Period Obs Count</span>
              <span className="text-lg font-black text-emerald-300">{kpis.totalObs} Logged</span>
            </div>
          </div>
        </div>

        {/* Scientist Activity Table Digest */}
        {scientistDigest.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-emerald-300 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-3">Scientist</th>
                  <th className="px-4 py-3 text-center">Trials Worked On</th>
                  <th className="px-4 py-3 text-center">Observations Logged</th>
                  <th className="px-4 py-3 text-right">Avg Efficacy</th>
                  <th className="px-4 py-3">Top Formulation</th>
                  <th className="px-4 py-3 text-right">Latest Observation Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {scientistDigest.map((sci, idx) => (
                  <tr key={sci.name} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-bold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 flex items-center justify-center font-black text-xs">
                        {sci.name.charAt(0)}
                      </div>
                      <span>{sci.name}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-emerald-200">
                      {sci.trialsWorked.size} Trial{sci.trialsWorked.size !== 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-xs border border-emerald-400/30">
                        {sci.obsCount} Logged
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-black text-sm" style={{ color: getEfficacyColor(sci.avgEff) }}>
                      {sci.avgEff > 0 ? `${sci.avgEff}%` : '—'}
                    </td>
                    <td className="px-4 py-3 text-emerald-100 font-medium truncate max-w-[180px]" title={sci.topFormulation}>
                      {sci.topFormulation}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300 font-medium whitespace-nowrap">
                      {fmtDate(sci.latestDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-white/5 text-center text-xs text-emerald-200 italic">
            No scientist observations recorded in the selected period ({timeHorizon}). Switch to <strong>Last 30 Days</strong> or <strong>All Time</strong> to view historical logs.
          </div>
        )}
      </div>

      {/* ── Sync Notice ─────────────────────────────────────────────────────── */}
      {syncNotice && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          <span>{syncNotice}</span>
          <button onClick={() => setSyncNotice(null)} className="text-emerald-600 hover:text-emerald-800 font-black text-sm">×</button>
        </div>
      )}

      {/* ── KPI Bar ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Trials', value: kpis.total, icon: FlaskConical, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
          { label: 'Active Trials', value: kpis.active, icon: Activity, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
          { label: 'Finalized', value: kpis.finalized, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
          { label: 'Avg Efficacy', value: kpis.avgEff > 0 ? `${kpis.avgEff}%` : '—', icon: TrendingUp, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
          { label: 'Total Observations', value: kpis.totalObs, icon: Eye, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-3xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${bg}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{label}</p>
              <p className={`text-xl font-black ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Category Distribution Chart + Filter Bar ─────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Mini Category Bar Chart */}
        {catChartData.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
            <h3 className="text-xs font-black uppercase text-gray-400 mb-3">Trials by Category</h3>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={catChartData} margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb', padding: '4px 8px' }}
                  formatter={(v: any) => [v, 'Trials']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {catChartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Filter Controls */}
        <div className={`${catChartData.length > 0 ? 'md:col-span-2' : 'md:col-span-3'} bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm`}>
          <h3 className="text-xs font-black uppercase text-gray-400 mb-3 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Filter Trials
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by trial code, formulation, scientist, crop, location…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-emerald-400 dark:focus:border-emerald-600 transition-colors"
              />
            </div>
            {/* Category */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as any)}
              className="px-3 py-2.5 text-sm rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none focus:border-emerald-400 transition-colors"
            >
              <option value="all">All Categories</option>
              {ALL_CATEGORIES.map(c => (
                <option key={c} value={c}>{CATEGORY_CONFIG[c].label}</option>
              ))}
            </select>
            {/* Status */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-2.5 text-sm rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none focus:border-emerald-400 transition-colors"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="finalized">Finalized Only</option>
            </select>
            {/* Scientist */}
            <select
              value={scientistFilter}
              onChange={e => setScientistFilter(e.target.value)}
              className="px-3 py-2.5 text-sm rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none focus:border-emerald-400 transition-colors"
            >
              <option value="all">All Scientists</option>
              {scientists.map(s => (
                <option key={s} value={s}>{fmtName(s)}</option>
              ))}
            </select>
            {/* Rating */}
            <select
              value={ratingFilter}
              onChange={e => setRatingFilter(e.target.value)}
              className="px-3 py-2.5 text-sm rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none focus:border-emerald-400 transition-colors"
            >
              <option value="all">All Ratings</option>
              {['Excellent', 'Good', 'Fair', 'Poor', 'Control', 'Unrated'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Category Quick-Tab Filter Row ───────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-black transition-all whitespace-nowrap ${
            categoryFilter === 'all'
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-gray-300'
          }`}
        >
          All ({trials.length})
        </button>
        {ALL_CATEGORIES.map(cat => {
          const cfg = CATEGORY_CONFIG[cat];
          const Icon = cfg.icon;
          const cnt = trials.filter(t => t.category === cat).length;
          if (cnt === 0) return null;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat === categoryFilter ? 'all' : cat)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-black transition-all whitespace-nowrap border ${
                categoryFilter === cat
                  ? 'text-white shadow-lg border-transparent'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:border-gray-300'
              }`}
              style={categoryFilter === cat ? { background: cfg.color, borderColor: cfg.color } : {}}
            >
              <Icon className="w-3.5 h-3.5" />
              {cfg.label} ({cnt})
            </button>
          );
        })}
      </div>

      {/* ── Results Count ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-500">
          Showing <span className="text-gray-900 dark:text-white font-black">{filtered.length}</span> of {trials.length} trials
        </p>
        {filtered.length > 0 && (
          <button
            onClick={() => {
              if (expandedIds.size === filtered.length) {
                setExpandedIds(new Set());
              } else {
                setExpandedIds(new Set(filtered.map(t => t.id)));
              }
            }}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors"
          >
            {expandedIds.size === filtered.length ? 'Collapse All' : 'Expand All'}
          </button>
        )}
      </div>

      {/* ── Trial Cards Grid ─────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          {isLoading ? (
            <>
              <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin mx-auto" />
              <p className="text-gray-500 font-semibold">Fetching trials from Trial Manager cloud…</p>
            </>
          ) : trials.length === 0 ? (
            <>
              <FlaskConical className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto" />
              <p className="text-gray-500 font-bold text-lg">No trial data synced yet</p>
              <p className="text-gray-400 text-sm">Go to <strong>Trial Manager Sync</strong> in the sidebar to connect your Firebase account and sync trial data.</p>
            </>
          ) : (
            <>
              <Search className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto" />
              <p className="text-gray-500 font-bold">No trials match your filters</p>
              <button
                onClick={() => { setSearchTerm(''); setCategoryFilter('all'); setStatusFilter('all'); setScientistFilter('all'); setRatingFilter('all'); }}
                className="text-sm text-emerald-600 hover:underline font-bold"
              >
                Clear all filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(trial => (
            <TrialCard
              key={trial.id}
              trial={trial}
              expanded={expandedIds.has(trial.id)}
              onToggle={() => toggleExpand(trial.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Add Activity icon import alias
const Activity = TrendingUp;
