import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Mail, CheckCircle, FileText, AlertTriangle, Clock, Download, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../hooks/useUsers';
import { useDailyLogs } from '../hooks/useDailyLogs';
import { getProductName, getExperimentName } from '../constants';
import { formatDate } from '../utils/formatters';
import { Badge } from '../components/ui/Badge';
import { ScientistPerformanceOverview } from '../components/ScientistPerformanceOverview';
import { getEntriesByScientist } from '../services/timeTracking';
import type { TimeMotionEntry } from '../types/timeTracking';
import { exportToExcel, formatEmployeeReportForExport } from '../utils/exportUtils';

const buildMonthlyTrend = (logs: { createdAt: string; completionStatus: string; confidenceLevel: number }[]) => {
  // Last 6 months, oldest first, aggregating log count (knowledge) and avg confidence (innovation proxy).
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
  const [timeMotionRange, setTimeMotionRange] = React.useState<'week' | 'month' | 'quarter'>('month');
  const [timeEntries, setTimeEntries] = useState<TimeMotionEntry[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [timeEntriesLoading, setTimeEntriesLoading] = useState(false);

  // No :userId param means "my own profile".
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

  // Load time motion entries
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

  // Export handlers
  const handleExportPDF = async () => {
    if (!person) return;
    setIsExporting(true);
    try {
      const stats = {
        totalHoursThisMonth: totalHours,
        activeProjectsCount: 0,
        experimentsWorkedOn: 0,
        tasksCompleted: completedCount,
        fieldDaysThisMonth: 0,
      labDaysThisMonth: 0,
        billablePercentage: 0
      };
      
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Profile sheet
      doc.setFontSize(18);
      doc.text('Employee Report', 14, 22);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`Employee: ${person.name}`, 14, 38);
      doc.text(`Designation: ${person.designation}`, 14, 44);
      
      // Time entries
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Time Motion Entries', 14, 22);
      
      let y = 35;
      const headers = ['Date', 'Category', 'Duration', 'Description', 'Billable'];
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(headers.join('  '), 14, y);
      y += 8;
      
      doc.setFont('helvetica', 'normal');
      timeEntries.slice(0, 30).forEach(entry => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        const duration = entry.durationMinutes ? `${Math.floor(entry.durationMinutes / 60)}h ${entry.durationMinutes % 60}m` : '-';
        doc.text(`${entry.date || ''}  ${entry.category || ''}  ${duration}  ${(entry.description || '').substring(0, 30)}  ${entry.isBillable ? 'Yes' : 'No'}`, 14, y);
        y += 7;
      });
      
      doc.save(`Employee_Report_${person.name.replace(/\s+/g, '_')}.pdf`);
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
      const stats = {
        totalHoursThisMonth: totalHours,
        activeProjectsCount: 0,
        experimentsWorkedOn: 0,
        tasksCompleted: completedCount,
        fieldDaysThisMonth: 0,
        labDaysThisMonth: 0,
        billablePercentage: 0
      };
      
      const sheets = formatEmployeeReportForExport(person, stats, timeEntries, 'excel');
      exportToExcel(sheets, `Employee_Report_${person.name.replace(/\s+/g, '_')}.xlsx`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export Excel');
    } finally {
      setIsExporting(false);
    }
  };

  if (usersLoading || logsLoading) {
    return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
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
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 sm:h-48"></div>
        <div className="px-4 pb-6 sm:px-6 lg:px-8">
          <div className="-mt-12 sm:-mt-16 sm:flex sm:items-end sm:space-x-5">
            <div className="flex">
              <img className="h-24 w-24 rounded-full ring-4 ring-white dark:ring-gray-900 sm:h-32 sm:w-32" src={person.avatar || `https://i.pravatar.cc/150?u=${person.id}`} alt="" />
            </div>
            <div className="mt-6 sm:flex sm:min-w-0 sm:flex-1 sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
              <div className="mt-6 min-w-0 flex-1 sm:hidden md:block">
                <h1 className="truncate text-2xl font-bold text-gray-900 dark:text-white">{person.name}</h1>
                <p className="text-gray-500 dark:text-gray-400">{person.designation}</p>
              </div>
              <div className="mt-6 flex flex-col justify-stretch space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
                {isSelf ? (
                  <Badge variant="info">Your profile</Badge>
                ) : (
                  <a href={`mailto:${person.email}`} className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                    <Mail className="-ml-1 mr-2 h-5 w-5 text-gray-400" aria-hidden="true" />
                    <span>Message</span>
                  </a>
                )}
                {/* Export Buttons */}
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 dark:bg-gray-800 dark:border-gray-700">
                  <button
                    onClick={handleExportPDF}
                    disabled={isExporting || timeEntriesLoading}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors dark:hover:bg-red-900/20"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                  <button
                    onClick={handleExportExcel}
                    disabled={isExporting || timeEntriesLoading}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-md transition-colors dark:hover:bg-green-900/20"
                    title="Download Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Excel
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 sm:hidden">
            <h1 className="truncate text-2xl font-bold text-gray-900 dark:text-white">{person.name}</h1>
            <p className="text-gray-500 dark:text-gray-400">{person.designation}</p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-1 space-y-6">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Core Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {person.skills.length > 0 ? person.skills.map(skill => (
                    <span key={skill} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-900/50 dark:text-blue-200">
                      {skill}
                    </span>
                  )) : (
                    <span className="text-sm text-gray-400">No skills listed</span>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Work Summary</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Logs submitted</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{personLogs.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Hours logged</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{totalHours}h</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Completed activities</dt>
                    <dd className="font-medium text-green-600 dark:text-green-400">{completedCount}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Open blockers</dt>
                    <dd className="font-medium text-yellow-600 dark:text-yellow-400">{blockedCount}</dd>
                  </div>
                </dl>
              </div>

              {personLogs[0]?.aiNotes && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-900/20">
                  <h3 className="flex items-center font-medium text-blue-900 dark:text-blue-200 mb-2">
                    <CheckCircle className="mr-2 h-4 w-4" /> AI Summary
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-300">{personLogs[0].aiNotes}</p>
                </div>
              )}
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">Research Value Creation (last 6 months)</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorInnovation" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorKnowledge" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                      <Area type="monotone" dataKey="innovation" stroke="#3b82f6" fillOpacity={1} fill="url(#colorInnovation)" name="Avg Confidence" />
                      <Area type="monotone" dataKey="knowledge" stroke="#10b981" fillOpacity={1} fill="url(#colorKnowledge)" name="Logs Submitted" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">Recent Research Logs</h3>
                {personLogs.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700">
                    No logs submitted yet.
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {personLogs.slice(0, 5).map((log) => (
                      <li key={log.id} className="flex space-x-3 rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
                        <div className="flex-shrink-0">
                          <FileText className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                              {getProductName(log.productId)} &middot; {getExperimentName(log.experimentId)}
                            </h3>
                            <p className="whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(log.date)}</p>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{log.objective}</p>
                          <div className="flex items-center gap-2 pt-1">
                            <Badge variant={log.completionStatus === 'Completed' ? 'success' : log.completionStatus === 'Blocked' ? 'warning' : 'info'}>
                              {log.completionStatus}
                            </Badge>
                            <span className="text-xs text-gray-400">{log.timeSpentMinutes} min</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              {/* Time Motion Section */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Time Motion Performance</h3>
                  </div>
                  <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                    {(['week', 'month', 'quarter'] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeMotionRange(range)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                          timeMotionRange === range
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {range.charAt(0).toUpperCase() + range.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg hover:shadow-xl transition-shadow animate-fade-in">
                  {targetId && person?.name ? (
                    <ScientistPerformanceOverview
                      scientistId={targetId}
                      scientistName={person.name}
                      dateRange={timeMotionRange}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Clock className="h-8 w-8 text-gray-300" />
                      </div>
                      <p className="text-gray-500">
                        Time motion data will appear here once the scientist starts logging their activities.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};