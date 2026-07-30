export type ExperimentType = 'Lab' | 'Field' | 'Both';
export type ExperimentStatus = 'InProgress' | 'Completed' | 'Blocked' | 'Queued' | 'Planning';
export type ScientificOutcomeStatus = 'Pending' | 'Passed' | 'Failed' | 'Inconclusive';
export type TemplateType = 'Formulation' | 'Microbiology' | 'Stability' | 'Field' | 'Custom';

export interface DailyExecutionRun {
  id: string;
  dayNumber: number;
  date: string;
  scientistName: string;
  activityPerformed: string; // e.g. "Adjusted pH from 7.4 to 6.2 using 1M HCl buffer, brought volume to 1000mL"
  observationResult: string; // e.g. "Viscosity 145 cPs, clear emulsion, zero precipitation"
  runStatus: 'Passed' | 'In Progress' | 'Needs Re-Run';
}

export interface ExperimentItem {
  id: string;
  name: string;
  productName: string;
  type: ExperimentType;
  templateType?: TemplateType;
  status: ExperimentStatus;
  startDate: string;
  description?: string;
  hypothesis?: string;
  targetVolume?: string;
  dailyRuns?: DailyExecutionRun[];
  conclusion?: string;
  outcomeStatus?: ScientificOutcomeStatus;
  createdAt: string;
}

export interface LabTestItem {
  id: string;
  name: string;
  productName: string;
  type: string;
  templateType?: TemplateType;
  status: ExperimentStatus;
  lab: string;
  dueDate: string;
  hypothesis?: string;
  dailyRuns?: DailyExecutionRun[];
  conclusion?: string;
  outcomeStatus?: ScientificOutcomeStatus;
  createdAt: string;
}

export interface StabilityLogItem {
  id: string;
  batchNo: string;
  productName: string;
  chamberTemp: string;
  startDate: string;
  duration: string;
  nextTestDate: string;
  nextInterval: string;
  status: 'active' | 'completed' | 'overdue' | 'warning';
  activeRetention: number;
  pH: number;
  hypothesis?: string;
  dailyRuns?: DailyExecutionRun[];
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
  dailyRuns?: DailyExecutionRun[];
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
