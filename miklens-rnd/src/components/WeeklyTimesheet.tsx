import { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { 
  Clock, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  BarChart3,
  PieChart,
  Target,
  TrendingUp,
  Sun,
  Moon,
  Coffee,
  Zap,
  Download,
  Printer,
  Filter,
  Eye,
  Edit2,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Sparkles,
  FileText,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  FileSpreadsheet
} from 'lucide-react';
import { 
  getEntriesByScientistAndDateRange
} from '../services/timeTracking';
import { 
  TimeMotionEntry, 
  ActivityCategory,
  getCategoryLabel,
  getCategoryColor,
  getStageLabel
} from '../types/timeTracking';
import { useAuth } from '../contexts/AuthContext';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, isToday } from 'date-fns';
import { exportToPDF, exportToExcel, formatWeeklySummaryForExport, formatTimeEntriesForExport } from '../utils/exportUtils';

interface WeeklyTimesheetProps {
  userId?: string;
}

const ACTIVITY_CATEGORIES = [
  { value: 'research', icon: '📚', label: 'Research', color: '#8B5CF6' },
  { value: 'document', icon: '📄', label: 'Documents', color: '#3B82F6' },
  { value: 'trials', icon: '🌾', label: 'Field Trials', color: '#10B981' },
  { value: 'experiments', icon: '🧪', label: 'Experiments', color: '#F59E0B' },
  { value: 'lab', icon: '🔬', label: 'Laboratory', color: '#EC4899' },
  { value: 'meetings', icon: '👥', label: 'Meetings', color: '#6366F1' },
  { value: 'discussions', icon: '💬', label: 'Discussions', color: '#14B8A6' },
  { value: 'field_visits', icon: '🚗', label: 'Field Visits', color: '#84CC16' },
  { value: 'other', icon: '📌', label: 'Other', color: '#6B7280' },
];

