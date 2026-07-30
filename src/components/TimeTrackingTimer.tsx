import { useState, useEffect, memo, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Loader2,
  Sun,
  Moon,
  Zap,
  Brain,
  FlaskConical,
  Microscope,
  Users,
  MapPin,
  FileText,
  MoreHorizontal,
  X
} from 'lucide-react';
import { createTimeMotionEntry } from '../services/timeTracking';
import { 
  type ActivityCategory, 
  type ProjectStage,
  getCategoryLabel
} from '../types/timeTracking';
import { useAuth } from '../contexts/AuthContext';
import { db, getDocs, collection, query, where } from '../services/firebaseUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface TimeTrackingTimerProps {
  onSuccess?: () => void;
}

interface Project {
  id: string;
  name: string;
  stage: ProjectStage;
}

const ACTIVITY_CATEGORIES = [
  { value: 'research', icon: Brain, label: 'Research', color: '#8B5CF6', gradient: 'from-violet-500 to-purple-600' },
  { value: 'document', icon: FileText, label: 'Documents', color: '#3B82F6', gradient: 'from-blue-500 to-cyan-600' },
  { value: 'trials', icon: MapPin, label: 'Field Trials', color: '#10B981', gradient: 'from-emerald-500 to-green-600' },
  { value: 'experiments', icon: FlaskConical, label: 'Experiments', color: '#F59E0B', gradient: 'from-amber-500 to-orange-600' },
  { value: 'lab', icon: Microscope, label: 'Laboratory', color: '#EC4899', gradient: 'from-pink-500 to-rose-600' },
  { value: 'meetings', icon: Users, label: 'Meetings', color: '#6366F1', gradient: 'from-indigo-500 to-blue-600' },
  { value: 'discussions', icon: Users, label: 'Discussions', color: '#14B8A6', gradient: 'from-teal-500 to-cyan-600' },
  { value: 'field_visits', icon: MapPin, label: 'Field Visits', color: '#84CC16', gradient: 'from-lime-500 to-green-600' },
  { value: 'other', icon: MoreHorizontal, label: 'Other', color: '#6B7280', gradient: 'from-gray-500 to-slate-600' },
];

