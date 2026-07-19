import { useState, useEffect, useCallback, memo } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Clock, 
  FileText, 
  Upload, 
  Calendar,
  FolderOpen,
  Image,
  File,
  Table,
  Save,
  Trash2,
  Check,
  AlertCircle,
  Briefcase,
  FlaskConical,
  Users,
  MapPin,
  FileCheck,
  Beaker,
  BookOpen,
  Presentation,
  Sparkles,
  Zap,
  X,
  Plus,
  ChevronRight,
  Loader2,
  TestTube2,
  ListTodo,
  CheckCircle
} from 'lucide-react';
import { createTimeMotionEntry, updateTimeMotionEntry } from '../services/timeTracking';
import { useAuth } from '../contexts/AuthContext';
import { getDocs, collection, query, where, or, and } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  TimeMotionEntry, 
  ActivityCategory, 
  ProjectStage, 
  AttachedDocument,
  getCategoryLabel,
  getCategoryColor
} from '../types/timeTracking';
import { LinkedEntity } from '../types/unifiedTracking';

interface TimeMotionFormProps {
  initialDate?: string;
  onSuccess?: () => void;
  editEntry?: TimeMotionEntry | null;
  onCancel?: () => void;
}

interface Project {
  id: string;
  name: string;
  stage: ProjectStage;
}

