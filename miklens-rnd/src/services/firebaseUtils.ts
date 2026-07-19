// Firebase utility functions - abstracts Firestore imports
import { db } from '../config/firebase';
import { 
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  startAfter,
  Timestamp
} from 'firebase/firestore';

// Re-export functions for use throughout the app
export {
  db,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  startAfter,
  Timestamp
};

// Helper to convert Firestore timestamp to Date
export const timestampToDate = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp.toDate) return timestamp.toDate();
  if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
  return new Date(timestamp);
};

// Helper to convert Date to Firestore timestamp
export const dateToTimestamp = (date: Date | string): any => {
  if (!date) return Timestamp.now();
  const d = typeof date === 'string' ? new Date(date) : date;
  return Timestamp.fromDate(d);
};