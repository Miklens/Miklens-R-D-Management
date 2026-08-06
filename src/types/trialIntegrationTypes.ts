export type TrialCategory = 'herbicide' | 'fungicide' | 'pesticide' | 'nutrition' | 'biostimulant';

export interface ExternalTrialPhoto {
  id: string;
  driveFileId?: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  takenAt?: string;
  plotNumber?: string;
  treatmentName?: string;
}

export interface ExternalTrialEvaluation {
  id: string;
  evalDate: string;
  daysAfterTreatment: number;
  efficacyPercent: number;
  phytotoxicityScore: number; // 0-10
  weedOrPathogenControlPercent: number;
  notes?: string;
  evaluatedBy?: string;
}

export interface ExternalTreatmentArm {
  id: string;
  name: string;
  productName: string;
  doseRate: string; // e.g. "3.0 mL/L"
  formulationCode?: string;
  replicationsCount?: number;
}

export interface ExternalFieldTrial {
  id: string;
  trialCode: string;
  title: string;
  category: TrialCategory;
  cropName: string;
  location: string;
  state: string;
  targetWeedOrPathogen: string;
  designType: 'RCBD' | 'CRD' | 'SplitPlot' | 'Demonstration';
  scientistName: string;
  creatorUid?: string;
  creatorEmail?: string;
  startDate: string;
  endDate?: string;
  status: 'Planning' | 'Active' | 'EvaluationPhase' | 'Completed' | 'ReportGenerated';
  productName: string;
  dosage?: string;
  resultRating?: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Control' | string;
  lat?: string | number;
  lon?: string | number;
  projectId?: string;
  isCompleted?: boolean;
  isControl?: boolean;
  isBaseline?: boolean;
  isLive?: boolean;
  rawDateStr?: string;
  treatments: ExternalTreatmentArm[];
  evaluations: ExternalTrialEvaluation[];
  photos: ExternalTrialPhoto[];
  summaryConclusion?: string;
  syncedAt: string;
  sourceApp: 'Miklens Trial Manager 7';
}

export interface ExternalProject {
  id: string;
  name: string;
  code?: string;
  category: TrialCategory;
  leadScientistUid?: string;
  leadScientistName?: string;
  startDate?: string;
  targetEndDate?: string;
  status?: string;
  description?: string;
  targetWeedsPathogens?: string[];
  targetCrops?: string[];
}

export interface ExternalUser {
  uid: string;
  displayName: string;
  email: string;
  role: 'admin' | 'scientist' | 'viewer';
  categoryAccess?: string[];
  department?: string;
}

export type DateRangePreset = 'today' | 'yesterday' | '7d' | '30d' | '90d' | '6m' | '1y' | 'custom';

export interface DateFilterRange {
  preset: DateRangePreset;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

export interface ComparativeProgress {
  trialsStarted: number;
  trialsCompleted: number;
  pendingTrials: number;
  evaluationsDone: number;
  efficacyAvg: number;
  startedDiffPercent?: number;
  completedDiffPercent?: number;
}

export interface ScientistExecutiveProfile {
  uid: string;
  email: string;
  name: string;
  department: string;
  role: string;
  activeProjectsCount: number;
  completedProjectsCount: number;
  totalTrials: number;
  activeTrials: number;
  completedTrials: number;
  successRate: number; // Percentage (Excellent / Good outcome)
  failureRate: number; // Percentage (Poor outcome)
  currentWorkloadScore: number; // 0 - 100 indicator
  categoryWorkload: Record<TrialCategory, number>;
  weeklyProgress: {
    currentWeek: ComparativeProgress;
    previousWeek: ComparativeProgress;
  };
  monthlyProgress: {
    currentMonth: ComparativeProgress;
    previousMonth: ComparativeProgress;
  };
  summary: {
    focusArea: string;
    recentDiscoveries: string;
    majorAchievements: string;
    blockers: string;
    recommendations: string;
  };
  mostActiveCategory: TrialCategory;
  mostSuccessfulCategory: TrialCategory;
}

