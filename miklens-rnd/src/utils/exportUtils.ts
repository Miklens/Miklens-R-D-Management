// Export Utilities for PDF and Excel
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

// Types for export data
export interface ExportData {
  title: string;
  headers: string[];
  rows: (string | number | boolean | undefined)[][];
  sheetName?: string;
}

// Generate PDF from data
export const exportToPDF = (data: ExportData, filename?: string): void => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text(data.title, 14, 22);
  
  // Date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 14, 30);
  
  // Table
  let y = 40;
  const margin = 14;
  const pageWidth = doc.internal.pageSize.width;
  const colWidth = (pageWidth - 2 * margin) / data.headers.length;
  
  // Headers
  doc.setFillColor(66, 66, 66);
  doc.rect(margin, y - 5, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  data.headers.forEach((header, i) => {
    doc.text(header, margin + i * colWidth + 2, y);
  });
  
  y += 10;
  
  // Rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  
  data.rows.forEach((row, rowIndex) => {
    // Check if we need a new page
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    
    // Alternate row colors
    if (rowIndex % 2 === 0) {
      doc.setFillColor(248, 248, 248);
      doc.rect(margin, y - 4, pageWidth - 2 * margin, 7, 'F');
    }
    
    row.forEach((cell, colIndex) => {
      const cellValue = cell !== undefined ? String(cell) : '';
      const truncated = cellValue.length > 30 ? cellValue.substring(0, 27) + '...' : cellValue;
      doc.text(truncated, margin + colIndex * colWidth + 2, y);
    });
    
    y += 7;
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 290, { align: 'center' });
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

// Employee performance report
export const formatEmployeeReportForExport = (employee: any, stats: any, entries: any[], type: 'pdf' | 'excel') => {
  const sheets: ExportData[] = [
    {
      title: 'Employee Profile',
      headers: ['Field', 'Value'],
      rows: [
        ['Name', employee.name || ''],
        ['Designation', employee.designation || ''],
        ['Department', employee.department || ''],
        ['Email', employee.email || ''],
        ['Skills', employee.skills?.join(', ') || '']
      ],
      sheetName: 'Profile'
    },
    {
      title: 'Performance Summary',
      headers: ['Metric', 'Value'],
      rows: [
        ['Total Hours', `${stats.totalHoursThisMonth?.toFixed(1) || 0}h`],
        ['Active Projects', stats.activeProjectsCount?.toString() || '0'],
        ['Experiments', stats.experimentsWorkedOn?.toString() || '0'],
        ['Tasks Completed', stats.tasksCompleted?.toString() || '0'],
        ['Field Days', stats.fieldDaysThisMonth?.toString() || '0'],
        ['Lab Days', stats.labDaysThisMonth?.toString() || '0'],
        ['Billable %', `${stats.billablePercentage || 0}%`]
      ],
      sheetName: 'Performance'
    },
    formatTimeEntriesForExport(entries, type)
  ];
  
  return sheets;
};

// Project report
export const formatProjectReportForExport = (project: any, entries: any[], type: 'pdf' | 'excel') => {
  return {
    title: `Project Report - ${project.name}`,
    headers: ['Date', 'Scientist', 'Hours', 'Activity', 'Description', 'Status'],
    rows: entries.map((entry: any) => [
      entry.date,
      entry.scientistName || '',
      entry.durationMinutes ? `${(entry.durationMinutes / 60).toFixed(1)}h` : '0h',
      entry.category || '',
      entry.description || '',
      entry.completionStatus?.replace('_', ' ') || ''
    ]),
    sheetName: project.name.substring(0, 30)
  };
};

// Quick export wrapper
export const quickExport = (data: ExportData, format: 'pdf' | 'excel', customFilename?: string) => {
  if (format === 'pdf') {
    exportToPDF(data, customFilename);
  } else {
    exportToExcel(data, customFilename);
  }
};