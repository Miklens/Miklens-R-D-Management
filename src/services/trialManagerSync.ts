import { ExternalFieldTrial } from '../types/trialIntegrationTypes';
import Dexie from 'dexie';

const SYNC_STORAGE_KEY = 'miklens_rnd_synced_trials_v1';

// ── 1. Read directly from browser IndexedDB (MiklensTrialManagerDexieDB) ──
export const readTrialsFromIndexedDB = async (): Promise<ExternalFieldTrial[]> => {
  try {
    const dbExists = await IndexedDBDatabaseExists('MiklensTrialManagerDexieDB');
    if (!dbExists) {
      console.log('[TrialManagerSync] MiklensTrialManagerDexieDB not found on this device.');
      return [];
    }

    const trialDb = new Dexie('MiklensTrialManagerDexieDB');
    // Schema definition matching Trial Manager 7
    trialDb.version(1).stores({
      trials: 'ID, ProjectID, Date, LastModified',
      projects: 'ID',
      formulations: 'ID',
      trialPhotos: 'ID',
    });

    const rawTrials = await trialDb.table('trials').toArray();
    console.log(`[TrialManagerSync] Read ${rawTrials.length} trials from local IndexedDB.`);

    if (!rawTrials || rawTrials.length === 0) return [];

    // Map raw Trial Manager records into R&D Hub clean ExternalFieldTrial format
    const mapped: ExternalFieldTrial[] = rawTrials.map((t: any) => {
      // Parse ratings/observations
      let ratings: any[] = [];
      try {
        if (typeof t.Ratings === 'string') ratings = JSON.parse(t.Ratings);
        else if (Array.isArray(t.Ratings)) ratings = t.Ratings;
      } catch (e) {
        ratings = [];
      }

      // Parse photos
      let photos: any[] = [];
      try {
        if (typeof t.PhotoURLs === 'string') photos = JSON.parse(t.PhotoURLs);
        else if (Array.isArray(t.PhotoURLs)) photos = t.PhotoURLs;
      } catch (e) {
        photos = [];
      }

      // Calculate latest efficacy %
      let latestEfficacy = 0;
      let latestPhytotox = 0;
      let notesStr = '';

      if (ratings && ratings.length > 0) {
        const last = ratings[ratings.length - 1];
        latestEfficacy = parseFloat(last.Efficacy || last.ControlPercent || last.efficacyPercent || '0') || 0;
        latestPhytotox = parseFloat(last.Phytotoxicity || last.phytotoxicityScore || '0') || 0;
        notesStr = last.Notes || last.notes || last.Observation || '';
      }

      const formattedPhotos = photos.map((p: any, idx: number) => ({
        id: p.id || `photo-${idx}`,
        url: p.driveUrl || p.url || p.fileData || 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80',
        thumbnailUrl: p.thumbnailUrl || p.url || p.fileData,
        caption: p.caption || p.label || `Plot Inspection Photo #${idx + 1}`,
        takenAt: p.date || t.Date || new Date().toISOString().split('T')[0],
        treatmentName: p.treatment || t.FormulationCode || 'Treatment Plot',
      }));

      return {
        id: String(t.ID || t.id || `trial-${Date.now()}`),
        trialCode: t.TrialCode || t.Code || `TR-${t.ID || '2026'}`,
        title: t.Title || t.Name || `${t.Crop || 'Crop'} Field Trial - ${t.FormulationCode || 'Treatment'}`,
        cropName: t.Crop || t.CropName || 'Crop Field',
        location: t.Location || t.State || 'India Farm Station',
        state: t.State || 'Punjab',
        targetWeedOrPathogen: t.TargetWeed || t.TargetDisease || t.WeedSpecies || 'Weed / Pathogen',
        designType: (t.DesignType || 'RCBD') as any,
        scientistName: t.EvaluatedBy || t.Scientist || t.User || 'Dr. Mik (Agronomist)',
        startDate: t.Date || new Date().toISOString().split('T')[0],
        status: (t.Status || 'Active') as any,
        productName: t.ProductName || t.FormulationCode || 'Goweed Ultra',
        syncedAt: new Date().toISOString(),
        sourceApp: 'Miklens Trial Manager 7',
        summaryConclusion: t.Conclusion || notesStr || `Field evaluation conducted. Efficacy recorded at ${latestEfficacy}%.`,
        treatments: [
          {
            id: 't1',
            name: t.FormulationCode || 'Treatment Arm',
            productName: t.ProductName || 'Formulation',
            doseRate: t.DoseRate || '2.5 mL/L',
            replicationsCount: t.Replications || 4,
          }
        ],
        evaluations: ratings.map((r: any, rIdx: number) => ({
          id: `eval-${rIdx}`,
          evalDate: r.Date || r.evalDate || t.Date || new Date().toISOString().split('T')[0],
          daysAfterTreatment: parseInt(r.DAT || r.daysAfterTreatment || '7', 10),
          efficacyPercent: parseFloat(r.Efficacy || r.efficacyPercent || '0'),
          phytotoxicityScore: parseFloat(r.Phytotoxicity || r.phytotoxicityScore || '0'),
          weedOrPathogenControlPercent: parseFloat(r.Control || r.efficacyPercent || '0'),
          notes: r.Notes || r.notes || 'Evaluation recorded',
          evaluatedBy: r.Evaluator || t.Scientist || 'Agronomist',
        })),
        photos: formattedPhotos,
      };
    });

    return mapped;
  } catch (err) {
    console.warn('[TrialManagerSync] Could not read IndexedDB:', err);
    return [];
  }
};

// Helper to check if IndexedDB database exists
function IndexedDBDatabaseExists(dbName: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!window.indexedDB || !window.indexedDB.databases) {
      resolve(true); // Fallback: try opening
      return;
    }
    window.indexedDB.databases().then((dbs) => {
      const exists = dbs.some((db) => db.name === dbName);
      resolve(exists);
    }).catch(() => resolve(true));
  });
}

// ── 2. Pre-seeded Demonstration Data Fallback ──
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
    scientistName: 'Pavan (Admin)',
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
      { id: 'e1', evalDate: '2026-07-10', daysAfterTreatment: 3, efficacyPercent: 78.0, phytotoxicityScore: 1, weedOrPathogenControlPercent: 82.0, notes: 'Slight transient yellowing on lower leaves, recovered by day 5.', evaluatedBy: 'Pavan' },
      { id: 'e2', evalDate: '2026-07-22', daysAfterTreatment: 14, efficacyPercent: 94.5, phytotoxicityScore: 0, weedOrPathogenControlPercent: 96.0, notes: 'Complete weed suppression.', evaluatedBy: 'Pavan' },
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

export const saveSyncedTrialsList = (trials: ExternalFieldTrial[]): void => {
  try {
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(trials));
  } catch (e) {
    console.error('Failed to cache synced trials:', e);
  }
};
