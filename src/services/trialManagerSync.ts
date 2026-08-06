import { ExternalFieldTrial, TrialCategory, ExternalProject } from '../types/trialIntegrationTypes';
import Dexie from 'dexie';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query, where } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getUsers, saveUsers } from './localStore';
import { AppUser } from '../types';

const SYNC_STORAGE_KEY = 'miklens_rnd_synced_trials_v1';
const FIREBASE_CONFIG_KEY = 'miklens_rnd_firebase_config_v1';

export const formatCleanScientistName = (uIdOrEmail?: string): string => {
  if (!uIdOrEmail) return 'Pavan Dev';
  const target = uIdOrEmail.trim().toLowerCase();
  if (target.includes('pavan')) return 'Pavan Dev';
  if (target.includes('bindushree')) return 'Bindushree B U';
  if (target.includes('sandeep')) return 'Sandeep';
  if (target.includes('@')) {
    const handle = target.split('@')[0];
    const clean = handle.split('.')[0].split('_')[0];
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }
  return uIdOrEmail.split(/[\s._@]/).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
};

export const parseFlexibleDateStr = (dateStr?: any): string => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const s = String(dateStr).trim();

  // Handle DD-MM-YYYY or DD/MM/YYYY with optional time (e.g. 30-07-2026 11:03 AM)
  const ddmmyyyyMatch = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Handle YYYY-MM-DD
  const yyyymmddMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (yyyymmddMatch) {
    const [, year, month, day] = yyyymmddMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const dt = new Date(s);
  if (!isNaN(dt.getTime())) {
    return dt.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
};

export const parseFlexibleDateObj = (dateStr?: any): Date => {
  const iso = parseFlexibleDateStr(dateStr);
  return new Date(iso);
};

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
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.apiKey && parsed.projectId) return parsed;
    }
  } catch (e) {
    /* ignore parse error */
  }

  // Fallback to environment variables if configured
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (apiKey && projectId && apiKey !== 'mock-api-key' && !apiKey.includes('placeholder')) {
    return {
      apiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    };
  }

  return null;
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

// Derive trial category from Firestore `Category` field or fallback to collection name
const deriveCategoryFromCollectionOrField = (collectionName: string, dataCategory?: string): TrialCategory => {
  const validCategories: TrialCategory[] = ['herbicide', 'fungicide', 'pesticide', 'nutrition', 'biostimulant'];
  // Prefer the explicit Category field on the document
  if (dataCategory) {
    const normalized = dataCategory.toLowerCase().trim() as TrialCategory;
    if (validCategories.includes(normalized)) return normalized;
  }
  // Fallback: derive from collection name prefix (e.g. "fungicide_trials" → "fungicide")
  for (const cat of validCategories) {
    if (collectionName.startsWith(cat)) return cat;
  }
  // Bare "trials" collection = legacy herbicide
  return 'herbicide';
};

