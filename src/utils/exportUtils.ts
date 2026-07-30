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

// Format raw ISO date strings cleanly to YYYY-MM-DD
export const formatCleanDate = (val: string | undefined): string => {
  if (!val) return '-';
  if (val.includes('T')) return val.split('T')[0];
  return val;
};

// Generate Beautiful Executive PDF in Wide Landscape Mode with Multi-Line Text & Header Wrapping (Zero Overlap)
export const exportToPDF = (data: ExportData, filename?: string): void => {
  // Use Landscape orientation for multi-column management reports
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  
  // Page setup (Landscape A4: 297mm width x 210mm height)
  const pageWidth = doc.internal.pageSize.width; // 297 mm
  const pageHeight = doc.internal.pageSize.height; // 210 mm
  const margin = 12;
  const contentWidth = pageWidth - 2 * margin; // 273 mm

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
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text(data.title, margin, y);

  // Subtitle / Scope
  y += 6;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text(`Generated: ${format(new Date(), 'PPpp')} • Scope: ${data.scopeText || 'All Scientists & Products'}`, margin, y);

  if (data.dateRangeText) {
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // Emerald-500
    doc.text(`Reporting Period: ${data.dateRangeText}`, margin, y);
  }

  y += 9;
  
  // Column Width Proportions for Landscape A4 (273mm total)
  // For 6 columns: Date (32mm), Scientist (45mm), Product (55mm), Hours (25mm), Work Log (88mm), Status (28mm) = 273mm
  const numCols = data.headers.length;
  let colWidths: number[] = [];

  if (numCols === 6) {
    colWidths = [32, 45, 55, 25, 88, 28];
  } else if (numCols === 5) {
    colWidths = [52, 48, 42, 88, 43];
  } else {
    const avg = contentWidth / numCols;
    colWidths = Array(numCols).fill(avg);
  }

  // Wrap Table Headers into lines to prevent title text collisions
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');

  const wrappedHeaderLines = data.headers.map((h, i) => {
    const w = (colWidths[i] || 30) - 4;
    return doc.splitTextToSize(h, w);
  });

  const maxHeaderLines = Math.max(...wrappedHeaderLines.map((lines) => lines.length), 1);
  const headerHeight = Math.max(9, maxHeaderLines * 4.2 + 3);

  // Helper to draw Table Headers
  const drawTableHeader = (startY: number) => {
    doc.setFillColor(15, 23, 42); // Slate-900 Header
    doc.rect(margin, startY - 4, contentWidth, headerHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');

    let currentX = margin;
    wrappedHeaderLines.forEach((lines: string[], i: number) => {
      const w = colWidths[i] || 30;
      lines.forEach((line: string, lineIdx: number) => {
        doc.text(line, currentX + 2, startY + lineIdx * 4);
      });
      currentX += w;
    });
  };

  // Draw initial Table Header
  drawTableHeader(y);
  y += headerHeight + 3;
  
  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  
  if (data.rows.length === 0) {
    // Render Fallback Empty Row
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y - 4, contentWidth, 10, 'F');
    doc.text('No activity records logged within selected date range and filter criteria.', margin + 4, y + 2);
    y += 12;
  } else {
    data.rows.forEach((row, rowIndex) => {
      // Clean up dates & raw strings in row cells
      const processedCells = row.map((cell, colIdx) => {
        let str = cell !== undefined ? String(cell) : '';
        if (colIdx === 0 && str.includes('T')) str = str.split('T')[0]; // Format dates
        return str;
      });

      // Wrap text for each cell based on column width
      const cellLineArrays = processedCells.map((text, colIdx) => {
        const w = (colWidths[colIdx] || 30) - 4;
        return doc.splitTextToSize(text, w);
      });

      // Calculate maximum row height needed based on lines
      const maxLines = Math.max(...cellLineArrays.map((lines) => lines.length), 1);
      const rowHeight = Math.max(8, maxLines * 4.2 + 3);

      // Check for page overflow before drawing row
      if (y + rowHeight > pageHeight - 15) {
        doc.addPage();
        y = 18;
        drawTableHeader(y);
        y += headerHeight + 3;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
      }

      // Alternate Row Shading
      if (rowIndex % 2 === 0) {
        doc.setFillColor(241, 245, 249); // Slate-100
        doc.rect(margin, y - 4, contentWidth, rowHeight, 'F');
      }

      // Render cells in row
      let currentX = margin;
      cellLineArrays.forEach((lines, colIdx) => {
        const w = colWidths[colIdx] || 30;
        lines.forEach((line: string, lineIdx: number) => {
          doc.text(line, currentX + 2, y + lineIdx * 4);
        });
        currentX += w;
      });

      y += rowHeight;
    });
  }
  
  // Page Numbers Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Miklens Bio-Tech Executive Audit • Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 6, { align: 'center' });
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
      ...sheetData.rows.map((r) =>
        r.map((cell, colIdx) => {
          let val = cell !== undefined ? String(cell) : '';
          if (colIdx === 0 && val.includes('T')) val = val.split('T')[0];
          return val;
        })
      ),
    ]);
    
    // Set column widths
    const colWidths = sheetData.headers.map((h, i) => {
      const maxLength = Math.max(
        h.length,
        ...sheetData.rows.map((r) => String(r[i] || '').length)
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
    formatCleanDate(entry.date),
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
    formatCleanDate(date),
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