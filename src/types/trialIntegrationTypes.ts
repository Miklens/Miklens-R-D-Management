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
  treatments: ExternalTreatmentArm[];
  evaluations: ExternalTrialEvaluation[];
  photos: ExternalTrialPhoto[];
  summaryConclusion?: string;
  syncedAt: string;
  sourceApp: 'Miklens Trial Manager 7';
}
