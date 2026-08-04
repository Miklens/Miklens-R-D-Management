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

const SEED_EXPERIMENTS: ExperimentItem[] = [];
const SEED_LAB_TESTS: LabTestItem[] = [];
const SEED_STABILITY: StabilityLogItem[] = [];
const SEED_FIELD_TRIALS: FieldTrialItem[] = [];
const SEED_OBSERVATIONS: ObservationItem[] = [];

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
