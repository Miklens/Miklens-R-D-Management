import React, { createContext, useContext, useState, useEffect } from 'react';
import type { GlobalTask, TaskStatus, TaskPriority, TaskType, TaskEntityType } from '../types/taskTypes';
import { loadTasksFromStorage, saveTasksToStorage } from '../services/taskStore';

interface TaskContextType {
  tasks: GlobalTask[];
  addTask: (taskData: Omit<GlobalTask, 'id' | 'createdAt' | 'updatedAt'>) => GlobalTask;
  updateTask: (id: string, updates: Partial<GlobalTask>) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;
  getTasksForEntity: (entityType: TaskEntityType, entityId?: string) => GlobalTask[];
  getTasksForUser: (userId: string) => GlobalTask[];
  pendingCount: number;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<GlobalTask[]>(loadTasksFromStorage);

  useEffect(() => {
    saveTasksToStorage(tasks);
  }, [tasks]);

  const addTask = (taskData: Omit<GlobalTask, 'id' | 'createdAt' | 'updatedAt'>): GlobalTask => {
    const newTask: GlobalTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<GlobalTask>) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleTaskStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus: TaskStatus =
            t.status === 'Completed'
              ? 'Pending'
              : t.status === 'Pending'
              ? 'In Progress'
              : 'Completed';
          return { ...t, status: nextStatus, updatedAt: new Date().toISOString() };
        }
        return t;
      })
    );
  };

  const getTasksForEntity = (entityType: TaskEntityType, entityId?: string) => {
    return tasks.filter((t) => {
      if (t.entityType !== entityType) return false;
      if (entityId && t.entityId !== entityId) return false;
      return true;
    });
  };

  const getTasksForUser = (userId: string) => {
    return tasks.filter((t) => t.assignedToUserId === userId);
  };

  const pendingCount = tasks.filter((t) => t.status !== 'Completed').length;

  return (
    <TaskContext.Provider
      value={{
        tasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
        getTasksForEntity,
        getTasksForUser,
        pendingCount,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
