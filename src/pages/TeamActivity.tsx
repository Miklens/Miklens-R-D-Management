import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, FlaskConical, TrendingUp, AlertTriangle, Search, Download, FileSpreadsheet, X, Calendar, Users } from 'lucide-react';
import { useUsers } from '../hooks/useUsers';
import { useDailyLogs } from '../hooks/useDailyLogs';
import { Badge } from '../components/ui/Badge';
import { getProductName, getExperimentName } from '../constants';
import { formatDate } from '../utils/formatters';
import { getEntriesByScientistAndDateRange } from '../services/timeTracking';
import { useAuth } from '../contexts/AuthContext';
import { format, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Management Visibility hub (SRS goal #1): lets Admin/Management understand
 * what every scientist is doing - logs submitted, hours spent, completion
 * rate, and blockers - without needing to read every daily log individually.
 */
export const TeamActivity: React.FC = () => {
  const navigate = useNavigate();
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: logs, isLoading: logsLoading } = useDailyLogs();
  const { userRole } = useAuth();
  const [search, setSearch] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [isExporting, setIsExporting] = useState(false);
  const [teamTimeData, setTeamTimeData] = useState<Record<string, any[]>>({});

  const isManagement = userRole === 'Admin' || userRole === 'Management';

  const scientists = useMemo(
    () => users?.filter(u => u.role === 'Scientist' && u.isActive) || [],
    [users]
  );

  const stats = useMemo(() => {
    return scientists.map(sci => {
      const userLogs = logs?.filter(l => l.userId === sci.id) || [];
      const totalMinutes = userLogs.reduce((sum, l) => sum + l.timeSpentMinutes, 0);
      const completed = userLogs.filter(l => l.completionStatus === 'Completed').length;
      const blocked = userLogs.filter(l => l.completionStatus === 'Blocked').length;
      const avgConfidence = userLogs.length
        ? Math.round(userLogs.reduce((sum, l) => sum + l.confidenceLevel, 0) / userLogs.length)
        : 0;
      const lastLog = userLogs[0];

      return {
        user: sci,
        logCount: userLogs.length,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
        completed,
        blocked,
        avgConfidence,
        lastLog,
      };
    });
  }, [scientists, logs]);

  const filteredStats = useMemo(() => {
    if (!search.trim()) return stats;
    const term = search.toLowerCase();
    return stats.filter(s =>
      s.user.name.toLowerCase().includes(term) ||
      s.user.department?.toLowerCase().includes(term) ||
      s.user.designation?.toLowerCase().includes(term)
    );
  }, [stats, search]);

  const teamTotals = useMemo(() => ({
    activeToday: stats.filter(s => s.lastLog && new Date(s.lastLog.date).toDateString() === new Date().toDateString()).length,
    totalLogs: stats.reduce((sum, s) => sum + s.logCount, 0),
    totalBlocked: stats.reduce((sum, s) => sum + s.blocked, 0),
  }), [stats]);

  const loadTeamData = async () => {
    const now = new Date();
    let startDate: Date;
    switch (dateRange) {
      case 'week': startDate = subDays(now, 7); break;
      case 'month': startDate = subDays(now, 30); break;
      case 'quarter': startDate = subDays(now, 90); break;
    }

    const data: Record<string, any[]> = {};
    for (const sci of scientists) {
      try {
        const entries = await getEntriesByScientistAndDateRange(
          sci.id,
          format(startDate, 'yyyy-MM-dd'),
          format(now, 'yyyy-MM-dd')
        );
        data[sci.id] = entries;
      } catch (error) {
        console.error(`Error loading data for ${sci.name}:`, error);
        data[sci.id] = [];
      }
    }
    setTeamTimeData(data);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await loadTeamData();
      
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const now = new Date();
      let startDate: Date;
      switch (dateRange) {
        case 'week': startDate = subDays(now, 7); break;
        case 'month': startDate = subDays(now, 30); break;
        case 'quarter': startDate = subDays(now, 90); break;
      }

      // Title
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('Team Activity Report', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Period: ${format(startDate, 'MMM d, yyyy')} - ${format(now, 'MMM d, yyyy')}`, 14, 30);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 36);
      
      // Team Summary
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('Team Summary', 14, 50);
      
      const totalHours = stats.reduce((s, st) => s + st.totalHours, 0);
      const totalLogs = stats.reduce((s, st) => s + st.logCount, 0);
      
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`Total Team Members: ${scientists.length}`, 14, 58);
      doc.text(`Total Hours Logged: ${totalHours.toFixed(1)}h`, 14, 64);
      doc.text(`Total Activities: ${totalLogs}`, 14, 70);
      doc.text(`Active Today: ${teamTotals.activeToday}`, 14, 76);
      
      // Individual Stats Table
      let y = 90;
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('Individual Performance', 14, y);
      y += 10;
      
      // Table Header
      doc.setFillColor(66, 66, 66);
      doc.rect(14, y - 5, 180, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text('Name', 16, y);
      doc.text('Hours', 70, y);
      doc.text('Activities', 100, y);
      doc.text('Completed', 130, y);
      doc.text('Blocked', 160, y);
      
      y += 10;
      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'normal');
      
      stats.forEach((stat) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(stat.user.name || 'Unknown', 16, y);
        doc.text(`${stat.totalHours}h`, 70, y);
        doc.text(stat.logCount.toString(), 100, y);
        doc.text(stat.completed.toString(), 130, y);
        doc.text(stat.blocked.toString(), 160, y);
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
      
      doc.save(`Team_Activity_Report_${format(startDate, 'yyyy-MM-dd')}_to_${format(now, 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await loadTeamData();
      
      const { default: XLSX } = await import('xlsx');
      const now = new Date();
      let startDate: Date;
      switch (dateRange) {
        case 'week': startDate = subDays(now, 7); break;
        case 'month': startDate = subDays(now, 30); break;
        case 'quarter': startDate = subDays(now, 90); break;
      }
      
      const wb = XLSX.utils.book_new();
      
      // Sheet 1: Team Summary
      const summaryData = [
        ['Team Activity Report'],
        [''],
        ['Period', `${format(startDate, 'MMM d, yyyy')} - ${format(now, 'MMM d, yyyy')}`],
        ['Generated', new Date().toLocaleString()],
        [''],
        ['Team Summary'],
        ['Total Members', scientists.length.toString()],
        ['Total Hours', stats.reduce((s, st) => s + st.totalHours, 0).toFixed(1)],
        ['Total Activities', stats.reduce((s, st) => s + st.logCount, 0).toString()],
        ['Active Today', teamTotals.activeToday.toString()],
        [''],
        ['Individual Performance'],
        ['Name', 'Designation', 'Department', 'Hours', 'Activities', 'Completed', 'Blocked']
      ];
      
      stats.forEach(stat => {
        summaryData.push([
          stat.user.name || '',
          stat.user.designation || '',
          stat.user.department || '',
          stat.totalHours.toString(),
          stat.logCount.toString(),
          stat.completed.toString(),
          stat.blocked.toString()
        ]);
      });
      
      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Team Summary');
      
      // Sheet 2: Time Entries by Employee
      for (const sci of scientists) {
        const entries = teamTimeData[sci.id] || [];
        const empData = [['Date', 'Start', 'End', 'Duration', 'Category', 'Description', 'Billable']];
        entries.forEach(e => {
          empData.push([
            e.date || '',
            e.startTime || '',
            e.endTime || '',
            e.durationMinutes?.toString() || '0',
            e.category || '',
            e.description || '',
            e.isBillable ? 'Yes' : 'No'
          ]);
        });
        const ws = XLSX.utils.aoa_to_sheet(empData);
        XLSX.utils.book_append_sheet(wb, ws, sci.name?.substring(0, 20) || 'Employee');
      }
      
      XLSX.writeFile(wb, `Team_Activity_Report_${format(startDate, 'yyyy-MM-dd')}_to_${format(now, 'yyyy-MM-dd')}.xlsx`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const isLoading = usersLoading || logsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Team Activity</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            What every scientist is working on, at a glance
          </p>
        </div>
        {isManagement && (
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Download className="w-5 h-5" />
            Export Report
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Today</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{teamTotals.activeToday} / {scientists.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
              <FlaskConical className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{teamTotals.totalLogs}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Open Blockers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{teamTotals.totalBlocked}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or department..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
        />
      </div>

      {/* Team List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredStats.map(({ user, logCount, totalHours, completed, blocked, avgConfidence, lastLog }) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate(`/profile/${user.id}`)}
              className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-800 cursor-pointer hover:shadow-xl transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img 
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg"
                    src={user.avatar || `https://i.pravatar.cc/150?u=${user.id}`} 
                    alt={user.name} 
                  />
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{user.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.designation} · {user.department}</p>
                    {lastLog ? (
                      <p className="text-xs text-gray-400 mt-1">
                        Last activity: {formatDate(lastLog.date)} on {getProductName(lastLog.productId)}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-500 mt-1">No logs yet</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{logCount}</p>
                    <p className="text-xs text-gray-500">Activities</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{totalHours}h</p>
                    <p className="text-xs text-gray-500">Hours</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{completed}</p>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{blocked}</p>
                    <p className="text-xs text-gray-500">Blocked</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredStats.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center text-gray-500">
              No scientists match your search.
            </div>
          )}
        </div>
      )}

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
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
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Export Team Report</h3>
                  <button onClick={() => setShowExportModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Date Range</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'week', label: '7 Days' },
                      { value: 'month', label: '30 Days' },
                      { value: 'quarter', label: '90 Days' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setDateRange(option.value as any)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          dateRange === option.value
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Export will include all {scientists.length} team members with their activities, hours, and performance metrics.
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium disabled:opacity-50"
                  >
                    <Download className="w-5 h-5" />
                    PDF
                  </button>
                  <button
                    onClick={handleExportExcel}
                    disabled={isExporting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-5 h-5" />
                    Excel
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