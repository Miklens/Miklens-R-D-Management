import React from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const mockTasks = [
  { id: 1, title: 'Draft field trial protocol for BioShield', type: 'Task', status: 'Pending', dueDate: 'Tomorrow' },
  { id: 2, title: 'Complete Lab Test Phase 1', type: 'Milestone', status: 'Completed', dueDate: 'Yesterday' },
  { id: 3, title: 'Review formulation stability data', type: 'Task', status: 'In Progress', dueDate: 'Next Week' },
];

export const Tasks: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
          Tasks & Milestones
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Track actionable steps and major product milestones.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {mockTasks.map((task, index) => (
            <motion.li
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              key={task.id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 sm:px-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {task.status === 'Completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : task.status === 'In Progress' ? (
                    <Clock className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                  )}
                  <p className={`text-sm font-medium ${task.status === 'Completed' ? 'text-gray-500 line-through dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                    {task.title}
                  </p>
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                    task.type === 'Milestone'
                      ? 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-900/50 dark:text-purple-200'
                      : 'bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {task.type}
                  </span>
                </div>
                <div className="flex flex-shrink-0 text-sm text-gray-500 dark:text-gray-400">
                  {task.dueDate}
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
};
