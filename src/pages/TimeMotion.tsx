import { useState, memo } from 'react';
import { 
  Clock, 
  Users, 
  BarChart3, 
  FileSpreadsheet,
  Timer,
  Calendar,
  Plus,
  Zap,
  Brain,
  Home,
  CalendarDays,
  Download,
  FileText,
  File
} from 'lucide-react';
import { TimeMotionDashboard } from '../components/TimeMotionDashboard';
import { TimeMotionForm } from '../components/TimeMotionForm';
import { TimeTrackingTimer } from '../components/TimeTrackingTimer';
import { WeeklyTimesheet } from '../components/WeeklyTimesheet';
import { ScientistHub } from '../components/ScientistHub';
import { useAuth } from '../contexts/AuthContext';
import { getTodayActivities, getActivitiesByScientist } from '../services/unifiedActivity';
import { 
  quickExport, 
  formatTimeEntriesForExport, 
  formatWeeklySummaryForExport,
  formatDashboardStatsForExport 
} from '../utils/exportUtils';
import { getWeeklySummary, getScientistDashboardStats } from '../services/unifiedActivity';

type ViewType = 'hub' | 'timer' | 'weekly' | 'dashboard' | 'form' | 'management';

export const TimeMotion: React.FC = memo(() => {
  const { currentUser, profile } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('hub');
  const [showManagementView, setShowManagementView] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const isManagement = profile?.role === 'Admin' || profile?.role === 'Management';
  const scientistId = currentUser?.uid || '';

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [todayActivities, weeklySummary, stats] = await Promise.all([
        getTodayActivities(scientistId),
        getWeeklySummary(scientistId, new Date()),
        getScientistDashboardStats(scientistId)
      ]);

      // Create combined PDF with all data
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Title
      doc.setFontSize(20);
      doc.text('Time Motion Report', 14, 22);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

      // Dashboard Stats Section
      doc.setFontSize(14);
      doc.text('Performance Summary', 14, 45);
      doc.setFontSize(10);
      
      const statsData = [
        ['Total Hours This Month', `${stats.totalHoursThisMonth?.toFixed(1) || 0}h`],
        ['Total Hours This Week', `${stats.totalHoursThisWeek?.toFixed(1) || 0}h`],
        ['Active Projects', stats.activeProjectsCount?.toString() || '0'],
        ['Experiments', stats.experimentsWorkedOn?.toString() || '0'],
        ['Tasks Completed', stats.tasksCompleted?.toString() || '0'],
        ['Billable Hours', `${stats.billableHoursThisMonth?.toFixed(1) || 0}h`],
        ['Billable %', `${stats.billablePercentage || 0}%`]
      ];

      let y = 55;
      statsData.forEach(([label, value]) => {
        doc.text(`${label}:`, 14, y);
        doc.text(String(value), 70, y);
        y += 7;
      });

      // Today's Activities
      y += 10;
      doc.setFontSize(14);
      doc.text("Today's Activities", 14, y);
      y += 8;
      doc.setFontSize(9);

      todayActivities.forEach((activity: any) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        const duration = activity.durationMinutes ? `${Math.floor(activity.durationMinutes / 60)}h ${activity.durationMinutes % 60}m` : '0m';
        doc.text(`${activity.startTime || ''} - ${activity.endTime || ''} (${duration}) ${activity.category || ''} - ${(activity.description || '').substring(0, 50)}`, 14, y);
        y += 6;
      });

      doc.save(`TimeMotion_Report_${today}.pdf`);
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
      const [todayActivities, weeklySummary, stats] = await Promise.all([
        getTodayActivities(scientistId),
        getWeeklySummary(scientistId, new Date()),
        getScientistDashboardStats(scientistId)
      ]);

      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Use the Excel export utility
      const { exportToExcel } = await import('../utils/exportUtils');
      
      // Create multiple sheets
      const sheets = [
        formatDashboardStatsForExport(stats, 'excel'),
        formatTimeEntriesForExport(todayActivities, 'excel'),
        formatWeeklySummaryForExport(weeklySummary, 'excel')
      ];

      exportToExcel(sheets, `TimeMotion_Data_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const navItems = [
    { id: 'hub' as ViewType, label: 'My Hub', icon: Home },
    { id: 'timer' as ViewType, label: 'Timer', icon: Timer },
    { id: 'weekly' as ViewType, label: 'Weekly', icon: Calendar },
    { id: 'dashboard' as ViewType, label: 'History', icon: Clock },
    { id: 'form' as ViewType, label: 'Log Activity', icon: Plus },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* View Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                    currentView === item.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Management Controls */}
          <div className="flex items-center gap-2">
            {/* Export Buttons */}
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Download PDF"
              >
                <FileText className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={handleExportExcel}
                disabled={isExporting}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-md transition-colors"
                title="Download Excel"
              >
                <File className="w-4 h-4" />
                Excel
              </button>
            </div>

            {isManagement && (
              <button
                onClick={() => setShowManagementView(!showManagementView)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  showManagementView 
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' 
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Users className="w-4 h-4" />
                <span className="font-medium">{showManagementView ? 'Team View' : 'My View'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="animate-fade-in">
        {currentView === 'hub' && <ScientistHub />}

        {currentView === 'timer' && (
          <div className="max-w-2xl mx-auto">
            <TimeTrackingTimer onSuccess={() => {}} />
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Quick Tips</h4>
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>• Use quick start buttons for common tasks</li>
                    <li>• Mark time as billable for client work</li>
                    <li>• Link activities to projects for better tracking</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'weekly' && <WeeklyTimesheet />}

        {currentView === 'dashboard' && (
          <TimeMotionDashboard viewMode={showManagementView ? 'management' : 'personal'} />
        )}

        {currentView === 'form' && (
          <div className="max-w-4xl mx-auto">
            <TimeMotionForm
              onSuccess={() => setCurrentView('hub')}
              onCancel={() => setCurrentView('hub')}
            />
          </div>
        )}
      </div>
    </div>
  );
});

TimeMotion.displayName = 'TimeMotion';

export default TimeMotion;