// Optimized category data with gradients
const ACTIVITY_CATEGORIES = [
  { value: 'research', icon: BookOpen, label: 'Research', color: '#8B5CF6', gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', border: 'border-violet-200' },
  { value: 'document', icon: FileText, label: 'Documents', color: '#3B82F6', gradient: 'from-blue-500 to-cyan-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { value: 'trials', icon: MapPin, label: 'Field Trials', color: '#10B981', gradient: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { value: 'experiments', icon: FlaskConical, label: 'Experiments', color: '#F59E0B', gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { value: 'lab', icon: Beaker, label: 'Laboratory', color: '#EC4899', gradient: 'from-pink-500 to-rose-600', bg: 'bg-pink-50', border: 'border-pink-200' },
  { value: 'meetings', icon: Users, label: 'Meetings', color: '#6366F1', gradient: 'from-indigo-500 to-blue-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  { value: 'discussions', icon: Presentation, label: 'Discussions', color: '#14B8A6', gradient: 'from-teal-500 to-cyan-600', bg: 'bg-teal-50', border: 'border-teal-200' },
  { value: 'field_visits', icon: MapPin, label: 'Field Visits', color: '#84CC16', gradient: 'from-lime-500 to-green-600', bg: 'bg-lime-50', border: 'border-lime-200' },
  { value: 'other', icon: File, label: 'Other', color: '#6B7280', gradient: 'from-gray-500 to-slate-600', bg: 'bg-gray-50', border: 'border-gray-200' },
];

const PROJECT_STAGES: { value: ProjectStage; label: string; color: string }[] = [
  { value: 'concept', label: 'Concept', color: 'bg-gray-100 text-gray-700' },
  { value: 'mis', label: 'MIS', color: 'bg-blue-100 text-blue-700' },
  { value: 'design', label: 'Design', color: 'bg-purple-100 text-purple-700' },
  { value: 'development', label: 'Development', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'testing', label: 'Testing', color: 'bg-orange-100 text-orange-700' },
  { value: 'pilot', label: 'Pilot', color: 'bg-pink-100 text-pink-700' },
  { value: 'production', label: 'Production', color: 'bg-green-100 text-green-700' },
  { value: 'completed', label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
];

// Quick time presets
const TIME_PRESETS = [
  { label: '30m', value: 30 },
  { label: '1h', value: 60 },
  { label: '1.5h', value: 90 },
  { label: '2h', value: 120 },
  { label: '3h', value: 180 },
  { label: '4h', value: 240 },
];

export const TimeMotionForm: React.FC<TimeMotionFormProps> = memo(({
  initialDate,
  onSuccess,
  editEntry,
  onCancel,
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [driveConnected, setDriveConnected] = useState(false);
  const [showProjectPanel, setShowProjectPanel] = useState(false);

  // Additional entity types
interface Experiment { id: string; name: string; status: string; }
interface FieldTrial { id: string; name: string; status: string; }
interface LabTest { id: string; name: string; status: string; }
interface Task { id: string; title: string; status: string; }

const [formData, setFormData] = useState({
    date: initialDate || new Date().toISOString().split('T')[0],
    category: 'research' as ActivityCategory,
    subCategory: '',
    description: '',
    startTime: '10:00',
    endTime: '11:00',
    
    // Project
    projectId: '',
    projectName: '',
    projectStage: 'development' as ProjectStage,
    
    // Linked Entities
    linkedExperiments: [] as LinkedEntity[],
    linkedFieldTrials: [] as LinkedEntity[],
    linkedLabTests: [] as LinkedEntity[],
    linkedTasks: [] as LinkedEntity[],
    
    // Work Type
    isFieldWork: false,
    isLabWork: false,
    
    // Location & Notes
    location: '',
    notes: '',
    results: '',
    findings: '',
    
    // Status
    isBillable: false,
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    completionStatus: 'in_progress' as 'not_started' | 'in_progress' | 'completed' | 'blocked',
    isDraft: false,
    attachments: [] as AttachedDocument[],
  });

  // Initialize Google Drive
  useEffect(() => {
    const initDrive = async () => {
      await initGoogleDrive();
      setDriveConnected(isDriveAuthorized());
    };
    initDrive();
  }, []);

  // Load all entity types
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [fieldTrials, setFieldTrials] = useState<FieldTrial[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const loadEntities = async () => {
      try {
        // Load Projects
        const projectsQ = query(collection(db, 'projects'), where('status', '==', 'active'));
        const projectsSnap = await getDocs(projectsQ);
        const projectList: Project[] = projectsSnap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          stage: (doc.data().stage as ProjectStage) || 'development',
        }));
        setProjects(projectList);

        // Load Experiments
        const expQ = query(collection(db, 'experiments')); // or your collection name
        const expSnap = await getDocs(expQ);
        setExperiments(expSnap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || doc.data().title || 'Untitled',
          status: doc.data().status || 'active'
        })));

        // Load Field Trials
        const trialsQ = query(collection(db, 'fieldTrials'));
        const trialsSnap = await getDocs(trialsQ);
        setFieldTrials(trialsSnap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || 'Untitled Trial',
          status: doc.data().status || 'active'
        })));

        // Load Lab Tests
        const labQ = query(collection(db, 'labTests'));
        const labSnap = await getDocs(labQ);
        setLabTests(labSnap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || 'Untitled Test',
          status: doc.data().status || 'active'
        })));

        // Load Tasks
        const tasksQ = query(collection(db, 'tasks'));
        const tasksSnap = await getDocs(tasksQ);
        setTasks(tasksSnap.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title || 'Untitled Task',
          status: doc.data().status || 'pending'
        })));

      } catch (error) {
        console.log('Loading entities - some collections may not exist yet:', error);
        // Silently fail - some collections might not exist
      }
    };
    loadEntities();
  }, []);

  // Populate edit data
  useEffect(() => {
    if (editEntry) {
      setFormData({
        date: editEntry.date,
        category: editEntry.category,
        subCategory: editEntry.subCategory || '',
        description: editEntry.description,
        startTime: editEntry.startTime,
        endTime: editEntry.endTime,
        projectId: editEntry.projectId || '',
        projectName: editEntry.projectName || '',
        projectStage: editEntry.projectStage || 'development',
        location: editEntry.location || '',
        notes: editEntry.notes || '',
        isDraft: editEntry.isDraft,
        attachments: editEntry.attachments || [],
      });
    }
  }, [editEntry]);

  // Quick time handler
  const handleQuickTime = (minutes: number) => {
    const [startH, startM] = formData.startTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = startMinutes + minutes;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    setFormData(prev => ({
      ...prev,
      endTime: `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
    }));
  };

  const calculateDuration = () => {
    const [startH, startM] = formData.startTime.split(':').map(Number);
    const [endH, endM] = formData.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return Math.max(0, endMinutes - startMinutes);
  };

  const getDurationDisplay = () => {
    const mins = calculateDuration();
    if (mins === 0) return '0m';
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setIsUploading(true);
    setMessage(null);

    try {
      const processFile = async (file: File): Promise<AttachedDocument> => {
        const url = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        
        return {
          id: crypto.randomUUID(),
          name: file.name,
          type: getFileType(file.type),
          url,
          uploadedAt: new Date().toISOString(),
          size: file.size,
        };
      };

      const localAttachments = await Promise.all(acceptedFiles.map(processFile));
      
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...localAttachments],
      }));
      setMessage({ type: 'success', text: `${acceptedFiles.length} file(s) attached` });
    } catch (error) {
      console.error('Error uploading files:', error);
      setMessage({ type: 'error', text: 'Failed to upload files' });
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024,
  });

  const getFileType = (mimeType: string): 'image' | 'pdf' | 'excel' | 'document' | 'other' => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'excel';
    if (mimeType.includes('document') || mimeType.includes('word')) return 'document';
    return 'other';
  };

  const removeAttachment = (id: string) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(a => a.id !== id),
    }));
  };

  const handleProjectChange = (projectId: string) => {
    const selectedProject = projects.find(p => p.id === projectId);
    setFormData(prev => ({
      ...prev,
      projectId,
      projectName: selectedProject?.name || '',
      projectStage: selectedProject?.stage || 'development',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (calculateDuration() === 0) {
      setMessage({ type: 'error', text: 'Please set a valid time duration' });
      return;
    }
    if (!formData.description.trim()) {
      setMessage({ type: 'error', text: 'Please describe what you worked on' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      // Build linked entities from selections
      const linkedProjects = formData.projectId ? [{
        type: 'project' as const,
        id: formData.projectId,
        name: formData.projectName || formData.projectId,
        stage: formData.projectStage,
        status: 'active'
      }] : [];

      const linkedExperiments = formData.linkedExperiments;
      const linkedFieldTrials = formData.linkedFieldTrials;
      const linkedLabTests = formData.linkedLabTests;
      const linkedTasks = formData.linkedTasks;

      const entryData: any = {
        scientistId: user?.uid || '',
        scientistName: user?.displayName || user?.email || 'Unknown',
        date: formData.date,
        category: formData.category,
        subCategory: formData.subCategory || undefined,
        description: formData.description,
        startTime: formData.startTime,
        endTime: formData.endTime,
        durationMinutes: calculateDuration(),
        
        // Project
        projectId: formData.projectId || undefined,
        projectName: formData.projectName || undefined,
        projectStage: formData.projectStage,
        
        // Linked Entities (for unified tracking)
        linkedProjects,
        linkedExperiments,
        linkedFieldTrials,
        linkedLabTests,
        linkedTasks,
        
        // Work Type
        isFieldWork: formData.isFieldWork,
        isLabWork: formData.isLabWork,
        
        // Location & Notes
        location: formData.location || undefined,
        notes: formData.notes || undefined,
        results: formData.results || undefined,
        findings: formData.findings || undefined,
        
        // Status & Priority
        isBillable: formData.isBillable,
        priority: formData.priority,
        completionStatus: formData.completionStatus,
        
        // Attachments & Draft
        attachments: formData.attachments,
        isDraft: formData.isDraft,
      };

      if (editEntry) {
        await updateTimeMotionEntry(editEntry.id, entryData);
      } else {
        await createTimeMotionEntry(entryData);
      }

      setMessage({ type: 'success', text: editEntry ? 'Entry updated!' : 'Time logged successfully!' });
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 800);
    } catch (error) {
      console.error('Error saving:', error);
      setMessage({ type: 'error', text: 'Failed to save. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = ACTIVITY_CATEGORIES.find(c => c.value === formData.category);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Floating Header */}
      <div className="relative mb-6">
        <div className={`absolute inset-0 bg-gradient-to-r ${selectedCategory?.gradient || 'from-blue-500 to-indigo-600'} rounded-2xl opacity-10`} />
        <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${selectedCategory?.gradient || 'from-blue-500 to-indigo-600'} flex items-center justify-center shadow-lg`}>
                {selectedCategory && <selectedCategory.icon className="w-7 h-7 text-white" />}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {editEntry ? 'Edit Entry' : 'Log Your Time'}
                </h2>
                <p className="text-gray-500">
                  {editEntry ? 'Update your time entry' : 'Quickly log what you worked on'}
                </p>
              </div>
            </div>
            
            {onCancel && (
              <button
                onClick={onCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>

          {/* Message Toast */}
          {message && (
            <div className={`mt-4 flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${
              message.type === 'success' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-medium">{message.text}</span>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quick Time Row */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-gray-700 font-semibold">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>Time</span>
            </div>
            <div className="flex gap-1">
              {TIME_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleQuickTime(preset.value)}
                  className="px-3 py-1.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="relative">
              <label className="absolute -top-2 left-3 text-xs font-medium text-gray-500 bg-white px-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:bg-white transition-all font-medium"
              />
            </div>
            <div className="relative">
              <label className="absolute -top-2 left-3 text-xs font-medium text-gray-500 bg-white px-1">Start</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:bg-white transition-all font-medium"
              />
            </div>
            <div className="relative">
              <label className="absolute -top-2 left-3 text-xs font-medium text-gray-500 bg-white px-1">End</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-center">
            <div className={`px-6 py-2 rounded-full text-lg font-bold ${
              calculateDuration() >= 480 ? 'bg-green-100 text-green-700' :
              calculateDuration() >= 300 ? 'bg-blue-100 text-blue-700' :
              calculateDuration() > 0 ? 'bg-gray-100 text-gray-700' :
              'bg-red-100 text-red-700'
            }`}>
              <Zap className="w-5 h-5 inline mr-2" />
              {getDurationDisplay()}
            </div>
          </div>
        </div>

        {/* Activity Categories - Beautiful Grid */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
          <div className="flex items-center gap-2 text-gray-700 font-semibold mb-4">
            <Briefcase className="w-5 h-5 text-purple-600" />
            <span>Activity Type</span>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {ACTIVITY_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = formData.category === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.value })}
                  className={`relative p-3 rounded-xl border-2 transition-all duration-200 ${
                    isSelected
                      ? `${cat.border} shadow-lg transform scale-105`
                      : 'border-transparent hover:bg-gray-50 hover:border-gray-200'
                  }`}
                >
                  {isSelected && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-10 rounded-xl`} />
                  )}
                  <div className="relative flex flex-col items-center gap-1.5">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected ? `bg-gradient-to-br ${cat.gradient}` : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <span className={`text-xs font-medium ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>
                      {cat.label}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <input
              type="text"
              value={formData.subCategory}
              onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
              placeholder="Add sub-category (optional)"
              className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-purple-300 focus:bg-white transition-all text-sm"
            />
          </div>
        </div>

        {/* What did you work on? - Main Description */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
          <div className="flex items-center gap-2 text-gray-700 font-semibold mb-4">
            <Sparkles className="w-5 h-5 text-green-600" />
            <span>What did you work on?</span>
          </div>
          
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe your activities in detail. What was accomplished? Any decisions made?"
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-green-500 focus:bg-white transition-all min-h-[100px] resize-none"
            required
          />
          <div className="mt-2 text-right text-xs text-gray-400">
            {formData.description.length} characters
          </div>
        </div>

        {/* Project Link - Collapsible */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowProjectPanel(!showProjectPanel)}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2 text-gray-700 font-semibold">
              <FolderOpen className="w-5 h-5 text-orange-600" />
              <span>Link to Project</span>
              {formData.projectName && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {formData.projectName}
                </span>
              )}
            </div>
            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${showProjectPanel ? 'rotate-90' : ''}`} />
          </button>
          
          {showProjectPanel && (
            <div className="px-5 pb-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={formData.projectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-orange-300 focus:bg-white transition-all"
                >
                  <option value="">Select Project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value, projectId: '' })}
                  placeholder="Or enter project name"
                  className="px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-orange-300 focus:bg-white transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={formData.projectStage}
                  onChange={(e) => setFormData({ ...formData, projectStage: e.target.value as ProjectStage })}
                  className="px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-orange-300 focus:bg-white transition-all"
                >
                  {PROJECT_STAGES.map((stage) => (
                    <option key={stage.value} value={stage.value}>{stage.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Location (Lab, Office, Field...)"
                  className="px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-orange-300 focus:bg-white transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Document Attachments */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
          <div className="flex items-center gap-2 text-gray-700 font-semibold mb-4">
            <Upload className="w-5 h-5 text-indigo-600" />
            <span>Attachments</span>
            {formData.attachments.length > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                {formData.attachments.length} files
              </span>
            )}
          </div>
          
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
                <p className="text-gray-600">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-2">
                  <Upload className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-gray-700 font-medium">
                  {isDragActive ? 'Drop files here' : 'Drop files or click to upload'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Images, PDF, Excel, Word</p>
              </div>
            )}
          </div>

          {formData.attachments.length > 0 && (
            <div className="mt-4 space-y-2">
              {formData.attachments.map((attachment) => (
                <div 
                  key={attachment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group"
                >
                  <div className="flex items-center gap-3">
                    {attachment.type === 'image' && <Image className="w-5 h-5 text-pink-500" />}
                    {attachment.type === 'pdf' && <File className="w-5 h-5 text-red-500" />}
                    {attachment.type === 'excel' && <Table className="w-5 h-5 text-green-500" />}
                    {attachment.type === 'document' && <FileText className="w-5 h-5 text-blue-500" />}
                    {attachment.type === 'other' && <File className="w-5 h-5 text-gray-500" />}
                    <span className="text-sm font-medium text-gray-700">{attachment.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(attachment.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Additional Notes */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
          <div className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
            <FileCheck className="w-5 h-5 text-teal-600" />
            <span>Additional Notes</span>
            <span className="text-xs text-gray-400 font-normal">(optional)</span>
          </div>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Blockers, observations, follow-ups..."
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-teal-500 focus:bg-white transition-all min-h-[60px] resize-none"
          />
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isDraft}
              onChange={(e) => setFormData({ ...formData, isDraft: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Save as draft</span>
          </label>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span className="font-semibold">{editEntry ? 'Update Entry' : 'Log Time'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
});

TimeMotionForm.displayName = 'TimeMotionForm';

export default TimeMotionForm;