import { ExternalFieldTrial } from '../types/trialIntegrationTypes';
import Dexie from 'dexie';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getUsers, saveUsers } from './localStore';
import { AppUser } from '../types';

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

    let authUserUid: string | null = null;
    let authUserEmail: string | null = config.email || null;

    // Authenticate if email and password are provided
    if (config.email && config.password) {
      try {
        const auth = getAuth(app);
        let user = auth.currentUser;
        if (!user) {
          console.log(`[TrialManagerSync] Authenticating as ${config.email}...`);
          const cred = await signInWithEmailAndPassword(auth, config.email, config.password);
          user = cred.user;
          console.log('[TrialManagerSync] Firebase Auth Success!');
        }
        if (user) {
          authUserUid = user.uid;
          authUserEmail = user.email || config.email;
        }
      } catch (authErr: any) {
        console.warn('[TrialManagerSync] Auth warning:', authErr?.message);
        throw new Error(`Firebase Auth Failed: ${authErr?.message || 'Check Email & Password'}`);
      }
    }

    const firestore = getFirestore(app);
    console.log('[TrialManagerSync] Querying Firebase Cloud collections:', TARGET_COLLECTIONS);

    // Dynamic Live User Directory Sync (Firestore users collection -> App Users)
    const userMap = new Map<string, { name: string; email: string; role: string }>();
    try {
      const usersRef = collection(firestore, 'users');
      const usersSnap = await getDocs(query(usersRef, limit(300)));
      if (!usersSnap.empty) {
        const fetchedAppUsers: AppUser[] = [];

        usersSnap.docs.forEach(uDoc => {
          const uData = uDoc.data();
          const uName = uData.Name || uData.name || uData.Username || uData.email || uDoc.id;
          const uEmail = uData.Username || uData.email || '';
          const uRole = uData.Role || uData.role || 'Scientist';
          const isActive = uData.IsActive !== false;

          userMap.set(uDoc.id, { name: uName, email: uEmail, role: uRole });

          if (uEmail && isActive) {
            fetchedAppUsers.push({
              id: uDoc.id,
              name: uName,
              email: uEmail,
              role: (uRole.toLowerCase().includes('admin') ? 'Admin' : uRole.toLowerCase().includes('viewer') ? 'Management' : 'Scientist') as any,
              designation: `${uRole} (Synced from Trial Manager)`,
              department: 'Field Operations',
              skills: ['Trial Management', 'Field Efficacy'],
              avatar: `https://i.pravatar.cc/150?u=${uDoc.id}`,
              isActive: true,
            });
          }
        });

        // Merge fetched cloud users into active localStore so no hardcoding exists
        if (fetchedAppUsers.length > 0) {
          const currentUsers = getUsers();
          const mergedUsers = [...currentUsers];

          fetchedAppUsers.forEach(nu => {
            const existingIdx = mergedUsers.findIndex(u => u.email.toLowerCase() === nu.email.toLowerCase() || u.id === nu.id);
            if (existingIdx !== -1) {
              mergedUsers[existingIdx] = { ...mergedUsers[existingIdx], ...nu };
            } else {
              mergedUsers.push(nu);
            }
          });

          saveUsers(mergedUsers);
          console.log(`[TrialManagerSync] Dynamically registered ${fetchedAppUsers.length} users from Trial Manager Firestore!`);
        }
      }
    } catch (uErr) {
      console.warn('[TrialManagerSync] Could not fetch live user directory:', uErr);
    }

    let allCloudDocs: { id: string; data: any }[] = [];

    // Query across exact matching collection names
    for (const colName of TARGET_COLLECTIONS) {
      try {
        const trialsRef = collection(firestore, colName);
        const snapshot = await getDocs(query(trialsRef, limit(300)));
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

      const title = data.Title || data.title || data.Name || data.name || (data.Crop ? `${data.Crop} Field Trial` : 'Crop Field Trial');
      const crop = data.Crop || data.crop || data.CropName || 'Crop Field';
      const location = data.Location || data.location || data.GPS || data.State || 'Research Farm Plot';
      const weedOrPathogen = data.WeedSpecies || data.DiseaseTarget || data.TargetWeed || data.TargetDisease || data.PestTarget || data.TargetWeedOrPathogen || 'Target Disease / Weed';

      // ── Dynamic Scientist Ownership Resolution ──
      const creatorUid = data.CreatedBy || data.userId || data.UID || data.uid || '';
      let resolvedUser = creatorUid ? userMap.get(creatorUid) : null;

      let scientistName = data.Scientist || data.EvaluatedBy || data.User || (resolvedUser ? resolvedUser.name : '');
      if (!scientistName || scientistName.length > 25) {
        scientistName = resolvedUser ? resolvedUser.name : (authUserEmail ? authUserEmail.split('@')[0] : 'Agronomist');
      }

      let creatorEmail = data.UserEmail || data.Username || data.User || data.email || (resolvedUser ? resolvedUser.email : '');
      if (!creatorEmail && creatorUid === authUserUid) {
        creatorEmail = authUserEmail || '';
      }

      const formulationCode = data.FormulationCode || data.productName || data.Product || 'Treatment Formulation';

      let ratings: any[] = [];
      try {
        if (typeof data.Ratings === 'string') ratings = JSON.parse(data.Ratings);
        else if (Array.isArray(data.Ratings)) ratings = data.Ratings;
        else if (Array.isArray(data.evaluations)) ratings = data.evaluations;
      } catch (e) {
        ratings = [];
      }

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
        scientistName: scientistName,
        creatorUid: creatorUid,
        creatorEmail: creatorEmail,
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
          evaluatedBy: r.Evaluator || scientistName,
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
        creatorUid: t.CreatedBy || t.userId || '',
        creatorEmail: t.UserEmail || t.Username || '',
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
          evaluatedBy: r.Evaluator || 'Agronomist',
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

export const getSyncedTrials = (): ExternalFieldTrial[] => {
  try {
    const raw = localStorage.getItem(SYNC_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
};

export const saveSyncedTrialsList = (trials: ExternalFieldTrial[]): void => {
  try {
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(trials));
  } catch (e) {
    console.error('Failed to cache synced trials:', e);
  }
};
