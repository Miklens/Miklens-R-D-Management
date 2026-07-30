export type ExperimentType = 'Lab' | 'Field' | 'Both';
export type ExperimentStatus = 'InProgress' | 'Completed' | 'Blocked' | 'Queued';

export interface ExperimentItem {
  id: string;
  name: string;
  productName: string;
  type: ExperimentType;
  status: ExperimentStatus;
  progress: number;
  startDate: string;
  description?: string;
  createdAt: string;
}

export interface LabTestItem {
  id: string;
  name: string;
  productName: string;
  type: string; // Efficacy, Quality, Stability, Safety
  status: ExperimentStatus;
  progress: number;
  lab: string;
  dueDate: string;
  createdAt: string;
}

export interface StabilityLogItem {
  id: string;
  batchNo: string;
  productName: string;
  chamberTemp: string; // "54°C (Accelerated)", "0°C (Cold)", "25°C (Ambient)"
  startDate: string;
  duration: string;
  nextTestDate: string;
  nextInterval: string;
  status: 'active' | 'completed' | 'overdue' | 'warning';
  activeRetention: number;
  pH: number;
  createdAt: string;
}

export interface FieldTrialItem {
  id: string;
  name: string;
  productName: string;
  location: string;
  area: string;
  status: string;
  startDate: string;
  duration: string;
  createdAt: string;
}

export interface ObservationItem {
  id: string;
  title: string;
  productName: string;
  type: string; // Visual, Measurement, Environmental, Equipment
  location: string;
  date: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'Resolved' | 'Under Review';
  createdAt: string;
}
