import type { GlobalTask } from '../types/taskTypes';

const TASKS_KEY = 'miklens_tasks_v1';

const SEED_TASKS: GlobalTask[] = [
  {
    id: 'task-1',
    title: 'Draft field trial protocol for BioShield Alpha',
    description: 'Establish pest control evaluation parameter for greenhouse and open field trials in wheat crops.',
    status: 'Pending',
    priority: 'High',
    type: 'Task',
    entityType: 'product',
    entityId: 'p1',
    entityName: 'BioShield Alpha',
    assignedToUserId: 'sci-1',
    assignedToName: 'Dr. Sarah Jenkins',
    dueDate: '2026-08-05',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    title: 'Complete Lab Test Phase 1 (Suspensibility check)',
    description: 'Perform standardCIPAC MT 161 suspensibility testing after 14-day accelerated heat stability.',
    status: 'Completed',
    priority: 'Urgent',
    type: 'Milestone',
    entityType: 'experiment',
    entityId: 'exp1',
    entityName: 'Efficacy Trial #104',
    assignedToUserId: 'sci-2',
    assignedToName: 'Marcus Chen',
    dueDate: '2026-07-28',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    title: 'Review formulation stability data at 54°C',
    description: 'Analyze physical phase separation and active content retention for NemaKill Pro formulation.',
    status: 'In Progress',
    priority: 'Medium',
    type: 'Experiment Action',
    entityType: 'product',
    entityId: 'p2',
    entityName: 'NemaKill Pro',
    assignedToUserId: 'sci-2',
    assignedToName: 'Marcus Chen',
    dueDate: '2026-08-10',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-4',
    title: 'Prepare regulatory dossier for Neem EC 1%',
    description: 'Compile toxicity studies, chemical specs, and bio-efficacy certificates for registration submission.',
    status: 'Pending',
    priority: 'High',
    type: 'Regulatory',
    entityType: 'project',
    entityId: 'proj-1',
    entityName: 'Organic Biopesticide Line',
    assignedToUserId: 'mgmt-1',
    assignedToName: 'Dr. Mik',
    dueDate: '2026-08-20',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-5',
    title: 'Soil moisture and pH baseline sampling',
    description: 'Collect 15 soil core samples across experimental plots A1-A5 prior to RootBoost X application.',
    status: 'In Progress',
    priority: 'Medium',
    type: 'Field Trial',
    entityType: 'product',
    entityId: 'p3',
    entityName: 'RootBoost X',
    assignedToUserId: 'sci-3',
    assignedToName: 'Dr. Aliyah Patel',
    dueDate: '2026-08-02',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
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
