export type Role = 'Admin' | 'Management' | 'Scientist';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  designation: string;
  department: string;
  skills: string[];
  avatar?: string;
  isActive: boolean;
}

export type CompletionStatus = 'InProgress' | 'Completed' | 'Blocked';

export interface DailyLog {
  id: string;
  userId: string;
  date: string; // ISO date string
  productId?: string;
  experimentId?: string;
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
  objective: string;
  activities: string;
  problems?: string;
  achievements?: string;
  blockers?: string;
  timeSpentMinutes: number;
  completionStatus: CompletionStatus;
  confidenceLevel: number;
  aiNotes?: string;
  createdAt: string; // ISO timestamp
  updatedAt?: string;
}
