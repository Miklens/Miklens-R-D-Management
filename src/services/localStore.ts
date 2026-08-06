import type { AppUser, DailyLog } from '../types';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';

const USERS_KEY = 'miklens_users_v4';
const LOGS_KEY = 'miklens_daily_logs_v4';

// Clear stale v3 keys that may contain old BioShield Alpha demo session data
try {
  localStorage.removeItem('miklens_users_v3');
  localStorage.removeItem('miklens_daily_logs_v3');
} catch { /* ignore */ }

// ── Initial fallback store seed (Will be dynamically updated from Firestore `users` collection) ──
const INITIAL_USERS: AppUser[] = [];
const INITIAL_LOGS: DailyLog[] = [];

// Simple in-memory listeners array for store changes
type Listener = () => void;
const listeners: Set<Listener> = new Set();

export const subscribeToStoreChanges = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notifyListeners = () => {
  listeners.forEach(l => l());
};

export const getUsers = (): AppUser[] => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  } catch (err) {
    return INITIAL_USERS;
  }
};

export const saveUsers = (users: AppUser[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  notifyListeners();
};

export const getUserById = (id: string): AppUser | undefined => {
  return getUsers().find(u => u.id === id);
};

export const getUserByEmail = (email: string): AppUser | undefined => {
  const clean = email.toLowerCase().trim();
  return getUsers().find(u => u.email.toLowerCase().trim() === clean);
};

export const addUser = (user: Omit<AppUser, 'id'>): AppUser => {
  const users = getUsers();
  const newUser: AppUser = {
    ...user,
    id: `user-${Date.now()}`,
  };
  saveUsers([newUser, ...users]);
  return newUser;
};

export const updateUser = (id: string, updates: Partial<AppUser>): AppUser => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) throw new Error('User not found');
  const updated = { ...users[index], ...updates };
  users[index] = updated;
  saveUsers(users);
  return updated;
};

export const getDailyLogs = (): DailyLog[] => {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    if (!raw) {
      localStorage.setItem(LOGS_KEY, JSON.stringify(INITIAL_LOGS));
      return INITIAL_LOGS;
    }
    return JSON.parse(raw);
  } catch (err) {
    return INITIAL_LOGS;
  }
};

export const getLogs = getDailyLogs;

export const saveDailyLogs = (logs: DailyLog[]) => {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  notifyListeners();
};

export const getLogsByUser = (userId: string): DailyLog[] => {
  return getDailyLogs().filter(l => l.userId === userId);
};

export const addLog = (log: Omit<DailyLog, 'id' | 'createdAt'>): DailyLog => {
  const logs = getDailyLogs();
  const newLog: DailyLog = {
    ...log,
    id: `log-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  saveDailyLogs([newLog, ...logs]);

  if (isFirebaseConfigured) {
    addDoc(collection(db, 'rnd_daily_logs'), {
      userId: newLog.userId,
      date: newLog.date,
      startTime: newLog.startTime || '',
      endTime: newLog.endTime || '',
      timeSpentMinutes: newLog.timeSpentMinutes || 0,
      objective: newLog.objective || '',
      activities: newLog.activities || '',
      completionStatus: newLog.completionStatus || 'Completed',
      confidenceLevel: newLog.confidenceLevel || 90,
      createdAt: newLog.createdAt
    }).then(docRef => {
      // Update the local ID to match Firestore document ID so delete/update works correctly
      const currentLogs = getDailyLogs();
      const updated = currentLogs.map(l => l.id === newLog.id ? { ...l, id: docRef.id } : l);
      saveDailyLogs(updated);
    }).catch(err => console.error('[LocalStore] Firestore addDoc error:', err));
  }

  return newLog;
};

export const updateLog = (id: string, updates: Partial<DailyLog>): DailyLog => {
  const logs = getDailyLogs();
  const index = logs.findIndex(l => l.id === id);
  if (index === -1) throw new Error('Log not found');
  const updated = { ...logs[index], ...updates };
  logs[index] = updated;
  saveDailyLogs(logs);

  if (isFirebaseConfigured && !id.startsWith('log-')) {
    updateDoc(doc(db, 'rnd_daily_logs', id), {
      ...updates,
      updatedAt: new Date().toISOString()
    }).catch(err => console.error('[LocalStore] Firestore updateDoc error:', err));
  }

  return updated;
};

export const deleteLog = (id: string) => {
  // Remove from localStorage (works for both local IDs and Firestore IDs)
  const logs = getDailyLogs();
  const filtered = logs.filter(l => l.id !== id);
  saveDailyLogs(filtered);

  // Always attempt Firestore deletion when Firebase is configured
  // Previously this was blocked for 'log-' prefixed IDs but Firestore
  // documents may have any ID format depending on when/how they were saved.
  if (isFirebaseConfigured) {
    deleteDoc(doc(db, 'rnd_daily_logs', id))
      .catch(() => {
        // If doc not found by this ID, try to delete by matching fields
        // (handles case where Firestore ID differs from localStorage ID)
        console.warn('[LocalStore] deleteDoc skipped — doc may already be removed or ID mismatch.');
      });
  }
};
