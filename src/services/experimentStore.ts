import type { 
  ExperimentItem, 
  LabTestItem, 
  StabilityLogItem, 
  FieldTrialItem, 
  ObservationItem 
} from '../types/experimentTypes';

const EXP_KEY = 'miklens_experiments_v4';
const LAB_KEY = 'miklens_lab_tests_v4';
const STABILITY_KEY = 'miklens_stability_v4';
const FIELD_KEY = 'miklens_field_trials_v4';
const OBS_KEY = 'miklens_observations_v4';

const SEED_EXPERIMENTS: ExperimentItem[] = [
  {
    id: 'exp-1',
    name: 'BioShield Alpha - Volume & pH Titration Adjustment',
    productName: 'BioShield Alpha (Bio-fungicide)',
    type: 'Lab',
    templateType: 'Formulation',
    status: 'InProgress',
    startDate: '2026-07-28',
    description: 'Multi-day volume makeup (800mL to 1000mL) and 1M HCl buffer titration to optimize emulsification stability.',
    hypothesis: 'Adjusting formulation pH to 6.2 and bringing total volume to 1000mL stabilizes active spores with zero precipitate.',
    dailyRuns: [
      {
        id: 'r1',
        dayNumber: 1,
        date: '2026-07-28',
        scientistName: 'Dr. Sarah Jenkins',
        activityPerformed: 'Initial batch formulation prep. Measured initial pH (7.4) and volume (800 mL). Added 150 mL DI water.',
        observationResult: 'Solution homogenous, initial viscosity 120 cPs. pH remains high at 7.1.',
        runStatus: 'In Progress',
      },
      {
        id: 'r2',
        dayNumber: 2,
        date: '2026-07-29',
        scientistName: 'Dr. Sarah Jenkins',
        activityPerformed: 'Titrated with 12 mL of 1M Citric Acid buffer. Brought final batch volume to 1000 mL.',
        observationResult: 'Target pH 6.2 achieved! Viscosity stabilized at 145 cPs. Zero phase separation after 4h.',
        runStatus: 'Passed',
      },
      {
        id: 'r3',
        dayNumber: 3,
        date: '2026-07-30',
        scientistName: 'Dr. Sarah Jenkins',
        activityPerformed: '24-hour post-titration thermal stability observation at ambient lab temperature (25°C).',
        observationResult: 'Viscosity 146 cPs, pH steady at 6.2. Passed initial formulation physical checks.',
        runStatus: 'Passed',
      },
    ],
    conclusion: 'Formulation pH 6.2 at 1000mL volume makeup meets target viscosity & stability specifications.',
    outcomeStatus: 'Passed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'exp-2',
    name: 'BioShield Efficacy Assay #101',
    productName: 'BioShield Alpha (Bio-fungicide)',
    type: 'Lab',
    templateType: 'Microbiology',
    status: 'InProgress',
    startDate: '2026-07-25',
    description: 'Fungal pathogen inhibition assay against Botrytis cinerea across 3 concentrations.',
    hypothesis: 'BioShield Alpha formulation at 2.5 mL/L achieves >90% inhibition of Botrytis cinerea within 48 hours.',
    dailyRuns: [
      {
        id: 'r1',
        dayNumber: 1,
        date: '2026-07-25',
        scientistName: 'Dr. Sarah Jenkins',
        activityPerformed: 'Autoclaved PDA agar plates at 121°C. Inoculated Botrytis cinerea fungal spores into center well.',
        observationResult: 'Agar plates clean, spore suspension density 10^6 spores/mL.',
        runStatus: 'In Progress',
      },
      {
        id: 'r2',
        dayNumber: 2,
        date: '2026-07-27',
        scientistName: 'Dr. Sarah Jenkins',
        activityPerformed: 'Applied BioShield Alpha treatment at 2.5 mL/L. Incubated at 25°C for 48 hours.',
        observationResult: 'Control colony radius: 38.5 mm. Treated colony radius: 3.2 mm (91.7% inhibition).',
        runStatus: 'Passed',
      },
    ],
    conclusion: 'Confirmed 91.7% fungal inhibition, exceeding target threshold.',
    outcomeStatus: 'Passed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'exp-3',
    name: 'BioShield Wheat Field Plot Trial',
    productName: 'BioShield Alpha (Bio-fungicide)',
    type: 'Field',
    templateType: 'Field',
    status: 'Completed',
    startDate: '2026-06-01',
    description: 'Open field evaluation of rust disease reduction in Punjab wheat crops.',
    hypothesis: 'Foliar spray at 3.0 mL/L reduces yellow rust disease incidence by >85% compared to untreated control plot.',
    dailyRuns: [
      {
        id: 'r1',
        dayNumber: 1,
        date: '2026-06-01',
        scientistName: 'Dr. Sarah Jenkins',
        activityPerformed: 'Mapped 50-acre trial plot into 4 randomized blocks. Applied First Foliar Spray.',
        observationResult: 'Spray coverage uniform, crop stage GS 21. No immediate phytotoxicity.',
        runStatus: 'Passed',
      },
      {
        id: 'r2',
        dayNumber: 14,
        date: '2026-06-15',
        scientistName: 'Dr. Sarah Jenkins',
        activityPerformed: 'Applied Second Foliar Spray post 14 days.',
        observationResult: 'Chlorophyll SPAD score 48.2 (vs 32.1 in control).',
        runStatus: 'Passed',
      },
      {
        id: 'r3',
        dayNumber: 45,
        date: '2026-07-15',
        scientistName: 'Dr. Sarah Jenkins',
        activityPerformed: 'Recorded final leaf rust disease severity index & crop yield metric.',
        observationResult: 'BioShield plot disease index: 4.8% (vs 45.2% in control). 89.4% disease reduction rate.',
        runStatus: 'Passed',
      },
    ],
    conclusion: 'BioShield Alpha demonstrated 89.4% disease reduction with zero crop toxicity. Approved for commercial launch.',
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
    lab: 'Main Microbiology Lab',
    dueDate: '2026-08-05',
    hypothesis: 'Complete inhibition of spore germination at 500 ppm active ingredient.',
    dailyRuns: [
      {
        id: 'r1',
        dayNumber: 1,
        date: '2026-07-28',
        scientistName: 'Dr. Sarah Jenkins',
        activityPerformed: 'Prepared Fusarium oxysporum spore suspension. Mixed serial dilutions.',
        observationResult: 'Germination rate at 500ppm: 2.1% (97.9% inhibition).',
        runStatus: 'Passed',
      },
    ],
    conclusion: 'High potency confirmed against Fusarium oxysporum.',
    outcomeStatus: 'Pending',
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
    dailyRuns: [
      {
        id: 'r1',
        dayNumber: 7,
        date: '2026-07-22',
        scientistName: 'Dr. Sarah Jenkins',
        activityPerformed: 'Day 7 thermal chamber check. HPLC assay for active lipopeptides.',
        observationResult: 'Active retention 98.2%, pH 6.5.',
        runStatus: 'Passed',
      },
      {
        id: 'r2',
        dayNumber: 14,
        date: '2026-07-29',
        scientistName: 'Dr. Sarah Jenkins',
        activityPerformed: 'Day 14 final thermal chamber check. Emulsification & viscosity assay.',
        observationResult: 'Active retention 95.8%, pH 6.5. Passed CIPAC MT 161 specifications.',
        runStatus: 'Passed',
      },
    ],
    conclusion: 'Accelerated thermal test passed. 95.8% active retention observed after 14 days at 54°C.',
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
    dailyRuns: [
      {
        id: 'r1',
        dayNumber: 1,
        date: '2026-06-01',
        scientistName: 'Dr. Sarah Jenkins',
        activityPerformed: 'Plot delineation & baseline soil sampling. First foliar spray.',
        observationResult: 'Uniform plot setup across 50 acres.',
        runStatus: 'Passed',
      },
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
