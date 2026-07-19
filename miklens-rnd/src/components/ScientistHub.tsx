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
  Briefcase,
  CheckCircle,
  AlertCircle,
  Eye,
  Sun,
  Moon,
  Coffee,
  FlaskConical,
  MapPin,
  TestTube2,
  ListTodo,
  FileStack,
  Bell,
  CalendarDays,
  DollarSign,
  Wrench,
  Brain,
  Lightbulb,
  AlertTriangle,
  Star
} from 'lucide-react';
import { getScientistDashboardStats, getWeeklySummary, getTodayActivities, getActivitiesByScientist } from '../services/unifiedActivity';
import { ScientistDashboardStats, WeeklySummary, UnifiedActivity, getActivityTypeIcon, getActivityTypeLabel, getStatusColor } from '../types/unifiedTracking';
import { useAuth } from '../contexts/AuthContext';

interface ScientistHubProps {
  userId?: string;
}

const ACTIVITY_ICONS: Record<string, string> = {
  time_entry: '⏱️',
  experiment: '🧪',
  field_trial: '🌾',
  lab_test: '🔬',
  task: '✅',
  meeting: '👥',
  document: '📄',
  observation: '👁️',
  product: '📦',
  research: '🔍',
  discussion: '💬',
  other: '📌'
};

