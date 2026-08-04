import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseReady } from '../config/firebase';
import type { AppUser, Role } from '../types';
import { mapTrialManagerRoleToRndRole } from '../utils/roleAdapter';
import { logger } from '../utils/logger';

interface AuthContextType {
  currentUser: User | null;
  profile: AppUser | null;
  userRole: Role | null;
  trialManagerRole: string | null;
  loading: boolean;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  profile: null,
  userRole: null,
  trialManagerRole: null,
  loading: true,
  logout: async () => {},
  error: null,
});

export const useAuth = () => useContext(AuthContext);

/**
 * Create default user profile
 */
const createDefaultProfile = (user: User): AppUser => {
  const email = user.email || '';
  const nameFromEmail = email.split('@')[0] || 'User';

  return {
    id: user.uid,
    name: nameFromEmail,
    email,
    role: 'Scientist',
    trialManagerRole: 'User',
    designation: 'R&D Scientist',
    department: 'Research & Development',
    skills: ['Field Operations', 'R&D Research'],
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
    isActive: true,
  } as any;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [trialManagerRole, setTrialManagerRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      logger.warn('Firebase Auth not initialized', { module: 'AuthProvider' });
      setLoading(false);
      setError('Firebase not configured. Running in offline mode.');
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        try {
          setError(null);

          if (user) {
            logger.logAuthEvent('login', user.uid);

            // If Firebase is not configured, create default profile
            if (!isFirebaseReady || !db) {
              logger.warn('Firestore not available, using default profile', {
                module: 'AuthProvider',
              });
              setCurrentUser(user);
              setTrialManagerRole('User');
              setProfile(createDefaultProfile(user));
              setLoading(false);
              return;
            }

            try {
              // Query Trial Manager's exact `users/{uid}` collection
              logger.debug('Fetching user profile from Firestore', {
                module: 'AuthProvider',
                userId: user.uid,
              });

              const snap = await getDoc(doc(db, 'users', user.uid));

              if (snap.exists()) {
                const data = snap.data();

                // Account Disabled Check (IsActive === false)
                if (data.IsActive === false || data.isActive === false) {
                  logger.warn('Account disabled in Trial Manager. Revoking session.', {
                    module: 'AuthProvider',
                    userId: user.uid,
                  });
                  await firebaseSignOut(auth);
                  setCurrentUser(null);
                  setProfile(null);
                  setTrialManagerRole(null);
                  setError('Your account has been disabled. Please contact support.');
                  setLoading(false);
                  return;
                }

                const rawTmRole = (data.Role || data.role || 'USER').toString();
                const mappedRndRole = mapTrialManagerRoleToRndRole(rawTmRole);

                const profileData = {
                  id: user.uid,
                  name: data.Name || data.name || data.Username || user.email?.split('@')[0] || 'User',
                  email: data.Username || data.email || user.email || '',
                  role: mappedRndRole,
                  trialManagerRole: rawTmRole,
                  designation: data.Designation || `${rawTmRole} (Trial Manager)`,
                  department: data.Department || 'Research & Development',
                  skills: Array.isArray(data.Skills) ? data.Skills : ['Trial Operations'],
                  avatar: data.Avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
                  isActive: true,
                } as any;

                setCurrentUser(user);
                setTrialManagerRole(rawTmRole);
                setProfile(profileData);

                logger.info('User profile loaded successfully', {
                  module: 'AuthProvider',
                  userId: user.uid,
                  action: 'profile-loaded',
                });
              } else {
                // Default user profile fallback for any valid Firebase Auth account
                logger.info('User profile not found in Firestore, using default', {
                  module: 'AuthProvider',
                  userId: user.uid,
                });
                setCurrentUser(user);
                setTrialManagerRole('User');
                setProfile(createDefaultProfile(user));
              }
            } catch (firestoreErr: unknown) {
              logger.warn('Failed to fetch Firestore profile, using default', 
                firestoreErr instanceof Error ? firestoreErr : new Error(String(firestoreErr)), 
                {
                  module: 'AuthProvider',
                  action: 'firestore-fetch-failed',
                  userId: user.uid,
                }
              );
              // Still permit authenticated session with default profile
              setCurrentUser(user);
              setTrialManagerRole('User');
              setProfile(createDefaultProfile(user));
            }
          } else {
            // User logged out
            logger.logAuthEvent('logout');
            setCurrentUser(null);
            setProfile(null);
            setTrialManagerRole(null);
          }
        } catch (err) {
          logger.error('Auth state change error', err, { module: 'AuthProvider' });
          setError('An authentication error occurred. Please refresh the page.');
        } finally {
          setLoading(false);
        }
      },
      (authErr) => {
        logger.error('Auth listener error', authErr, { module: 'AuthProvider' });
        setError('Authentication service unavailable.');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      if (auth) {
        await firebaseSignOut(auth);
      }
      logger.logAuthEvent('logout');
      setCurrentUser(null);
      setProfile(null);
      setTrialManagerRole(null);
      setError(null);
    } catch (err) {
      logger.error('Logout failed', err, { module: 'AuthProvider' });
      setError('Failed to logout. Please try again.');
    }
  };

  const userRole = profile?.role || null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        userRole,
        trialManagerRole,
        loading,
        logout,
        error,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
