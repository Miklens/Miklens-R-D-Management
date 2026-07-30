import type { 
  ExperimentItem, 
  LabTestItem, 
  StabilityLogItem, 
  FieldTrialItem, 
  ObservationItem 
} from '../types/experimentTypes';

const EXP_KEY = 'miklens_experiments_v2';
const LAB_KEY = 'miklens_lab_tests_v2';
const STABILITY_KEY = 'miklens_stability_v2';
const FIELD_KEY = 'miklens_field_trials_v2';
const OBS_KEY = 'miklens_observations_v2';

const SEED_EXPERIMENTS: ExperimentItem[] = [
  {
    id: 'exp-1',
    name: 'BioShield Efficacy Assay #101',
    productName: 'BioShield Alpha (Bio-fungicide)',
    type: 'Lab',
    status: 'InProgress',
    progress: 85,
    startDate: '2026-07-15',
    description: 'Fungal pathogen inhibition assay across 3 concentrations.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'exp-2',
    name: 'BioShield 54°C Heat Stability Check',
    productName: 'BioShield Alpha (Bio-fungicide)',
    type: 'Lab',
    status: 'InProgress',
    progress: 60,
    startDate: '2026-07-20',
    description: '14-day CIPAC MT 161 thermal stress & emulsification stability check.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'exp-3',
    name: 'BioShield Wheat Field Plot Trial',
    productName: 'BioShield Alpha (Bio-fungicide)',
    type: 'Field',
    status: 'Completed',
    progress: 100,
    startDate: '2026-06-01',
    description: 'Open field evaluation of pest control efficacy in Punjab wheat crops.',
    createdAt: new Date().toISOString(),
  },
];

const SEED_LAB_TESTS: LabTestItem[] = [
  {
    id: 'lab-1',
    name: 'BioShield Alpha - Fungal Spore Efficacy Check',
    productName: 'BioShield Alpha (Bio-fungicide)',
    type: 'Efficacy',
    status: 'InProgress',
    progress: 85,
    lab: 'Main Microbiology Lab',
    dueDate: '2026-08-05',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'lab-2',
    name: 'BioShield Alpha - Microbial Colony Count Assay',
    productName: 'BioShield Alpha (Bio-fungicide)',
    type: 'Quality',
    status: 'Completed',
    progress: 100,
    lab: 'Microbiology Lab',
    dueDate: '2026-07-28',
    createdAt: new Date().toISOString(),
  },
];

const SEED_STABILITY: StabilityLogItem[] = [
  {
    id: 'stab-1',
    batchNo: 'B-BSA-2026-07A',
    productName: 'BioShield Alpha (Bio-fungicide)',
    chamberTemp: '54°C (Accelerated)',
    startDate: '2026-07-15',
    duration: '14 Days',
    nextTestDate: '2026-07-29',
    nextInterval: 'Complete',
    status: 'active',
    activeRetention: 95.8,
    pH: 6.5,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'stab-2',
    batchNo: 'B-BSA-2026-05F',
    productName: 'BioShield Alpha (Bio-fungicide)',
    chamberTemp: '25°C (Ambient)',
    startDate: '2026-05-10',
    duration: '24 Months',
    nextTestDate: '2026-08-10',
    nextInterval: '3 Month',
    status: 'active',
    activeRetention: 98.2,
    pH: 6.6,
    createdAt: new Date().toISOString(),
  },
];

const SEED_FIELD_TRIALS: FieldTrialItem[] = [
  {
    id: 'field-1',
    name: 'BioShield Alpha Wheat Field Efficacy Trial',
    productName: 'BioShield Alpha (Bio-fungicide)',
    location: 'Punjab, India',
    area: '50 acres',
    status: 'Active',
    startDate: '2026-06-01',
    duration: '90 days',
    createdAt: new Date().toISOString(),
  },
];

const SEED_OBSERVATIONS: ObservationItem[] = [
  {
    id: 'obs-1',
    title: 'BioShield Alpha - High fungal inhibition observed in Trial Plot A',
    productName: 'BioShield Alpha (Bio-fungicide)',
    type: 'Measurement',
    location: 'Field Plot 3',
    date: '2026-07-28',
    severity: 'Low',
    status: 'Resolved',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'obs-2',
    title: 'BioShield Alpha - Emulsification viscosity stable after 54°C heat stress',
    productName: 'BioShield Alpha (Bio-fungicide)',
    type: 'Measurement',
    location: 'Main Lab',
    date: '2026-07-25',
    severity: 'Low',
    status: 'Resolved',
    createdAt: new Date().toISOString(),
  },
];

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to write key ${key}:`, err);
  }
}

export const loadExperiments = (): ExperimentItem[] => readStorage(EXP_KEY, SEED_EXPERIMENTS);
export const saveExperiments = (items: ExperimentItem[]) => writeStorage(EXP_KEY, items);

export const loadLabTests = (): LabTestItem[] => readStorage(LAB_KEY, SEED_LAB_TESTS);
export const saveLabTests = (items: LabTestItem[]) => writeStorage(LAB_KEY, items);

export const loadStabilityLogs = (): StabilityLogItem[] => readStorage(STABILITY_KEY, SEED_STABILITY);
export const saveStabilityLogs = (items: StabilityLogItem[]) => writeStorage(STABILITY_KEY, items);

export const loadFieldTrials = (): FieldTrialItem[] => readStorage(FIELD_KEY, SEED_FIELD_TRIALS);
export const saveFieldTrials = (items: FieldTrialItem[]) => writeStorage(FIELD_KEY, items);

export const loadObservations = (): ObservationItem[] => readStorage(OBS_KEY, SEED_OBSERVATIONS);
export const saveObservations = (items: ObservationItem[]) => writeStorage(OBS_KEY, items);
