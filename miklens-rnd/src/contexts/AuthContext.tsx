import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../config/firebase';
import type { AppUser, Role } from '../types';
import { getUserById } from '../services/localStore';

const DEMO_SESSION_KEY = 'miklens_demo_user_id';

interface AuthContextType {
  currentUser: User | null;
  profile: AppUser | null;
  userRole: Role | null;
  loading: boolean;
  isDemoMode: boolean;
  loginAsDemo: (userId: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  profile: null,
  userRole: null,
  loading: true,
  isDemoMode: false,
  loginAsDemo: () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Real Firebase user - resolve role/profile from Firestore `users/{uid}`
        // as documented in docs/DATABASE.md. Falls back to Scientist if the
        // profile document hasn't been provisioned yet.
        setCurrentUser(user);
        setIsDemoMode(false);
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            setProfile({ id: user.uid, ...(snap.data() as Omit<AppUser, 'id'>) });
          } else {
            setProfile({
              id: user.uid,
              name: user.displayName || user.email || 'User',
              email: user.email || '',
              role: 'Scientist',
              designation: '',
              department: '',
              skills: [],
              isActive: true,
            });
          }
        } catch (err) {
          console.error('Failed to load user profile from Firestore', err);
          setProfile(null);
        }
        setLoading(false);
        return;
      }

      // No real Firebase user - check for an active local demo session.
      const demoUserId = sessionStorage.getItem(DEMO_SESSION_KEY);
      if (demoUserId) {
        const demoProfile = getUserById(demoUserId);
        if (demoProfile) {
          setCurrentUser({ email: demoProfile.email, uid: demoProfile.id } as User);
          setProfile(demoProfile);
          setIsDemoMode(true);
          setLoading(false);
          return;
        }
      }

      setCurrentUser(null);
      setProfile(null);
      setIsDemoMode(false);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Log in as one of the seeded demo accounts (Admin / Management / Scientist).
  // Used when Firebase isn't configured yet, so multi-role behavior can still
  // be exercised end-to-end.
  const loginAsDemo = (userId: string) => {
    const demoProfile = getUserById(userId);
    if (!demoProfile) return;
    sessionStorage.setItem(DEMO_SESSION_KEY, userId);
    setCurrentUser({ email: demoProfile.email, uid: demoProfile.id } as User);
    setProfile(demoProfile);
    setIsDemoMode(true);
  };

  const logout = async () => {
    sessionStorage.removeItem(DEMO_SESSION_KEY);
    setCurrentUser(null);
    setProfile(null);
    setIsDemoMode(false);
    if (isFirebaseConfigured) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.error('Failed to sign out', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        userRole: profile?.role ?? null,
        loading,
        isDemoMode,
        loginAsDemo,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