export const TimeTrackingTimer: React.FC<TimeTrackingTimerProps> = memo(({ onSuccess }) => {
  const { profile } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory>('research');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedProjectName, setSelectedProjectName] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isBillable, setIsBillable] = useState(false);

  // Load projects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const q = query(collection(db, 'projects'), where('status', '==', 'active'));
        const snapshot = await getDocs(q);
        const projectList: Project[] = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          name: doc.data().name,
          stage: (doc.data().stage as ProjectStage) || 'development',
        }));
        setProjects(projectList);
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };
    loadProjects();
  }, []);

  // Timer logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const seconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedSeconds(seconds);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const handleStart = useCallback(() => {
    setStartTime(new Date());
    setIsRunning(true);
    setElapsedSeconds(0);
  }, []);

  const handlePause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const handleResume = useCallback(() => {
    setIsRunning(true);
  }, []);

  const handleStop = async () => {
    if (!startTime || elapsedSeconds < 30) {
      setIsRunning(false);
      setStartTime(null);
      setElapsedSeconds(0);
      setDescription('');
      setSelectedCategory('research');
      setSelectedProject('');
      setSelectedProjectName('');
      return;
    }

    setIsSaving(true);
    try {
      const endTime = new Date();
      const startTimeStr = startTime.toTimeString().slice(0, 5);
      const endTimeStr = endTime.toTimeString().slice(0, 5);
      
      const entryData = {
        scientistId: profile?.id || '',
        scientistName: profile?.name || profile?.email || 'Unknown',
        date: new Date().toISOString().split('T')[0],
        category: selectedCategory,
        description: description || `${getCategoryLabel(selectedCategory)} work`,
        startTime: startTimeStr,
        endTime: endTimeStr,
        durationMinutes: Math.ceil(elapsedSeconds / 60),
        projectId: selectedProject || undefined,
        projectName: selectedProjectName || undefined,
        projectStage: 'development' as ProjectStage,
        attachments: [],
        isBillable: isBillable || false,
        isDraft: false,
      };

      await createTimeMotionEntry(entryData);
      
      setIsRunning(false);
      setStartTime(null);
      setElapsedSeconds(0);
      setDescription('');
      setSelectedCategory('research');
      setSelectedProject('');
      setSelectedProjectName('');
      setIsBillable(false);
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving entry:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setIsRunning(false);
    setStartTime(null);
    setElapsedSeconds(0);
    setDescription('');
    setSelectedCategory('research');
    setSelectedProject('');
    setSelectedProjectName('');
  };

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(projectId);
    setSelectedProjectName(project?.name || '');
  };

  const quickCategories = [
    { category: 'research' as ActivityCategory, label: 'Research', icon: Brain },
    { category: 'experiments' as ActivityCategory, label: 'Experiment', icon: FlaskConical },
    { category: 'trials' as ActivityCategory, label: 'Field Trial', icon: MapPin },
    { category: 'lab' as ActivityCategory, label: 'Lab Work', icon: Microscope },
    { category: 'meetings' as ActivityCategory, label: 'Meeting', icon: Users },
    { category: 'field_visits' as ActivityCategory, label: 'Field Visit', icon: MapPin },
  ];

  const selectedCat = ACTIVITY_CATEGORIES.find(c => c.value === selectedCategory);
  const SelectedIcon = selectedCat?.icon || Brain;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { icon: Sun, text: 'Good Morning', gradient: 'from-amber-400 via-orange-500 to-rose-400' };
    if (hour < 17) return { icon: Sun, text: 'Good Afternoon', gradient: 'from-blue-400 via-cyan-500 to-teal-400' };
    return { icon: Moon, text: 'Good Evening', gradient: 'from-indigo-400 via-purple-500 to-pink-400' };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  return (
    <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100/50 dark:border-gray-800/50 overflow-hidden">
      {/* Header Background */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-400"></div>

      {/* Header Content */}
      <div className="relative pt-8 pb-4 px-8 text-center text-white">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex justify-center mb-3"
        >
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl">
            <GreetingIcon className="w-7 h-7" />
          </div>
        </motion.div>
        <p className="text-white/80 font-medium text-sm">{greeting.text}, {profile?.name?.split(' ')[0] || 'Scientist'}!</p>
        <h2 className="text-2xl font-bold mt-1">Ready to Track Your Work?</h2>
        <p className="text-white/70 text-xs mt-1">Start the timer when you begin your activity</p>
      </div>

      {/* Timer Section */}
      <div className="relative px-8 py-6 text-center">
        {/* Category Badge */}
        <button
          onClick={() => setShowCategoryPicker(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-all mb-4"
        >
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: selectedCat?.color + '20' }}
          >
            <SelectedIcon className="w-4 h-4" style={{ color: selectedCat?.color }} />
          </div>
          <span className="font-semibold text-gray-700 dark:text-gray-200">{selectedCat?.label}</span>
          <Zap className="w-4 h-4 text-gray-400" />
        </button>

        {/* Time Display */}
        <div className="relative inline-block mb-3">
          <motion.div 
            className={`text-7xl font-bold tracking-wider font-mono ${
              isRunning 
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600' 
                : elapsedSeconds > 0
                ? 'text-amber-500'
                : 'text-gray-200 dark:text-gray-700'
            }`}
            key={elapsedSeconds}
            initial={{ scale: 1 }}
            animate={{ scale: isRunning ? [1, 1.02, 1] : 1 }}
            transition={{ duration: 0.5 }}
          >
            {formatTime(elapsedSeconds)}
          </motion.div>
          {isRunning && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -right-3 top-1/2 -translate-y-1/2"
            >
              <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50 animate-pulse" />
            </motion.div>
          )}
        </div>

        {/* Duration display when paused */}
        {elapsedSeconds > 0 && !isRunning && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-lg font-medium text-amber-600 dark:text-amber-400 mb-2"
          >
            {formatDuration(elapsedSeconds)} logged
          </motion.p>
        )}

        {/* Status */}
        <div className="flex items-center justify-center gap-2">
          {isRunning ? (
            <>
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-2 h-2 bg-emerald-500 rounded-full" 
              />
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Timer Running</span>
              <span className="text-gray-300">-</span>
              <span className="text-gray-500 text-sm">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </>
          ) : elapsedSeconds > 0 ? (
            <>
              <Pause className="w-4 h-4 text-amber-500" />
              <span className="text-amber-600 dark:text-amber-400 font-medium">Paused</span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Click Start to begin</span>
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="relative px-8 pb-8">
        {!isRunning && elapsedSeconds === 0 ? (
          // Start State
          <div className="space-y-4">
            {/* Quick Start Grid */}
            <div>
              <p className="text-xs font-medium text-gray-400 mb-3 text-center uppercase tracking-wider">Quick Start</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {quickCategories.map((item, index) => {
                  const CatIcon = item.icon;
                  const cat = ACTIVITY_CATEGORIES.find(c => c.value === item.category);
                  return (
                    <motion.button
                      key={item.category}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        setSelectedCategory(item.category);
                        handleStart();
                      }}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 border-gray-100 dark:border-gray-800 hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-all group"
                    >
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{ backgroundColor: cat?.color + '15' }}
                      >
                        <CatIcon className="w-5 h-5" style={{ color: cat?.color }} />
                      </div>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Custom Start Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStart}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white rounded-2xl font-bold text-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3"
            >
              <Play className="w-6 h-6 fill-current" />
              Start Timer
            </motion.button>
          </div>
        ) : (
          // Running/Paused State
          <div className="space-y-5">
            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-3">
              {isRunning ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePause}
                  className="flex items-center gap-2 px-6 py-3.5 bg-amber-500 text-white rounded-2xl font-semibold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
                >
                  <Pause className="w-5 h-5" />
                  <span className="hidden sm:inline">Pause</span>
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleResume}
                  className="flex items-center gap-2 px-6 py-3.5 bg-emerald-500 text-white rounded-2xl font-semibold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span className="hidden sm:inline">Resume</span>
                </motion.button>
              )}
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStop}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3.5 bg-red-500 text-white rounded-2xl font-semibold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Square className="w-5 h-5 fill-current" />
                )}
                <span className="hidden sm:inline">Stop</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleDiscard}
                className="p-3.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all"
                title="Discard"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Entry Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 ml-1">
                  What are you working on?
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your activity..."
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 ml-1">
                  Project <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                >
                  <option value="">Select project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Billable Toggle */}
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isBillable}
                    onChange={(e) => setIsBillable(e.target.checked)}
                    className="sr-only"
                  />
                  <div 
                    className={`w-11 h-6 rounded-full transition-colors duration-200 ${isBillable ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                  >
                    <motion.div 
                      className="w-5 h-5 bg-white rounded-full shadow-md mt-0.5"
                      animate={{ x: isBillable ? 22 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  Mark as Billable
                </span>
              </label>
              
              {selectedProject && (
                <span className="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  {selectedProjectName}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Category Picker Modal */}
      <AnimatePresence>
        {showCategoryPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCategoryPicker(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Select Activity Type</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Choose what type of work you're doing</p>
              </div>
              <div className="p-4 max-h-80 overflow-y-auto">
                <div className="grid grid-cols-3 gap-2">
                  {ACTIVITY_CATEGORIES.map((cat) => {
                    const CatIcon = cat.icon;
                    const isSelected = selectedCategory === cat.value;
                    return (
                      <button
                        key={cat.value}
                        onClick={() => {
                          setSelectedCategory(cat.value as ActivityCategory);
                          setShowCategoryPicker(false);
                        }}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                          isSelected 
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                            : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                        }`}
                      >
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: cat.color + '15' }}
                        >
                          <CatIcon className="w-6 h-6" style={{ color: cat.color }} />
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

TimeTrackingTimer.displayName = 'TimeTrackingTimer';

export default TimeTrackingTimer;