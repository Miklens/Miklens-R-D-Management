export type ExperimentType = 'Lab' | 'Field' | 'Both';
export type ExperimentStatus = 'InProgress' | 'Completed' | 'Blocked' | 'Queued' | 'Planning';
export type ScientificOutcomeStatus = 'Pending' | 'Passed' | 'Failed' | 'Inconclusive';

export interface ProtocolStep {
  id: string;
  title: string;
  completed: boolean;
}

export interface DataReading {
  id: string;
  parameter: string;
  value: string;
  unit: string;
  timestamp: string;
  notes?: string;
}

export interface ExperimentItem {
  id: string;
  name: string;
  productName: string;
  type: ExperimentType;
  status: ExperimentStatus;
  progress: number;
  startDate: string;
  description?: string;
  hypothesis?: string;
  protocolSteps?: ProtocolStep[];
  dataReadings?: DataReading[];
  conclusion?: string;
  outcomeStatus?: ScientificOutcomeStatus;
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
  hypothesis?: string;
  protocolSteps?: ProtocolStep[];
  dataReadings?: DataReading[];
  conclusion?: string;
  outcomeStatus?: ScientificOutcomeStatus;
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
  hypothesis?: string;
  protocolSteps?: ProtocolStep[];
  dataReadings?: DataReading[];
  conclusion?: string;
  outcomeStatus?: ScientificOutcomeStatus;
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
  hypothesis?: string;
  protocolSteps?: ProtocolStep[];
  dataReadings?: DataReading[];
  conclusion?: string;
  outcomeStatus?: ScientificOutcomeStatus;
  createdAt: string;
}

export interface ObservationItem {
  id: string;
  title: string;
  productName: string;
  type: string;
  location: string;
  date: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'Resolved' | 'Under Review';
  createdAt: string;
}
