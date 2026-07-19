import { useState, useEffect, memo, useMemo } from 'react';
import { 
  Clock, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Image,
  File,
  Table,
  Edit2,
  Trash2,
  BarChart3,
  PieChart,
  Search,
  Plus,
  Zap,
  Target,
  TrendingUp,
  Coffee,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  X,
  ArrowRight,
  Loader2,
  Filter
} from 'lucide-react';
import { 
  getEntriesByScientistAndDate, 
  getDailyTimeSummary,
  deleteTimeMotionEntry 
} from '../services/timeTracking';
import { 
  TimeMotionEntry, 
  ActivityCategory, 
  DailyTimeSummary,
  getCategoryLabel,
  getCategoryColor,
  getStageLabel
} from '../types/timeTracking';
import { useAuth } from '../contexts/AuthContext';
import { TimeMotionForm } from './TimeMotionForm';

interface TimeMotionDashboardProps {
  userId?: string;
  viewMode?: 'personal' | 'management';
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

export const TimeMotionDashboard: React.FC<TimeMotionDashboardProps> = memo(({
  userId,
  viewMode = 'personal'
}) => {
  const { currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [entries, setEntries] = useState<TimeMotionEntry[]>([]);
  const [dailySummary, setDailySummary] = useState<DailyTimeSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeMotionEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ActivityCategory | 'all'>('all');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const scientistId = userId || currentUser?.uid || '';

  // Load entries
  useEffect(() => {
    const loadEntries = async () => {
      if (!scientistId) return;
      setIsLoading(true);
      try {
        const [entriesData, summaryData] = await Promise.all([
          getEntriesByScientistAndDate(scientistId, selectedDate),
          getDailyTimeSummary(scientistId, selectedDate)
        ]);
        setEntries(entriesData);
        setDailySummary(summaryData);
      } catch (error) {
        console.error('Error loading entries:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadEntries();
  }, [scientistId, selectedDate]);

  const handlePrevDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleToday = () => setSelectedDate(new Date().toISOString().split('T')[0]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { icon: Sun, text: 'Good Morning', color: 'from-yellow-400 to-orange-500' };
    if (hour < 17) return { icon: Sun, text: 'Good Afternoon', color: 'from-blue-400 to-cyan-500' };
    return { icon: Moon, text: 'Good Evening', color: 'from-indigo-400 to-purple-500' };
  };

  const handleEdit = (entry: TimeMotionEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleDelete = async (entryId: string) => {
    setIsDeleting(entryId);
    try {
      await deleteTimeMotionEntry(entryId);
      const entriesData = await getEntriesByScientistAndDate(scientistId, selectedDate);
      setEntries(entriesData);
      const summaryData = await getDailyTimeSummary(scientistId, selectedDate);
      setDailySummary(summaryData);
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    setEditingEntry(null);
    const [entriesData, summaryData] = await Promise.all([
      getEntriesByScientistAndDate(scientistId, selectedDate),
      getDailyTimeSummary(scientistId, selectedDate)
    ]);
    setEntries(entriesData);
    setDailySummary(summaryData);
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.projectName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || entry.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [entries, searchTerm, categoryFilter]);

  const getCategoryData = () => {
    if (!dailySummary) return [];
    return Object.entries(dailySummary.byCategory)
      .filter(([, minutes]) => minutes > 0)
      .map(([category, minutes]) => ({
        category: category as ActivityCategory,
        label: getCategoryLabel(category as ActivityCategory),
        minutes,
        hours: (minutes / 60).toFixed(1),
        color: getCategoryColor(category as ActivityCategory),
        icon: ACTIVITY_CATEGORIES.find(c => c.value === category)?.icon || '📌',
        percentage: Math.round((minutes / dailySummary.totalMinutes) * 100)
      }))
      .sort((a, b) => b.minutes - a.minutes);
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getTimeIcon = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) return <Sun className="w-4 h-4 text-yellow-500" />;
    if (hour < 17) return <Sun className="w-4 h-4 text-orange-500" />;
    return <Moon className="w-4 h-4 text-indigo-500" />;
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4 text-pink-500" />;
      case 'pdf': return <File className="w-4 h-4 text-red-500" />;
      case 'excel': return <Table className="w-4 h-4 text-green-500" />;
      case 'document': return <FileText className="w-4 h-4 text-blue-500" />;
      default: return <File className="w-4 h-4 text-gray-500" />;
    }
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  if (showForm) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <button
          onClick={() => { setShowForm(false); setEditingEntry(null); }}
          className="mb-4 flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          <span>Back to Dashboard</span>
        </button>
        <TimeMotionForm
          initialDate={selectedDate}
          editEntry={editingEntry}
          onSuccess={handleFormSuccess}
          onCancel={() => { setShowForm(false); setEditingEntry(null); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${greeting.color} flex items-center justify-center shadow-lg`}>
            <GreetingIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{greeting.text}!</h2>
            <p className="text-gray-500 text-sm">Track your progress</p>
          </div>
        </div>
        
        {viewMode === 'personal' && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Log Time</span>
          </button>
        )}
      </div>

      {/* Date Navigator */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevDay}
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider">
                {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short' })}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {new Date(selectedDate).getDate()}
              </p>
            </div>
            <div className="h-10 w-px bg-gray-200" />
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
              <button
                onClick={handleToday}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Today
              </button>
            </div>
          </div>
          
          <button
            onClick={handleNextDay}
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {dailySummary && dailySummary.totalMinutes > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Time */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                dailySummary.totalMinutes >= 480 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {dailySummary.totalMinutes >= 480 ? '✓ Complete' : `${Math.round((dailySummary.totalMinutes / 480) * 100)}%`}
              </span>
            </div>
            <p className="text-sm text-gray-500">Total Time</p>
            <p className="text-2xl font-bold text-gray-900">{formatDuration(dailySummary.totalMinutes)}</p>
          </div>

          {/* Activities */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Activities</p>
            <p className="text-2xl font-bold text-gray-900">{dailySummary.entriesCount}</p>
          </div>

          {/* Projects */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Projects</p>
            <p className="text-2xl font-bold text-gray-900">{dailySummary.projectsWorked.length}</p>
          </div>

          {/* Efficiency */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${dailySummary.totalMinutes >= 480 ? 'from-green-500 to-emerald-600' : 'from-yellow-500 to-orange-600'} flex items-center justify-center`}>
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Office Hours</p>
            <p className="text-2xl font-bold text-gray-900">
              {dailySummary.totalMinutes >= 480 ? 'Full Day!' : `${Math.round((dailySummary.totalMinutes / 480) * 100)}%`}
            </p>
          </div>
        </div>
      )}

      {/* Time Distribution */}
      {dailySummary && dailySummary.totalMinutes > 0 && getCategoryData().length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <PieChart className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Time Distribution</h3>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {getCategoryData().map((item) => (
              <div 
                key={item.category}
                className="p-4 rounded-xl border-2 transition-all hover:shadow-md"
                style={{ borderColor: item.color + '30', backgroundColor: item.color + '08' }}
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <p className="font-medium text-gray-900 text-sm">{item.label}</p>
                <p className="text-lg font-bold" style={{ color: item.color }}>{item.hours}h</p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div 
                    className="h-1.5 rounded-full"
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as ActivityCategory | 'all')}
              className="px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:bg-white transition-all"
            >
              <option value="all">All Categories</option>
              {ACTIVITY_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">
            {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          <span className="ml-auto text-sm text-gray-400">{filteredEntries.length} activities</span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 mb-4">No activities logged for this day</p>
            {viewMode === 'personal' && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Log Your First Activity
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEntries.map((entry) => {
              const cat = ACTIVITY_CATEGORIES.find(c => c.value === entry.category);
              return (
                <div 
                  key={entry.id}
                  className="group p-4 rounded-xl border-2 border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Time Badge */}
                    <div className="flex flex-col items-center min-w-[80px]">
                      <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                        {getTimeIcon(entry.startTime)}
                        {entry.startTime}
                      </div>
                      <div className="w-px h-4 bg-gray-200 my-1" />
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        {entry.endTime}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{cat?.icon}</span>
                        <span 
                          className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: cat?.color + '20', color: cat?.color }}
                        >
                          {cat?.label}
                        </span>
                        {entry.isDraft && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">Draft</span>
                        )}
                        <span className="ml-auto flex items-center gap-1 text-sm font-medium text-gray-500">
                          <Zap className="w-4 h-4" />
                          {formatDuration(entry.durationMinutes)}
                        </span>
                      </div>

                      <p className="text-gray-700 mb-2 line-clamp-2">{entry.description}</p>

                      {entry.subCategory && (
                        <p className="text-xs text-gray-400 mb-2">→ {entry.subCategory}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        {entry.projectName && (
                          <span className="flex items-center gap-1 text-orange-600">
                            <Target className="w-4 h-4" />
                            {entry.projectName}
                            <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                              {getStageLabel(entry.projectStage || 'development')}
                            </span>
                          </span>
                        )}
                        {entry.location && (
                          <span className="text-gray-500">📍 {entry.location}</span>
                        )}
                      </div>

                      {entry.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                          {entry.attachments.map((att) => (
                            <a
                              key={att.id}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                            >
                              {getFileIcon(att.type)}
                              <span className="text-gray-700">{att.name}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {viewMode === 'personal' && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          disabled={isDeleting === entry.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isDeleting === entry.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

TimeMotionDashboard.displayName = 'TimeMotionDashboard';

export default TimeMotionDashboard;