export const ScientistHub: React.FC<ScientistHubProps> = memo(({ userId }) => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<ScientistDashboardStats | null>(null);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [todayActivities, setTodayActivities] = useState<UnifiedActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'projects' | 'ai'>('overview');

  const scientistId = userId || currentUser?.uid || '';

  useEffect(() => {
    const loadData = async () => {
      if (!scientistId) return;
      setIsLoading(true);
      try {
        const [statsData, summaryData, todayData] = await Promise.all([
          getScientistDashboardStats(scientistId),
          getWeeklySummary(scientistId, new Date()),
          getTodayActivities(scientistId)
        ]);
        setStats(statsData);
        setWeeklySummary(summaryData);
        setTodayActivities(todayData);
      } catch (error) {
        console.error('Error loading hub data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [scientistId]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { icon: Sun, text: 'Good Morning', color: 'from-amber-400 to-orange-500' };
    if (hour < 17) return { icon: Sun, text: 'Good Afternoon', color: 'from-blue-400 to-cyan-500' };
    return { icon: Moon, text: 'Good Evening', color: 'from-indigo-400 to-purple-500' };
  };

  const getTimeIcon = (time?: string) => {
    if (!time) return <Clock className="w-4 h-4 text-gray-400" />;
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) return <Sun className="w-4 h-4 text-yellow-500" />;
    if (hour < 14) return <Sun className="w-4 h-4 text-orange-500" />;
    if (hour < 18) return <Coffee className="w-4 h-4 text-amber-500" />;
    return <Moon className="w-4 h-4 text-indigo-500" />;
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '0m';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  // Calculate today's progress
  const todayMinutes = todayActivities.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);
  const targetMinutes = 480; // 8 hours
  const todayProgress = Math.min(100, (todayMinutes / targetMinutes) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-green-500 to-blue-500 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center">
                <GreetingIcon className="w-8 h-8" />
              </div>
              <div>
                <p className="text-white/70 font-medium">{greeting.text}!</p>
                <h2 className="text-3xl font-bold">Welcome to Your Hub</h2>
                <p className="text-white/60 text-sm mt-1">Here's everything about your work today</p>
              </div>
            </div>

            {/* Today's Progress Circle */}
            <div className="text-center">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-white/10" />
                  <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" 
                    strokeDasharray={251.2} 
                    strokeDashoffset={251.2 - (251.2 * todayProgress) / 100}
                    className="text-green-400" 
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div>
                    <p className="text-2xl font-bold">{Math.round(todayProgress)}%</p>
                    <p className="text-xs text-white/60">of 8h</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/5 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <Clock className="w-4 h-4" /> Today
              </div>
              <p className="text-2xl font-bold mt-1">{formatDuration(todayMinutes)}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <Activity className="w-4 h-4" /> Activities
              </div>
              <p className="text-2xl font-bold mt-1">{todayActivities.length}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <FolderOpen className="w-4 h-4" /> Projects
              </div>
              <p className="text-2xl font-bold mt-1">{stats?.activeProjectsCount || 0}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <CheckCircle className="w-4 h-4" /> Tasks Done
              </div>
              <p className="text-2xl font-bold mt-1">{stats?.tasksCompleted || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'timeline', label: "Today's Timeline", icon: Clock },
          { id: 'projects', label: 'My Projects', icon: FolderOpen },
          { id: 'ai', label: 'AI Insights', icon: Brain }
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Weekly Progress */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  This Week
                </h3>
                <span className="text-sm text-gray-500">
                  {weeklySummary?.totalHours.toFixed(1)}h / 40h
                </span>
              </div>
              
              <div className="w-full bg-gray-100 rounded-full h-4 mb-4">
                <div 
                  className="h-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
                  style={{ width: `${Math.min(100, (weeklySummary?.totalHours || 0) / 40 * 100)}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-amber-50 rounded-xl">
                  <p className="text-2xl font-bold text-amber-600">{weeklySummary?.fieldHours.toFixed(1)}h</p>
                  <p className="text-xs text-amber-700">Field Work</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-xl">
                  <p className="text-2xl font-bold text-purple-600">{weeklySummary?.labHours.toFixed(1)}h</p>
                  <p className="text-xs text-purple-700">Lab Work</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <p className="text-2xl font-bold text-blue-600">{weeklySummary?.officeHours.toFixed(1)}h</p>
                  <p className="text-xs text-blue-700">Office/Other</p>
                </div>
              </div>
            </div>

            {/* AI Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">AI Weekly Summary</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {weeklySummary?.aiWeeklySummary || 'Start tracking your activities to get AI-powered insights about your work patterns and productivity.'}
              </p>
              
              {weeklySummary?.topAchievements && weeklySummary.topAchievements.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-100">
                  <p className="text-sm font-medium text-blue-800 mb-2">🏆 Top Achievements This Week:</p>
                  <ul className="space-y-1">
                    {weeklySummary.topAchievements.map((achievement, i) => (
                      <li key={i} className="text-sm text-blue-700 flex items-center gap-2">
                        <Star className="w-3 h-3 text-yellow-500" />
                        {achievement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-3">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-2xl font-bold text-gray-900">{(stats?.totalHoursThisMonth || 0).toFixed(1)}h</p>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-3">
                  <FlaskConical className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm text-gray-500">Experiments</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.experimentsWorkedOn || 0}</p>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-3">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm text-gray-500">Field Days</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.fieldDaysThisMonth || 0}</p>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mb-3">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm text-gray-500">Billable</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.billablePercentage || 0}%</p>
              </div>
            </div>
          </div>

          {/* Right Column - Today's Activities */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-600" />
                Today's Activities
              </h3>
              <span className="text-sm text-gray-500">{todayActivities.length} entries</span>
            </div>

            {todayActivities.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No activities logged today</p>
                <p className="text-sm text-gray-400 mt-1">Start the timer to track your work!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayActivities.slice(0, 8).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <span className="text-xl">{ACTIVITY_ICONS[activity.activityType] || '📌'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getTimeIcon(activity.startTime)}
                        <span className="font-medium text-gray-900 text-sm truncate">
                          {activity.title || activity.description.slice(0, 30)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(activity.completionStatus || 'not_started')}`}>
                          {activity.completionStatus?.replace('_', ' ') || 'logged'}
                        </span>
                        {activity.linkedProjects?.[0] && (
                          <span className="text-xs text-orange-600">📁 {activity.linkedProjects[0].name}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {formatDuration(activity.durationMinutes)}
                    </span>
                  </div>
                ))}

                {todayActivities.length > 8 && (
                  <button className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View all {todayActivities.length} activities →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Today's Timeline
          </h3>
          
          {todayActivities.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No activities yet today</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

              <div className="space-y-6">
                {todayActivities.map((activity, index) => (
                  <div key={activity.id} className="relative flex gap-4">
                    {/* Timeline Dot */}
                    <div className="relative z-10 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>

                    {/* Activity Card */}
                    <div className="flex-1 bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{ACTIVITY_ICONS[activity.activityType]}</span>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {activity.startTime} - {activity.endTime}
                            </p>
                            <p className="text-sm text-gray-500">{formatDuration(activity.durationMinutes)}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.completionStatus || 'not_started')}`}>
                          {activity.completionStatus?.replace('_', ' ') || 'logged'}
                        </span>
                      </div>

                      <p className="mt-2 text-gray-700">{activity.description}</p>

                      {/* Linked Entities */}
                      {(activity.linkedProjects || activity.linkedExperiments || activity.linkedFieldTrials) && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {activity.linkedProjects?.map((p, i) => (
                            <span key={i} className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs">
                              📁 {p.name}
                            </span>
                          ))}
                          {activity.linkedExperiments?.map((e, i) => (
                            <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs">
                              🧪 {e.name}
                            </span>
                          ))}
                          {activity.linkedFieldTrials?.map((t, i) => (
                            <span key={i} className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs">
                              🌾 {t.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Location & Notes */}
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        {activity.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {activity.location}
                          </span>
                        )}
                        {activity.isFieldWork && (
                          <span className="flex items-center gap-1 text-green-600">
                            <MapPin className="w-3 h-3" /> Field Work
                          </span>
                        )}
                        {activity.isLabWork && (
                          <span className="flex items-center gap-1 text-purple-600">
                            <TestTube2 className="w-3 h-3" /> Lab Work
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-orange-600" />
            Projects You're Working On
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Placeholder - would load from getScientistProjects */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Your Projects</p>
                  <p className="text-sm text-gray-500">will appear here</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FlaskConical className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Your Experiments</p>
                  <p className="text-sm text-gray-500">will appear here</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI-Powered Insights</h3>
              <p className="text-sm text-gray-500">Smart analysis of your work patterns</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Productivity Score */}
            <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-green-900">Productivity Score</h4>
              </div>
              <p className="text-4xl font-bold text-green-600">85%</p>
              <p className="text-sm text-green-700 mt-1">Based on this week's activity</p>
            </div>

            {/* Focus Areas */}
            <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">Focus Areas</h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">🧪 Experiments</span>
                  <span className="text-sm font-medium text-gray-900">45%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }} />
                </div>
              </div>
            </div>

            {/* Suggestions */}
            <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-amber-600" />
                <h4 className="font-medium text-amber-900">AI Suggestions</h4>
              </div>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-amber-800">
                  <Sparkles className="w-4 h-4 mt-0.5 text-amber-500" />
                  You've been spending more time in the lab this week. Consider documenting your findings.
                </li>
                <li className="flex items-start gap-2 text-sm text-amber-800">
                  <Sparkles className="w-4 h-4 mt-0.5 text-amber-500" />
                  3 tasks are pending - follow up to keep projects on track.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ScientistHub.displayName = 'ScientistHub';

export default ScientistHub;