import { useEffect, useState } from 'react';
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { getLogs, subscribeToStoreChanges } from '../services/localStore';
import type { DailyLog } from '../types';

/**
 * Returns all daily research logs across every scientist.
 * This is the read side of the "management can see scientist activity"
 * requirement - previously logs could only be written, never read back.
 * Uses real Firestore `daily_logs` when configured, else the local store.
 */
export const useDailyLogs = () => {
  const [data, setData] = useState<DailyLog[]>(isFirebaseConfigured ? [] : getLogs());
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      const unsubscribe = subscribeToStoreChanges(() => setData(getLogs()));
      return unsubscribe;
    }

    const q = query(collection(db, 'daily_logs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setData(snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Omit<DailyLog, 'id'>) })));
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching daily logs realtime:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { data, isLoading };
};
