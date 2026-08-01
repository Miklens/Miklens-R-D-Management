import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { AppUser, Role } from '../types';
import { mapTrialManagerRoleToRndRole } from '../utils/roleAdapter';

interface AuthContextType {
  currentUser: User | null;
  profile: AppUser | null;
  userRole: Role | null;
  trialManagerRole: string | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  profile: null,
  userRole: null,
  trialManagerRole: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [trialManagerRole, setTrialManagerRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Query Trial Manager's exact `users/{uid}` collection
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            const data = snap.data();
            
            // Account Disabled Check (IsActive === false)
            if (data.IsActive === false || data.isActive === false) {
              console.warn('[Security] Account disabled in Trial Manager. Revoking session.');
              await firebaseSignOut(auth);
              setCurrentUser(null);
              setProfile(null);
              setTrialManagerRole(null);
              setLoading(false);
              return;
            }

            const rawTmRole = (data.Role || data.role || 'USER').toString();
            const mappedRndRole = mapTrialManagerRoleToRndRole(rawTmRole);

            setCurrentUser(user);
            setTrialManagerRole(rawTmRole);
            setProfile({
              id: user.uid,
              name: data.Name || data.name || data.Username || user.email || 'User',
              email: data.Username || data.email || user.email || '',
              role: mappedRndRole,
              trialManagerRole: rawTmRole,
              designation: data.Designation || `${rawTmRole} (Trial Manager)`,
              department: data.Department || 'Research & Development',
              skills: Array.isArray(data.Skills) ? data.Skills : ['Trial Operations'],
              avatar: data.Avatar || `https://i.pravatar.cc/150?u=${user.uid}`,
              isActive: true,
            } as any);
          } else {
            console.warn('[Security] User document missing in Trial Manager users collection.');
            await firebaseSignOut(auth);
            setCurrentUser(null);
            setProfile(null);
            setTrialManagerRole(null);
          }
        } catch (err) {
          console.error('[Security] Error reading Trial Manager user profile:', err);
          setCurrentUser(null);
          setProfile(null);
          setTrialManagerRole(null);
        }
        setLoading(false);
        return;
      }

      setCurrentUser(null);
      setProfile(null);
      setTrialManagerRole(null);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    await firebaseSignOut(auth);
    setCurrentUser(null);
    setProfile(null);
    setTrialManagerRole(null);
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
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
