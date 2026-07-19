import { useState, useEffect, memo } from 'react';
import { 
  Clock, 
  Calendar, 
  BarChart3, 
  PieChart,
  TrendingUp,
  FolderOpen,
  FileText,
  Target,
  Users,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Loader2,
  Sparkles,
  Award,
  Timer,
  Briefcase
} from 'lucide-react';
import { 
  getEntriesByScientistAndDateRange, 
  getProjectProgressForScientist,
  getTotalHoursWorked 
} from '../services/timeTracking';
import { 
  TimeMotionEntry, 
  ActivityCategory, 
  ProjectProgress,
  getCategoryLabel,
  getCategoryColor,
  getStageLabel
} from '../types/timeTracking';

interface ScientistPerformanceOverviewProps {
  scientistId: string;
  scientistName: string;
  dateRange?: 'week' | 'month' | 'quarter';
  onViewDetails?: () => void;
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

export const ScientistPerformanceOverview: React.FC<ScientistPerformanceOverviewProps> = memo(({
  scientistId,
  scientistName,
  dateRange = 'month',
  onViewDetails
}) => {
  const [entries, setEntries] = useState<TimeMotionEntry[]>([]);
  const [projectProgress, setProjectProgress] = useState<ProjectProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalHours, setTotalHours] = useState(0);
  const [averageDailyHours, setAverageDailyHours] = useState(0);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    switch (dateRange) {
      case 'week': start.setDate(start.getDate() - 7); break;
      case 'month': start.setMonth(start.getMonth() - 1); break;
      case 'quarter': start.setMonth(start.getMonth() - 3); break;
    }
    return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const { startDate, endDate } = getDateRange();
        const [entriesData, progressData, hours] = await Promise.all([
          getEntriesByScientistAndDateRange(scientistId, startDate, endDate),
          getProjectProgressForScientist(scientistId),
          getTotalHoursWorked(scientistId, startDate, endDate)
        ]);
        
        setEntries(entriesData);
        setProjectProgress(progressData);
        setTotalHours(hours);
        
        const uniqueDates = new Set(entriesData.map(e => e.date));
        setAverageDailyHours(hours / (uniqueDates.size || 1));
      } catch (error) {
        console.error('Error loading performance data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [scientistId, dateRange]);

  const getCategoryBreakdown = () => {
    const totals: Record<ActivityCategory, number> = {
      research: 0, document: 0, trials: 0, experiments: 0,
      lab: 0, meetings: 0, discussions: 0, field_visits: 0, other: 0
    };
    
    entries.forEach(entry => totals[entry.category] += entry.durationMinutes);
    
    return Object.entries(totals)
      .filter(([, minutes]) => minutes > 0)
      .map(([category, minutes]) => ({
        category: category as ActivityCategory,
        label: getCategoryLabel(category as ActivityCategory),
        icon: ACTIVITY_CATEGORIES.find(c => c.value === category)?.icon || '📌',
        minutes,
        hours: (minutes / 60).toFixed(1),
        percentage: totalHours > 0 ? Math.round((minutes / (totalHours * 60)) * 100) : 0,
        color: getCategoryColor(category as ActivityCategory)
      }))
      .sort((a, b) => b.minutes - a.minutes);
  };

  const getRecentActivity = () => {
    return [...entries]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  };

  const getActiveProjects = () => projectProgress.filter(p => p.status === 'active').slice(0, 4);

  const getProductivityScore = () => {
    const targetHoursPerDay = 8;
    return Math.min(100, Math.round((averageDailyHours / targetHoursPerDay) * 100));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'from-green-500 to-emerald-600', text: 'text-green-600', label: 'Excellent' };
    if (score >= 60) return { bg: 'from-blue-500 to-cyan-600', text: 'text-blue-600', label: 'Good' };
    if (score >= 40) return { bg: 'from-yellow-500 to-orange-600', text: 'text-yellow-600', label: 'Fair' };
    return { bg: 'from-red-500 to-pink-600', text: 'text-red-600', label: 'Needs Focus' };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const productivityScore = getProductivityScore();
  const scoreStyle = getScoreColor(productivityScore);
  const categoryBreakdown = getCategoryBreakdown();
  const recentActivity = getRecentActivity();
  const activeProjects = getActiveProjects();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-gray-900">Performance Overview</span>
        </div>
        {onViewDetails && (
          <button onClick={onViewDetails} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
            View Details <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Hours */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Total Hours</p>
          <p className="text-xl font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
          <p className="text-xs text-gray-400 mt-1">Avg {averageDailyHours.toFixed(1)}h/day</p>
        </div>

        {/* Activities */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Activities</p>
          <p className="text-xl font-bold text-gray-900">{entries.length}</p>
          <p className="text-xs text-gray-400 mt-1">{new Set(entries.map(e => e.date)).size} days active</p>
        </div>

        {/* Projects */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-4 border border-orange-100">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Projects</p>
          <p className="text-xl font-bold text-gray-900">{activeProjects.length}</p>
          <p className="text-xs text-gray-400 mt-1">{projectProgress.length} total tracked</p>
        </div>

        {/* Score */}
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${scoreStyle.bg} flex items-center justify-center`}>
              <Award className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Score</p>
          <p className={`text-xl font-bold ${scoreStyle.text}`}>{productivityScore}/100</p>
          <p className="text-xs text-gray-400 mt-1">{scoreStyle.label}</p>
        </div>
      </div>

      {/* Productivity Score Bar */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">Productivity Score</span>
          </div>
          <span className={`text-2xl font-bold ${scoreStyle.text}`}>{productivityScore}%</span>
        </div>
        
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div 
            className={`h-3 rounded-full bg-gradient-to-r ${scoreStyle.bg} transition-all duration-500`}
            style={{ width: `${productivityScore}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>0%</span>
          <span>Target: 100% (8h/day)</span>
          <span>100%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Time Distribution */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-gray-900">Time Distribution</span>
          </div>
          
          {categoryBreakdown.length === 0 ? (
            <p className="text-gray-400 text-center py-8 text-sm">No data available</p>
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.slice(0, 5).map((item) => (
                <div key={item.category}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: item.color }}>
                      {item.hours}h ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project Progress */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-orange-600" />
            <span className="font-medium text-gray-900">Project Progress</span>
          </div>
          
          {activeProjects.length === 0 ? (
            <p className="text-gray-400 text-center py-8 text-sm">No active projects</p>
          ) : (
            <div className="space-y-3">
              {activeProjects.map((project) => (
                <div key={project.projectId} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 text-sm truncate">{project.projectName}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      project.stage === 'completed' ? 'bg-green-100 text-green-700' :
                      project.stage === 'production' ? 'bg-blue-100 text-blue-700' :
                      project.stage === 'pilot' ? 'bg-purple-100 text-purple-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {getStageLabel(project.stage)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${project.progressPercent}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{project.progressPercent}%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{project.hoursSpent.toFixed(1)}h logged</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-900">Recent Activity</span>
        </div>
        
        {recentActivity.length === 0 ? (
          <p className="text-gray-400 text-center py-6 text-sm">No recent activity</p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((entry) => {
              const cat = ACTIVITY_CATEGORIES.find(c => c.value === entry.category);
              return (
                <div key={entry.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-lg">{cat?.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {entry.startTime} - {entry.endTime}
                      </span>
                      <span 
                        className="px-2 py-0.5 rounded text-xs"
                        style={{ backgroundColor: cat?.color + '20', color: cat?.color }}
                      >
                        {cat?.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{entry.description}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

ScientistPerformanceOverview.displayName = 'ScientistPerformanceOverview';

export default ScientistPerformanceOverview;