// Helper to format Drive image URLs — returns empty string if no real URL is available
const formatDriveImageUrl = (rawUrl?: string): string => {
  if (!rawUrl || rawUrl === '—' || rawUrl.trim() === '') {
    // No placeholder fallback — we only show real photos from Google Drive or Firebase Storage
    return '';
  }
  // Convert Google Drive view/open links into direct embeddable thumbnail links
  if (rawUrl.includes('drive.google.com') || rawUrl.includes('docs.google.com')) {
    const match = rawUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || rawUrl.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/u/0/d/${match[1]}=w800`;
    }
  }
  // Firebase Storage URLs, direct image URLs — pass through as-is
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
        }
      }
    } catch (uErr) {
      console.warn('[TrialManagerSync] Could not fetch live user directory:', uErr);
    }

    let allCloudDocs: { id: string; data: any; collection: string }[] = [];

    // Query across exact matching collection names from Cloud Firebase
    for (const colName of TARGET_COLLECTIONS) {
      try {
        const trialsRef = collection(firestore, colName);
        const snapshot = await getDocs(query(trialsRef, limit(500)));
        if (!snapshot.empty) {
          console.log(`[TrialManagerSync] Found ${snapshot.size} records in Cloud collection "${colName}"`);
          snapshot.docs.forEach(doc => {
            allCloudDocs.push({ id: doc.id, data: doc.data(), collection: colName });
          });
        }
      } catch (colErr: any) {
        // If collection fails (e.g. rules), attempt fallback to user-filtered query
        if (authUserUid) {
          try {
            const trialsRef = collection(firestore, colName);
            const q = query(trialsRef, where('CreatedBy', '==', authUserUid), limit(300));
            const snap = await getDocs(q);
            snap.docs.forEach(doc => {
              allCloudDocs.push({ id: doc.id, data: doc.data(), collection: colName });
            });
          } catch (e) {
            console.warn(`[TrialManagerSync] Collection "${colName}" query failed:`, colErr?.message);
          }
        } else {
          console.warn(`[TrialManagerSync] Collection "${colName}" fetch status:`, colErr?.message);
        }
      }
    }

    if (allCloudDocs.length === 0) {
      console.log('[TrialManagerSync] No cloud trials retrieved.');
      return [];
    }

    const cloudTrials: ExternalFieldTrial[] = allCloudDocs.map(item => {
      const data = item.data;
      const id = item.id;

      const title = data.TrialName || data.trialName || data.trial_name ||
                    data.FormulationName || data.formulationName || data.formulation_name ||
                    data.Title || data.title ||
                    data.Name || data.name ||
                    (data.Crop ? `${data.Crop} Field Trial` : (data.crop ? `${data.crop} Field Trial` : 'Crop Field Trial'));

      const crop = data.Crop || data.crop || data.CropName || data.cropName || 'Crop Field';
      const location = data.Location || data.location || data.GPS || data.gps || data.State || data.state || 'Research Farm Plot';

      const weedOrPathogen = data.WeedSpecies || data.weedSpecies || data.weed_species ||
                            data.DiseaseTarget || data.diseaseTarget || data.disease_target ||
                            data.TargetWeed || data.targetWeed || data.target_weed ||
                            data.TargetDisease || data.targetDisease || data.target_disease ||
                            data.PestTarget || data.pestTarget || data.pest_target ||
                            data.TargetWeedOrPathogen || data.targetWeedOrPathogen || data.target_weed_or_pathogen ||
                            'Target Disease / Weed';

      // ── Dynamic Scientist Ownership Resolution ──
      const creatorUid = data.CreatedBy || data.createdBy || data.userId || data.UID || data.uid || '';
      let resolvedUser = creatorUid ? userMap.get(creatorUid) : null;

      let rawSciName = data.Scientist || data.scientist || data.EvaluatedBy || data.evaluatedBy || data.User || data.user || (resolvedUser ? resolvedUser.name : '');
      const scientistName = formatCleanScientistName(rawSciName);

      let creatorEmail = data.UserEmail || data.userEmail || data.Username || data.username || data.User || data.user || data.email || (resolvedUser ? resolvedUser.email : '');
      if (!creatorEmail && creatorUid === authUserUid) {
        creatorEmail = authUserEmail || '';
      }

      const formulationCode = data.FormulationName || data.formulationName || data.formulation_name ||
                              data.FormulationCode || data.formulationCode || data.formulation_code ||
                              data.productName || data.product || data.Product ||
                              data.TrialName || data.trialName || data.trial_name ||
                              'Treatment Formulation';

      // Robust Ratings / Efficacy Observations extraction across all possible Firestore keys
      let rawRatingsData = data.EfficacyDataJSON || data.Ratings || data.observations || data.evaluations || data.ratings || [];
      let ratings: any[] = [];
      try {
        if (typeof rawRatingsData === 'string') ratings = JSON.parse(rawRatingsData);
        else if (Array.isArray(rawRatingsData)) ratings = rawRatingsData;
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
        const rawLastEff = last.WCE ?? last.Efficacy ?? last.efficacyPercent ?? last.controlPct ?? last.weedCover ?? last.diseaseSeverity ?? last.pestCount ?? last.visualVigor ?? last.Control ?? '0';
        latestEfficacy = parseFloat(String(rawLastEff)) || 0;
        const rawLastPhyto = last.Phytotoxicity ?? last.phytotoxicityScore ?? last.phytotoxicity ?? '0';
        latestPhytotox = parseFloat(String(rawLastPhyto)) || 0;
        notesStr = last.Notes || last.notes || last.ObsNotes || last.Observation || notesStr;
      }

      const formattedPhotos = photos
        .map((p: any, idx: number) => {
          const rawUrl = p.driveUrl || p.url || p.fileData || p.PhotoURL;
          const resolvedUrl = formatDriveImageUrl(rawUrl);
          return {
            id: p.id || `photo-${idx}`,
            url: resolvedUrl,
            thumbnailUrl: formatDriveImageUrl(p.thumbnailUrl || rawUrl) || resolvedUrl,
            caption: p.caption || p.label || p.fileName || `Field Photo ${p.date || idx + 1}`,
            takenAt: parseFlexibleDateStr(p.date || data.Date),
            treatmentName: p.treatment || formulationCode || 'Treatment Plot',
          };
        })
        .filter(p => p.url && p.url.length > 0);

      const category = deriveCategoryFromCollectionOrField(item.collection, data.Category || data.category);

      return {
        id: String(id),
        trialCode: data.TrialCode || data.Code || `TR-${id.slice(0, 8)}`,
        title: title,
        category,
        cropName: crop,
        location: location,
        state: data.State || 'India',
        targetWeedOrPathogen: weedOrPathogen,
        designType: (data.DesignType || data.Replication ? 'RCBD' : 'CRD') as any,
        scientistName: scientistName,
        creatorUid: creatorUid,
        creatorEmail: creatorEmail,
        startDate: parseFlexibleDateStr(data.Date || data.startDate),
        status: (data.IsCompleted === true || data.IsCompleted === 'true' || data.Status === 'Completed') ? 'Completed' : ((data.Status || 'Active') as any),
        productName: formulationCode,
        dosage: data.Dosage || data.DoseRate || '40ml/l',
        resultRating: data.Result || data.resultRating || (latestEfficacy >= 80 ? 'Excellent' : latestEfficacy >= 60 ? 'Good' : latestEfficacy >= 40 ? 'Fair' : 'Unrated'),
        lat: data.Lat || data.lat || '',
        lon: data.Lon || data.lon || '',
        projectId: data.ProjectID || data.projectId || '',
        isCompleted: data.IsCompleted === true || data.IsCompleted === 'true',
        isControl: data.IsControl === true || data.IsControl === 'true',
        isBaseline: ratings.some((r: any) => Number(r.DAT || r.daa || 0) === 0),
        isLive: String(data.IsLive) !== 'false',
        rawDateStr: data.Date || data.startDate || '',
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
        evaluations: ratings.map((r: any, rIdx: number) => {
          const rawEff = r.WCE ?? r.Efficacy ?? r.efficacyPercent ?? r.controlPct ?? r.weedCover ?? r.diseaseSeverity ?? r.pestCount ?? r.visualVigor ?? r.Control ?? '0';
          const effVal = parseFloat(String(rawEff)) || 0;
          const rawPhyto = r.Phytotoxicity ?? r.phytotoxicityScore ?? r.phytotoxicity ?? '0';
          const phytoVal = parseFloat(String(rawPhyto)) || 0;
          const rawDaa = r.daa ?? r.DAT ?? r.daysAfterTreatment ?? (rIdx * 7);
          const daaVal = parseInt(String(rawDaa), 10) || 0;
          const rawEvDate = r.date || r.Date || r.evalDate || data.Date || data.startDate;

          return {
            id: `eval-${rIdx}`,
            evalDate: parseFlexibleDateStr(rawEvDate),
            daysAfterTreatment: daaVal,
            efficacyPercent: effVal,
            phytotoxicityScore: phytoVal,
            weedOrPathogenControlPercent: effVal,
            notes: r.notes || r.Notes || r.ObsNotes || r.phytotoxicityNotes || 'Evaluation recorded',
            evaluatedBy: formatCleanScientistName(r.Evaluator || r.evaluatedBy || scientistName),
          };
        }),
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

      // Derive category from IndexedDB record's Category field
      const idbCategory = deriveCategoryFromCollectionOrField('trials', t.Category || t.category);

      const title = t.TrialName || t.trialName || t.trial_name ||
                    t.FormulationName || t.formulationName || t.formulation_name ||
                    t.Title || t.title || t.Name || t.name ||
                    (t.Crop ? `${t.Crop} Field Trial` : (t.crop ? `${t.crop} Field Trial` : 'Crop Field Trial'));

      const crop = t.Crop || t.crop || t.CropName || t.cropName || 'Crop Field';
      const location = t.Location || t.location || t.GPS || t.gps || t.State || t.state || 'Research Farm Plot';

      const weedOrPathogen = t.WeedSpecies || t.weedSpecies || t.weed_species ||
                            t.DiseaseTarget || t.diseaseTarget || t.disease_target ||
                            t.TargetWeed || t.targetWeed || t.target_weed ||
                            t.TargetDisease || t.targetDisease || t.target_disease ||
                            t.PestTarget || t.pestTarget || t.pest_target ||
                            t.TargetWeedOrPathogen || t.targetWeedOrPathogen || t.target_weed_or_pathogen ||
                            'Target Disease / Weed';

      const scientistName = t.Scientist || t.scientist || t.EvaluatedBy || t.evaluatedBy || t.User || t.user || 'Agronomist';
      const creatorUid = t.CreatedBy || t.createdBy || t.userId || t.UID || t.uid || '';
      const creatorEmail = t.UserEmail || t.userEmail || t.Username || t.username || t.User || t.user || t.email || '';

      const formulationCode = t.FormulationName || t.formulationName || t.formulation_name ||
                              t.FormulationCode || t.formulationCode || t.formulation_code ||
                              t.productName || t.product || t.Product ||
                              t.TrialName || t.trialName || t.trial_name ||
                              'Treatment Formulation';

      return {
        id: String(t.ID || t.id || `trial-${Date.now()}`),
        trialCode: t.TrialCode || t.Code || `TR-${t.ID || '2026'}`,
        title: title,
        category: idbCategory,
        cropName: crop,
        location: location,
        state: t.State || t.state || 'India',
        targetWeedOrPathogen: weedOrPathogen,
        designType: (t.DesignType || 'RCBD') as any,
        scientistName: scientistName,
        creatorUid: creatorUid,
        creatorEmail: creatorEmail,
        startDate: t.Date || t.startDate || new Date().toISOString().split('T')[0],
        status: (t.IsCompleted === true || t.IsCompleted === 'true' || t.Status === 'Completed') ? 'Completed' : ((t.Status || 'Active') as any),
        productName: formulationCode,
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

// ── Projects Synced Storage Helpers ──
const PROJECTS_SYNC_STORAGE_KEY = 'miklens_rnd_synced_projects_v1';
const PROJECT_COLLECTIONS = [
  'projects',
  'fungicide_projects',
  'pesticide_projects',
  'nutrition_projects',
  'biostimulant_projects'
];

export const getSyncedProjects = (): ExternalProject[] => {
  try {
    const raw = localStorage.getItem(PROJECTS_SYNC_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
};

export const saveSyncedProjectsList = (projects: ExternalProject[]): void => {
  try {
    localStorage.setItem(PROJECTS_SYNC_STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to cache synced projects:', e);
  }
};

export const fetchProjectsFromFirebaseCloud = async (config: FirebaseConnectionConfig): Promise<ExternalProject[]> => {
  try {
    let app;
    const existingApps = getApps();
    const existing = existingApps.find(a => a.options.projectId === config.projectId);
    if (existing) {
      app = existing;
    } else {
      app = initializeApp(config, `trialManagerProjects-${Date.now()}`);
    }

    const firestore = getFirestore(app);
    console.log('[TrialManagerSync] Querying Firebase Cloud project collections:', PROJECT_COLLECTIONS);

    let allCloudProjects: { id: string; data: any; collection: string }[] = [];

    for (const colName of PROJECT_COLLECTIONS) {
      try {
        const projRef = collection(firestore, colName);
        const snapshot = await getDocs(query(projRef, limit(300)));
        if (!snapshot.empty) {
          console.log(`[TrialManagerSync] Found ${snapshot.size} records in Cloud collection "${colName}"`);
          snapshot.docs.forEach(doc => {
            allCloudProjects.push({ id: doc.id, data: doc.data(), collection: colName });
          });
        }
      } catch (colErr: any) {
        console.warn(`[TrialManagerSync] Collection "${colName}" fetch failed:`, colErr?.message);
      }
    }

    const mappedProjects: ExternalProject[] = allCloudProjects.map(item => {
      const data = item.data;
      const id = item.id;
      const category = deriveCategoryFromCollectionOrField(item.collection, data.Category || data.category);

      return {
        id: String(id),
        name: data.Name || data.name || 'Unnamed Project',
        code: data.Code || data.code || `PR-${id.slice(0, 8)}`,
        category,
        leadScientistUid: data.leadScientistUid || data.CreatedBy || '',
        leadScientistName: data.leadScientistName || data.ScientistName || data.InvestigatorName || 'Lead Scientist',
        startDate: data.StartDate || data.startDate || '',
        targetEndDate: data.TargetEndDate || data.targetEndDate || '',
        status: data.Status || data.status || 'Active',
        description: data.Description || data.description || '',
        targetWeedsPathogens: data.TargetWeeds || data.targetWeeds || [],
        targetCrops: data.TargetCrops || data.targetCrops || [],
      };
    });

    return mappedProjects;
  } catch (err: any) {
    console.error('[TrialManagerSync] Cloud Firebase projects fetch error:', err);
    return [];
  }
};

// ── Formulations Synced Storage Helpers ──
export interface ExternalFormulation {
  id: string;
  name: string;
  category: string;
  stage: string;
  status: string;
  progress: number;
  teamSize: number;
  lastUpdate: string;
}

const FORMULATIONS_SYNC_STORAGE_KEY = 'miklens_rnd_synced_formulations_v1';
const FORMULATION_COLLECTIONS = [
  'formulations',
  'fungicide_formulations',
  'pesticide_formulations',
  'nutrition_formulations',
  'biostimulant_formulations'
];

export const getSyncedFormulations = (): ExternalFormulation[] => {
  try {
    const raw = localStorage.getItem(FORMULATIONS_SYNC_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
};

export const saveSyncedFormulationsList = (formulations: ExternalFormulation[]): void => {
  try {
    localStorage.setItem(FORMULATIONS_SYNC_STORAGE_KEY, JSON.stringify(formulations));
  } catch (e) {
    console.error('Failed to cache synced formulations:', e);
  }
};

export const fetchFormulationsFromFirebaseCloud = async (config: FirebaseConnectionConfig): Promise<ExternalFormulation[]> => {
  try {
    let app;
    const existingApps = getApps();
    const existing = existingApps.find(a => a.options.projectId === config.projectId);
    if (existing) {
      app = existing;
    } else {
      app = initializeApp(config, `trialManagerFormulations-${Date.now()}`);
    }

    const firestore = getFirestore(app);
    console.log('[TrialManagerSync] Querying Firebase Cloud formulation collections:', FORMULATION_COLLECTIONS);

    let allCloudFormulations: { id: string; data: any; collection: string }[] = [];

    for (const colName of FORMULATION_COLLECTIONS) {
      try {
        const formRef = collection(firestore, colName);
        const snapshot = await getDocs(query(formRef, limit(300)));
        if (!snapshot.empty) {
          console.log(`[TrialManagerSync] Found ${snapshot.size} records in Cloud collection "${colName}"`);
          snapshot.docs.forEach(doc => {
            allCloudFormulations.push({ id: doc.id, data: doc.data(), collection: colName });
          });
        }
      } catch (colErr: any) {
        console.warn(`[TrialManagerSync] Collection "${colName}" fetch failed:`, colErr?.message);
      }
    }

    const mappedFormulations: ExternalFormulation[] = allCloudFormulations.map(item => {
      const data = item.data;
      const id = item.id;
      const category = deriveCategoryFromCollectionOrField(item.collection, data.Category || data.category);

      return {
        id: String(id),
        name: data.Name || data.name || data.FormulationCode || 'Unnamed Formulation',
        category: category.toUpperCase(),
        stage: data.Stage || data.stage || 'Lab Testing',
        status: data.Status || data.status || 'Active',
        progress: data.Progress || data.progress || 15,
        teamSize: data.TeamSize || data.teamSize || 2,
        lastUpdate: data.LastUpdate || data.lastUpdate || 'Synced'
      };
    });

    return mappedFormulations;
  } catch (err: any) {
    console.error('[TrialManagerSync] Cloud Firebase formulations fetch error:', err);
    return [];
  }
};
