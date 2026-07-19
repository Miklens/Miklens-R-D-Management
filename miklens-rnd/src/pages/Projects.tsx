import React from 'react';
import { FolderGit2, Calendar as CalendarIcon, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const mockProjects = [
  { id: 1, name: 'Q3 Formulation Initiative', status: 'Active', progress: 65, members: 12, deadline: 'Nov 30, 2023' },
  { id: 2, name: 'BioPesticide Trial Expansion', status: 'Planning', progress: 15, members: 5, deadline: 'Jan 15, 2024' },
];

export const Projects: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
            Projects
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            High-level initiatives that group multiple research products together.
          </p>
        </div>
        <button className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
          New Project
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {mockProjects.map((project, index) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            key={project.id}
            className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/50">
                  <FolderGit2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{project.name}</h3>
              </div>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-900/50 dark:text-blue-200">
                {project.status}
              </span>
            </div>

            <div className="mt-6 flex-1">
               <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Overall Progress</span>
                  <span className="font-medium text-gray-900 dark:text-white">{project.progress}%</span>
                </div>
                <div className="mt-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
               <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                 <Users className="mr-1.5 h-4 w-4" />
                 {project.members} Members
               </div>
               <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                 <CalendarIcon className="mr-1.5 h-4 w-4" />
                 {project.deadline}
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
