export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Blocked';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskType = 'Task' | 'Milestone' | 'Experiment Action' | 'Regulatory' | 'Field Trial';
export type TaskEntityType = 'product' | 'project' | 'experiment' | 'general';

export interface GlobalTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  entityType: TaskEntityType;
  entityId?: string;
  entityName?: string;
  assignedToUserId?: string;
  assignedToName?: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  linkedLogIds?: string[];
}
