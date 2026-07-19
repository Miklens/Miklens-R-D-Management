import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Mail, CheckCircle, FileText, AlertTriangle, Clock, Download, FileSpreadsheet, Award, Target, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../hooks/useUsers';
import { useDailyLogs } from '../hooks/useDailyLogs';
import { getProductName, getExperimentName } from '../constants';
import { formatDate } from '../utils/formatters';
import { Badge } from '../components/ui/Badge';
import { ScientistPerformanceOverview } from '../components/ScientistPerformanceOverview';
import { getEntriesByScientist } from '../services/timeTracking';
import type { TimeMotionEntry } from '../types/timeTracking';
import { format, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar } from 'lucide-react';

const buildMonthlyTrend = (logs: { createdAt: string; completionStatus: string; confidenceLevel: number }[]) => {
  const months: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en-US', { month: 'short' }) });
  }

  return months.map(({ key, label }) => {
    const [y, m] = key.split('-').map(Number);
    const monthLogs = logs.filter(l => {
      const d = new Date(l.createdAt);
      return d.getFullYear() === y && d.getMonth() === m;
    });
    const avgConfidence = monthLogs.length
      ? Math.round(monthLogs.reduce((s, l) => s + l.confidenceLevel, 0) / monthLogs.length)
      : 0;
    return { month: label, knowledge: monthLogs.length, innovation: avgConfidence };
  });
};

