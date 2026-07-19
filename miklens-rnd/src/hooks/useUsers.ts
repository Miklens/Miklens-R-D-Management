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
        setData(snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Omit<AppUser, 'id'>) })));
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
