import { ExternalFieldTrial } from '../types/trialIntegrationTypes';

const SYNC_STORAGE_KEY = 'miklens_rnd_synced_trials_v1';

// Pre-seeded high-fidelity demonstration field trials from Miklens Trial Manager
const SEED_TRIALS: ExternalFieldTrial[] = [
  {
    id: 'trial-tm-101',
    trialCode: 'TR-PB-2026-WHEAT-01',
    title: 'Punjab Wheat Yellow Rust & Weed Control Field Trial',
    cropName: 'Wheat (PBW 725)',
    location: 'Ludhiana Research Station, Plot #4B',
    state: 'Punjab',
    targetWeedOrPathogen: 'Puccinia striiformis (Yellow Rust) & Phalaris minor',
    designType: 'RCBD',
    scientistName: 'Dr. Sarah Jenkins',
    startDate: '2026-06-15',
    status: 'Completed',
    productName: 'BioShield Alpha (Bio-fungicide)',
    syncedAt: new Date().toISOString(),
    sourceApp: 'Miklens Trial Manager 7',
    summaryConclusion: 'Foliar application of BioShield Alpha at 3.0 mL/L achieved 91.4% control of yellow rust with zero phytotoxicity. SPAD chlorophyll index increased by +14.2%. Approved for commercial scale-up.',
    treatments: [
      { id: 't1', name: 'Control (Untreated Check)', productName: 'Water Spray', doseRate: '0 mL/L', replicationsCount: 4 },
      { id: 't2', name: 'BioShield T1 Standard', productName: 'BioShield Alpha', doseRate: '1.5 mL/L', replicationsCount: 4 },
      { id: 't3', name: 'BioShield T2 High Dose', productName: 'BioShield Alpha', doseRate: '3.0 mL/L', replicationsCount: 4 },
    ],
    evaluations: [
      { id: 'e1', evalDate: '2026-06-25', daysAfterTreatment: 7, efficacyPercent: 68.5, phytotoxicityScore: 0, weedOrPathogenControlPercent: 65.0, notes: 'Initial spore inhibition observed. No leaf scorching.', evaluatedBy: 'Dr. Sarah Jenkins' },
      { id: 'e2', evalDate: '2026-07-05', daysAfterTreatment: 14, efficacyPercent: 88.2, phytotoxicityScore: 0, weedOrPathogenControlPercent: 86.0, notes: 'Strong systemic defense response.', evaluatedBy: 'Dr. Sarah Jenkins' },
      { id: 'e3', evalDate: '2026-07-20', daysAfterTreatment: 28, efficacyPercent: 93.8, phytotoxicityScore: 0, weedOrPathogenControlPercent: 91.4, notes: 'Final evaluation. Zero lesion expansion.', evaluatedBy: 'Dr. Sarah Jenkins' },
    ],
    photos: [
      {
        id: 'p1',
        url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=200&q=80',
        caption: 'Plot #4B Wheat Foliar Assessment - Day 14 Post Treatment',
        takenAt: '2026-07-05',
        treatmentName: 'BioShield T2 High Dose'
      },
      {
        id: 'p2',
        url: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=200&q=80',
        caption: 'Root & Canopy Health Inspection - Day 28',
        takenAt: '2026-07-20',
        treatmentName: 'BioShield T2 High Dose'
      }
    ]
  },
  {
    id: 'trial-tm-102',
    trialCode: 'TR-MH-2026-SOYA-04',
    title: 'Maharashtra Soybean Broad-Leaf Herbicide & Bio-Stimulant Evaluation',
    cropName: 'Soybean (JS 335)',
    location: 'Nashik Agri Park, Plot #12',
    state: 'Maharashtra',
    targetWeedOrPathogen: 'Amaranthus viridis & Echinochloa colonum',
    designType: 'CRD',
    scientistName: 'Dr. Mik (Management)',
    startDate: '2026-07-01',
    status: 'EvaluationPhase',
    productName: 'Goweed Ultra',
    syncedAt: new Date().toISOString(),
    sourceApp: 'Miklens Trial Manager 7',
    summaryConclusion: 'Goweed Ultra combination tank-mix demonstrated rapid 48-hour burndown of broadleaf weeds without crop stunting.',
    treatments: [
      { id: 't1', name: 'Commercial Standard (Check)', productName: 'Standard Herbicide', doseRate: '2.0 mL/L', replicationsCount: 3 },
      { id: 't2', name: 'Goweed Ultra Bio-Mix', productName: 'Goweed Ultra', doseRate: '2.5 mL/L', replicationsCount: 3 },
    ],
    evaluations: [
      { id: 'e1', evalDate: '2026-07-10', daysAfterTreatment: 3, efficacyPercent: 78.0, phytotoxicityScore: 1, weedOrPathogenControlPercent: 82.0, notes: 'Slight transient yellowing on lower leaves, recovered by day 5.', evaluatedBy: 'Dr. Mik' },
      { id: 'e2', evalDate: '2026-07-22', daysAfterTreatment: 14, efficacyPercent: 94.5, phytotoxicityScore: 0, weedOrPathogenControlPercent: 96.0, notes: 'Complete weed suppression.', evaluatedBy: 'Dr. Mik' },
    ],
    photos: [
      {
        id: 'p3',
        url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=200&q=80',
        caption: 'Post-emergent Weed Clearance - Plot #12',
        takenAt: '2026-07-22',
        treatmentName: 'Goweed Ultra Bio-Mix'
      }
    ]
  }
];

export const getSyncedTrials = (): ExternalFieldTrial[] => {
  try {
    const raw = localStorage.getItem(SYNC_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(SEED_TRIALS));
      return SEED_TRIALS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load synced trials:', err);
    return SEED_TRIALS;
  }
};

export const saveSyncedTrial = (trial: ExternalFieldTrial): ExternalFieldTrial[] => {
  const current = getSyncedTrials();
  const existingIdx = current.findIndex(t => t.id === trial.id);
  let updated: ExternalFieldTrial[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = { ...trial, syncedAt: new Date().toISOString() };
  } else {
    updated = [trial, ...current];
  }
  localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteSyncedTrial = (trialId: string): ExternalFieldTrial[] => {
  const current = getSyncedTrials();
  const updated = current.filter(t => t.id !== trialId);
  localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(updated));
  return updated;
};