export const EmployeeProfile: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const { profile: currentProfile } = useAuth();
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: allLogs, isLoading: logsLoading } = useDailyLogs();
  const [timeMotionRange, setTimeMotionRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [timeEntries, setTimeEntries] = useState<TimeMotionEntry[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [timeEntriesLoading, setTimeEntriesLoading] = useState(false);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [showExportModal, setShowExportModal] = useState(false);

  const targetId = userId || currentProfile?.id;
  const isSelf = targetId === currentProfile?.id;

  const person = useMemo(
    () => users.find(u => u.id === targetId) || (isSelf ? currentProfile : undefined),
    [users, targetId, isSelf, currentProfile]
  );

  const personLogs = useMemo(
    () => allLogs.filter(l => l.userId === targetId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [allLogs, targetId]
  );

  const trendData = useMemo(() => buildMonthlyTrend(personLogs), [personLogs]);

  useMemo(() => {
    if (targetId) {
      setTimeEntriesLoading(true);
      getEntriesByScientist(targetId)
        .then(setTimeEntries)
        .catch(console.error)
        .finally(() => setTimeEntriesLoading(false));
    }
  }, [targetId]);

  const totalHours = Math.round((personLogs.reduce((s, l) => s + l.timeSpentMinutes, 0) / 60) * 10) / 10;
  const completedCount = personLogs.filter(l => l.completionStatus === 'Completed').length;
  const blockedCount = personLogs.filter(l => l.completionStatus === 'Blocked').length;

  // Get filtered entries based on date range
  const getFilteredEntries = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    switch (dateRange) {
      case 'week': startDate = subDays(now, 7); break;
      case 'month': startDate = subDays(now, 30); break;
      case 'quarter': startDate = subDays(now, 90); break;
    }
    return timeEntries.filter(e => {
      const entryDate = new Date(e.date || '');
      return entryDate >= startDate && entryDate <= now;
    });
  }, [timeEntries, dateRange]);

  const filteredTotalMinutes = getFilteredEntries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
  const filteredDaysWorked = new Set(getFilteredEntries.map(e => e.date)).size;

  const openExportModal = () => {
    setShowExportModal(true);
  };

  const handleExportPDF = async () => {
    if (!person) return;
    setIsExporting(true);
    try {
      const now = new Date();
      let startDate: Date;
      switch (dateRange) {
        case 'week': startDate = subDays(now, 7); break;
        case 'month': startDate = subDays(now, 30); break;
        case 'quarter': startDate = subDays(now, 90); break;
      }
      
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Title Page
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('My Activity Report', 14, 22);
      
      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      doc.text(`Name: ${person.name}`, 14, 35);
      doc.text(`Designation: ${person.designation || 'N/A'}`, 14, 42);
      doc.text(`Department: ${person.department || 'N/A'}`, 14, 49);
      doc.text(`Report Period: ${format(startDate, 'MMM d, yyyy')} - ${format(now, 'MMM d, yyyy')}`, 14, 56);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 63);
      
      // Summary Stats
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('Summary', 14, 80);
      
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      const totalHoursFiltered = (filteredTotalMinutes / 60).toFixed(1);
      doc.text(`Total Hours: ${totalHoursFiltered}h`, 14, 90);
      doc.text(`Days Worked: ${filteredDaysWorked}`, 14, 98);
      doc.text(`Total Activities: ${getFilteredEntries.length}`, 14, 106);
      doc.text(`Completed Tasks: ${completedCount}`, 14, 114);
      
      // Time Entries
      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('Time Entries', 14, 22);
      
      let y = 35;
      const headers = ['Date', 'Start', 'End', 'Duration', 'Category', 'Description'];
      doc.setFontSize(9);
      doc.setFillColor(66, 66, 66);
      doc.rect(14, y - 5, 180, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text(headers[0], 16, y);
      doc.text(headers[1], 55, y);
      doc.text(headers[2], 80, y);
      doc.text(headers[3], 105, y);
      doc.text(headers[4], 135, y);
      doc.text(headers[5], 160, y);
      
      y += 10;
      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'normal');
      
      getFilteredEntries.slice(0, 40).forEach(entry => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        const duration = entry.durationMinutes ? `${Math.floor(entry.durationMinutes / 60)}h ${entry.durationMinutes % 60}m` : '-';
        const desc = (entry.description || entry.category || '-').substring(0, 25);
        
        doc.text(entry.date || '-', 16, y);
        doc.text(entry.startTime || '-', 55, y);
        doc.text(entry.endTime || '-', 80, y);
        doc.text(duration, 105, y);
        doc.text(entry.category || '-', 135, y);
        doc.text(desc, 160, y);
        y += 7;
      });
      
      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      }
      
      doc.save(`My_Report_${format(startDate, 'yyyy-MM-dd')}_to_${format(now, 'yyyy-MM-dd')}.pdf`);
      setShowExportModal(false);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (!person) return;
    setIsExporting(true);
    try {
      const { default: XLSX } = await import('xlsx');
      const now = new Date();
      let startDate: Date;
      switch (dateRange) {
        case 'week': startDate = subDays(now, 7); break;
        case 'month': startDate = subDays(now, 30); break;
        case 'quarter': startDate = subDays(now, 90); break;
      }
      
      const wb = XLSX.utils.book_new();
      
      // Summary Sheet
      const summaryData = [
        ['My Activity Report'],
        [''],
        ['Name', person.name],
        ['Designation', person.designation || 'N/A'],
        ['Department', person.department || 'N/A'],
        ['Report Period', `${format(startDate, 'MMM d, yyyy')} - ${format(now, 'MMM d, yyyy')}`],
        ['Generated', new Date().toLocaleString()],
        [''],
        ['Summary'],
        ['Total Hours', (filteredTotalMinutes / 60).toFixed(1) + 'h'],
        ['Days Worked', filteredDaysWorked.toString()],
        ['Total Activities', getFilteredEntries.length.toString()],
        ['Completed Tasks', completedCount.toString()]
      ];
      
      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Summary');
      
      // Time Entries Sheet
      const timeData = [['Date', 'Start Time', 'End Time', 'Duration (min)', 'Category', 'Description', 'Project', 'Billable']];
      getFilteredEntries.forEach(entry => {
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
      
      // Daily Summary
      const dailySummary: Record<string, { minutes: number; count: number }> = {};
      getFilteredEntries.forEach(entry => {
        if (!dailySummary[entry.date]) {
          dailySummary[entry.date] = { minutes: 0, count: 0 };
        }
        dailySummary[entry.date].minutes += entry.durationMinutes || 0;
        dailySummary[entry.date].count += 1;
      });
      
      const dailyData = [['Date', 'Total Hours', 'Activities']];
      Object.entries(dailySummary).sort().forEach(([date, data]) => {
        dailyData.push([
          date,
          (data.minutes / 60).toFixed(1) + 'h',
          data.count.toString()
        ]);
      });
      
      const ws3 = XLSX.utils.aoa_to_sheet(dailyData);
      XLSX.utils.book_append_sheet(wb, ws3, 'Daily Summary');
      
      XLSX.writeFile(wb, `My_Report_${format(startDate, 'yyyy-MM-dd')}_to_${format(now, 'yyyy-MM-dd')}.xlsx`);
      setShowExportModal(false);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export Excel');
    } finally {
      setIsExporting(false);
    }
  };

  if (usersLoading || logsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-2 text-center">
        <AlertTriangle className="h-10 w-10 text-gray-400" />
        <p className="text-gray-500 dark:text-gray-400">Employee not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/50 shadow-2xl border border-gray-100/50 dark:border-gray-800/50"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-400/10 to-transparent rounded-full blur-3xl"></div>
        
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 p-1 shadow-2xl shadow-emerald-500/25">
                  <img 
                    className="w-full h-full rounded-3xl object-cover" 
                    src={person.avatar || `https://i.pravatar.cc/150?u=${person.id}`} 
                    alt={person.name}
                  />
                </div>
                {isSelf && (
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                    You
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{person.name}</h1>
                  <p className="text-gray-500 dark:text-gray-400 text-lg">{person.designation}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    {person.department && (
                      <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                        <Target className="w-4 h-4 text-emerald-500" />
                        {person.department}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                      <Mail className="w-4 h-4 text-emerald-500" />
                      {person.email}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {!isSelf && (
                    <a 
                      href={`mailto:${person.email}`} 
                      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-600 transition-all"
                    >
                      <Mail className="w-4 h-4" />
                      Message
                    </a>
                  )}
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                    <button
                      onClick={openExportModal}
                      disabled={isExporting || timeEntriesLoading}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">PDF</span>
                    </button>
                    <button
                      onClick={openExportModal}
                      disabled={isExporting || timeEntriesLoading}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span className="hidden sm:inline">Excel</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Skills */}
              {person.skills.length > 0 && (
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {person.skills.map((skill) => (
                      <span 
                        key={skill} 
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium border border-emerald-200/50 dark:border-emerald-800/50"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Hours Logged', value: `${totalHours}h`, icon: Clock, color: 'from-blue-500 to-cyan-500', text: 'text-blue-600' },
          { label: 'Activities', value: personLogs.length, icon: FileText, color: 'from-emerald-500 to-teal-500', text: 'text-emerald-600' },
          { label: 'Completed', value: completedCount, icon: CheckCircle, color: 'from-violet-500 to-purple-500', text: 'text-violet-600' },
          { label: 'Pending', value: blockedCount, icon: AlertTriangle, color: 'from-amber-500 to-orange-500', text: 'text-amber-600' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-lg border border-gray-100/50 dark:border-gray-800/50 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Work Summary */}
        <div className="space-y-6">
          {/* Work Summary Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-100/50 dark:border-gray-800/50"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-500" />
              Work Summary
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <span className="text-gray-600 dark:text-gray-300">Research Logs</span>
                <span className="font-bold text-gray-900 dark:text-white">{personLogs.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <span className="text-gray-600 dark:text-gray-300">Total Hours</span>
                <span className="font-bold text-gray-900 dark:text-white">{totalHours}h</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <span className="text-emerald-700 dark:text-emerald-300">Completed</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{completedCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <span className="text-amber-700 dark:text-amber-300">In Progress</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{blockedCount}</span>
              </div>
            </div>
          </motion.div>

          {/* AI Summary */}
          {personLogs[0]?.aiNotes && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border border-emerald-100/50 dark:border-emerald-800/30"
            >
              <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-200 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                AI Summary
              </h3>
              <p className="text-emerald-800 dark:text-emerald-300 text-sm leading-relaxed">
                {personLogs[0].aiNotes}
              </p>
            </motion.div>
          )}
        </div>

        {/* Right Column - Charts & Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-100/50 dark:border-gray-800/50"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Research Performance</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInnovation" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorKnowledge" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Area type="monotone" dataKey="innovation" stroke="#10b981" fillOpacity={1} fill="url(#colorInnovation)" name="Innovation Score" />
                  <Area type="monotone" dataKey="knowledge" stroke="#3b82f6" fillOpacity={1} fill="url(#colorKnowledge)" name="Research Logs" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Recent Logs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-100/50 dark:border-gray-800/50"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Research Logs</h3>
            {personLogs.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No research logs yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {personLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {getProductName(log.productId)} - {getExperimentName(log.experimentId)}
                        </h4>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(log.date)}</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{log.objective}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={log.completionStatus === 'Completed' ? 'success' : log.completionStatus === 'Blocked' ? 'warning' : 'info'}>
                          {log.completionStatus}
                        </Badge>
                        <span className="text-xs text-gray-400">{log.timeSpentMinutes} min</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Time Motion Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-100/50 dark:border-gray-800/50"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Time Motion Performance</h3>
          </div>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            {(['week', 'month', 'quarter'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeMotionRange(range)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  timeMotionRange === range
                    ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {targetId && person?.name ? (
          <ScientistPerformanceOverview
            scientistId={targetId}
            scientistName={person.name}
            dateRange={timeMotionRange}
          />
        ) : (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Time motion data will appear here once logging begins.</p>
          </div>
        )}
      </motion.div>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowExportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Export My Report</h3>
                    <p className="text-white/80 text-sm mt-1">Download your activity data</p>
                  </div>
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Date Range Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Select Date Range
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['week', 'month', 'quarter'] as const).map((range) => {
                      const labels = { week: 'Last 7 Days', month: 'Last 30 Days', quarter: 'Last 90 Days' };
                      return (
                        <button
                          key={range}
                          onClick={() => setDateRange(range)}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            dateRange === range
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                              : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600'
                          }`}
                        >
                          <span className="block text-sm font-semibold">{labels[range]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preview Stats */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Report Preview</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{(filteredTotalMinutes / 60).toFixed(1)}h</p>
                      <p className="text-xs text-gray-500">Total Hours</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredDaysWorked}</p>
                      <p className="text-xs text-gray-500">Days Worked</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{getFilteredEntries.length}</p>
                      <p className="text-xs text-gray-500">Activities</p>
                    </div>
                  </div>
                </div>

                {/* Export Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium shadow-lg shadow-red-500/25 hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExporting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                    PDF
                  </button>
                  <button
                    onClick={handleExportExcel}
                    disabled={isExporting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium shadow-lg shadow-green-500/25 hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExporting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-5 h-5" />
                    )}
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