import type { 
  ExperimentItem, 
  LabTestItem, 
  StabilityLogItem, 
  FieldTrialItem, 
  ObservationItem,
  ScientificFormulation,
  ScientificEvaluationRecord,
  WeeklyMISReport,
} from '../types/experimentTypes';
import { ensureAllWeeklyMISReports } from './weeklyMISCompiler';
import { getGuaranteedFormulations, deriveScientificEvaluations } from './scientificIntelligenceCompiler';

// v5: Purged all BioShield demo seed data. Bumping keys forces clean localStorage reset across all browsers.
const EXP_KEY = 'miklens_experiments_v5';
const LAB_KEY = 'miklens_lab_tests_v5';
const STABILITY_KEY = 'miklens_stability_v5';
const FIELD_KEY = 'miklens_field_trials_v5';
const OBS_KEY = 'miklens_observations_v5';

// v1 keys for new MIS features
const FORMULATIONS_KEY = 'miklens_scientific_formulations_v1';
const EVALUATIONS_KEY = 'miklens_scientific_evaluations_v1';
const MIS_REPORTS_KEY = 'miklens_mis_reports_v2';

// Clear out all legacy v4 seed keys on first load
const LEGACY_KEYS = [
  'miklens_experiments_v4', 'miklens_lab_tests_v4',
  'miklens_stability_v4', 'miklens_field_trials_v4',
  'miklens_observations_v4'
];
try { LEGACY_KEYS.forEach(k => localStorage.removeItem(k)); } catch { /* ignore */ }

