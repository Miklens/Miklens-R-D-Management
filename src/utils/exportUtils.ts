// Export Utilities for PDF and Excel
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

// Types for export data
export interface ExportData {
  title: string;
  subtitle?: string;
  dateRangeText?: string;
  scopeText?: string;
  headers: string[];
  rows: (string | number | boolean | undefined)[][];
  sheetName?: string;
}

// Generate Beautiful Executive PDF from data
export const exportToPDF = (data: ExportData, filename?: string): void => {
  const doc = new jsPDF();
  
  // Page setup
  const pageWidth = doc.internal.pageSize.width;
  const margin = 14;

  // Header Branding Banner (Miklens Emerald Header)
  doc.setFillColor(5, 150, 105); // #059669 Emerald-600
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Company Brand Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('MIKLENS R&D MANAGEMENT | EXECUTIVE REPORT', margin, 18);

  // Document Title
  let y = 38;
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text(data.title, margin, y);

  // Subtitle / Scope
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text(`Generated: ${format(new Date(), 'PPpp')} • Scope: ${data.scopeText || 'All Scientists & Products'}`, margin, y);

  if (data.dateRangeText) {
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // Emerald-500
    doc.text(`Reporting Period: ${data.dateRangeText}`, margin, y);
  }

  y += 10;
  
  // Table Setup
  const colWidth = (pageWidth - 2 * margin) / data.headers.length;
  
  // Table Header Row
  doc.setFillColor(15, 23, 42); // Slate-900 Header
  doc.rect(margin, y - 5, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  
  data.headers.forEach((header, i) => {
    doc.text(header, margin + i * colWidth + 2, y);
  });
  
  y += 10;
  
  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  
  data.rows.forEach((row, rowIndex) => {
    // Check for page overflow
    if (y > 270) {
      doc.addPage();
      y = 20;

      // Re-draw header on new page
      doc.setFillColor(15, 23, 42);
      doc.rect(margin, y - 5, pageWidth - 2 * margin, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      data.headers.forEach((header, i) => {
        doc.text(header, margin + i * colWidth + 2, y);
      });
      y += 10;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
    }
    
    // Alternating Row Fill
    if (rowIndex % 2 === 0) {
      doc.setFillColor(241, 245, 249); // Slate-100
      doc.rect(margin, y - 4, pageWidth - 2 * margin, 7, 'F');
    }
    
    row.forEach((cell, colIndex) => {
      const cellValue = cell !== undefined ? String(cell) : '';
      const truncated = cellValue.length > 28 ? cellValue.substring(0, 25) + '...' : cellValue;
      doc.text(truncated, margin + colIndex * colWidth + 2, y);
    });
    
    y += 7;
  });
  
  // Page Numbers Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Miklens Bio-Tech Executive Audit • Page ${i} of ${pageCount}`, pageWidth / 2, 290, { align: 'center' });
  }
  
  doc.save(filename || `${data.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Generate Excel from data
export const exportToExcel = (data: ExportData | ExportData[], filename?: string): void => {
  const workbook = XLSX.utils.book_new();
  
  const datasets = Array.isArray(data) ? data : [data];
  
  datasets.forEach((sheetData, index) => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      sheetData.headers,
      ...sheetData.rows
    ]);
    
    // Set column widths
    const colWidths = sheetData.headers.map((h, i) => {
      const maxLength = Math.max(
        h.length,
        ...sheetData.rows.map(r => String(r[i] || '').length)
      );
      return { wch: Math.min(maxLength + 2, 50) };
    });
    worksheet['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      sheetData.sheetName || `Sheet${index + 1}`
    );
  });
  
  XLSX.writeFile(workbook, filename || `Export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Convert time entries to export format
export const formatTimeEntriesForExport = (entries: any[], type: 'pdf' | 'excel') => {
  const headers = ['Date', 'Start', 'End', 'Duration', 'Category', 'Description', 'Project', 'Location', 'Billable', 'Status'];
  
  const rows = entries.map(entry => [
    entry.date,
    entry.startTime || '',
    entry.endTime || '',
    entry.durationMinutes ? `${Math.floor(entry.durationMinutes / 60)}h ${entry.durationMinutes % 60}m` : '0m',
    entry.category || '',
    entry.description || '',
    entry.projectName || '-',
    entry.location || '-',
    entry.isBillable ? 'Yes' : 'No',
    entry.completionStatus?.replace('_', ' ') || 'logged'
  ]);
  
  return {
    title: 'Time Motion Report',
    headers,
    rows,
    sheetName: 'Time Entries'
  };
};

// Convert weekly summary to export format
export const formatWeeklySummaryForExport = (summary: any, type: 'pdf' | 'excel') => {
  const headers = ['Day', 'Hours', 'Activities'];
  const rows = Object.entries(summary.hoursByDay || {}).map(([date, minutes]: [string, any]) => [
    format(new Date(date), 'EEE, MMM d'),
    `${(minutes / 60).toFixed(1)}h`,
    summary.activitiesByType?.[date] || '-'
  ]);
  
  return {
    title: `Weekly Summary - ${format(new Date(summary.weekStart), 'MMM d')} to ${format(new Date(summary.weekEnd), 'MMM d, yyyy')}`,
    headers,
    rows,
    sheetName: 'Weekly Summary'
  };
};

// Convert dashboard stats to export format
export const formatDashboardStatsForExport = (stats: any, type: 'pdf' | 'excel') => {
  const headers = ['Metric', 'Value'];
  const rows = [
    ['Total Hours This Month', `${stats.totalHoursThisMonth?.toFixed(1) || 0}h`],
    ['Total Hours This Week', `${stats.totalHoursThisWeek?.toFixed(1) || 0}h`],
    ['Average Daily Hours', `${stats.averageDailyHours?.toFixed(1) || 0}h`],
    ['Activities This Month', stats.totalActivitiesThisMonth?.toString() || '0'],
    ['Active Projects', stats.activeProjectsCount?.toString() || '0'],
    ['Experiments Worked On', stats.experimentsWorkedOn?.toString() || '0'],
    ['Field Days This Month', stats.fieldDaysThisMonth?.toString() || '0'],
    ['Lab Days This Month', stats.labDaysThisMonth?.toString() || '0'],
    ['Tasks Completed', stats.tasksCompleted?.toString() || '0'],
    ['Tasks Pending', stats.tasksPending?.toString() || '0'],
    ['Billable Hours', `${stats.billableHoursThisMonth?.toFixed(1) || 0}h`],
    ['Billable Percentage', `${stats.billablePercentage || 0}%`],
    ['Documents Created', stats.documentsCreated?.toString() || '0']
  ];
  
  return {
    title: 'Performance Dashboard',
    headers,
    rows,
    sheetName: 'Dashboard Stats'
  };
};

// Quick export wrapper
export const quickExport = (data: ExportData, formatType: 'pdf' | 'excel', customFilename?: string) => {
  if (formatType === 'pdf') {
    exportToPDF(data, customFilename);
  } else {
    exportToExcel(data, customFilename);
  }
};