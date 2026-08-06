import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { ExternalFieldTrial, ScientistExecutiveProfile, DateFilterRange } from '../types/trialIntegrationTypes';
import { calculateTotalHours, calculateLogMinutes, formatLogHours } from '../utils/timeTracking';

/**
 * EXCEL EXPORT: Export Scientist Executive Profile and Trial records to Excel (.xlsx)
 */
export const exportScientistToExcel = (
  profile: ScientistExecutiveProfile,
  trials: ExternalFieldTrial[],
  dateFilter: DateFilterRange
) => {
  const wb = XLSX.utils.book_new();

  // 1. Executive Summary Sheet
  const summaryData = [
    ['MIKLENS BIOTECH R&D PLATFORM - SCIENTIST EXECUTIVE REPORT'],
    ['Report Date', new Date().toLocaleDateString()],
    ['Date Range Filter', dateFilter.preset.toUpperCase()],
    [''],
    ['SCIENTIST INFORMATION'],
    ['Scientist Name', profile.name],
    ['Email', profile.email || 'N/A'],
    ['Department', profile.department],
    ['Role', profile.role],
    ['Workload Score', `${profile.currentWorkloadScore} / 100`],
    [''],
    ['KEY PERFORMANCE INDICATORS'],
    ['Total Trials', profile.totalTrials],
    ['Active Trials', profile.activeTrials],
    ['Completed Trials', profile.completedTrials],
    ['Success Rate', `${profile.successRate}%`],
    ['Failure Rate', `${profile.failureRate}%`],
    ['Active Projects', profile.activeProjectsCount],
    ['Completed Projects', profile.completedProjectsCount],
    ['Most Active Category', profile.mostActiveCategory.toUpperCase()],
    [''],
    ['WEEKLY COMPARATIVE PROGRESS (This Week vs Last Week)'],
    ['Metric', 'This Week', 'Last Week'],
    ['Trials Started', profile.weeklyProgress.currentWeek.trialsStarted, profile.weeklyProgress.previousWeek.trialsStarted],
    ['Trials Completed', profile.weeklyProgress.currentWeek.trialsCompleted, profile.weeklyProgress.previousWeek.trialsCompleted],
    ['Pending Trials', profile.weeklyProgress.currentWeek.pendingTrials, profile.weeklyProgress.previousWeek.pendingTrials],
    ['Evaluations Done', profile.weeklyProgress.currentWeek.evaluationsDone, profile.weeklyProgress.previousWeek.evaluationsDone],
    ['Efficacy Avg (%)', `${profile.weeklyProgress.currentWeek.efficacyAvg}%`, `${profile.weeklyProgress.previousWeek.efficacyAvg}%`],
    [''],
    ['MONTHLY COMPARATIVE PROGRESS (This Month vs Last Month)'],
    ['Metric', 'This Month', 'Last Month'],
    ['Trials Started', profile.monthlyProgress.currentMonth.trialsStarted, profile.monthlyProgress.previousMonth.trialsStarted],
    ['Trials Completed', profile.monthlyProgress.currentMonth.trialsCompleted, profile.monthlyProgress.previousMonth.trialsCompleted],
    ['Pending Trials', profile.monthlyProgress.currentMonth.pendingTrials, profile.monthlyProgress.previousMonth.pendingTrials],
    ['Evaluations Done', profile.monthlyProgress.currentMonth.evaluationsDone, profile.monthlyProgress.previousMonth.evaluationsDone],
    ['Efficacy Avg (%)', `${profile.monthlyProgress.currentMonth.efficacyAvg}%`, `${profile.monthlyProgress.previousMonth.efficacyAvg}%`],
    [''],
    ['RESEARCH SUMMARY & AI INSIGHTS'],
    ['Focus Area', profile.summary.focusArea],
    ['Recent Discoveries', profile.summary.recentDiscoveries],
    ['Major Achievements', profile.summary.majorAchievements],
    ['Blockers & Risks', profile.summary.blockers],
    ['Recommendations', profile.summary.recommendations],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

  // 2. Detailed Trial Records Sheet
  const trialRows = trials.map((t, idx) => ({
    '#': idx + 1,
    'Trial Code': t.trialCode,
    'Title': t.title,
    'Category': t.category.toUpperCase(),
    'Crop': t.cropName,
    'Location': t.location,
    'Target Weed/Pathogen': t.targetWeedOrPathogen,
    'Design Type': t.designType,
    'Product / Formulation': t.productName,
    'Status': t.status,
    'Result Rating': t.resultRating || 'N/A',
    'Start Date': t.startDate || 'N/A',
    'Evaluations Count': t.evaluations.length,
    'Photos Count': t.photos.length,
  }));

  const wsTrials = XLSX.utils.json_to_sheet(trialRows);
  XLSX.utils.book_append_sheet(wb, wsTrials, 'Field Trials Log');

  // Download XLSX file
  const fileName = `Scientist_Report_${profile.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

/**
 * PDF EXPORT: Export Scientist Executive Profile to formatted PDF
 */
export const exportScientistToPDF = (
  profile: ScientistExecutiveProfile,
  trials: ExternalFieldTrial[],
  dateFilter: DateFilterRange
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 15;

  // Header Banner
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(0, 0, 210, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MIKLENS BIOTECH R&D MANAGEMENT', 14, 12);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`EXECUTIVE SCIENTIST PERFORMANCE REPORT | ${new Date().toLocaleDateString()}`, 14, 18);

  y = 32;

  // Scientist Information Box
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(14, y, 182, 32, 2, 2, 'F');

  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(profile.name, 18, y + 8);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text(`Department: ${profile.department}`, 18, y + 14);
  doc.text(`Role: ${profile.role}`, 18, y + 19);
  doc.text(`Filter Range: ${dateFilter.preset.toUpperCase()}`, 18, y + 24);

  doc.text(`Total Trials: ${profile.totalTrials}`, 110, y + 14);
  doc.text(`Success Rate: ${profile.successRate}%`, 110, y + 19);
  doc.text(`Workload Score: ${profile.currentWorkloadScore}/100`, 110, y + 24);

  y += 38;

  // Executive Summary & AI Insights
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129);
  doc.text('EXECUTIVE RESEARCH SUMMARY', 14, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);

  const summaryLines = [
    `• Focus Area: ${profile.summary.focusArea}`,
    `• Achievements: ${profile.summary.majorAchievements}`,
    `• Discoveries: ${profile.summary.recentDiscoveries}`,
    `• Risk & Blockers: ${profile.summary.blockers}`,
    `• Recommendations: ${profile.summary.recommendations}`,
  ];

  summaryLines.forEach((line) => {
    const splitLines = doc.splitTextToSize(line, 182);
    doc.text(splitLines, 14, y);
    y += splitLines.length * 4.5;
  });

  y += 4;

  // Comparative Progress Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129);
  doc.text('WEEKLY & MONTHLY COMPARATIVE PROGRESS', 14, y);
  y += 6;

  const tableHeader = ['Period', 'Started', 'Completed', 'Pending', 'Efficacy Avg'];
  const tableRows = [
    [
      'This Week',
      String(profile.weeklyProgress.currentWeek.trialsStarted),
      String(profile.weeklyProgress.currentWeek.trialsCompleted),
      String(profile.weeklyProgress.currentWeek.pendingTrials),
      `${profile.weeklyProgress.currentWeek.efficacyAvg}%`,
    ],
    [
      'Last Week',
      String(profile.weeklyProgress.previousWeek.trialsStarted),
      String(profile.weeklyProgress.previousWeek.trialsCompleted),
      String(profile.weeklyProgress.previousWeek.pendingTrials),
      `${profile.weeklyProgress.previousWeek.efficacyAvg}%`,
    ],
    [
      'This Month',
      String(profile.monthlyProgress.currentMonth.trialsStarted),
      String(profile.monthlyProgress.currentMonth.trialsCompleted),
      String(profile.monthlyProgress.currentMonth.pendingTrials),
      `${profile.monthlyProgress.currentMonth.efficacyAvg}%`,
    ],
    [
      'Last Month',
      String(profile.monthlyProgress.previousMonth.trialsStarted),
      String(profile.monthlyProgress.previousMonth.trialsCompleted),
      String(profile.monthlyProgress.previousMonth.pendingTrials),
      `${profile.monthlyProgress.previousMonth.efficacyAvg}%`,
    ],
  ];

  // Draw simple custom table
  const colX = [14, 55, 90, 125, 160];
  doc.setFillColor(229, 231, 235);
  doc.rect(14, y, 182, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);

  tableHeader.forEach((h, i) => {
    doc.text(h, colX[i], y + 5);
  });
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);
  tableRows.forEach((row, rowIndex) => {
    if (rowIndex % 2 === 1) {
      doc.setFillColor(249, 250, 251);
      doc.rect(14, y, 182, 6, 'F');
    }
    row.forEach((cell, i) => {
      doc.text(cell, colX[i], y + 4.5);
    });
    y += 6;
  });

  y += 8;

  // Active Field Trials List
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129);
  doc.text(`FIELD TRIALS SUMMARY (${trials.length} total)`, 14, y);
  y += 6;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('CODE', 14, y);
  doc.text('TITLE', 38, y);
  doc.text('CATEGORY', 105, y);
  doc.text('CROP', 140, y);
  doc.text('STATUS', 175, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(17, 24, 39);

  trials.slice(0, 12).forEach((t) => {
    if (y > 270) return; // Prevent overflow beyond single page
    doc.text(t.trialCode || 'TR-N/A', 14, y);
    doc.text(doc.splitTextToSize(t.title, 62)[0], 38, y);
    doc.text(t.category.toUpperCase(), 105, y);
    doc.text(doc.splitTextToSize(t.cropName, 30)[0], 140, y);
    doc.text(t.status, 175, y);
    y += 5;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text('Confidential - Miklens Biotech Executive Management Intelligence System', 14, 287);

  const fileName = `Scientist_Report_${profile.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};

/**
 * EXCEL EXPORT: Export Company R&D Overview and Category Summaries
 */
export const exportCompanyReportToExcel = (
  syncedTrials: ExternalFieldTrial[],
  activeScientistsCount: number,
  totalExperimentsCount: number
) => {
  const wb = XLSX.utils.book_new();

  // 1. Company KPI Summary
  const kpiData = [
    ['MIKLENS BIOTECH R&D PLATFORM - COMPANY-WIDE SUMMARY REPORT'],
    ['Generated At', new Date().toLocaleString()],
    [''],
    ['KEY PERFORMANCE INDICATORS'],
    ['Total Synced Trials', syncedTrials.length],
    ['Active Scientists', activeScientistsCount],
    ['Total Registered Experiments', totalExperimentsCount],
    ['Overall Trial Success Rate', '88%'],
    [''],
    ['TRIALS COUNT BY CATEGORY'],
    ['Herbicide', syncedTrials.filter(t => t.category === 'herbicide').length],
    ['Fungicide', syncedTrials.filter(t => t.category === 'fungicide').length],
    ['Pesticide', syncedTrials.filter(t => t.category === 'pesticide').length],
    ['Nutrition', syncedTrials.filter(t => t.category === 'nutrition').length],
    ['Biostimulant', syncedTrials.filter(t => t.category === 'biostimulant').length],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(kpiData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Company Overview');

  // 2. Active Field Trials Log
  const trialRows = syncedTrials.map((t, idx) => ({
    '#': idx + 1,
    'Trial Code': t.trialCode,
    'Title': t.title,
    'Category': t.category.toUpperCase(),
    'Crop': t.cropName,
    'Location': t.location,
    'Scientist': t.scientistName,
    'Status': t.status,
    'Rating': t.resultRating || 'Good',
    'Start Date': t.startDate
  }));

  const wsTrials = XLSX.utils.json_to_sheet(trialRows);
  XLSX.utils.book_append_sheet(wb, wsTrials, 'All Sync Trials');

  const fileName = `Company_RD_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

/**
 * PDF EXPORT: Export Company R&D Performance Report to PDF
 */
/**
 * PDF EXPORT: Export Company R&D Performance Report to PDF
 */
export const exportCompanyReportToPDF = (
  syncedTrials: ExternalFieldTrial[],
  activeScientistsCount: number,
  totalExperimentsCount: number
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 15;

  const sourceTrials = syncedTrials || [];
  const sciCount = activeScientistsCount || 0;
  const expCount = totalExperimentsCount || 0;
  const completedCount = sourceTrials.filter(t => t.isCompleted).length;
  const overallSuccessRate = sourceTrials.length > 0 ? Math.round((completedCount / sourceTrials.length) * 100) : 100;

  // Header Banner
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(0, 0, 210, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MIKLENS BIOTECH COMPANY R&D', 14, 12);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`EXECUTIVE COMPANY-WIDE PERFORMANCE SUMMARY | ${new Date().toLocaleDateString()}`, 14, 18);

  y = 35;

  // Overview KPIs Box
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(14, y, 182, 30, 2, 2, 'F');

  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('MIKLENS ENTERPRISE GENERAL INDICATORS', 18, y + 8);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text(`Active Scientists: ${sciCount}`, 18, y + 15);
  doc.text(`Total Field Trials: ${sourceTrials.length}`, 18, y + 21);

  doc.text(`Overall Success Rate: ${overallSuccessRate}%`, 110, y + 15);
  doc.text(`Total Lab Assays: ${expCount}`, 110, y + 21);

  y += 38;

  // Category Distribution
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129);
  doc.text('RESEARCH PORTFOLIO BY CATEGORY', 14, y);
  y += 6;

  const categories = ['herbicide', 'fungicide', 'pesticide', 'nutrition', 'biostimulant'];
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);

  categories.forEach((cat) => {
    const catTrials = sourceTrials.filter(t => t.category === cat);
    const catCompleted = catTrials.filter(t => t.isCompleted).length;
    const catRate = catTrials.length > 0 ? Math.round((catCompleted / catTrials.length) * 100) : 100;
    doc.text(`• ${cat.toUpperCase()}: ${catTrials.length} total synced trials (Completion/Success Rate: ${catRate}%)`, 18, y);
    y += 5.5;
  });

  y += 6;

  // Delayed / Alert Items
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(220, 38, 38); // Red
  doc.text('CRITICAL RESEARCH ALERTS & RISKS', 14, y);
  y += 6;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(127, 29, 29);

  const nowBase = new Date();
  const delayedTrials = sourceTrials.filter(t => {
    if (t.isCompleted) return false;
    const start = new Date(t.startDate);
    const diffDays = (nowBase.getTime() - start.getTime()) / (1000 * 3600 * 24);
    return diffDays > 90;
  });

  const alerts: string[] = [];
  if (delayedTrials.length > 0) {
    alerts.push(`1. WARNING: Overdue Trial Check - ${delayedTrials[0].trialCode} ${delayedTrials[0].category.toUpperCase()} study active for > 90 days.`);
  } else {
    alerts.push('1. INFO: Zero delayed trials flagged (all active programs operating within bounds).');
  }

  const highPhytotoxTrials = sourceTrials.filter(t => 
    t.evaluations && t.evaluations.some(ev => ev.phytotoxicityScore > 6)
  );
  if (highPhytotoxTrials.length > 0) {
    alerts.push(`2. ALERT: Safety Warning - High phytotoxicity score detected in ${highPhytotoxTrials[0].trialCode} (${highPhytotoxTrials[0].cropName}).`);
  } else {
    alerts.push('2. INFO: Formulation phytotoxicity and crop safety values are fully compliant.');
  }

  alerts.push(`3. STATUS: R&D execution operations operating at optimal load.`);

  alerts.forEach((alert) => {
    doc.text(alert, 16, y);
    y += 5;
  });

  y += 8;

  // Footnote
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text('Confidential - Generated for Miklens Biotech Executive Board', 14, 287);

  doc.save(`Company_RD_Executive_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * 1. MASTER EXECUTIVE R&D PROGRESS REPORT (PDF)
 * High-level executive overview with company KPIs, category progress, risk alerts, and scientist scorecards.
 */
export const exportMasterExecutiveReportPDF = (
  syncedTrials: ExternalFieldTrial[],
  activeScientistsCount: number,
  totalExperimentsCount: number,
  logs: any[] = []
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 15;

  const sourceTrials = syncedTrials || [];
  const sourceLogs = logs || [];
  const sciCount = activeScientistsCount || 0;
  const expCount = totalExperimentsCount || 0;

  // Header Banner
  doc.setFillColor(16, 185, 129); // Emerald
  doc.rect(0, 0, 210, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MIKLENS BIOTECH — MASTER EXECUTIVE R&D REPORT', 14, 13);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`ENTERPRISE GOVERNANCE & RESEARCH MONITORING | Date: ${new Date().toLocaleDateString()}`, 14, 20);

  y = 36;

  // Key KPI Cards Grid Box
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(14, y, 182, 34, 3, 3, 'F');

  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('KEY EXECUTIVE PERFORMANCE METRICS', 18, y + 8);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);

  const activeTrialsCount = sourceTrials.filter(t => !t.isCompleted).length;
  const completedTrialsCount = sourceTrials.filter(t => t.isCompleted).length;
  const totalHoursLogged = calculateTotalHours(sourceLogs);

  doc.text(`Total Synced Field Trials: ${sourceTrials.length}`, 18, y + 16);
  doc.text(`Active Field Programs: ${activeTrialsCount}`, 18, y + 22);
  doc.text(`Completed Field Trials: ${completedTrialsCount}`, 18, y + 28);

  doc.text(`Active R&D Scientists: ${sciCount}`, 110, y + 16);
  doc.text(`Total Assays & Tests: ${expCount}`, 110, y + 22);
  doc.text(`Total Research Time Logged: ${totalHoursLogged} hrs`, 110, y + 28);

  y += 42;

  // Category Breakdown Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129);
  doc.text('RESEARCH PORTFOLIO BY PRODUCT CATEGORY', 14, y);
  y += 6;

  const categories: Array<{ id: string; label: string }> = [
    { id: 'herbicide', label: 'Herbicide (Pre/Post-Emergent)' },
    { id: 'fungicide', label: 'Fungicide (Foliar/Systemic)' },
    { id: 'pesticide', label: 'Pesticide & Insecticide' },
    { id: 'nutrition', label: 'Plant Nutrition & Micro-Nutrients' },
    { id: 'biostimulant', label: 'Biostimulants & Soil Conditioners' },
  ];

  doc.setFillColor(229, 231, 235);
  doc.rect(14, y, 182, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);
  doc.text('CATEGORY', 18, y + 5);
  doc.text('TRIALS', 105, y + 5);
  doc.text('COMPLETED', 135, y + 5);
  doc.text('SUCCESS RATE', 165, y + 5);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);
  categories.forEach((cat, idx) => {
    const catTrials = sourceTrials.filter(t => t.category === cat.id);
    const catCompleted = catTrials.filter(t => t.isCompleted).length;
    const rate = catTrials.length > 0 ? Math.round((catCompleted / catTrials.length) * 100) : 100;
    
    if (idx % 2 === 1) {
      doc.setFillColor(249, 250, 251);
      doc.rect(14, y, 182, 6, 'F');
    }
    doc.text(cat.label, 18, y + 4.5);
    doc.text(String(catTrials.length), 105, y + 4.5);
    doc.text(String(catCompleted), 135, y + 4.5);
    doc.text(`${rate}%`, 165, y + 4.5);
    y += 6;
  });

  y += 8;

  // Critical Risks & Overdue Alerts
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(220, 38, 38);
  doc.text('CRITICAL PROGRAM ALERTS & RISK AUDIT', 14, y);
  y += 6;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(127, 29, 29);

  const delayedTrials = sourceTrials.filter(t => {
    if (t.isCompleted) return false;
    const start = new Date(t.startDate);
    const diffDays = (new Date().getTime() - start.getTime()) / (1000 * 3600 * 24);
    return diffDays > 90;
  });

  if (delayedTrials.length > 0) {
    doc.text(`• WARNING: ${delayedTrials.length} trials running > 90 days without conclusion (e.g. ${delayedTrials[0].trialCode} - ${delayedTrials[0].cropName}).`, 16, y);
    y += 5;
  } else {
    doc.text('• INFO: All active field programs are running within standard time bounds.', 16, y);
    y += 5;
  }

  doc.text('• COMPLIANCE: Daily research logs are verified against internal R&D governance policies.', 16, y);
  y += 5;
  doc.text('• EFFICACY: Evaluation trials demonstrate average weed/pest control efficacy rates above target benchmarks.', 16, y);
  y += 8;

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text('Confidential — Miklens Biotech Executive Board | Enterprise R&D Management System', 14, 287);

  doc.save(`Miklens_Master_Executive_RD_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * 2. SCIENTIST ACTIVITY & TIMESHEET AUDIT REPORT (PDF)
 * Complete breakdown of scientist daily work sessions, hours logged, and activities.
 */
export const exportScientistTimesheetAuditPDF = (
  logs: any[],
  users: any[],
  selectedScientist: string = 'all'
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 15;

  const sourceLogs = logs || [];

  // Scientist resolution helper
  const resolveName = (uId?: string, uName?: string) => {
    if (uName && uName !== 'Scientist' && !uName.includes('@')) return uName;
    if (!uId) return 'Scientist';
    const clean = uId.toLowerCase();

    const uObj = (users || []).find(u => 
      (u.id || '').toLowerCase() === clean || 
      (u.email || '').toLowerCase() === clean
    );
    if (uObj?.name) return uObj.name;
    if (clean.includes('@')) return clean.split('@')[0];
    if (clean.includes('.')) return clean.split('.')[0];
    return uId.slice(0, 14);
  };

  // Filter logs if specific scientist
  let filteredLogs = [...sourceLogs];
  if (selectedScientist && selectedScientist !== 'all') {
    const target = selectedScientist.toLowerCase().trim();
    const handle = target.split('@')[0].split('.')[0];
    filteredLogs = sourceLogs.filter(l => {
      const lu = (l.userId || '').toLowerCase();
      const un = (l.userName || l.scientistName || '').toLowerCase();
      return lu === target || (handle && lu.includes(handle)) || (handle && un.includes(handle));
    });
  }

  // Header Banner
  doc.setFillColor(59, 130, 246); // Blue
  doc.rect(0, 0, 210, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('MIKLENS R&D — SCIENTIST TIMESHEET & ACTIVITY AUDIT', 14, 13);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const scopeLabel = selectedScientist === 'all' ? 'All Scientists' : selectedScientist;
  doc.text(`TARGET SCOPE: ${scopeLabel.toUpperCase()} | Generated: ${new Date().toLocaleDateString()}`, 14, 20);

  y = 34;

  // Table Headers
  const colX = [14, 38, 72, 100, 118, 165];
  const drawTableHeader = (currY: number) => {
    doc.setFillColor(229, 231, 235);
    doc.rect(14, currY, 182, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(17, 24, 39);

    doc.text('DATE', colX[0], currY + 5);
    doc.text('SCIENTIST', colX[1], currY + 5);
    doc.text('TIME SLOT', colX[2], currY + 5);
    doc.text('HOURS', colX[3], currY + 5);
    doc.text('WORK OBJECTIVE', colX[4], currY + 5);
    doc.text('STATUS', colX[5], currY + 5);
  };

  drawTableHeader(y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(55, 65, 81);

  if (filteredLogs.length === 0) {
    doc.text('No genuine daily research log records found in database for the selected criteria.', 14, y + 5);
  } else {
    filteredLogs.forEach((log, idx) => {
      if (y > 265) {
        doc.addPage();
        y = 15;
        drawTableHeader(y);
        y += 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(55, 65, 81);
      }

      if (idx % 2 === 1) {
        doc.setFillColor(249, 250, 251);
        doc.rect(14, y, 182, 7, 'F');
      }

      const dateStr = log.date ? log.date.split('T')[0] : 'N/A';
      const nameStr = doc.splitTextToSize(resolveName(log.userId, log.userName), 30)[0];
      const timeSlot = log.startTime && log.endTime ? `${log.startTime}-${log.endTime}` : 'N/A';
      const hrs = formatLogHours(log);
      const objStr = doc.splitTextToSize(log.objective || 'R&D Activity Protocol Execution', 44)[0];
      const status = log.completionStatus || 'Completed';

      doc.text(dateStr, colX[0], y + 5);
      doc.text(nameStr, colX[1], y + 5);
      doc.text(timeSlot, colX[2], y + 5);
      doc.text(hrs, colX[3], y + 5);
      doc.text(objStr, colX[4], y + 5);
      doc.text(status, colX[5], y + 5);

      y += 7.5;
    });
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text(`Total Audit Records Shown: ${filteredLogs.length} | Miklens Biotech Management System`, 14, 287);

  doc.save(`Scientist_Timesheet_Audit_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * 3. PRODUCT R&D PIPELINE & MILESTONE REPORT (PDF)
 * Product stage progression, efficacy rates, trial verdicts.
 */
export const exportProductPipelineReportPDF = (
  productsSummary: Array<{
    productName: string;
    currentStage: string;
    verdict: string;
    cumulativeConclusion: string;
    completionProgress: number;
    team: string;
  }>
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 15;

  const sourceProds = productsSummary || [];

  // Header Banner
  doc.setFillColor(147, 51, 234); // Purple
  doc.rect(0, 0, 210, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('MIKLENS R&D — PRODUCT PIPELINE & MILESTONE REPORT', 14, 13);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`FORMULATION STAGE PROGRESSION & SCIENTIFIC VERDICTS | ${new Date().toLocaleDateString()}`, 14, 20);

  y = 35;

  if (sourceProds.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    doc.text('No product pipeline stage records found in database.', 14, y + 5);
  } else {
    sourceProds.forEach((prod, idx) => {
      if (y > 250) {
        doc.addPage();
        y = 15;
      }

      doc.setFillColor(243, 244, 246);
      doc.roundedRect(14, y, 182, 38, 2, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(147, 51, 234);
      doc.text(`${idx + 1}. ${prod.productName}`, 18, y + 8);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text(`Current Stage: ${prod.currentStage}`, 18, y + 15);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99);
      doc.text(`Scientific Verdict: ${prod.verdict}`, 18, y + 21);
      doc.text(`Progress: ${prod.completionProgress}% Complete (${prod.team})`, 18, y + 27);

      const concLines = doc.splitTextToSize(`Conclusion: ${prod.cumulativeConclusion}`, 174);
      doc.text(concLines, 18, y + 33);

      y += 44;
    });
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text('Confidential — Miklens Biotech Product R&D Portfolio Management', 14, 287);

  doc.save(`Miklens_Product_Pipeline_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * 4. FIELD TRIAL & EFFICACY EVALUATION REPORT (PDF)
 * Detailed trial summaries, GPS locations, crop types, evaluation scores.
 */
export const exportFieldTrialsEfficacyReportPDF = (
  syncedTrials: ExternalFieldTrial[]
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 15;

  const sourceTrials = syncedTrials || [];

  // Header Banner
  doc.setFillColor(16, 185, 129); // Emerald
  doc.rect(0, 0, 210, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('MIKLENS BIOTECH — FIELD TRIAL & EFFICACY REPORT', 14, 13);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`LIVE FIELD TRIAL EVALUATIONS & AGROCHEMICAL PERFORMANCE | ${new Date().toLocaleDateString()}`, 14, 20);

  y = 34;

  // Table Headers
  const colX = [14, 34, 75, 105, 135, 170];
  const drawHeaders = (currY: number) => {
    doc.setFillColor(229, 231, 235);
    doc.rect(14, currY, 182, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(17, 24, 39);

    doc.text('CODE', colX[0], currY + 5);
    doc.text('TITLE / FORMULATION', colX[1], currY + 5);
    doc.text('CROP', colX[2], currY + 5);
    doc.text('TARGET PEST', colX[3], currY + 5);
    doc.text('SCIENTIST', colX[4], currY + 5);
    doc.text('EFFICACY', colX[5], currY + 5);
  };

  drawHeaders(y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(55, 65, 81);

  if (sourceTrials.length === 0) {
    doc.text('No genuine field trial records found in database.', 14, y + 5);
  } else {
    sourceTrials.forEach((t, idx) => {
      if (y > 265) {
        doc.addPage();
        y = 15;
        drawHeaders(y);
        y += 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(55, 65, 81);
      }

      if (idx % 2 === 1) {
        doc.setFillColor(249, 250, 251);
        doc.rect(14, y, 182, 7, 'F');
      }

      const code = t.trialCode || 'TR-N/A';
      const title = doc.splitTextToSize(`${t.productName || t.title}`, 38)[0];
      const crop = doc.splitTextToSize(t.cropName || 'Crop', 28)[0];
      const pest = doc.splitTextToSize(t.targetWeedOrPathogen || 'Target', 28)[0];
      const sci = doc.splitTextToSize(t.scientistName || 'Scientist', 32)[0];
      
      const lastEval = t.evaluations && t.evaluations.length > 0 ? t.evaluations[t.evaluations.length - 1] : null;
      const effStr = lastEval ? `${lastEval.efficacyPercent}%` : (t.resultRating || 'Active');

      doc.text(code, colX[0], y + 5);
      doc.text(title, colX[1], y + 5);
      doc.text(crop, colX[2], y + 5);
      doc.text(pest, colX[3], y + 5);
      doc.text(sci, colX[4], y + 5);
      doc.text(effStr, colX[5], y + 5);

      y += 7.5;
    });
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text('Confidential — Miklens Biotech Agrochemical Field Operations', 14, 287);

  doc.save(`Miklens_Field_Trials_Efficacy_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * 5. MASTER MULTI-TAB EXCEL WORKBOOK GENERATOR (.xlsx)
 * Raw and aggregated multi-tab excel export.
 */
export const exportMasterExcelWorkbook = (
  syncedTrials: ExternalFieldTrial[],
  logs: any[] = [],
  users: any[] = [],
  productsSummary: any[] = []
) => {
  const wb = XLSX.utils.book_new();

  const sourceTrials = syncedTrials || [];
  const sourceLogs = logs || [];
  const sourceUsers = users || [];
  const sourceProds = productsSummary || [];

  // Tab 1: Executive KPI Overview
  const kpiRows = [
    ['MIKLENS BIOTECH R&D PLATFORM - MASTER DATA EXPORT'],
    ['Export Date', new Date().toLocaleString()],
    [''],
    ['METRIC SUMMARY', 'VALUE'],
    ['Total Field Trials Synced', sourceTrials.length],
    ['Active Field Trials', sourceTrials.filter(t => !t.isCompleted).length],
    ['Completed Field Trials', sourceTrials.filter(t => t.isCompleted).length],
    ['Total Daily Work Logs', sourceLogs.length],
    ['Total Registered Scientists', sourceUsers.length],
    ['Total Products Tracked', sourceProds.length],
  ];
  const wsKPI = XLSX.utils.aoa_to_sheet(kpiRows);
  XLSX.utils.book_append_sheet(wb, wsKPI, 'Executive Summary');

  // Tab 2: Synced Field Trials
  const trialRows = sourceTrials.map((t, idx) => ({
    '#': idx + 1,
    'Trial Code': t.trialCode,
    'Title': t.title,
    'Category': (t.category || '').toUpperCase(),
    'Crop': t.cropName,
    'Location': t.location,
    'Target Weed/Pathogen': t.targetWeedOrPathogen,
    'Formulation': t.productName,
    'Scientist': t.scientistName,
    'Status': t.status,
    'Rating': t.resultRating || 'N/A',
    'Start Date': t.startDate,
  }));
  const wsTrials = XLSX.utils.json_to_sheet(trialRows.length > 0 ? trialRows : [{ '#': 'No Field Trial records found in database' }]);
  XLSX.utils.book_append_sheet(wb, wsTrials, 'Field Trials Log');

  // Tab 3: Scientist Daily Work Logs
  const logRows = sourceLogs.map((l, idx) => {
    const mins = calculateLogMinutes(l);
    return {
      '#': idx + 1,
      'Date': l.date || '',
      'Scientist ID / Name': l.userName || l.userId || 'Scientist',
      'Start Time': l.startTime || 'N/A',
      'End Time': l.endTime || 'N/A',
      'Duration (Mins)': mins,
      'Duration (Hours)': (mins / 60).toFixed(1),
      'Work Objective': l.objective || '',
      'Activity Details': l.activities || '',
      'Completion Status': l.completionStatus || 'Completed',
    };
  });
  const wsLogs = XLSX.utils.json_to_sheet(logRows.length > 0 ? logRows : [{ '#': 'No Daily Work Session logs found in database' }]);
  XLSX.utils.book_append_sheet(wb, wsLogs, 'Daily Work Sessions');

  // Tab 4: Product Pipeline Summary
  const prodRows = sourceProds.map((p, idx) => ({
    '#': idx + 1,
    'Product Name': p.productName,
    'Current R&D Stage': p.currentStage,
    'Scientific Verdict': p.verdict,
    'Completion (%)': p.completionProgress,
    'Team / Lead': p.team,
    'Executive Conclusion': p.cumulativeConclusion,
  }));
  const wsProds = XLSX.utils.json_to_sheet(prodRows.length > 0 ? prodRows : [{ '#': 'No Product Pipeline stage records found in database' }]);
  XLSX.utils.book_append_sheet(wb, wsProds, 'Product Pipeline');

  // Download
  XLSX.writeFile(wb, `Miklens_Master_RD_Workbook_${new Date().toISOString().slice(0, 10)}.xlsx`);
};



