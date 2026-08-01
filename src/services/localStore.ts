import type { AppUser, DailyLog } from '../types';

const USERS_KEY = 'miklens_users_v3';
const LOGS_KEY = 'miklens_daily_logs_v3';

// ── Exact User Accounts matching Miklens Trial Manager 7 ──
const SEED_USERS: AppUser[] = [
  {
    id: 'user-pavan',
    name: 'Pavan',
    email: 'pavan@miklensbio.com',
    role: 'Admin',
    designation: 'Head of R&D & Admin',
    department: 'Research Management',
    skills: ['Trial Design', 'Herbicide Formulations', 'Portfolio Oversight'],
    avatar: 'https://i.pravatar.cc/150?u=pavan',
    isActive: true,
  },
  {
    id: 'user-sandeep',
    name: 'Sandeep',
    email: 'sandeep.431441@gmail.com',
    role: 'Scientist',
    designation: 'Field Agronomist & Research Scientist',
    department: 'Field Trial Operations',
    skills: ['Field Evaluation', 'Crop Disease Rating', 'Weed Efficacy'],
    avatar: 'https://i.pravatar.cc/150?u=sandeep',
    isActive: true,
  },
  {
    id: 'user-bindu',
    name: 'Bindu',
    email: 'bindushreebu01@gmail.com',
    role: 'Scientist',
    designation: 'Research Microbiologist & Formulation Chemist',
    department: 'Microbiology & Formulations',
    skills: ['Microbiology Assay', 'Formulation Titration', 'Lab Analysis'],
    avatar: 'https://i.pravatar.cc/150?u=bindu',
    isActive: true,
  },
  {
    id: 'mgmt-1',
    name: 'Dr. Mik',
    email: 'dr.mik@miklensbio.com',
    role: 'Management',
    designation: 'Executive Management',
    department: 'Research Management',
    skills: ['Portfolio Strategy', 'Stage-Gate Review'],
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
    skills: ['Microbiology', 'Fungal Pathology'],
    avatar: 'https://i.pravatar.cc/150?u=1',
    isActive: true,
  },
];

const SEED_LOGS: DailyLog[] = [
  {
    id: 'log-pavan-1',
    userId: 'user-pavan',
    date: new Date().toISOString(),
    productId: 'Goweed Ultra',
    experimentId: 'exp-p1',
    objective: 'Oversight & Review of 220 active field trials across Punjab & Maharashtra stations',
    activities: '[Field Trial Sync] Verified 1542 trial observations. Reviewed Goweed Ultra burndown ratings on broadleaf weeds. (240m)\n[Executive Review] Analyzed efficacy percentage trends and updated commercial release milestones. (180m)',
    achievements: 'Confirmed 94.5% weed clearance on Soybean JS 335 plots.',
    problems: '',
    timeSpentMinutes: 420,
    completionStatus: 'Completed',
    confidenceLevel: 95,
    aiNotes: 'Portfolio metrics on track for Q3 release.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'log-sandeep-1',
    userId: 'user-sandeep',
    date: new Date().toISOString(),
    productId: 'Goweed Ultra',
    experimentId: 'exp-s1',
    objective: 'Field plot spraying & 14-day DAT weed control evaluation',
    activities: '[Field Trial / Sampling] Conducted post-emergent foliar application on Plot #12 Nashik Agri Park. (210m)\n[Field Evaluation] Recorded SPAD chlorophyll index and weed injury ratings. Uploaded Google Drive plot photos. (150m)',
    achievements: 'Achieved 96% suppression of Amaranthus viridis.',
    problems: 'Transient lower leaf yellowing observed, recovered by Day 5.',
    timeSpentMinutes: 360,
    completionStatus: 'Completed',
    confidenceLevel: 90,
    aiNotes: 'Excellent field control data submitted.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'log-bindu-1',
    userId: 'user-bindu',
    date: new Date().toISOString(),
    productId: 'BioShield Alpha (Bio-fungicide)',
    experimentId: 'exp-b1',
    objective: 'Lab culture preparation and emulsion thermal stability testing',
    activities: '[Laboratory Experiment] Cultured Puccinia striiformis fungal spores for yellow rust assay. (180m)\n[Formulation & Stability] Conducted 54°C thermal aging test in stability chamber. Verified viscosity 145 cPs. (180m)',
    achievements: 'Maintained 95.8% active ingredient retention post-thermal aging.',
    problems: '',
    timeSpentMinutes: 360,
    completionStatus: 'Completed',
    confidenceLevel: 92,
    aiNotes: 'Stability assay passed lab parameters.',
    createdAt: new Date().toISOString(),
  }
];

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
      localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
      return SEED_USERS;
    }
    return JSON.parse(raw);
  } catch (err) {
    return SEED_USERS;
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
      localStorage.setItem(LOGS_KEY, JSON.stringify(SEED_LOGS));
      return SEED_LOGS;
    }
    return JSON.parse(raw);
  } catch (err) {
    return SEED_LOGS;
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
  return newLog;
};

export const updateLog = (id: string, updates: Partial<DailyLog>): DailyLog => {
  const logs = getDailyLogs();
  const index = logs.findIndex(l => l.id === id);
  if (index === -1) throw new Error('Log not found');
  const updated = { ...logs[index], ...updates };
  logs[index] = updated;
  saveDailyLogs(logs);
  return updated;
};

export const deleteLog = (id: string) => {
  const logs = getDailyLogs();
  const filtered = logs.filter(l => l.id !== id);
  saveDailyLogs(filtered);
};
