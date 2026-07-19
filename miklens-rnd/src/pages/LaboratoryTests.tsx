import React from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, TestTube2, Activity } from 'lucide-react';

const mockTests = [
  { id: 1, title: 'Spectrometry Analysis: Sample A', status: 'Processing', equipment: 'Mass Spectrometer', operator: 'Marcus Chen', eta: '2 hours' },
  { id: 2, title: 'pH Stability Over 48h', status: 'Completed', equipment: 'pH Meter Station 2', operator: 'Dr. Sarah Jenkins', eta: 'Completed' },
];

export const LaboratoryTests: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
          Laboratory Tests
        </h2>
        <button className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
          Queue Test
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {mockTests.map((test, index) => (
            <motion.li
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              key={test.id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 sm:p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${test.status === 'Processing' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-green-50 text-green-600 dark:bg-green-900/50 dark:text-green-400'}`}>
                    {test.status === 'Processing' ? <Activity className="h-6 w-6 animate-pulse" /> : <TestTube2 className="h-6 w-6" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">{test.title}</h3>
                    <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-2">
                      <span className="flex items-center"><FlaskConical className="mr-1 h-3 w-3" /> {test.equipment}</span>
                      <span>•</span>
                      <span>{test.operator}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${test.status === 'Processing' ? 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/50 dark:text-blue-200' : 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/50 dark:text-green-200'}`}>
                    {test.status}
                  </span>
                  <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">ETA: {test.eta}</span>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
};
