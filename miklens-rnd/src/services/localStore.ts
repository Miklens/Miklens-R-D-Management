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

const USERS_KEY = 'miklens_users_v1';
const LOGS_KEY = 'miklens_daily_logs_v1';

const SEED_USERS: AppUser[] = [
  {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@miklensbio.com',
    role: 'Admin',
    designation: 'Platform Administrator',
    department: 'Operations',
    skills: ['System Administration', 'RBAC', 'Data Governance'],
    avatar: 'https://i.pravatar.cc/150?u=admin-1',
    isActive: true,
  },
  {
    id: 'mgmt-1',
    name: 'Priya Nair',
    email: 'priya.nair@miklensbio.com',
    role: 'Management',
    designation: 'Head of R&D',
    department: 'Research',
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
    department: 'Research',
    skills: ['Microbiology', 'Fungal Pathology', 'Data Analysis', 'PCR'],
    avatar: 'https://i.pravatar.cc/150?u=1',
    isActive: true,
  },
  {
    id: 'sci-2',
    name: 'Marcus Chen',
    email: 'm.chen@miklensbio.com',
    role: 'Scientist',
    designation: 'Senior Chemist',
    department: 'Formulation',
    skills: ['Organic Chemistry', 'Spectroscopy'],
    avatar: 'https://i.pravatar.cc/150?u=2',
    isActive: true,
  },
  {
    id: 'sci-3',
    name: 'Dr. Aliyah Patel',
    email: 'apatel@miklensbio.com',
    role: 'Scientist',
    designation: 'Field Agronomist',
    department: 'Field Trials',
    skills: ['Crop Science', 'Soil Analysis', 'Trial Management'],
    avatar: 'https://i.pravatar.cc/150?u=3',
    isActive: true,
  },
];

const daysAgoIso = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

const SEED_LOGS: DailyLog[] = [
  {
    id: 'log-1',
    userId: 'sci-1',
    date: daysAgoIso(0),
    productId: 'p1',
    experimentId: 'exp1',
    objective: 'Run efficacy trial of BioShield Alpha against Botrytis cinerea.',
    activities: 'Prepared 6 culture plates, applied treatment at 3 concentrations, incubated at 25C.',
    problems: 'One plate showed contamination, excluded from results.',
    achievements: 'Confirmed 80% inhibition at highest concentration.',
    timeSpentMinutes: 180,
    completionStatus: 'Completed',
    confidenceLevel: 85,
    aiNotes: 'Strong inhibition trend consistent with prior batch. Recommend scaling to greenhouse trial.',
    createdAt: daysAgoIso(0),
  },
  {
    id: 'log-2',
    userId: 'sci-1',
    date: daysAgoIso(1),
    productId: 'p1',
    experimentId: 'exp2',
    objective: 'Investigate root cause of variability in EXP-2023-090 results.',
    activities: 'Reviewed incubation logs, re-ran control group, checked reagent batch numbers.',
    problems: 'Suspect reagent batch #445 degraded; requesting fresh stock.',
    achievements: 'Isolated likely root cause to reagent quality, not protocol error.',
    timeSpentMinutes: 150,
    completionStatus: 'Blocked',
    confidenceLevel: 60,
    aiNotes: 'Root-cause analysis is high quality despite blocked status - treat as knowledge gain, not delay.',
    createdAt: daysAgoIso(1),
  },
  {
    id: 'log-3',
    userId: 'sci-2',
    date: daysAgoIso(0),
    productId: 'p2',
    experimentId: 'exp3',
    objective: 'Optimize solvent ratio for NemaKill Pro formulation stability.',
    activities: 'Tested 4 solvent blends, measured viscosity and shelf stability at 40C.',
    achievements: 'Blend C shows best stability profile, moving to next formulation round.',
    timeSpentMinutes: 210,
    completionStatus: 'Completed',
    confidenceLevel: 78,
    aiNotes: 'Formulation stability trend is improving month over month.',
    createdAt: daysAgoIso(0),
  },
  {
    id: 'log-4',
    userId: 'sci-2',
    date: daysAgoIso(2),
    productId: 'p2',
    experimentId: 'exp4',
    objective: 'Spectroscopy analysis of active compound degradation.',
    activities: 'Ran FTIR on 3 samples aged 0/30/60 days.',
    problems: 'Degradation faster than expected past day 30.',
    timeSpentMinutes: 120,
    completionStatus: 'InProgress',
    confidenceLevel: 55,
    createdAt: daysAgoIso(2),
  },
  {
    id: 'log-5',
    userId: 'sci-3',
    date: daysAgoIso(1),
    productId: 'p3',
    experimentId: 'exp5',
    objective: 'Field trial site inspection for RootBoost X commercial validation.',
    activities: 'Soil sampling at 5 points, moisture and pH readings logged.',
    achievements: 'Site conditions confirmed suitable, trial can proceed as scheduled.',
    timeSpentMinutes: 240,
    completionStatus: 'Completed',
    confidenceLevel: 90,
    aiNotes: 'Field readiness confirmed - clears blocker for commercial validation stage.',
    createdAt: daysAgoIso(1),
  },
  {
    id: 'log-6',
    userId: 'sci-3',
    date: daysAgoIso(4),
    productId: 'p4',
    experimentId: 'exp6',
    objective: 'Review AeroSpore V2 pre-launch documentation checklist.',
    activities: 'Cross-checked registration documents against regulatory requirements.',
    achievements: 'All documents verified, ready for commercial launch sign-off.',
    timeSpentMinutes: 90,
    completionStatus: 'Completed',
    confidenceLevel: 95,
    createdAt: daysAgoIso(4),
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

export const addLog = (log: Omit<DailyLog, 'id' | 'createdAt' | 'date'>): DailyLog => {
  const logs = getLogs();
  const now = new Date().toISOString();
  const newLog: DailyLog = {
    ...log,
    id: `log-${Date.now()}`,
    date: now,
    createdAt: now,
  };
  logs.push(newLog);
  writeJson(LOGS_KEY, logs);
  notifyStoreChange();
  return newLog;
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