export const WeeklyTimesheet: React.FC<WeeklyTimesheetProps> = memo(({ userId }) => {
  const { currentUser } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [entries, setEntries] = useState<TimeMotionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');
  const [isExporting, setIsExporting] = useState(false);

  const scientistId = userId || currentUser?.uid || '';

  // Get week dates
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Load entries for the week
  useEffect(() => {
    const loadEntries = async () => {
      if (!scientistId) return;
      setIsLoading(true);
      try {
        const data = await getEntriesByScientistAndDateRange(
          scientistId,
          weekStart.toISOString().split('T')[0],
          weekEnd.toISOString().split('T')[0]
        );
        setEntries(data);
      } catch (error) {
        console.error('Error loading entries:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadEntries();
  }, [scientistId, currentWeek]);

  // Group entries by day
  const entriesByDay = useMemo(() => {
    const map: Record<string, TimeMotionEntry[]> = {};
    weekDays.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      map[dateKey] = entries.filter(e => e.date === dateKey);
    });
    return map;
  }, [entries, weekDays]);

  // Calculate daily totals
  const getDayTotal = (day: Date): number => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return entriesByDay[dateKey]?.reduce((sum, e) => sum + e.durationMinutes, 0) || 0;
  };

  // Weekly totals
  const weeklyTotal = entries.reduce((sum, e) => sum + e.durationMinutes, 0);
  const billableMinutes = entries.filter(e => (e as any).isBillable).reduce((sum, e) => sum + e.durationMinutes, 0);
  const totalEntries = entries.length;

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const totals: Record<ActivityCategory, number> = {
      research: 0, document: 0, trials: 0, experiments: 0,
      lab: 0, meetings: 0, discussions: 0, field_visits: 0, other: 0
    };
    entries.forEach(e => totals[e.category] += e.durationMinutes);
    return Object.entries(totals)
      .filter(([, mins]) => mins > 0)
      .map(([cat, mins]) => ({
        category: cat as ActivityCategory,
        ...ACTIVITY_CATEGORIES.find(c => c.value === cat),
        minutes: mins,
        hours: (mins / 60).toFixed(1),
        percentage: Math.round((mins / weeklyTotal) * 100)
      }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [entries, weeklyTotal]);

  // Get time of day icon
  const getTimeIcon = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) return <Sun className="w-4 h-4 text-yellow-500" />;
    if (hour < 14) return <Sun className="w-4 h-4 text-orange-500" />;
    if (hour < 18) return <Coffee className="w-4 h-4 text-amber-500" />;
    return <Moon className="w-4 h-4 text-indigo-500" />;
  };

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  // Export handlers
  const handleExportPDF = useCallback(async () => {
    if (entries.length === 0) {
      alert('No entries to export');
      return;
    }
    setIsExporting(true);
    try {
      const summary = {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        hoursByDay: Object.fromEntries(
          weekDays.map(day => [
            format(day, 'yyyy-MM-dd'),
            getDayTotal(day)
          ])
        )
      };
      
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text('Weekly Timesheet', 14, 22);
      doc.setFontSize(10);
      doc.text(`Week: ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`, 14, 30);
      doc.text(`Total Hours: ${(weeklyTotal / 60).toFixed(1)}h`, 14, 36);
      
      let y = 50;
      doc.setFontSize(12);
      doc.text('Daily Summary', 14, y);
      y += 8;
      doc.setFontSize(9);
      
      weekDays.forEach(day => {
        const dayTotal = getDayTotal(day);
        doc.text(`${format(day, 'EEE, MMM d')}: ${formatDuration(dayTotal)}`, 14, y);
        y += 6;
      });
      
      y += 10;
      doc.setFontSize(12);
      doc.text('Time Entries', 14, y);
      y += 8;
      doc.setFontSize(9);
      
      entries.slice(0, 25).forEach(entry => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        const duration = formatDuration(entry.durationMinutes);
        doc.text(`${entry.date} ${entry.startTime || ''}-${entry.endTime || ''} ${duration} ${entry.category} ${(entry.description || '').substring(0, 40)}`, 14, y);
        y += 6;
      });
      
      doc.save(`Weekly_Timesheet_${format(weekStart, 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  }, [entries, weekStart, weekEnd, weekDays, weeklyTotal]);

  const handleExportExcel = useCallback(async () => {
    if (entries.length === 0) {
      alert('No entries to export');
      return;
    }
    setIsExporting(true);
    try {
      const summary = {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        hoursByDay: Object.fromEntries(
          weekDays.map(day => [
            format(day, 'yyyy-MM-dd'),
            getDayTotal(day)
          ])
        ),
        activitiesByType: {}
      };
      
      const sheets = [
        formatWeeklySummaryForExport(summary, 'excel'),
        formatTimeEntriesForExport(entries, 'excel')
      ];
      
      exportToExcel(sheets, `Weekly_Timesheet_${format(weekStart, 'yyyy-MM-dd')}.xlsx`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export Excel');
    } finally {
      setIsExporting(false);
    }
  }, [entries, weekStart, weekEnd, weekDays]);

  const getDayStatus = (minutes: number) => {
    if (minutes >= 480) return { label: 'Full Day', color: 'text-green-600 bg-green-50', icon: CheckCircle };
    if (minutes >= 300) return { label: 'Good', color: 'text-blue-600 bg-blue-50', icon: TrendingUp };
    if (minutes > 0) return { label: 'Partial', color: 'text-yellow-600 bg-yellow-50', icon: AlertTriangle };
    return { label: 'No Data', color: 'text-gray-400 bg-gray-50', icon: Clock };
  };

  const prevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const goToToday = () => setCurrentWeek(new Date());

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Weekly Timesheet</h2>
            <p className="text-gray-500 text-sm">Week of {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                viewMode === 'overview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                viewMode === 'detailed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              Detailed
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button onClick={prevWeek} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={goToToday} className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              Today
            </button>
            <button onClick={nextWeek} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 dark:bg-gray-800 dark:border-gray-700">
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors dark:hover:bg-red-900/20"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-md transition-colors dark:hover:bg-green-900/20"
              title="Download Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Hours */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
              weeklyTotal >= 2400 ? 'bg-green-100 text-green-700' :
              weeklyTotal >= 1800 ? 'bg-blue-100 text-blue-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {weeklyTotal >= 2400 ? '✓ On Track' : `${Math.round((weeklyTotal / 2400) * 100)}%`}
            </span>
          </div>
          <p className="text-sm text-gray-500">Total Hours</p>
          <p className="text-2xl font-bold text-gray-900">{(weeklyTotal / 60).toFixed(1)}h</p>
        </div>

        {/* Billable */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Billable Hours</p>
          <p className="text-2xl font-bold text-gray-900">{(billableMinutes / 60).toFixed(1)}h</p>
          <p className="text-xs text-gray-400 mt-1">{Math.round((billableMinutes / weeklyTotal) * 100) || 0}% of total</p>
        </div>

        {/* Activities */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Activities</p>
          <p className="text-2xl font-bold text-gray-900">{totalEntries}</p>
          <p className="text-xs text-gray-400 mt-1">Across {weekDays.filter(d => getDayTotal(d) > 0).length} days</p>
        </div>

        {/* Daily Average */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Daily Average</p>
          <p className="text-2xl font-bold text-gray-900">
            {(weeklyTotal / 60 / (weekDays.filter(d => getDayTotal(d) > 0).length || 1)).toFixed(1)}h
          </p>
          <p className="text-xs text-gray-400 mt-1">Target: 8h/day</p>
        </div>
      </div>

      {/* Week Grid */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <>
            {/* Day Cards */}
            <div className="grid grid-cols-7 gap-3 mb-6">
              {weekDays.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayEntries = entriesByDay[dateKey] || [];
                const total = getDayTotal(day);
                const status = getDayStatus(total);
                const StatusIcon = status.icon;
                const isSelected = selectedDay && isSameDay(day, selectedDay);

                return (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                    } ${isToday(day) ? 'ring-2 ring-blue-300' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">
                        {format(day, 'EEE')}
                      </span>
                      {isToday(day) && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{format(day, 'd')}</p>
                    <div className="mt-2">
                      <p className={`text-xs font-medium ${status.color} px-2 py-0.5 rounded-full inline-flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {formatDuration(total)}
                      </p>
                    </div>
                    {dayEntries.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">{dayEntries.length} entries</p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Weekly Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Weekly Progress</span>
                <span className="text-sm text-gray-500">
                  {(weeklyTotal / 60).toFixed(1)} / 40 hours
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div 
                  className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all"
                  style={{ width: `${Math.min(100, (weeklyTotal / 2400) * 100)}%` }}
                />
              </div>
            </div>

            {/* Category Breakdown */}
            {categoryBreakdown.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-purple-600" />
                  Time by Category
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {categoryBreakdown.slice(0, 5).map((item) => (
                    <div 
                      key={item.category}
                      className="p-3 rounded-xl border"
                      style={{ borderColor: item.color + '30', backgroundColor: item.color + '08' }}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <span>{item.icon}</span>
                        <span className="text-xs font-medium text-gray-600">{item.label}</span>
                      </div>
                      <p className="text-lg font-bold" style={{ color: item.color }}>{item.hours}h</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Selected Day Detail */}
      {selectedDay && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              {format(selectedDay, 'EEEE, MMMM d, yyyy')}
            </h3>
            <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-gray-600">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {entriesByDay[format(selectedDay, 'yyyy-MM-dd')]?.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No activities logged for this day</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entriesByDay[format(selectedDay, 'yyyy-MM-dd')]?.map((entry) => {
                const cat = ACTIVITY_CATEGORIES.find(c => c.value === entry.category);
                return (
                  <div key={entry.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="flex flex-col items-center min-w-[60px]">
                      {getTimeIcon(entry.startTime)}
                      <span className="text-sm font-semibold text-gray-900">{entry.startTime}</span>
                      <span className="text-xs text-gray-400">{entry.endTime}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{cat?.icon}</span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: cat?.color + '20', color: cat?.color }}>
                          {cat?.label}
                        </span>
                        {(entry as any).isBillable && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Billable</span>
                        )}
                      </div>
                      <p className="text-gray-700">{entry.description}</p>
                      {entry.projectName && (
                        <p className="text-sm text-orange-600 mt-1">
                          📁 {entry.projectName}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatDuration(entry.durationMinutes)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

WeeklyTimesheet.displayName = 'WeeklyTimesheet';

export default WeeklyTimesheet;