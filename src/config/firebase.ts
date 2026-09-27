import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import { logger } from '../utils/logger';

/**
 * FIREBASE CONFIGURATION
 * Load credentials from environment variables.
 * See .env.example for required variables.
 */

interface FirebaseConfigType {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const getResolvedFirebaseConfig = (): FirebaseConfigType => {
  // 1. Check environment variables
  const envKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const envProj = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (envKey && envProj && envKey !== 'mock-api-key' && !envKey.includes('your-') && !envKey.includes('placeholder')) {
    return {
      apiKey: envKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: envProj,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
  }

  // 2. Check saved credentials in localStorage (from Trial Manager sync or Settings)
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('miklens_rnd_firebase_config_v1') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.apiKey && parsed.projectId && !parsed.apiKey.includes('placeholder')) {
        return {
          apiKey: parsed.apiKey,
          authDomain: parsed.authDomain || `${parsed.projectId}.firebaseapp.com`,
          projectId: parsed.projectId,
          storageBucket: parsed.storageBucket || `${parsed.projectId}.appspot.com`,
          messagingSenderId: parsed.messagingSenderId || '',
          appId: parsed.appId || '',
        };
      }
    }
  } catch {
    // Ignore storage parse error
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
};

const firebaseConfig: FirebaseConfigType = getResolvedFirebaseConfig();

/**
 * Validate Firebase configuration
 */
const checkFirebaseConfigured = (): boolean => {
  const val = firebaseConfig.apiKey;
  const proj = firebaseConfig.projectId;
  const configured = !!val && !!proj && val !== 'mock-api-key' && !val.includes('your-') && !val.includes('placeholder');

  if (!configured) {
    logger.warn(
      'Firebase not properly configured or using mock keys. Offline/Demo mode active.',
      { module: 'Firebase', action: 'init' }
    );
  }
  
  return configured;
};

// Pre-compute configuration status at module load time
export const isFirebaseConfigured = checkFirebaseConfigured();

// Initialize Firebase only if configured
let app: ReturnType<typeof initializeApp> | null = null;
let auth: any = null;
let db: any = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);

    // Modern Firestore v11 multi-tab persistence configuration
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
      logger.info('Firestore multi-tab persistence enabled', { module: 'Firebase' });
    } catch {
      db = getFirestore(app);
    }

    logger.info('Firebase initialized successfully', { module: 'Firebase' });
  } catch (error) {
    logger.error('Failed to initialize Firebase', error, { module: 'Firebase' });
  }
} else {
  logger.warn(
    'Firebase not configured. Running in offline-only mode. See .env.example for setup.',
    { module: 'Firebase' }
  );
}

export { auth, db };
export const isFirebaseReady = isFirebaseConfigured;
