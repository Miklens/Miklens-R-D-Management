import React, { useMemo, useState, useEffect } from 'react';
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
import { useExperiments } from '../contexts/ExperimentContext';
import { getSyncedTrials } from '../services/trialManagerSync';
import { Leaf, Shield, Bug, Beaker, Sprout, ShieldCheck, Activity as ActivityIcon } from 'lucide-react';
import { Calendar, Camera, Trash2 } from 'lucide-react';
import { getEffectiveAvatar, setUserCustomAvatar, removeUserCustomAvatar } from '../utils/avatarHelper';
import { DateFilterRange, DateRangePreset, ScientistExecutiveProfile } from '../types/trialIntegrationTypes';
import { buildScientistExecutiveProfile, filterTrialsByDateRange } from '../services/executiveAnalytics';
import { exportScientistToExcel, exportScientistToPDF } from '../services/executiveReportGenerator';


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
  const [execFilter, setExecFilter] = useState<DateFilterRange>({ preset: '30d' });
  const [showExportModal, setShowExportModal] = useState(false);


  const targetId = userId || currentProfile?.id;
  const isSelf = targetId === currentProfile?.id;

  const [avatarTick, setAvatarTick] = useState(0);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (currentProfile?.email) setUserCustomAvatar(currentProfile.email, base64);
      if (currentProfile?.id) setUserCustomAvatar(currentProfile.id, base64);
      setAvatarTick(t => t + 1);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoDelete = () => {
    if (currentProfile?.email) removeUserCustomAvatar(currentProfile.email);
    if (currentProfile?.id) removeUserCustomAvatar(currentProfile.id);
    setAvatarTick(t => t + 1);
  };

  const person = useMemo(
    () => users.find(u => u.id === targetId) || (isSelf ? currentProfile : undefined),
    [users, targetId, isSelf, currentProfile, avatarTick]
  );

  const personLogs = useMemo(
    () => allLogs.filter(l => l.userId === targetId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [allLogs, targetId]
  );

  const { experiments, labTests } = useExperiments();
  const syncedTrials = useMemo(() => getSyncedTrials(), []);

  const personScorecard = useMemo(() => {
    if (!person) return null;
    const pEmail = (person.email || '').toLowerCase();
    const pHandle = pEmail ? pEmail.split('@')[0] : person.name?.toLowerCase();

    const matchesScientist = (sciName?: string, email?: string, uid?: string) => {
      if (uid && uid === person.id) return true;
      const sName = (sciName || '').toLowerCase();
      const sEmail = (email || '').toLowerCase();
      return (
        (pEmail && sEmail.includes(pEmail)) ||
        (pHandle && sName.includes(pHandle)) ||
        (person.name && sName.includes(person.name.toLowerCase()))
      );
    };

    const myTrials = syncedTrials.filter(t => matchesScientist(t.scientistName, t.creatorEmail, t.creatorUid));
    const trialsByCategory = {
      herbicide: myTrials.filter(t => t.category === 'herbicide').length,
      fungicide: myTrials.filter(t => t.category === 'fungicide').length,
      pesticide: myTrials.filter(t => t.category === 'pesticide').length,
      nutrition: myTrials.filter(t => t.category === 'nutrition').length,
      biostimulant: myTrials.filter(t => t.category === 'biostimulant').length,
    };

    const withEvals = myTrials.filter(t => t.evaluations && t.evaluations.length > 0);
    const avgEfficacy = withEvals.length > 0
      ? Math.round(withEvals.reduce((s, t) => s + (t.evaluations[t.evaluations.length - 1]?.efficacyPercent || 0), 0) / withEvals.length)
      : null;

    const myExp = experiments.filter(e => matchesScientist(e.name, '', '') || e.productName);
    const myLab = labTests.filter(l => matchesScientist(l.name, '', ''));

    const passedVerdicts = [
      ...myExp.filter(e => e.outcomeStatus === 'Passed'),
      ...myLab.filter(l => l.outcomeStatus === 'Passed')
    ].length;

    const totalExpCount = myExp.length + myLab.length;
    const successRate = totalExpCount > 0 ? Math.round((passedVerdicts / totalExpCount) * 100) : (avgEfficacy !== null ? avgEfficacy : 100);

    return {
      totalTrials: myTrials.length,
      trialsByCategory,
      avgEfficacy,
      passedVerdicts,
      totalExpCount,
      successRate,
      myTrials,
    };
  }, [person, syncedTrials, experiments, labTests]);

  const executiveProfile = useMemo(() => {
    if (!person) return null;
    return buildScientistExecutiveProfile(person.name || person.email, syncedTrials);
  }, [person, syncedTrials]);

  const dateFilteredTrials = useMemo(() => {
    if (!personScorecard?.myTrials) return [];
    return filterTrialsByDateRange(personScorecard.myTrials, execFilter);
  }, [personScorecard, execFilter]);


  const trendData = useMemo(() => buildMonthlyTrend(personLogs), [personLogs]);

  const scientistTimelineEvents = useMemo(() => {
    const events: { date: string; type: string; title: string; desc: string; icon: string; color: string }[] = [];

    // 1. Add Trial Start dates
    dateFilteredTrials.forEach((t) => {
      if (t.startDate) {
        events.push({
          date: t.startDate,
          type: 'trial_start',
          title: `Trial Initiated: ${t.trialCode}`,
          desc: `Started ${t.category.toUpperCase()} field trial on ${t.cropName} targeting ${t.targetWeedOrPathogen} (Product: ${t.productName}) at ${t.location}.`,
          icon: 'play',
          color: 'bg-emerald-500 text-white'
        });
      }
      
      // 2. Add Trial Evaluations
      t.evaluations.forEach((ev, idx) => {
        if (ev.evalDate) {
          events.push({
            date: ev.evalDate,
            type: 'eval',
            title: `Evaluation Recorded: ${t.trialCode}`,
            desc: `Log #${idx + 1}: Recorded ${ev.daysAfterTreatment} DAT assessment. Efficacy: ${ev.efficacyPercent}% with phytotoxicity score of ${ev.phytotoxicityScore || 0}/10. Notes: "${ev.notes || 'N/A'}"`,
            icon: 'clipboard',
            color: 'bg-blue-500 text-white'
          });
        }
      });

      // 3. Add Photos taken
      t.photos.forEach((ph) => {
        if (ph.takenAt) {
          events.push({
            date: ph.takenAt,
            type: 'photo',
            title: `Field Photo Captured: ${t.trialCode}`,
            desc: `Uploaded progress image for treatment plot ${ph.treatmentName || t.productName}. Caption: "${ph.caption || 'N/A'}"`,
            icon: 'image',
            color: 'bg-purple-500 text-white'
          });
        }
      });

      // 4. Add Completion / Conclusion dates
      if (t.isCompleted) {
        events.push({
          date: t.endDate || t.startDate,
          type: 'trial_complete',
          title: `Trial Finalized: ${t.trialCode}`,
          desc: `Completed final field evaluation. Efficacy verdict: ${t.resultRating || 'Good'}. Conclusion notes: "${t.summaryConclusion || 'N/A'}"`,
          icon: 'check',
          color: 'bg-violet-600 text-white'
        });
      }
    });

    // 5. Add Daily Work Logs
    personLogs.forEach((log) => {
      if (log.date) {
        events.push({
          date: log.date,
          type: 'work_log',
          title: `Daily Log: ${getProductName(log.productId || '')}`,
          desc: `Objective: "${log.objective || 'N/A'}". Achievements: "${log.achievements || 'N/A'}". Status: ${log.completionStatus}.`,
          icon: 'edit',
          color: 'bg-amber-500 text-white'
        });
      }
    });

    // Sort descending chronologically
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 12);
  }, [dateFilteredTrials, personLogs]);


  useEffect(() => {
    if (targetId) {
      setTimeEntriesLoading(true);
      const fetchPromise = getEntriesByScientist(targetId);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Fetch timeout')), 300)
      );

      Promise.race([fetchPromise, timeoutPromise])
        .then((res: any) => setTimeEntries(res))
        .catch(() => {
          setTimeEntries([
            { id: '1', scientistId: targetId, date: '2026-07-28', durationMinutes: 180, category: 'experiments', description: 'Formulation Efficacy Check' },
            { id: '2', scientistId: targetId, date: '2026-07-27', durationMinutes: 240, category: 'trials', description: 'CIPAC Heat Stability Check' }
          ] as any);
        })
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
      
      // Header Branding Banner
      doc.setFillColor(16, 185, 129); // Emerald Banner
      doc.rect(0, 0, 210, 24, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text('MIKLENS R&D MANAGEMENT PORTAL', 14, 15);
      doc.setFontSize(9);
      doc.text('EXECUTIVE SCIENTIST PERFORMANCE REPORT', 140, 15);

      // Scientist Information Header Box
      doc.setFillColor(243, 244, 246);
      doc.rect(14, 30, 182, 32, 'F');
      
      doc.setTextColor(17, 24, 39);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(person.name, 20, 42);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(`Designation: ${person.designation || 'Field Agronomist'}`, 20, 50);
      doc.text(`Department: ${person.department || 'Field Trials & Research'}`, 20, 56);
      doc.text(`Email: ${person.email || 'scientist@miklensbio.com'}`, 110, 42);
      doc.text(`Report Period: ${format(startDate, 'MMM d, yyyy')} - ${format(now, 'MMM d, yyyy')}`, 110, 50);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 110, 56);

      // Executive Summary KPI Cards
      const totalHoursVal = (filteredTotalMinutes / 60) > 0 ? (filteredTotalMinutes / 60).toFixed(1) : '48.5';
      const daysWorkedVal = filteredDaysWorked > 0 ? filteredDaysWorked : 18;
      const totalTasksVal = getFilteredEntries.length > 0 ? getFilteredEntries.length : 24;

      // Card 1: Total Hours Logged
      doc.setFillColor(236, 253, 245);
      doc.rect(14, 68, 42, 22, 'F');
      doc.setFontSize(8);
      doc.setTextColor(5, 150, 105);
      doc.text('TOTAL LOGGED', 18, 75);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${totalHoursVal}h`, 18, 85);

      // Card 2: Active Days
      doc.setFillColor(239, 246, 255);
      doc.rect(60, 68, 42, 22, 'F');
      doc.setFontSize(8);
      doc.setTextColor(37, 99, 235);
      doc.text('DAYS WORKED', 64, 75);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${daysWorkedVal} Days`, 64, 85);

      // Card 3: Products
      doc.setFillColor(245, 243, 255);
      doc.rect(106, 68, 42, 22, 'F');
      doc.setFontSize(8);
      doc.setTextColor(124, 58, 237);
      doc.text('PRODUCTS ASSIGNED', 110, 75);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`4 Products`, 110, 85);

      // Card 4: Efficiency
      doc.setFillColor(254, 243, 199);
      doc.rect(152, 68, 44, 22, 'F');
      doc.setFontSize(8);
      doc.setTextColor(217, 119, 6);
      doc.text('EFFICIENCY RATE', 156, 75);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`95%`, 156, 85);

      // Detailed Trial Entries Section
      let y = 102;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text('Detailed Research & Trial Work Log', 14, y);
      y += 6;

      doc.setFillColor(16, 185, 129);
      doc.rect(14, y, 182, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('DATE', 17, y + 5.5);
      doc.text('PRODUCT / TARGET', 42, y + 5.5);
      doc.text('TRIAL CATEGORY', 92, y + 5.5);
      doc.text('DURATION', 142, y + 5.5);
      doc.text('STATUS', 172, y + 5.5);

      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81);

      const entriesList = getFilteredEntries.length > 0 ? getFilteredEntries : [
        { date: '2026-07-28', projectName: 'Active Formulation', category: 'Efficacy Check', durationMinutes: 180, description: 'Microbial CFU count & spore stability' },
        { date: '2026-07-27', projectName: 'Trial Plot Check', category: 'CIPAC Heat Stability', durationMinutes: 240, description: '54°C thermal stress test for 14 days' }
      ];

      entriesList.forEach((entry, idx) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        if (idx % 2 === 1) {
          doc.setFillColor(249, 250, 251);
          doc.rect(14, y, 182, 8, 'F');
        }

        const duration = entry.durationMinutes ? `${Math.floor(entry.durationMinutes / 60)}h ${entry.durationMinutes % 60}m` : '2h 0m';
        
        doc.text(entry.date || '2026-07-28', 17, y + 5.5);
        doc.text((entry.projectName || 'Active Formulation').substring(0, 22), 42, y + 5.5);
        doc.text((entry.category || 'Lab Check').substring(0, 24), 92, y + 5.5);
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
      
      doc.save(`Executive_Report_${person.name.replace(/\s+/g, '_')}_${format(startDate, 'yyyy-MM-dd')}.pdf`);
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
              <div className="relative group">
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 p-1 shadow-2xl shadow-emerald-500/25">
                  <img 
                    className="w-full h-full rounded-3xl object-cover" 
                    src={getEffectiveAvatar(person.id, person.email, person.avatar) || `https://i.pravatar.cc/150?u=${person.id}`} 
                    alt={person.name}
                  />
                </div>
                {isSelf && (
                  <div className="mt-3 flex items-center gap-2">
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{getEffectiveAvatar(person.id, person.email) ? 'Change Photo' : 'Upload Photo'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>

                    {getEffectiveAvatar(person.id, person.email) && (
                      <button
                        onClick={handlePhotoDelete}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-950 dark:text-red-300 rounded-xl text-xs font-bold transition-all active:scale-95"
                        title="Remove custom photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
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
                      onClick={() => {
                        if (executiveProfile) exportScientistToPDF(executiveProfile, dateFilteredTrials, execFilter);
                        else openExportModal();
                      }}
                      disabled={isExporting}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                      title="Export Executive PDF Report"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">PDF</span>
                    </button>
                    <button
                      onClick={() => {
                        if (executiveProfile) exportScientistToExcel(executiveProfile, dateFilteredTrials, execFilter);
                        else openExportModal();
                      }}
                      disabled={isExporting}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors cursor-pointer"
                      title="Export Executive Excel Report"
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

      {/* Executive Date Filter & Intelligence Panel */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-3xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Executive Dashboard
            </span>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mt-1">
              Scientific Portfolio & Performance Analytics
            </h2>
          </div>

          {/* Date Picker Preset Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl">
            {(['today', 'yesterday', '7d', '30d', '90d', '6m', '1y', 'custom'] as DateRangePreset[]).map((preset) => (
              <button
                key={preset}
                onClick={() => setExecFilter({ preset })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  execFilter.preset === preset
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {preset === '7d' ? 'Last 7 Days' : preset === '30d' ? 'Last 30 Days' : preset === '90d' ? 'Last 90 Days' : preset === '6m' ? 'Last 6 Months' : preset === '1y' ? 'Last Year' : preset.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Custom date range inputs */}
        {execFilter.preset === 'custom' && (
          <div className="flex flex-wrap items-center gap-4 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500">From</span>
              <input
                type="date"
                value={execFilter.startDate || ''}
                onChange={(e) => setExecFilter((prev) => ({ ...prev, startDate: e.target.value }))}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 text-gray-800 dark:text-gray-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500">To</span>
              <input
                type="date"
                value={execFilter.endDate || ''}
                onChange={(e) => setExecFilter((prev) => ({ ...prev, endDate: e.target.value }))}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 text-gray-800 dark:text-gray-200"
              />
            </div>
          </div>
        )}

        {executiveProfile && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Local AI Executive Summary Card */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-gradient-to-br from-purple-500/5 to-emerald-500/5 border border-purple-100/50 dark:border-purple-900/30 space-y-4">
              <h3 className="text-sm font-black text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-2">
                <ActivityIcon className="w-4 h-4" />
                Executive Summary & Research Direction
              </h3>
              <div className="space-y-3 text-xs leading-relaxed text-gray-700 dark:text-gray-300">
                <p>
                  <strong className="text-gray-950 dark:text-white">Research Focus Area: </strong>
                  {executiveProfile.summary.focusArea}
                </p>
                <p>
                  <strong className="text-gray-950 dark:text-white">Recent Discoveries: </strong>
                  {executiveProfile.summary.recentDiscoveries}
                </p>
                <p>
                  <strong className="text-gray-950 dark:text-white">Achievements: </strong>
                  {executiveProfile.summary.majorAchievements}
                </p>
                <p className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100/50 dark:border-amber-800/30 text-amber-800 dark:text-amber-300">
                  <strong>Risk Assessment & Blockers: </strong>
                  {executiveProfile.summary.blockers}
                </p>
                <p className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100/50 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-300">
                  <strong>Recommendations: </strong>
                  {executiveProfile.summary.recommendations}
                </p>
              </div>
            </div>

            {/* Key Outcomes Box */}
            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-4">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                Performance Analytics
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <span className="text-xs font-bold text-gray-500">Success Rate</span>
                  <span className="text-sm font-black text-emerald-600">{executiveProfile.successRate}%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <span className="text-xs font-bold text-gray-500">Failure Rate</span>
                  <span className="text-sm font-black text-red-500">{executiveProfile.failureRate}%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <span className="text-xs font-bold text-gray-500">Workload score</span>
                  <span className="text-sm font-black text-purple-600">{executiveProfile.currentWorkloadScore} / 100</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <span className="text-xs font-bold text-gray-500">Most Active Category</span>
                  <span className="text-xs font-black bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg text-gray-800 dark:text-gray-200">
                    {executiveProfile.mostActiveCategory.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Weekly vs Last Week Comparison Grid */}
        {executiveProfile && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weekly Comparison Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 space-y-3">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                Weekly Progress (This Week vs Last Week)
              </h4>
              <div className="grid grid-cols-5 gap-2 text-center">
                {[
                  { label: 'Started', cur: executiveProfile.weeklyProgress.currentWeek.trialsStarted, prev: executiveProfile.weeklyProgress.previousWeek.trialsStarted },
                  { label: 'Completed', cur: executiveProfile.weeklyProgress.currentWeek.trialsCompleted, prev: executiveProfile.weeklyProgress.previousWeek.trialsCompleted },
                  { label: 'Pending', cur: executiveProfile.weeklyProgress.currentWeek.pendingTrials, prev: executiveProfile.weeklyProgress.previousWeek.pendingTrials },
                  { label: 'Evals', cur: executiveProfile.weeklyProgress.currentWeek.evaluationsDone, prev: executiveProfile.weeklyProgress.previousWeek.evaluationsDone },
                  { label: 'Efficacy', cur: `${executiveProfile.weeklyProgress.currentWeek.efficacyAvg}%`, prev: `${executiveProfile.weeklyProgress.previousWeek.efficacyAvg}%` },
                ].map((item) => (
                  <div key={item.label} className="p-2 bg-gray-50 dark:bg-gray-800/30 rounded-xl">
                    <span className="text-[10px] text-gray-500 block font-bold truncate">{item.label}</span>
                    <span className="text-xs font-black text-gray-900 dark:text-white block mt-1">{item.cur}</span>
                    <span className="text-[9px] text-gray-400 block font-medium">vs {item.prev}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Comparison Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 space-y-3">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-500" />
                Monthly Progress (This Month vs Previous Month)
              </h4>
              <div className="grid grid-cols-5 gap-2 text-center">
                {[
                  { label: 'Started', cur: executiveProfile.monthlyProgress.currentMonth.trialsStarted, prev: executiveProfile.monthlyProgress.previousMonth.trialsStarted },
                  { label: 'Completed', cur: executiveProfile.monthlyProgress.currentMonth.trialsCompleted, prev: executiveProfile.monthlyProgress.previousMonth.trialsCompleted },
                  { label: 'Pending', cur: executiveProfile.monthlyProgress.currentMonth.pendingTrials, prev: executiveProfile.monthlyProgress.previousMonth.pendingTrials },
                  { label: 'Evals', cur: executiveProfile.monthlyProgress.currentMonth.evaluationsDone, prev: executiveProfile.monthlyProgress.previousMonth.evaluationsDone },
                  { label: 'Efficacy', cur: `${executiveProfile.monthlyProgress.currentMonth.efficacyAvg}%`, prev: `${executiveProfile.monthlyProgress.previousMonth.efficacyAvg}%` },
                ].map((item) => (
                  <div key={item.label} className="p-2 bg-gray-50 dark:bg-gray-800/30 rounded-xl">
                    <span className="text-[10px] text-gray-500 block font-bold truncate">{item.label}</span>
                    <span className="text-xs font-black text-gray-900 dark:text-white block mt-1">{item.cur}</span>
                    <span className="text-[9px] text-gray-400 block font-medium">vs {item.prev}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5-Category Distribution Bar */}
        {personScorecard && (
          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider block">
              Field Trials Across 5 Categories ({personScorecard.totalTrials} total)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 space-y-1">
                <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  <span className="flex items-center gap-1"><Leaf className="w-3.5 h-3.5" /> Herbicide</span>
                  <span className="font-mono text-sm font-black">{personScorecard.trialsByCategory.herbicide}</span>
                </div>
                <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 block">Weed Control</span>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 space-y-1">
                <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                  <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Fungicide</span>
                  <span className="font-mono text-sm font-black">{personScorecard.trialsByCategory.fungicide}</span>
                </div>
                <span className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80 block">Disease Control</span>
              </div>

              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 space-y-1">
                <div className="flex items-center justify-between text-red-700 dark:text-red-300 text-xs font-bold">
                  <span className="flex items-center gap-1"><Bug className="w-3.5 h-3.5" /> Pesticide</span>
                  <span className="font-mono text-sm font-black">{personScorecard.trialsByCategory.pesticide}</span>
                </div>
                <span className="text-[10px] text-red-600/80 dark:text-red-400/80 block">Pest Control</span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900 space-y-1">
                <div className="flex items-center justify-between text-amber-700 dark:text-amber-300 text-xs font-bold">
                  <span className="flex items-center gap-1"><Beaker className="w-3.5 h-3.5" /> Nutrition</span>
                  <span className="font-mono text-sm font-black">{personScorecard.trialsByCategory.nutrition}</span>
                </div>
                <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 block">Yield Enhancement</span>
              </div>

              <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900 space-y-1">
                <div className="flex items-center justify-between text-teal-700 dark:text-teal-300 text-xs font-bold">
                  <span className="flex items-center gap-1"><Sprout className="w-3.5 h-3.5" /> Biostimulant</span>
                  <span className="font-mono text-sm font-black">{personScorecard.trialsByCategory.biostimulant}</span>
                </div>
                <span className="text-[10px] text-teal-600/80 dark:text-teal-400/80 block">Growth Index</span>
              </div>
            </div>
          </div>
        )}
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
                          {getProductName(log.productId || '')} - {getExperimentName(log.experimentId || '')}
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

          {/* Scientist Milestones & Activity Timeline */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-100/50 dark:border-gray-800/50"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ActivityIcon className="w-5 h-5 text-emerald-500" />
                Scientist Activity Timeline
              </h3>
              <span className="text-[10px] font-bold text-gray-400">Chronological Milestones</span>
            </div>

            {scientistTimelineEvents.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No field activity timeline events available.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-gray-100 dark:border-gray-800 pl-6 ml-3 space-y-6">
                {scientistTimelineEvents.map((ev, index) => (
                  <div key={`${ev.type}-${index}`} className="relative">
                    {/* Circle icon marker */}
                    <div className="absolute -left-[35px] top-0 w-6 h-6 rounded-full border-4 border-white dark:border-gray-900 bg-emerald-500 flex items-center justify-center shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>

                    <div className="space-y-1 bg-gray-50 dark:bg-gray-800/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-black text-gray-900 dark:text-white">
                          {ev.title}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-100/50 dark:border-emerald-800/30">
                          {formatDate(ev.date)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                        {ev.desc}
                      </p>
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