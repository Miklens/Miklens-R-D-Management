import type { 
  ExperimentItem, 
  LabTestItem, 
  StabilityLogItem, 
  FieldTrialItem, 
  ObservationItem 
} from '../types/experimentTypes';

const EXP_KEY = 'miklens_experiments_v3';
const LAB_KEY = 'miklens_lab_tests_v3';
const STABILITY_KEY = 'miklens_stability_v3';
const FIELD_KEY = 'miklens_field_trials_v3';
const OBS_KEY = 'miklens_observations_v3';

const SEED_EXPERIMENTS: ExperimentItem[] = [
  {
    id: 'exp-1',
    name: 'BioShield Efficacy Assay #101',
    productName: 'BioShield Alpha (Bio-fungicide)',
    type: 'Lab',
    status: 'InProgress',
    progress: 75,
    startDate: '2026-07-15',
    description: 'Fungal pathogen inhibition assay across 3 concentrations.',
    hypothesis: 'BioShield Alpha formulation at 2.5 mL/L achieves >90% inhibition of Botrytis cinerea within 48 hours.',
    protocolSteps: [
      { id: 's1', title: 'Prepare PDA agar plates and autoclave at 121°C', completed: true },
      { id: 's2', title: 'Inoculate Botrytis cinerea fungal spores into center well', completed: true },
      { id: 's3', title: 'Apply BioShield Alpha treatment at 2.5 mL/L concentration', completed: true },
      { id: 's4', title: 'Measure colony growth radius after 48-hour incubation at 25°C', completed: false },
    ],
    dataReadings: [
      { id: 'd1', parameter: 'Control Colony Radius', value: '38.5', unit: 'mm', timestamp: '2026-07-28 10:00 AM' },
      { id: 'd2', parameter: 'Treated Colony Radius', value: '3.2', unit: 'mm', timestamp: '2026-07-28 10:05 AM' },
      { id: 'd3', parameter: 'Inhibition Percentage', value: '91.7', unit: '%', timestamp: '2026-07-28 10:10 AM' },
    ],
    conclusion: 'Interim readings confirm 91.7% fungal inhibition, exceeding target threshold.',
    outcomeStatus: 'Pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'exp-2',
    name: 'BioShield 54°C Heat Stability Check',
    productName: 'BioShield Alpha (Bio-fungicide)',
    type: 'Lab',
    status: 'InProgress',
    progress: 50,
    startDate: '2026-07-20',
    description: '14-day CIPAC MT 161 thermal stress & emulsification stability check.',
    hypothesis: 'Formulation maintains viscosity within 120-160 cPs and <2% phase separation after 14 days at 54°C.',
    protocolSteps: [
      { id: 's1', title: 'Seal 100mL glass vials with BioShield Alpha Batch B-BSA-2026-07A', completed: true },
      { id: 's2', title: 'Place vials in calibrated 54°C stability oven', completed: true },
      { id: 's3', title: 'Perform Day 7 viscosity and pH measurement', completed: false },
      { id: 's4', title: 'Perform Day 14 active retention assay & emulsion test', completed: false },
    ],
    dataReadings: [
      { id: 'd1', parameter: 'Initial pH (Day 0)', value: '6.5', unit: 'pH', timestamp: '2026-07-20 09:00 AM' },
      { id: 'd2', parameter: 'Initial Viscosity', value: '145', unit: 'cPs', timestamp: '2026-07-20 09:15 AM' },
    ],
    conclusion: 'Formulation stable through Day 7 of thermal stress.',
    outcomeStatus: 'Pending',
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
    description: 'Open field evaluation of rust disease reduction in Punjab wheat crops.',
    hypothesis: 'Foliar spray at 3.0 mL/L reduces yellow rust disease incidence by >85% compared to untreated control plot.',
    protocolSteps: [
      { id: 's1', title: 'Map 50-acre trial plot into 4 randomized blocks', completed: true },
      { id: 's2', title: 'Apply First Spray at early tillering stage (GS 21)', completed: true },
      { id: 's3', title: 'Apply Second Spray 14 days post-first spray', completed: true },
      { id: 's4', title: 'Record leaf disease severity score and yield metric', completed: true },
    ],
    dataReadings: [
      { id: 'd1', parameter: 'Control Plot Leaf Disease Index', value: '45.2', unit: '%', timestamp: '2026-07-10' },
      { id: 'd2', parameter: 'BioShield Plot Leaf Disease Index', value: '4.8', unit: '%', timestamp: '2026-07-10' },
      { id: 'd3', parameter: 'Disease Reduction Rate', value: '89.4', unit: '%', timestamp: '2026-07-10' },
    ],
    conclusion: 'BioShield Alpha demonstrated superior efficacy (89.4% reduction) with zero phytotoxicity. Recommended for commercial release.',
    outcomeStatus: 'Passed',
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
    progress: 75,
    lab: 'Main Microbiology Lab',
    dueDate: '2026-08-05',
    hypothesis: 'Complete inhibition of spore germination at 500 ppm active ingredient.',
    protocolSteps: [
      { id: 's1', title: 'Prepare spore suspension of Fusarium oxysporum (10^6 spores/mL)', completed: true },
      { id: 's2', title: 'Mix with serial dilutions of BioShield Alpha', completed: true },
      { id: 's3', title: 'Count germinated spores under light microscope after 18h', completed: true },
      { id: 's4', title: 'Calculate EC50 and EC90 values', completed: false },
    ],
    dataReadings: [
      { id: 'd1', parameter: 'Spore Germination Rate at 500ppm', value: '2.1', unit: '%', timestamp: '2026-07-29' },
    ],
    conclusion: 'High potency confirmed against Fusarium oxysporum.',
    outcomeStatus: 'Pending',
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
    hypothesis: 'Beneficial antagonist spore CFU count > 1 x 10^9 CFU/mL with zero pathogenic contaminants.',
    protocolSteps: [
      { id: 's1', title: 'Perform 10-fold serial dilution (10^-1 to 10^-8)', completed: true },
      { id: 's2', title: 'Spread plate 0.1 mL onto selective agar', completed: true },
      { id: 's3', title: 'Incubate at 28°C for 48 hours', completed: true },
      { id: 's4', title: 'Count colonies and calculate CFU/mL', completed: true },
    ],
    dataReadings: [
      { id: 'd1', parameter: 'Total Spore Count', value: '2.4 x 10^9', unit: 'CFU/mL', timestamp: '2026-07-28' },
      { id: 'd2', parameter: 'Bacterial Contaminants', value: '0', unit: 'CFU/mL', timestamp: '2026-07-28' },
    ],
    conclusion: 'Quality inspection PASSED. CFU count exceeds minimum commercial specifications.',
    outcomeStatus: 'Passed',
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
    hypothesis: 'Active biocontrol metabolite retention stays above 90% after 14-day accelerated aging at 54°C.',
    protocolSteps: [
      { id: 's1', title: 'Thermal oven placement at 54°C ± 2°C', completed: true },
      { id: 's2', title: 'HPLC quantification of active lipopeptides at Day 7', completed: true },
      { id: 's3', title: 'HPLC quantification of active lipopeptides at Day 14', completed: true },
    ],
    dataReadings: [
      { id: 'd1', parameter: 'Day 0 Active Content', value: '10.0', unit: 'g/L', timestamp: '2026-07-15' },
      { id: 'd2', parameter: 'Day 14 Active Content', value: '9.58', unit: 'g/L', timestamp: '2026-07-29' },
    ],
    conclusion: 'Accelerated thermal test passed. 95.8% active retention observed.',
    outcomeStatus: 'Passed',
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
    hypothesis: 'Substantial decrease in fungal foliar damage with 15% increase in grain yield.',
    protocolSteps: [
      { id: 's1', title: 'Plot delineation & baseline soil sampling', completed: true },
      { id: 's2', title: 'First spray application at 3 mL/L', completed: true },
      { id: 's3', title: 'Mid-season disease score assessment', completed: true },
      { id: 's4', title: 'Harvest yield measurement', completed: false },
    ],
    dataReadings: [
      { id: 'd1', parameter: 'Leaf Chlorophyll Index', value: '48.2', unit: 'SPAD', timestamp: '2026-07-15' },
    ],
    conclusion: 'Trial active. Plant vigour and disease protection significantly higher in treated plots.',
    outcomeStatus: 'Pending',
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
