// Time Motion Tracking Types

export type ActivityCategory = 
  | 'research'
  | 'document'
  | 'trials'
  | 'experiments'
  | 'lab'
  | 'meetings'
  | 'discussions'
  | 'field_visits'
  | 'other';

export type ProjectStage = 
  | 'concept'
  | 'mis'
  | 'design'
  | 'development'
  | 'testing'
  | 'pilot'
  | 'production'
  | 'completed';

export interface AttachedDocument {
  id: string;
  name: string;
  type: string; // 'image' | 'pdf' | 'excel' | 'document' | 'other'
  url: string;
  driveFileId?: string;
  uploadedAt: string;
  size: number;
}

export interface TimeMotionEntry {
  id: string;
  scientistId: string;
  scientistName: string;
  date: string; // ISO date string (YYYY-MM-DD)
  
  // Activity Details
  category: ActivityCategory;
  subCategory?: string;
  description: string;
  
  // Time Tracking
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  durationMinutes: number;
  
  // Project Link
  projectId?: string;
  projectName?: string;
  projectStage?: ProjectStage;
  
  // Document Attachments (stored in Google Drive)
  attachments: AttachedDocument[];
  
  // Additional Details
  location?: string;
  notes?: string;
  
  // Status
  isDraft: boolean;
  isBillable?: boolean;
  approvedBy?: string;
  approvedAt?: string;
  
  createdAt: string;
  updatedAt: string;
}

// Summary for Analytics
export interface DailyTimeSummary {
  date: string;
  scientistId: string;
  scientistName: string;
  totalMinutes: number;
  byCategory: Record<ActivityCategory, number>;
  projectsWorked: string[];
  entriesCount: number;
}

// Project Progress for Employee Profile
export interface ProjectProgress {
  projectId: string;
  projectName: string;
  stage: ProjectStage;
  progressPercent: number;
  hoursSpent: number;
  lastActivityDate: string;
  status: 'active' | 'completed' | 'paused';
}

// Helper functions
export const getCategoryLabel = (category: ActivityCategory): string => {
  const labels: Record<ActivityCategory, string> = {
    research: 'Research',
    document: 'Documents',
    trials: 'Field Trials',
    experiments: 'Experiments',
    lab: 'Laboratory',
    meetings: 'Meetings',
    discussions: 'Discussions',
    field_visits: 'Field Visits',
    other: 'Other'
  };
  return labels[category];
};

export const getCategoryColor = (category: ActivityCategory): string => {
  const colors: Record<ActivityCategory, string> = {
    research: '#8B5CF6',
    document: '#3B82F6',
    trials: '#10B981',
    experiments: '#F59E0B',
    lab: '#EC4899',
    meetings: '#6366F1',
    discussions: '#14B8A6',
    field_visits: '#84CC16',
    other: '#6B7280'
  };
  return colors[category];
};

export const getStageLabel = (stage: ProjectStage): string => {
  const labels: Record<ProjectStage, string> = {
    concept: 'Concept',
    mis: 'MIS',
    design: 'Design',
    development: 'Development',
    testing: 'Testing',
    pilot: 'Pilot',
    production: 'Production',
    completed: 'Completed'
  };
  return labels[stage];
};

export const getDocumentType = (mimeType: string): 'image' | 'pdf' | 'excel' | 'document' | 'other' => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'excel';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'document';
  return 'other';
};