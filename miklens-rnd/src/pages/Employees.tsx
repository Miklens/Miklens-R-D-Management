import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Download, FileSpreadsheet, Calendar, Search, Filter, X, Users, Clock, FileText, ChevronDown } from 'lucide-react';
import { useUsers } from '../hooks/useUsers';
import { useDailyLogs } from '../hooks/useDailyLogs';
import { getEntriesByScientist, getEntriesByScientistAndDateRange } from '../services/timeTracking';
import { useAuth } from '../contexts/AuthContext';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export const Employees: React.FC = () => {
  const { data: users, isLoading } = useUsers();
  const { data: logs } = useDailyLogs();
  const { userRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isExporting, setIsExporting] = useState(false);
  const [employeeTimeEntries, setEmployeeTimeEntries] = useState<any[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  const employees = users?.filter(u => u.isActive) || [];

  const filteredEmployees = employees.filter(emp => 
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isManagement = userRole === 'Admin' || userRole === 'Management';

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'week': return { start: subDays(now, 7), end: now };
      case 'month': return { start: subDays(now, 30), end: now };
      case 'quarter': return { start: subDays(now, 90), end: now };
      case 'custom': return { start: new Date(customStartDate), end: new Date(customEndDate) };
    }
  };

  const openExportModal = async (employee: any) => {
    setSelectedEmployee(employee);
    setShowExportModal(true);
    setLoadingEntries(true);
    
    try {
      const { start, end } = getDateRange();
      const entries = await getEntriesByScientistAndDateRange(
        employee.id,
        format(start, 'yyyy-MM-dd'),
        format(end, 'yyyy-MM-dd')
      );
      setEmployeeTimeEntries(entries);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoadingEntries(false);
    }
  };

  const handleExportPDF = async () => {
    if (!selectedEmployee) return;
    setIsExporting(true);
    
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const { start, end } = getDateRange();
      
      // Title
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('Employee Activity Report', 14, 22);
      
      // Employee Info
      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      doc.text(`Employee: ${selectedEmployee.name}`, 14, 35);
      doc.text(`Designation: ${selectedEmployee.designation || 'N/A'}`, 14, 42);
      doc.text(`Department: ${selectedEmployee.department || 'N/A'}`, 14, 49);
      doc.text(`Email: ${selectedEmployee.email}`, 14, 56);
      doc.text(`Period: ${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`, 14, 63);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 70);
      
      // Summary Stats
      const totalMinutes = employeeTimeEntries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
      const totalHours = (totalMinutes / 60).toFixed(1);
      const daysWorked = new Set(employeeTimeEntries.map(e => e.date)).size;
      
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('Summary', 14, 85);
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`Total Hours Logged: ${totalHours}h`, 14, 95);
      doc.text(`Days Worked: ${daysWorked}`, 14, 102);
      doc.text(`Total Activities: ${employeeTimeEntries.length}`, 14, 109);
      
      // Time Entries Table
      let y = 125;
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('Time Entries', 14, y);
      y += 10;
      
      // Table Header
      doc.setFillColor(66, 66, 66);
      doc.rect(14, y - 5, 180, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text('Date', 16, y);
      doc.text('Category', 50, y);
      doc.text('Duration', 95, y);
      doc.text('Description', 120, y);
      
      y += 10;
      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'normal');
      
      // Table Rows
      employeeTimeEntries.slice(0, 30).forEach((entry) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        const duration = entry.durationMinutes ? `${Math.floor(entry.durationMinutes / 60)}h ${entry.durationMinutes % 60}m` : '-';
        const desc = (entry.description || '').substring(0, 40);
        
        doc.text(entry.date || '-', 16, y);
        doc.text(entry.category || '-', 50, y);
        doc.text(duration, 95, y);
        doc.text(desc, 120, y);
        y += 7;
      });
      
      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        doc.text('Miklens R&D Management System', 14, 290);
      }
      
      doc.save(`Employee_Report_${selectedEmployee.name.replace(/\s+/g, '_')}_${format(start, 'yyyy-MM-dd')}_to_${format(end, 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (!selectedEmployee) return;
    setIsExporting(true);
    
    try {
      const { default: XLSX } = await import('xlsx');
      const { start, end } = getDateRange();
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Sheet 1: Employee Info
      const empInfo = [
        ['Employee Activity Report'],
        [''],
        ['Employee Name', selectedEmployee.name],
        ['Designation', selectedEmployee.designation || 'N/A'],
        ['Department', selectedEmployee.department || 'N/A'],
        ['Email', selectedEmployee.email],
        ['Report Period', `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`],
        ['Generated', new Date().toLocaleString()],
        [''],
        ['Summary'],
        ['Total Hours', (employeeTimeEntries.reduce((s, e) => s + (e.durationMinutes || 0), 0) / 60).toFixed(1) + 'h'],
        ['Days Worked', new Set(employeeTimeEntries.map(e => e.date)).size.toString()],
        ['Total Activities', employeeTimeEntries.length.toString()]
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(empInfo);
      XLSX.utils.book_append_sheet(wb, ws1, 'Employee Info');
      
      // Sheet 2: Time Entries
      const timeData = [['Date', 'Start Time', 'End Time', 'Duration (min)', 'Category', 'Description', 'Project', 'Billable']];
      employeeTimeEntries.forEach(entry => {
        timeData.push([
          entry.date || '',
          entry.startTime || '',
          entry.endTime || '',
          entry.durationMinutes?.toString() || '0',
          entry.category || '',
          entry.description || '',
          entry.projectName || '-',
          entry.isBillable ? 'Yes' : 'No'
        ]);
      });
      const ws2 = XLSX.utils.aoa_to_sheet(timeData);
      ws2['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 40 }, { wch: 20 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'Time Entries');
      
      // Sheet 3: Daily Summary
      const dailySummary: Record<string, { minutes: number; count: number }> = {};
      employeeTimeEntries.forEach(entry => {
        if (!dailySummary[entry.date]) {
          dailySummary[entry.date] = { minutes: 0, count: 0 };
        }
        dailySummary[entry.date].minutes += entry.durationMinutes || 0;
        dailySummary[entry.date].count += 1;
      });
      
      const summaryData = [['Date', 'Total Hours', 'Activities']];
      Object.entries(dailySummary).sort().forEach(([date, data]) => {
        summaryData.push([
          date,
          (data.minutes / 60).toFixed(1) + 'h',
          data.count.toString()
        ]);
      });
      const ws3 = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws3, 'Daily Summary');
      
      XLSX.writeFile(wb, `Employee_Report_${selectedEmployee.name.replace(/\s+/g, '_')}_${format(start, 'yyyy-MM-dd')}_to_${format(end, 'yyyy-MM-dd')}.xlsx`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export Excel');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Employees</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {employees.length} team member{employees.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/20">
            <Users className="w-5 h-5" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
        />
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((employee) => {
          const logCount = logs?.filter(l => l.userId === employee.id).length || 0;
          
          return (
            <motion.div
              key={employee.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden"
            >
              <Link to={`/profile/${employee.id}`} className="block p-5">
                <div className="flex items-start gap-4">
                  <img
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg"
                    src={employee.avatar || `https://i.pravatar.cc/150?u=${employee.id}`}
                    alt={employee.name}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{employee.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{employee.designation}</p>
                    <span className="inline-flex items-center mt-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                      {employee.department || 'General'}
                    </span>
                  </div>
                </div>
                
                {employee.skills && employee.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {employee.skills.slice(0, 3).map((skill) => (
                      <span key={skill} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                    {employee.skills.length > 3 && (
                      <span className="px-2 py-0.5 text-gray-400 text-xs">+{employee.skills.length - 3}</span>
                    )}
                  </div>
                )}
              </Link>
              
              <div className="border-t border-gray-100 dark:border-gray-800">
                <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-800">
                  <a 
                    href={`mailto:${employee.email}`} 
                    className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </a>
                  {isManagement && (
                    <button
                      onClick={() => openExportModal(employee)}
                      className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && selectedEmployee && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowExportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Export Employee Data</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedEmployee.name}</p>
                  </div>
                  <button onClick={() => setShowExportModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Date Range Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Date Range</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: 'week', label: 'Last 7 Days' },
                      { value: 'month', label: 'Last 30 Days' },
                      { value: 'quarter', label: 'Last 90 Days' },
                      { value: 'custom', label: 'Custom' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setDateRange(option.value as any)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          dateRange === option.value
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Custom Date Range */}
                {dateRange === 'custom' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                      />
                    </div>
                  </div>
                )}
                
                {/* Preview Stats */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview</h4>
                  {loadingEntries ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      Loading data...
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {(employeeTimeEntries.reduce((s, e) => s + (e.durationMinutes || 0), 0) / 60).toFixed(1)}h
                        </p>
                        <p className="text-xs text-gray-500">Total Hours</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {new Set(employeeTimeEntries.map(e => e.date)).size}
                        </p>
                        <p className="text-xs text-gray-500">Days Worked</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {employeeTimeEntries.length}
                        </p>
                        <p className="text-xs text-gray-500">Activities</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Export Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleExportPDF}
                    disabled={isExporting || loadingEntries}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    <Download className="w-5 h-5" />
                    Download PDF
                  </button>
                  <button
                    onClick={handleExportExcel}
                    disabled={isExporting || loadingEntries}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-5 h-5" />
                    Download Excel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};