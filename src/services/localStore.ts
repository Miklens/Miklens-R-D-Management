// Local, persistent (localStorage-backed) data layer.
//
// The real backend is Firebase/Firestore (see db.ts, researchLogs.ts), but until
// a real Firebase project is configured (see isFirebaseConfigured in config/firebase.ts)
// the app runs fully on this local store so multi-user login, role-based visibility,
// and scientist activity tracking all actually work end-to-end out of the box.
//
// Swapping to real Firestore later just means pointing the hooks/services at
// `db` instead of this module - the shapes (AppUser, DailyLog) already match
// docs/DATABASE.md's `users` and `daily_logs` collections.

import type { AppUser, DailyLog } from '../types';

const USERS_KEY = 'miklens_users_v3';
const LOGS_KEY = 'miklens_daily_logs_v3';

const SEED_USERS: AppUser[] = [
  {
    id: 'mgmt-1',
    name: 'Dr. Mik',
    email: 'dr.mik@miklensbio.com',
    role: 'Management',
    designation: 'Head of R&D',
    department: 'Research Management',
    skills: ['Portfolio Strategy', 'Budgeting', 'Stage-Gate Review'],
    avatar: 'https://i.pravatar.cc/150?u=mgmt-1',
    isActive: true,
  },
  {
    id: 'sci-1',
    name: 'Dr. Sarah Jenkins',
    email: 'sarah.j@miklensbio.com',
    role: 'Scientist',
    designation: 'Lead Microbiologist',
    department: 'Microbiology R&D',
    skills: ['Microbiology', 'Fungal Pathology', 'Data Analysis', 'PCR'],
    avatar: 'https://i.pravatar.cc/150?u=1',
    isActive: true,
  },
];

const SEED_LOGS: DailyLog[] = [
  {
    id: 'log-1',
    userId: 'sci-1',
    date: new Date().toISOString(),
    productId: 'BioShield Alpha (Bio-fungicide)',
    experimentId: 'exp1',
    objective: 'Full day efficacy testing, heat stability analysis & report documentation for BioShield Alpha',
    activities: '[Laboratory Experiment] Prepared culture plates and performed fungal pathogen inhibition assays across 3 concentrations. (180m)\n[Formulation & Stability] Conducted CIPAC MT 161 heat stability test at 54°C. Measured emulsification viscosity. (150m)\n[Report / Documentation] Compiled lab notes and updated regulatory dossier documentation. (120m)',
    achievements: 'Confirmed 85% fungal growth inhibition and verified physical stability at 54°C.',
    problems: '',
    timeSpentMinutes: 450,
    completionStatus: 'Completed',
    confidenceLevel: 90,
    aiNotes: 'Strong inhibition trend. BioShield Alpha trial proceeds on schedule.',
    createdAt: new Date().toISOString(),
  },
];

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (e.g. private mode) - fail silently, in-memory only for this session.
  }
}

function ensureSeeded() {
  if (localStorage.getItem(USERS_KEY) === null) {
    writeJson(USERS_KEY, SEED_USERS);
  }
  if (localStorage.getItem(LOGS_KEY) === null) {
    writeJson(LOGS_KEY, SEED_LOGS);
  }
}

// --- Users ---

export const getUsers = (): AppUser[] => {
  ensureSeeded();
  return readJson<AppUser[]>(USERS_KEY, SEED_USERS);
};

export const getUserById = (id: string): AppUser | undefined =>
  getUsers().find(u => u.id === id);

export const getUserByEmail = (email: string): AppUser | undefined =>
  getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());

export const saveUser = (user: AppUser) => {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === user.id);
  if (idx >= 0) {
    users[idx] = user;
  } else {
    users.push(user);
  }
  writeJson(USERS_KEY, users);
  notifyStoreChange();
  return user;
};

// --- Daily Logs ---

export const getLogs = (): DailyLog[] => {
  ensureSeeded();
  return readJson<DailyLog[]>(LOGS_KEY, SEED_LOGS);
};

export const getLogsByUser = (userId: string): DailyLog[] =>
  getLogs()
    .filter(l => l.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export const addLog = (log: Omit<DailyLog, 'id' | 'createdAt' | 'date'> & { date?: string }): DailyLog => {
  const logs = getLogs();
  const now = new Date().toISOString();
  const newLog: DailyLog = {
    ...log,
    id: `log-${Date.now()}`,
    date: log.date || now,
    createdAt: now,
  };
  logs.push(newLog);
  writeJson(LOGS_KEY, logs);
  notifyStoreChange();
  return newLog;
};

export const updateLog = (id: string, updates: Partial<DailyLog>): DailyLog | null => {
  const logs = getLogs();
  const idx = logs.findIndex(l => l.id === id);
  if (idx >= 0) {
    logs[idx] = { ...logs[idx], ...updates };
    writeJson(LOGS_KEY, logs);
    notifyStoreChange();
    return logs[idx];
  }
  return null;
};

export const deleteLog = (id: string): void => {
  const logs = getLogs();
  const filtered = logs.filter(l => l.id !== id);
  writeJson(LOGS_KEY, filtered);
  notifyStoreChange();
};

// Simple event so multiple hook instances in the same tab can react to writes
// without a full page reload (poor man's onSnapshot for localStorage).
type Listener = () => void;
const listeners: Set<Listener> = new Set();

export const subscribeToStoreChanges = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const notifyStoreChange = () => {
  listeners.forEach(l => l());
};
