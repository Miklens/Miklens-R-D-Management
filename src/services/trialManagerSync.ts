import { ExternalFieldTrial } from '../types/trialIntegrationTypes';
import Dexie from 'dexie';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const SYNC_STORAGE_KEY = 'miklens_rnd_synced_trials_v1';
const FIREBASE_CONFIG_KEY = 'miklens_rnd_firebase_config_v1';

export interface FirebaseConnectionConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  email?: string;
  password?: string;
}

export const getSavedFirebaseConfig = (): FirebaseConnectionConfig | null => {
  try {
    const raw = localStorage.getItem(FIREBASE_CONFIG_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

export const saveFirebaseConfig = (config: FirebaseConnectionConfig): void => {
  localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
};

// Target collection names exact to user's Firestore Security Rules:
const TARGET_COLLECTIONS = [
  'trials',
  'herbicide_trials',
  'fungicide_trials',
  'pesticide_trials',
  'nutrition_trials',
  'biostimulant_trials'
];

// Helper to format Drive image URLs or fallbacks
const formatDriveImageUrl = (rawUrl?: string): string => {
  if (!rawUrl || rawUrl === '—') {
    return 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80';
  }
  // Convert Google Drive view/open links into direct thumbnail links
  if (rawUrl.includes('drive.google.com') || rawUrl.includes('docs.google.com')) {
    const match = rawUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || rawUrl.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/u/0/d/${match[1]}=w800`;
    }
  }
  return rawUrl;
};

// ── 1. Read directly from Cloud Firebase Firestore (Authenticated & Cross-Device) ──
export const fetchTrialsFromFirebaseCloud = async (config: FirebaseConnectionConfig): Promise<ExternalFieldTrial[]> => {
  try {
    let app;
    const existingApps = getApps();
    const existing = existingApps.find(a => a.options.projectId === config.projectId);
    if (existing) {
      app = existing;
    } else {
      app = initializeApp(config, `trialManager-${Date.now()}`);
    }

    // Authenticate if email and password are provided
    if (config.email && config.password) {
      try {
        const auth = getAuth(app);
        if (!auth.currentUser) {
          console.log(`[TrialManagerSync] Authenticating as ${config.email}...`);
          await signInWithEmailAndPassword(auth, config.email, config.password);
          console.log('[TrialManagerSync] Firebase Auth Success!');
        }
      } catch (authErr: any) {
        console.warn('[TrialManagerSync] Auth warning:', authErr?.message);
        throw new Error(`Firebase Auth Failed: ${authErr?.message || 'Check Email & Password'}`);
      }
    }

    const firestore = getFirestore(app);
    console.log('[TrialManagerSync] Querying Firebase Cloud collections:', TARGET_COLLECTIONS);

    let allCloudDocs: { id: string; data: any }[] = [];

    // Query across exact matching collection names
    for (const colName of TARGET_COLLECTIONS) {
      try {
        const trialsRef = collection(firestore, colName);
        const snapshot = await getDocs(query(trialsRef, limit(200)));
        if (!snapshot.empty) {
          console.log(`[TrialManagerSync] Found ${snapshot.size} records in collection "${colName}"`);
          snapshot.docs.forEach(doc => {
            allCloudDocs.push({ id: doc.id, data: doc.data() });
          });
        }
      } catch (colErr: any) {
        console.warn(`[TrialManagerSync] Collection "${colName}" fetch status:`, colErr?.message);
      }
    }

    if (allCloudDocs.length === 0) {
      console.log('[TrialManagerSync] No cloud trials retrieved.');
      return [];
    }

    const cloudTrials: ExternalFieldTrial[] = allCloudDocs.map(item => {
      const data = item.data;
      const id = item.id;

      // Extract Trial Title & Crop
      const title = data.Title || data.title || data.Name || data.name || (data.Crop ? `${data.Crop} Field Trial` : 'Crop Field Trial');
      const crop = data.Crop || data.crop || data.CropName || 'Crop Field';
      const location = data.Location || data.location || data.GPS || data.State || 'Research Farm Plot';
      const weedOrPathogen = data.WeedSpecies || data.DiseaseTarget || data.TargetWeed || data.TargetDisease || data.PestTarget || data.TargetWeedOrPathogen || 'Target Disease / Weed';
      const scientist = data.Scientist || data.EvaluatedBy || data.User || data.CreatedBy || 'Dr. Mik (Agronomist)';
      const formulationCode = data.FormulationCode || data.productName || data.Product || 'Treatment Formulation';

      // Parse ratings/evaluations with full field fallback
      let ratings: any[] = [];
      try {
        if (typeof data.Ratings === 'string') ratings = JSON.parse(data.Ratings);
        else if (Array.isArray(data.Ratings)) ratings = data.Ratings;
        else if (Array.isArray(data.evaluations)) ratings = data.evaluations;
      } catch (e) {
        ratings = [];
      }

      // Parse photos
      let photos: any[] = [];
      try {
        if (typeof data.PhotoURLs === 'string') photos = JSON.parse(data.PhotoURLs);
        else if (Array.isArray(data.PhotoURLs)) photos = data.PhotoURLs;
        else if (Array.isArray(data.photos)) photos = data.photos;
      } catch (e) {
        photos = [];
      }

      let latestEfficacy = 0;
      let latestPhytotox = 0;
      let notesStr = data.Conclusion || data.conclusion || data.Notes || '';

      if (ratings && ratings.length > 0) {
        const last = ratings[ratings.length - 1];
        latestEfficacy = parseFloat(last.WCE || last.Efficacy || last.ControlPercent || last.efficacyPercent || last.Control || '0') || 0;
        latestPhytotox = parseFloat(last.Phytotoxicity || last.phytotoxicityScore || '0') || 0;
        notesStr = last.Notes || last.notes || last.Observation || notesStr;
      }

      const formattedPhotos = photos.map((p: any, idx: number) => {
        const rawUrl = p.driveUrl || p.url || p.fileData || p.PhotoURL;
        return {
          id: p.id || `photo-${idx}`,
          url: formatDriveImageUrl(rawUrl),
          thumbnailUrl: formatDriveImageUrl(p.thumbnailUrl || rawUrl),
          caption: p.caption || p.label || p.fileName || `Field Photo ${p.date || idx + 1}`,
          takenAt: p.date || data.Date || new Date().toISOString().split('T')[0],
          treatmentName: p.treatment || formulationCode || 'Treatment Plot',
        };
      });

      return {
        id: String(id),
        trialCode: data.TrialCode || data.Code || `TR-${id.slice(0, 8)}`,
        title: title,
        cropName: crop,
        location: location,
        state: data.State || 'India',
        targetWeedOrPathogen: weedOrPathogen,
        designType: (data.DesignType || data.Replication ? 'RCBD' : 'CRD') as any,
        scientistName: scientist,
        startDate: data.Date || data.startDate || new Date().toISOString().split('T')[0],
        status: (data.Status || 'Active') as any,
        productName: formulationCode,
        syncedAt: new Date().toISOString(),
        sourceApp: 'Miklens Trial Manager 7',
        summaryConclusion: notesStr || `Trial evaluated. Observed control efficacy: ${latestEfficacy}%.`,
        treatments: [
          {
            id: 't1',
            name: formulationCode,
            productName: formulationCode,
            doseRate: data.DoseRate || '2.5 mL/L',
            replicationsCount: data.Replication || 4,
          }
        ],
        evaluations: ratings.map((r: any, rIdx: number) => ({
          id: `eval-${rIdx}`,
          evalDate: r.Date || r.evalDate || data.Date || new Date().toISOString().split('T')[0],
          daysAfterTreatment: parseInt(r.DAT || r.daysAfterTreatment || '7', 10),
          efficacyPercent: parseFloat(r.WCE || r.Efficacy || r.efficacyPercent || '0'),
          phytotoxicityScore: parseFloat(r.Phytotoxicity || r.phytotoxicityScore || '0'),
          weedOrPathogenControlPercent: parseFloat(r.Control || r.efficacyPercent || '0'),
          notes: r.Notes || r.notes || 'Evaluation recorded',
          evaluatedBy: r.Evaluator || scientist,
        })),
        photos: formattedPhotos,
      };
    });

    return cloudTrials;
  } catch (err: any) {
    console.error('[TrialManagerSync] Cloud Firebase fetch error:', err);
    throw new Error(err?.message || 'Failed to fetch from Cloud Firebase');
  }
};

// ── 2. Read directly from browser IndexedDB (Same Device) ──
export const readTrialsFromIndexedDB = async (): Promise<ExternalFieldTrial[]> => {
  try {
    const dbExists = await IndexedDBDatabaseExists('MiklensTrialManagerDexieDB');
    if (!dbExists) {
      console.log('[TrialManagerSync] MiklensTrialManagerDexieDB not found on this device.');
      return [];
    }

    const trialDb = new Dexie('MiklensTrialManagerDexieDB');
    trialDb.version(1).stores({
      trials: 'ID, ProjectID, Date, LastModified',
      projects: 'ID',
      formulations: 'ID',
      trialPhotos: 'ID',
    });

    const rawTrials = await trialDb.table('trials').toArray();
    if (!rawTrials || rawTrials.length === 0) return [];

    const mapped: ExternalFieldTrial[] = rawTrials.map((t: any) => {
      let ratings: any[] = [];
      try {
        if (typeof t.Ratings === 'string') ratings = JSON.parse(t.Ratings);
        else if (Array.isArray(t.Ratings)) ratings = t.Ratings;
      } catch (e) {
        ratings = [];
      }

      let photos: any[] = [];
      try {
        if (typeof t.PhotoURLs === 'string') photos = JSON.parse(t.PhotoURLs);
        else if (Array.isArray(t.PhotoURLs)) photos = t.PhotoURLs;
      } catch (e) {
        photos = [];
      }

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
        url: formatDriveImageUrl(p.driveUrl || p.url || p.fileData),
        thumbnailUrl: formatDriveImageUrl(p.thumbnailUrl || p.url || p.fileData),
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

function IndexedDBDatabaseExists(dbName: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!window.indexedDB || !window.indexedDB.databases) {
      resolve(true);
      return;
    }
    window.indexedDB.databases().then((dbs) => {
      const exists = dbs.some((db) => db.name === dbName);
      resolve(exists);
    }).catch(() => resolve(true));
  });
}

// ── 3. Fallback Seeds ──
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
