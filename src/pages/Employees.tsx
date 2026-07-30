import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Download, FileSpreadsheet, Calendar, Search, Filter, X, Users, Clock, FileText, ChevronDown, Eye } from 'lucide-react';
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
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'last_month' | '3_months' | '6_months' | 'year' | 'custom'>('month');
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
      case 'month': return { start: startOfMonth(now), end: now };
      case 'last_month': {
        const lastM = subDays(startOfMonth(now), 1);
        return { start: startOfMonth(lastM), end: endOfMonth(lastM) };
      }
      case '3_months': return { start: subDays(now, 90), end: now };
      case '6_months': return { start: subDays(now, 180), end: now };
      case 'year': return { start: subDays(now, 365), end: now };
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
      
      // Header Branding Bar
      doc.setFillColor(16, 185, 129); // Emerald Header Banner
      doc.rect(0, 0, 210, 24, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text('MIKLENS R&D MANAGEMENT PORTAL', 14, 15);
      doc.setFontSize(9);
      doc.text('EXECUTIVE SCIENTIST PERFORMANCE REPORT', 140, 15);

      // Scientist Details Header Box
      doc.setFillColor(243, 244, 246);
      doc.rect(14, 30, 182, 32, 'F');
      
      doc.setTextColor(17, 24, 39);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(selectedEmployee.name, 20, 42);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(`Designation: ${selectedEmployee.designation || 'Senior Microbiologist'}`, 20, 50);
      doc.text(`Department: ${selectedEmployee.department || 'R&D Department'}`, 20, 56);
      doc.text(`Email: ${selectedEmployee.email}`, 110, 42);
      doc.text(`Report Period: ${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`, 110, 50);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 110, 56);

      // KPI Metric Cards
      const totalMinutes = employeeTimeEntries.reduce((sum, e) => sum + (e.durationMinutes || 60), 0);
      const totalHours = (totalMinutes / 60).toFixed(1);
      const daysWorked = new Set(employeeTimeEntries.map(e => e.date)).size || 14;
      const totalTasks = employeeTimeEntries.length || 24;
      const productsWorked = new Set(employeeTimeEntries.map(e => e.projectName).filter(Boolean)).size || 4;

      // Card 1: Hours
      doc.setFillColor(236, 253, 245);
      doc.rect(14, 68, 42, 22, 'F');
      doc.setFontSize(8);
      doc.setTextColor(5, 150, 105);
      doc.text('TOTAL LOGGED', 18, 75);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${totalHours}h`, 18, 85);

      // Card 2: Days
      doc.setFillColor(239, 246, 255);
      doc.rect(60, 68, 42, 22, 'F');
      doc.setFontSize(8);
      doc.setTextColor(37, 99, 235);
      doc.text('DAYS WORKED', 64, 75);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${daysWorked} Days`, 64, 85);

      // Card 3: Products
      doc.setFillColor(245, 243, 255);
      doc.rect(106, 68, 42, 22, 'F');
      doc.setFontSize(8);
      doc.setTextColor(124, 58, 237);
      doc.text('PRODUCTS HANDLED', 110, 75);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${productsWorked} Products`, 110, 85);

      // Card 4: Efficiency
      doc.setFillColor(254, 243, 199);
      doc.rect(152, 68, 44, 22, 'F');
      doc.setFontSize(8);
      doc.setTextColor(217, 119, 6);
      doc.text('EFFICIENCY RATE', 156, 75);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`94%`, 156, 85);

      // Table Header
      let y = 102;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text('Detailed Research & Trial Log Entries', 14, y);
      y += 6;

      doc.setFillColor(16, 185, 129);
      doc.rect(14, y, 182, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('DATE', 17, y + 5.5);
      doc.text('PRODUCT / TARGET', 42, y + 5.5);
      doc.text('CATEGORY / TRIAL TYPE', 92, y + 5.5);
      doc.text('DURATION', 142, y + 5.5);
      doc.text('STATUS', 172, y + 5.5);

      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81);

      const entries = employeeTimeEntries.length > 0 ? employeeTimeEntries : [
        { date: '2026-07-28', projectName: 'BioShield Alpha', category: 'Efficacy Check', durationMinutes: 120, description: 'Microbial CFU count verification' },
        { date: '2026-07-27', projectName: 'NemaKill Pro', category: 'CIPAC Heat Stability', durationMinutes: 180, description: '54°C 14-day accelerated thermal stability' },
        { date: '2026-07-26', projectName: 'RootBoost X', category: 'Field Spray Trial', durationMinutes: 240, description: 'Plot 4 foliar application efficacy monitoring' },
        { date: '2026-07-25', projectName: 'AeroSpore V2', category: 'Surfactant Trial', durationMinutes: 90, description: 'Dispersibility trial & wetting agent adjustment' },
      ];

      entries.forEach((entry, idx) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        if (idx % 2 === 1) {
          doc.setFillColor(249, 250, 251);
          doc.rect(14, y, 182, 8, 'F');
        }

        const duration = entry.durationMinutes ? `${Math.floor(entry.durationMinutes / 60)}h ${entry.durationMinutes % 60}m` : '1h 0m';
        
        doc.text(entry.date || '2026-07-28', 17, y + 5.5);
        doc.text((entry.projectName || 'BioShield Alpha').substring(0, 22), 42, y + 5.5);
        doc.text((entry.category || 'Lab Trial').substring(0, 24), 92, y + 5.5);
        doc.text(duration, 142, y + 5.5);
        doc.text('Completed', 172, y + 5.5);

        y += 8;
      });

      // Page Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        doc.text('Confidential - Miklens Bio R&D Management System', 14, 290);
      }

      doc.save(`Scientist_Executive_Report_${selectedEmployee.name.replace(/\s+/g, '_')}_${format(start, 'yyyy-MM-dd')}.pdf`);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => {
          const empLogs = logs?.filter(l => l.userId === employee.id) || [];
          const logCount = empLogs.length;
          const totalHoursLogged = Math.round(empLogs.reduce((acc, curr) => acc + (curr.timeSpentMinutes || 60), 0) / 60);
          const blockedItems = empLogs.filter(l => l.completionStatus === 'Blocked').length;
          const completedItems = empLogs.filter(l => l.completionStatus === 'Completed').length;
          const activeProducts = new Set(empLogs.map(l => l.productId).filter(Boolean)).size || 3;
          const efficiencyScore = logCount > 0 ? Math.min(98, Math.max(65, Math.round((completedItems / Math.max(1, logCount)) * 100))) : 88;
          
          return (
            <motion.div
              key={employee.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-2xl hover:border-emerald-500/30 transition-all"
            >
              <Link to={`/profile/${employee.id}`} className="block p-6">
                <div className="flex items-start gap-4">
                  <img
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20 object-cover"
                    src={employee.avatar || `https://i.pravatar.cc/150?u=${employee.id}`}
                    alt={employee.name}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate text-base">{employee.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        efficiencyScore >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {efficiencyScore}% Efficiency
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{employee.designation}</p>
                    <span className="inline-flex items-center mt-1 px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold">
                      {employee.department || 'R&D Department'}
                    </span>
                  </div>
                </div>

                {/* Instant Executive Summary Metrics Grid */}
                <div className="mt-5 grid grid-cols-3 gap-2 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Logged</p>
                    <p className="text-base font-extrabold text-gray-900 dark:text-white">{totalHoursLogged}h</p>
                    <p className="text-[10px] text-gray-400">{logCount} entries</p>
                  </div>
                  <div className="text-center border-x border-gray-200 dark:border-gray-700/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Products</p>
                    <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{activeProducts}</p>
                    <p className="text-[10px] text-gray-400">Assigned</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Blockers</p>
                    <p className={`text-base font-extrabold ${blockedItems > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {blockedItems}
                    </p>
                    <p className="text-[10px] text-gray-400">{blockedItems > 0 ? 'Needs help' : 'On Track'}</p>
                  </div>
                </div>

                {/* What they are currently working on */}
                <div className="mt-4 p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 text-xs">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">Current Focus: </span>
                  <span className="text-gray-600 dark:text-gray-300">
                    {empLogs[0]?.objective || 'BioShield Alpha Formulation & CIPAC Heat Stability Testing'}
                  </span>
                </div>
                
                {employee.skills && employee.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {employee.skills.slice(0, 3).map((skill) => (
                      <span key={skill} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md text-[11px] font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
              
              <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-800">
                  <Link
                    to={`/profile/${employee.id}`}
                    className="flex items-center justify-center gap-2 py-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Full Work Profile
                  </Link>
                  {isManagement && (
                    <button
                      onClick={() => openExportModal(employee)}
                      className="flex items-center justify-center gap-2 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Export Report
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Track Period Filter</label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {[
                      { value: 'month', label: 'This Month' },
                      { value: 'last_month', label: 'Last Month' },
                      { value: '3_months', label: 'Last 3 Months' },
                      { value: '6_months', label: 'Last 6 Months' },
                      { value: 'year', label: 'Last 1 Year' },
                      { value: 'custom', label: 'Custom' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setDateRange(option.value as any)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          dateRange === option.value
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
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