import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { AppUser, Role } from '../types';

interface AuthContextType {
  currentUser: User | null;
  profile: AppUser | null;
  userRole: Role | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  profile: null,
  userRole: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Strict Security Alignment: Query Trial Manager's exact `users/{uid}` collection
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            const data = snap.data();
            
            // Check IsActive status exact to Trial Manager (IsActive === false -> Revoke Session)
            if (data.IsActive === false || data.isActive === false) {
              console.warn('[Security] User account is disabled in Trial Manager. Signing out.');
              await firebaseSignOut(auth);
              setCurrentUser(null);
              setProfile(null);
              setLoading(false);
              return;
            }

            const rawRole = (data.Role || data.role || 'Scientist').toString();
            let parsedRole: Role = 'Scientist';
            if (rawRole.toLowerCase().includes('admin') || rawRole.toLowerCase().includes('developer')) {
              parsedRole = 'Admin';
            } else if (rawRole.toLowerCase().includes('viewer') || rawRole.toLowerCase().includes('mgmt') || rawRole.toLowerCase().includes('management')) {
              parsedRole = 'Management';
            }

            setCurrentUser(user);
            setProfile({
              id: user.uid,
              name: data.Name || data.name || data.Username || user.email || 'User',
              email: data.Username || data.email || user.email || '',
              role: parsedRole,
              designation: data.Designation || `${data.Role || 'User'} (Trial Manager)`,
              department: data.Department || 'Research & Development',
              skills: Array.isArray(data.Skills) ? data.Skills : ['Trial Operations'],
              avatar: data.Avatar || `https://i.pravatar.cc/150?u=${user.uid}`,
              isActive: true,
            });
          } else {
            // If user exists in Firebase Auth but has no registered doc in `users/{uid}` in Trial Manager -> Deny Access
            console.warn('[Security] No user document in Trial Manager users collection. Signing out.');
            await firebaseSignOut(auth);
            setCurrentUser(null);
            setProfile(null);
          }
        } catch (err) {
          console.error('[Security] Failed to verify user profile from Trial Manager Firestore', err);
          setCurrentUser(null);
          setProfile(null);
        }
        setLoading(false);
        return;
      }

      // No active Firebase user
      setCurrentUser(null);
      setProfile(null);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    await firebaseSignOut(auth);
    setCurrentUser(null);
    setProfile(null);
  };

  const userRole = profile?.role || null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        userRole,
        loading,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
