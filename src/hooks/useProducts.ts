import { useEffect, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { productsCollection } from '../services/db';
import type { Product } from '../services/db';

export const useProducts = () => {
  const [data, setData] = useState<Product[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If not using real firebase, skip subscription
    if (!import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'mock-api-key') {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(productsCollection, (snapshot) => {
      if (snapshot.empty) {
        setData([]);
      } else {
        setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching products realtime:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { data, isLoading };
};
