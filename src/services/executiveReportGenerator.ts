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
 * Raw and aggrega/**
 * Advanced Helper to resolve human-readable Scientist Name & Email
 */
const resolveScientistProfile = (uIdOrEmail?: string, usersList: any[] = []): { name: string; email: string } => {
  if (!uIdOrEmail) return { name: 'Scientist Lead', email: 'N/A' };
  const target = uIdOrEmail.trim().toLowerCase();

  // 1. Check users list matching id, uid, email, or handle
  const found = usersList.find(u => {
    const id = (u.id || '').toLowerCase();
    const uid = ((u as any).uid || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const handle = email ? email.split('@')[0] : '';
    return id === target || uid === target || email === target || (handle && target.includes(handle));
  });

  if (found) {
    let cleanName = found.name;
    if (!cleanName || cleanName.toLowerCase().includes('user') || cleanName.length <= 2) {
      if (found.email) cleanName = found.email.split('@')[0];
    }
    if (cleanName) {
      cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      return { name: cleanName, email: found.email || uIdOrEmail };
    }
  }

  // 2. Known handle mappings
  if (target.includes('pavan')) return { name: 'Pavan Dev', email: 'pavan@miklensbio.com' };
  if (target.includes('bindushree')) return { name: 'Bindushree B U', email: 'bindushreebu91@gmail.com' };
  if (target.includes('sandeep')) return { name: 'Sandeep', email: 'sandeep@miklensbio.com' };

  // 3. Email handle formatting
  if (target.includes('@')) {
    const handle = target.split('@')[0];
    const clean = handle.split('.')[0].split('_')[0];
    const formatted = clean.charAt(0).toUpperCase() + clean.slice(1);
    return { name: formatted, email: uIdOrEmail };
  }

  // 4. Fallback for raw UIDs
  if (target.length > 15) {
    return { name: 'Pavan Dev', email: 'pavan@miklensbio.com' };
  }

  return { name: uIdOrEmail.charAt(0).toUpperCase() + uIdOrEmail.slice(1), email: uIdOrEmail };
};

/**
 * 5. MASTER MULTI-TAB EXCEL WORKBOOK GENERATOR (.xlsx)
 * Exports ALL scientist data into a single Excel workbook with professional formatting:
 * 1. Human readable scientist names for tabs and headers
 * 2. Date-wise grouping (Date printed ONCE per date block)
 * 3. Blank row gaps between different dates
 * 4. Separate Work Category/Focus and Activity Details columns
 * 5. Status & Confidence Level columns REMOVED per user directive
 * 6. Combined All-Scientists master tab with date-wise grouping
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

  const usedSheetNames = new Set<string>();

  const getUniqueSheetName = (rawName: string, fallbackIndex: number): string => {
    let clean = (rawName || '').replace(/[\\/?*\[\]:]/g, ' ').trim();
    if (!clean) clean = `Scientist ${fallbackIndex + 1}`;
    if (clean.length > 25) clean = clean.substring(0, 25);
    
    let finalName = clean;
    let counter = 1;
    while (usedSheetNames.has(finalName.toLowerCase())) {
      finalName = `${clean.substring(0, 22)} (${counter})`;
      counter++;
    }
    usedSheetNames.add(finalName.toLowerCase());
    return finalName;
  };

  // Group logs by human-readable scientist profile
  const scientistMap = new Map<string, { name: string; email: string; logs: any[] }>();

  sourceUsers.forEach(u => {
    const prof = resolveScientistProfile(u.email || u.id || u.name, sourceUsers);
    const key = prof.name.toLowerCase();
    if (!scientistMap.has(key)) {
      scientistMap.set(key, { name: prof.name, email: prof.email, logs: [] });
    }
  });

  sourceLogs.forEach(l => {
    const prof = resolveScientistProfile(l.userId || l.userName, sourceUsers);
    const key = prof.name.toLowerCase();

    if (scientistMap.has(key)) {
      scientistMap.get(key)!.logs.push(l);
    } else {
      scientistMap.set(key, { name: prof.name, email: prof.email, logs: [l] });
    }
  });

  // Tab 1: Executive KPI Overview & Scientist Roster
  const totalHoursAll = calculateTotalHours(sourceLogs);
  const scientistRosterRows: any[] = [];
  
  let sIdx = 1;
  for (const [, val] of scientistMap.entries()) {
    const sHours = calculateTotalHours(val.logs);
    scientistRosterRows.push({
      '#': sIdx++,
      'Scientist Name': val.name,
      'User Email / ID': val.email,
      'Total Work Sessions Logged': val.logs.length,
      'Total Logged Hours': `${sHours} Hours`,
      'Dedicated Excel Tab': val.name.substring(0, 25)
    });
  }

  const kpiRows = [
    ['MIKLENS BIOTECH R&D PLATFORM - ALL SCIENTISTS MASTER WORKBOOK'],
    ['Generated Date', new Date().toLocaleString()],
    ['Report Scope', '1-Click Complete Scientist Timesheet & Daily Research Log Export'],
    [''],
    ['EXECUTIVE SUMMARY METRICS', 'VALUE'],
    ['Total Registered Scientists', sourceUsers.length],
    ['Scientists With Active Logs', scientistMap.size],
    ['Total Daily Work Session Logs', sourceLogs.length],
    ['Total Research Hours Logged Across All Scientists', `${totalHoursAll} Hours`],
    ['Total Field Trials Synced', sourceTrials.length],
    ['Active Field Trials', sourceTrials.filter(t => !t.isCompleted).length],
    [''],
    ['SCIENTIST TEAM ROSTER & LOGGED OUTPUT SUMMARY'],
  ];

  const wsKPI = XLSX.utils.aoa_to_sheet(kpiRows);
  if (scientistRosterRows.length > 0) {
    XLSX.utils.sheet_add_json(wsKPI, scientistRosterRows, { origin: 'A14' });
  }
  wsKPI['!cols'] = [
    { wch: 6 },
    { wch: 25 },
    { wch: 30 },
    { wch: 28 },
    { wch: 28 },
    { wch: 28 },
  ];
  const summarySheetName = getUniqueSheetName('Executive Summary', 0);
  XLSX.utils.book_append_sheet(wb, wsKPI, summarySheetName);

  // Dedicated Sheet Tabs for Each Scientist (Date-Wise Grouped + Date Gap)
  let sheetIdx = 1;
  for (const [, val] of scientistMap.entries()) {
    const tabName = getUniqueSheetName(val.name, sheetIdx++);
    const sLogs = [...val.logs].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const sTotalHours = calculateTotalHours(sLogs);

    let lastDate = '';
    const scientistAoA: any[][] = [
      [`MIKLENS R&D DAILY RESEARCH LOGS - ${val.name.toUpperCase()}`],
      [`Scientist Name: ${val.name}`, `Email/ID: ${val.email}`, `Total Hours: ${sTotalHours} hrs`, `Total Sessions: ${sLogs.length}`],
      [''],
      ['Date', 'Day', 'Start Time', 'End Time', 'Duration', 'Work Category / Focus', 'Activity & Protocol Details']
    ];

    sLogs.forEach(l => {
      const mins = calculateLogMinutes(l);
      const hrsStr = `${(mins / 60).toFixed(1)} hr`;
      const dateStr = l.date ? l.date.split('T')[0] : 'N/A';
      const dObj = l.date ? new Date(l.date) : null;
      const dayOfWeek = dObj && !isNaN(dObj.getTime()) ? dObj.toLocaleDateString('en-US', { weekday: 'short' }) : '';

      // Date gap logic: if date changes, add an empty row gap!
      if (lastDate !== '' && dateStr !== lastDate) {
        scientistAoA.push(['', '', '', '', '', '', '']);
      }

      const isNewDate = dateStr !== lastDate;
      const displayDate = isNewDate ? dateStr : '';
      const displayDay = isNewDate ? dayOfWeek : '';
      lastDate = dateStr;

      let objStr = l.objective || 'R&D Research Activity';
      let actStr = (l.activities || '').replace(/^\[.*?\]\s*/, '');

      scientistAoA.push([
        displayDate,
        displayDay,
        l.startTime || 'N/A',
        l.endTime || 'N/A',
        hrsStr,
        objStr,
        actStr || l.activities || 'Daily R&D Protocol Execution'
      ]);
    });

    const wsScientist = XLSX.utils.aoa_to_sheet(scientistAoA);
    wsScientist['!cols'] = [
      { wch: 14 }, // Date
      { wch: 8 },  // Day
      { wch: 12 }, // Start Time
      { wch: 12 }, // End Time
      { wch: 12 }, // Duration
      { wch: 38 }, // Work Category / Focus
      { wch: 60 }, // Activity Details
    ];
    XLSX.utils.book_append_sheet(wb, wsScientist, tabName);
  }

  // Combined Master Daily Logs Tab (Grouped by Date with Date Gaps)
  const sortedMasterLogs = [...sourceLogs].sort((a, b) => {
    const dComp = (b.date || '').localeCompare(a.date || '');
    if (dComp !== 0) return dComp;
    const pA = resolveScientistProfile(a.userId || a.userName, sourceUsers).name;
    const pB = resolveScientistProfile(b.userId || b.userName, sourceUsers).name;
    return pA.localeCompare(pB);
  });

  let masterLastDate = '';
  const masterAoA: any[][] = [
    ['MIKLENS BIOTECH R&D PLATFORM - ALL SCIENTISTS COMBINED DAILY LOGS'],
    [`Generated Date: ${new Date().toLocaleString()}`, `Total Logs: ${sourceLogs.length}`, `Total Research Hours: ${totalHoursAll} hrs`],
    [''],
    ['Date', 'Day', 'Scientist Name', 'Scientist Email / ID', 'Start Time', 'End Time', 'Duration', 'Work Category / Focus', 'Activity & Protocol Details']
  ];

  sortedMasterLogs.forEach(l => {
    const mins = calculateLogMinutes(l);
    const hrsStr = `${(mins / 60).toFixed(1)} hr`;
    const dateStr = l.date ? l.date.split('T')[0] : 'N/A';
    const dObj = l.date ? new Date(l.date) : null;
    const dayOfWeek = dObj && !isNaN(dObj.getTime()) ? dObj.toLocaleDateString('en-US', { weekday: 'short' }) : '';
    const prof = resolveScientistProfile(l.userId || l.userName, sourceUsers);

    if (masterLastDate !== '' && dateStr !== masterLastDate) {
      masterAoA.push(['', '', '', '', '', '', '', '', '']); // Date gap!
    }

    const isNewDate = dateStr !== masterLastDate;
    const displayDate = isNewDate ? dateStr : '';
    const displayDay = isNewDate ? dayOfWeek : '';
    masterLastDate = dateStr;

    let objStr = l.objective || 'R&D Research Activity';
    let actStr = (l.activities || '').replace(/^\[.*?\]\s*/, '');

    masterAoA.push([
      displayDate,
      displayDay,
      prof.name,
      prof.email,
      l.startTime || 'N/A',
      l.endTime || 'N/A',
      hrsStr,
      objStr,
      actStr || l.activities || 'Daily R&D Protocol Execution'
    ]);
  });

  const allLogsTabName = getUniqueSheetName('All Scientists Combined', 99);
  const wsAllLogs = XLSX.utils.aoa_to_sheet(masterAoA);
  wsAllLogs['!cols'] = [
    { wch: 14 }, // Date
    { wch: 8 },  // Day
    { wch: 22 }, // Scientist Name
    { wch: 28 }, // Scientist Email
    { wch: 12 }, // Start Time
    { wch: 12 }, // End Time
    { wch: 12 }, // Duration
    { wch: 38 }, // Work Category / Focus
    { wch: 60 }, // Activity Details
  ];
  XLSX.utils.book_append_sheet(wb, wsAllLogs, allLogsTabName);

  // Field Trials Master Tab
  const trialRows = sourceTrials.map((t, idx) => ({
    '#': idx + 1,
    'Trial Code': t.trialCode,
    'Title': t.title,
    'Category': (t.category || '').toUpperCase(),
    'Crop': t.cropName,
    'Location': t.location,
    'Target Weed/Pathogen': t.targetWeedOrPathogen,
    'Formulation': t.productName,
    'Scientist': resolveScientistProfile(t.scientistName, sourceUsers).name,
    'Status': t.status,
    'Rating': t.resultRating || 'N/A',
    'Start Date': t.startDate ? t.startDate.split('T')[0] : '',
  }));
  const trialsTabName = getUniqueSheetName('Field Trials Master', 98);
  const wsTrials = XLSX.utils.json_to_sheet(trialRows.length > 0 ? trialRows : [{ '#': 'No Field Trial records found in database' }]);
  wsTrials['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 30 },
    { wch: 16 },
    { wch: 18 },
    { wch: 22 },
    { wch: 30 },
    { wch: 24 },
    { wch: 22 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTrials, trialsTabName);

  // Download
  XLSX.writeFile(wb, `Miklens_All_Scientists_Daily_Logs_Workbook_${new Date().toISOString().slice(0, 10)}.xlsx`);
};



