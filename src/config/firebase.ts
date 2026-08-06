import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
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

const firebaseConfig: FirebaseConfigType = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * Validate Firebase configuration
 */
const checkFirebaseConfigured = (): boolean => {
  const requiredKeys = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ] as const;

  const configured = requiredKeys.every(key => {
    const val = firebaseConfig[key];
    return (
      !!val &&
      val !== 'mock-api-key' &&
      !val.includes('your-') &&
      !val.includes('placeholder')
    );
  });

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
    db = getFirestore(app);

    // Enable offline persistence
    enableIndexedDbPersistence(db)
      .then(() => {
        logger.info('Firestore offline persistence enabled', { module: 'Firebase' });
      })
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          logger.warn(
            'Multiple tabs open, persistence enabled in one tab only',
            { module: 'Firebase' }
          );
        } else if (err.code === 'unimplemented') {
          logger.warn(
            'Browser does not support all features required for persistence',
            { module: 'Firebase' }
          );
        } else {
          logger.error('Failed to enable persistence', err, { module: 'Firebase' });
        }
      });

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
