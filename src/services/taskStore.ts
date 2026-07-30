import type { GlobalTask } from '../types/taskTypes';

const TASKS_KEY = 'miklens_tasks_v3';

const SEED_TASKS: GlobalTask[] = [
  {
    id: 'task-1',
    title: 'Draft field trial protocol for BioShield Alpha',
    description: 'Establish pest control evaluation parameters for greenhouse and open field trials in wheat crops.',
    status: 'Pending',
    priority: 'High',
    type: 'Task',
    entityType: 'product',
    entityId: 'p1',
    entityName: 'BioShield Alpha (Bio-fungicide)',
    assignedToUserId: 'sci-1',
    assignedToName: 'Dr. Sarah Jenkins',
    dueDate: '2026-08-05',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    title: 'Complete Lab Test Phase 1 (Suspensibility check)',
    description: 'Perform standard CIPAC MT 161 suspensibility testing after 14-day accelerated heat stability.',
    status: 'Completed',
    priority: 'Urgent',
    type: 'Milestone',
    entityType: 'experiment',
    entityId: 'exp1',
    entityName: 'BioShield Efficacy Assay #101',
    assignedToUserId: 'sci-1',
    assignedToName: 'Dr. Sarah Jenkins',
    dueDate: '2026-07-28',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    title: 'Review BioShield Alpha regulatory dossier & toxicity specs',
    description: 'Compile toxicity studies, active ingredient assay specs, and bio-efficacy certificates for registration.',
    status: 'In Progress',
    priority: 'High',
    type: 'Regulatory',
    entityType: 'project',
    entityId: 'proj-1',
    entityName: 'BioShield Commercialization Project',
    assignedToUserId: 'mgmt-1',
    assignedToName: 'Dr. Mik',
    dueDate: '2026-08-15',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

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
