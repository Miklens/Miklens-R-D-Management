import { useEffect, useState } from 'react';
import { onSnapshot, collection } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { getUsers, subscribeToStoreChanges } from '../services/localStore';
import type { AppUser } from '../types';

/**
 * Returns all user/employee profiles.
 * Uses real Firestore `users` collection when configured, otherwise falls
 * back to the local persistent demo store so multi-user features (team
 * activity, employee directory) work without a Firebase project.
 */
export const useUsers = () => {
  const [data, setData] = useState<AppUser[]>(isFirebaseConfigured ? [] : getUsers());
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      const unsubscribe = subscribeToStoreChanges(() => setData(getUsers()));
      return unsubscribe;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        setData(snapshot.docs.map(d => {
          const raw = d.data() as any;
          const name = raw.Name || raw.name || raw.Username || (raw.email ? raw.email.split('@')[0] : '') || d.id;
          const email = raw.Username || raw.email || '';
          const role = raw.Role || raw.role || 'Scientist';
          return {
            id: d.id,
            name: name,
            email: email,
            role: role,
            designation: raw.Designation || `${role} (Trial Manager)`,
            department: raw.Department || 'Research & Development',
            skills: Array.isArray(raw.Skills) ? raw.Skills : ['Field Operations'],
            avatar: raw.Avatar || `https://i.pravatar.cc/150?u=${d.id}`,
            isActive: raw.IsActive !== false && raw.isActive !== false,
          } as AppUser;
        }));
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching users realtime:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { data, isLoading };
};
