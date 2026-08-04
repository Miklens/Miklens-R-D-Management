import type { GlobalTask } from '../types/taskTypes';

// v4: Purge all BioShield/Dr. Sarah Jenkins seed tasks. Bump key so old data is cleared.
const TASKS_KEY = 'miklens_tasks_v4';

// Clear old v3 keys so stale seed data doesn't persist across browsers
try { localStorage.removeItem('miklens_tasks_v3'); } catch { /* ignore */ }

const SEED_TASKS: GlobalTask[] = [];

export const loadTasksFromStorage = (): GlobalTask[] => {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) {
      localStorage.setItem(TASKS_KEY, JSON.stringify(SEED_TASKS));
      return SEED_TASKS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load tasks from localStorage:', err);
    return SEED_TASKS;
  }
};

export const saveTasksToStorage = (tasks: GlobalTask[]): void => {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save tasks to localStorage:', err);
  }
};