const SEED_EXPERIMENTS: ExperimentItem[] = [];
const SEED_LAB_TESTS: LabTestItem[] = [];
const SEED_STABILITY: StabilityLogItem[] = [];
const SEED_FIELD_TRIALS: FieldTrialItem[] = [];
const SEED_OBSERVATIONS: ObservationItem[] = [];
const SEED_FORMULATIONS: ScientificFormulation[] = [];
const SEED_EVALUATIONS: ScientificEvaluationRecord[] = [];
const SEED_MIS_REPORTS: WeeklyMISReport[] = [
  {
    id: 'mis-seed-w39-sandeep',
    weekNumber: 39,
    reportingPeriodStart: '2026-09-21',
    reportingPeriodEnd: '2026-09-27',
    preparedBy: 'Sandeep Patel',
    preparedAt: '2026-09-27',
    preparedDate: '2026-09-27',
    whatDidWeLearn: 'Evaluated 18 field plots across sugarcane and cotton trials. Bio-Herbicide MB-HB-04 demonstrated 88.5% Weed Control Efficacy against broadleaf species with zero crop phytotoxicity at 3.5 L/ha dosage.',
    whatDoesDataMeanScientifically: 'Botanical surfactant modification enhanced leaf cuticle penetration by 34%, eliminating the requirement for synthetic tank-mix additives while maintaining high selectivity.',
    whatDecisionFollows: 'Advance MB-HB-04 into multi-location regulatory trials; expand testing across sandy loam and clay soil zones.',
    keyAchievements: [
      'Completed 18 plot evaluations across 2 major crop zones',
      'Confirmed zero phytotoxicity across all bio-herbicide treatments',
      'Achieved 88.5% weed control efficacy on Cyperus and Parthenium species'
    ],
    keyScientificFindings: [
      'MB-HB-04 active ingredient showed rapid systemic translocation within 48h',
      'Cuticle penetration rate increased from 52% to 86% with new bio-adjuvant',
      'Soil microbial activity remained unaffected 14 days post-application'
    ],
    formulationEfficacyRanking: [
      {
        rank: 1,
        formulationName: 'MB-HB-04 (Bio-Herbicide)',
        wceAtLatestDaa: 88.5,
        latestDaa: 21,
        decision: 'Advance to Field Trial',
        notes: 'Top performing bio-herbicide. Fast burn-down with no crop injury.'
      },
      {
        rank: 2,
        formulationName: 'MB-HB-02 (Broadleaf)',
        wceAtLatestDaa: 79.2,
        latestDaa: 14,
        decision: 'Continue',
        notes: 'Consistent control; minor delay in translocation on grassy weeds.'
      },
      {
        rank: 3,
        formulationName: 'MB-HB-01 (Baseline)',
        wceAtLatestDaa: 62.0,
        latestDaa: 7,
        decision: 'Modify',
        notes: 'Requires higher surfactant ratio for rainfastness.'
      }
    ],
    problemsRisks: [
      {
        id: 'p1',
        problem: 'Intermittent rainfall during late afternoon spraying',
        impact: 'Risk of wash-off on plots sprayed after 3 PM',
        correctiveAction: 'Reschedule all applications to 6:30 AM - 10:30 AM window',
        status: 'Resolved'
      }
    ],
    decisionsRequiredFromManagement: [
      {
        id: 'd1',
        decisionRequired: 'Authorize multi-location trial protocol for MB-HB-04 in North Zone',
        urgency: 'High',
        deadline: '2026-10-05',
        status: 'Action Planned' as any
      }
    ],
    actionsForNextWeek: [
      {
        id: 'a1',
        action: 'Conduct 28-DAA final weed biomass assessment for sugarcane plots',
        responsiblePerson: 'Sandeep Patel',
        expectedCompletion: '2026-10-02',
        priority: 'High',
        status: 'Pending'
      },
      {
        id: 'a2',
        action: 'Dispatch treated soil samples to external GLP lab for residue analysis',
        responsiblePerson: 'Pavan Kumar',
        expectedCompletion: '2026-10-04',
        priority: 'Medium',
        status: 'Pending'
      }
    ],
    status: 'Saved'
  },
  {
    id: 'mis-seed-w38-bindu',
    weekNumber: 38,
    reportingPeriodStart: '2026-09-14',
    reportingPeriodEnd: '2026-09-20',
    preparedBy: 'Dr. Bindushree',
    preparedAt: '2026-09-20',
    preparedDate: '2026-09-20',
    whatDidWeLearn: 'Completed 14-day accelerated thermal stability testing (54°C) across 6 bio-fungicide micro-emulsions. MB-FG-07 maintained optical clarity, zero phase separation, and 97.4% active bio-conjugate viability.',
    whatDoesDataMeanScientifically: 'Optimized HLB balance at 12.8 stabilized botanical oil-in-water nano-globules without synthetic polymers, significantly extending shelf-life projection to 24 months.',
    whatDecisionFollows: 'Standardize MB-FG-07 as the primary candidate for powdery mildew and anthracnose field trials; initiate 50L pilot batch formulation.',
    keyAchievements: [
      'Completed accelerated stability testing across 6 formulation batches',
      'Demonstrated 97.4% bio-conjugate viability at elevated temperatures',
      'Established shelf-life model supporting 2-year ambient storage'
    ],
    keyScientificFindings: [
      'Nano-emulsion droplet size remained below 120nm after thermal cycling',
      'Active secondary metabolites exhibited 0% thermal degradation at 54°C',
      'Re-emulsification in hard water (500 ppm CaCO3) was instantaneous'
    ],
    formulationEfficacyRanking: [
      {
        rank: 1,
        formulationName: 'MB-FG-07 (Bio-Fungicide)',
        wceAtLatestDaa: 91.0,
        latestDaa: 28,
        decision: 'Advance to Registration',
        notes: 'Outstanding physical and chemical stability; high curative index.'
      },
      {
        rank: 2,
        formulationName: 'MB-FG-03 (Nano-Suspension)',
        wceAtLatestDaa: 83.5,
        latestDaa: 14,
        decision: 'Continue',
        notes: 'Good preventive protection; minor viscosity increase at 4°C.'
      }
    ],
    problemsRisks: [
      {
        id: 'p2',
        problem: 'Raw botanical extract viscosity variance from supplier batch #4',
        impact: 'Potential batch-to-batch droplet size drift during high-shear mixing',
        correctiveAction: 'Institute pre-shear viscosity qualification standard for all incoming lots',
        status: 'In Progress'
      }
    ],
    decisionsRequiredFromManagement: [
      {
        id: 'd2',
        decisionRequired: 'Approve procurement of 200L high-shear homogenizer vessel for pilot batch',
        urgency: 'Medium',
        deadline: '2026-10-10',
        status: 'Action Planned' as any
      }
    ],
    actionsForNextWeek: [
      {
        id: 'a3',
        action: 'Formulate 50L pilot batch of MB-FG-07 for multi-center field trials',
        responsiblePerson: 'Dr. Bindushree',
        expectedCompletion: '2026-09-29',
        priority: 'High',
        status: 'Pending'
      }
    ],
    status: 'Saved'
  },
  {
    id: 'mis-seed-w37-pavan',
    weekNumber: 37,
    reportingPeriodStart: '2026-09-07',
    reportingPeriodEnd: '2026-09-13',
    preparedBy: 'Pavan Kumar',
    preparedAt: '2026-09-13',
    preparedDate: '2026-09-13',
    whatDidWeLearn: 'Intense rain event (42mm rainfall within 3 hours post-spray) provided rigorous rainfastness stress. MB-HB-04 with adjuvant MB-AD-9 retained 84% active chemical residue on target leaf surfaces.',
    whatDoesDataMeanScientifically: 'Polymeric botanical sticking agent formed an insoluble hydrophobic matrix within 40 minutes of application, providing superior wash-off resistance compared to commercial benchmark.',
    whatDecisionFollows: 'Standardize adjuvant MB-AD-9 across all monsoon application trials and incorporate into commercial product specifications.',
    keyAchievements: [
      'Documented real-world extreme precipitation rainfastness on 24 test strips',
      'Demonstrated 84% surface retention vs 41% for commercial synthetic standard',
      'Zero leaf burning or cuticle damage observed under humid conditions'
    ],
    keyScientificFindings: [
      'Adjuvant MB-AD-9 reduced surface tension to 28.5 mN/m within 2 seconds',
      'Rainfastness was fully established within 40 minutes drying time',
      'No phytotoxic necrosis detected on test crop leaves'
    ],
    formulationEfficacyRanking: [
      {
        rank: 1,
        formulationName: 'MB-HB-04 + MB-AD-9',
        wceAtLatestDaa: 86.0,
        latestDaa: 14,
        decision: 'Continue',
        notes: 'Superior rainfastness and contact efficacy in high rainfall.'
      },
      {
        rank: 2,
        formulationName: 'MB-NT-01 (Foliar Biostimulant)',
        wceAtLatestDaa: 81.0,
        latestDaa: 14,
        decision: 'Continue',
        notes: 'Enhanced greening index and chlorophyll content under cloud cover.'
      }
    ],
    problemsRisks: [
      {
        id: 'p3',
        problem: 'Waterlogging in plot block B after 75mm two-day rainfall',
        impact: 'Restricted field tractor access for mechanical observation',
        correctiveAction: 'Installed trench drainage conduits; deployed drone telemetry',
        status: 'Resolved'
      }
    ],
    decisionsRequiredFromManagement: [
      {
        id: 'd3',
        decisionRequired: 'Approve drone imaging flights for weekly weed biomass scanning',
        urgency: 'Low',
        deadline: '2026-10-15',
        status: 'Action Planned' as any
      }
    ],
    actionsForNextWeek: [
      {
        id: 'a4',
        action: 'Complete multispectral drone imaging over all 24 rainfastness plots',
        responsiblePerson: 'Pavan Kumar',
        expectedCompletion: '2026-09-22',
        priority: 'High',
        status: 'Pending'
      }
    ],
    status: 'Saved'
  }
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

// ── New MIS Feature Stores ───────────────────────────────────────────────────
export const loadScientificFormulations = (): ScientificFormulation[] => {
  const existing = readStorage<ScientificFormulation[]>(FORMULATIONS_KEY, []);
  const guaranteed = getGuaranteedFormulations(existing);
  if (!existing || existing.length < guaranteed.length) {
    writeStorage(FORMULATIONS_KEY, guaranteed);
  }
  return guaranteed;
};
export const saveScientificFormulations = (items: ScientificFormulation[]) => writeStorage(FORMULATIONS_KEY, items);

export const loadScientificEvaluations = (): ScientificEvaluationRecord[] => {
  const existing = readStorage<ScientificEvaluationRecord[]>(EVALUATIONS_KEY, []);
  if (existing && existing.length > 0) return existing;
  const derived = deriveScientificEvaluations();
  writeStorage(EVALUATIONS_KEY, derived);
  return derived;
};
export const saveScientificEvaluations = (items: ScientificEvaluationRecord[]) => writeStorage(EVALUATIONS_KEY, items);

export const loadMISReports = (): WeeklyMISReport[] => {
  const existing = readStorage<WeeklyMISReport[]>(MIS_REPORTS_KEY, []);
  const compiled = ensureAllWeeklyMISReports(existing);
  if (!existing || existing.length < compiled.length) {
    writeStorage(MIS_REPORTS_KEY, compiled);
  }
  return compiled;
};
export const saveMISReports = (items: WeeklyMISReport[]) => writeStorage(MIS_REPORTS_KEY, items);
