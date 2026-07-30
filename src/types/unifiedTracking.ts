// Unified Activity Tracking - Links Everything About Scientists

export type ActivityType = 
  | 'time_entry'      // Time motion entry
  | 'experiment'      // Experiment work
  | 'field_trial'     // Field trial activity
  | 'lab_test'        // Laboratory test
  | 'task'            // Task completion
  | 'meeting'         // Meeting attended
  | 'document'        // Document created/edited
  | 'observation'     // Field observation
  | 'product'         // Product work
  | 'research'        // Research activity
  | 'discussion'      // Discussion/collaboration
  | 'other';          // Other activity

export type EntityType = 
  | 'project'
  | 'experiment'
  | 'field_trial'
  | 'lab_test'
  | 'task'
  | 'product'
  | 'document';

// Linked entity reference
export interface LinkedEntity {
  type: EntityType;
  id: string;
  name: string;
  stage?: string;
  status?: string;
}

// Unified Activity Entry - Links everything
export interface UnifiedActivity {
  id: string;
  
  // Core identifiers
  scientistId: string;
  scientistName: string;
  date: string; // YYYY-MM-DD
  
  // Activity type
  activityType: ActivityType;
  category?: string;
  
  // Time tracking
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  
  // Description & Details
  title: string;
  description: string;
  notes?: string;
  
  // Linked Entities (can link to multiple!)
  linkedProjects?: LinkedEntity[];
  linkedExperiments?: LinkedEntity[];
  linkedFieldTrials?: LinkedEntity[];
  linkedLabTests?: LinkedEntity[];
  linkedTasks?: LinkedEntity[];
  linkedProducts?: LinkedEntity[];
  
  // Attachments
  attachments: {
    id: string;
    name: string;
    type: string;
    url: string;
    uploadedAt: string;
  }[];
  
  // Location & Context
  location?: string;
  isFieldWork?: boolean;
  isLabWork?: boolean;
  
  // Status & Billing
  status: 'draft' | 'pending' | 'approved' | 'completed';
  isBillable?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  
  // Progress & Completion
  progressPercent?: number;
  completionStatus?: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  
  // Results & Outcomes
  results?: string;
  findings?: string;
  conclusions?: string;
  
  // AI Analysis (future)
  aiSummary?: string;
  aiInsights?: string;
  aiTags?: string[];
  aiRiskFlags?: string[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

// Quick stats for dashboard
export interface ScientistDashboardStats {
  scientistId: string;
  scientistName: string;
  
  // Time stats
  totalHoursThisWeek: number;
  totalHoursThisMonth: number;
  averageDailyHours: number;
  
  // Activity counts
  totalActivitiesThisWeek: number;
  totalActivitiesThisMonth: number;
  
  // Project involvement
  activeProjectsCount: number;
  completedProjectsCount: number;
  
  // Experiment involvement
  experimentsWorkedOn: number;
  experimentsCompleted: number;
  
  // Field work
  fieldDaysThisMonth: number;
  labDaysThisMonth: number;
  
  // Performance metrics
  tasksCompleted: number;
  tasksPending: number;
  onTimeCompletionRate: number;
  
  // Documents
  documentsCreated: number;
  
  // Billable hours
  billableHoursThisMonth: number;
  billablePercentage: number;
}

// AI Insight types
export interface AIInsight {
  id: string;
  scientistId: string;
  type: 'productivity' | 'collaboration' | 'bottleneck' | 'suggestion' | 'achievement' | 'warning';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  action?: string;
  createdAt: string;
}

// Weekly Summary
export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  scientistId: string;
  
  // Time breakdown
  totalHours: number;
  hoursByCategory: Record<string, number>;
  hoursByProject: Record<string, number>;
  hoursByDay: Record<string, number>;
  
  // Activity breakdown
  activitiesByType: Record<string, number>;
  
  // Work type analysis
  fieldHours: number;
  labHours: number;
  officeHours: number;
  
  // Project progress
  projectsUpdated: string[];
  projectsCompleted: string[];
  
  // Experiments
  experimentsWorked: string[];
  experimentsCompleted: string[];
  
  // Tasks
  tasksCompleted: number;
  tasksCreated: number;
  
  // AI summary
  aiWeeklySummary: string;
  topAchievements: string[];
  areasForImprovement: string[];
}

// Helper functions
export const getActivityTypeIcon = (type: ActivityType): string => {
  const icons: Record<ActivityType, string> = {
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
  return icons[type] || '📌';
};

export const getActivityTypeLabel = (type: ActivityType): string => {
  const labels: Record<ActivityType, string> = {
    time_entry: 'Time Entry',
    experiment: 'Experiment',
    field_trial: 'Field Trial',
    lab_test: 'Lab Test',
    task: 'Task',
    meeting: 'Meeting',
    document: 'Document',
    observation: 'Observation',
    product: 'Product',
    research: 'Research',
    discussion: 'Discussion',
    other: 'Other'
  };
  return labels[type] || 'Other';
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    in_progress: 'bg-blue-100 text-blue-700',
    blocked: 'bg-red-100 text-red-700',
    not_started: 'bg-gray-100 text-gray-500'
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};