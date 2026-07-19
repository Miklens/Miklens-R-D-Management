import React from 'react';
import { motion } from 'framer-motion';

const mockObservations = [
  { id: 1, author: 'Dr. Sarah Jenkins', text: 'Noticed slight discoloration in Petri Dish 4 after 12 hours. It might indicate contamination, isolating it now.', target: 'EXP-2023-089', time: '1 hour ago' },
  { id: 2, author: 'Marcus Chen', text: 'Viscosity of the new mixture seems thinner than expected at room temp.', target: 'BioShield Alpha', time: '3 hours ago' },
];

export const Observations: React.FC = () => {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-5 dark:border-gray-800">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
          Observations Feed
        </h2>
        <button className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
          Log Observation
        </button>
      </div>

      <div className="flow-root">
        <ul className="-mb-8">
          {mockObservations.map((obs, index) => (
            <motion.li
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={obs.id}
            >
              <div className="relative pb-8">
                {index !== mockObservations.length - 1 ? (
                  <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-800" aria-hidden="true" />
                ) : null}
                <div className="relative flex items-start space-x-3">
                  <div className="relative">
                    <img className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-400 ring-8 ring-white dark:ring-gray-950" src={`https://i.pravatar.cc/150?u=${obs.id}`} alt="" />
                  </div>
                  <div className="min-w-0 flex-1 rounded-lg bg-white p-4 shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                    <div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-900 dark:text-white">{obs.author}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                        Observed on <span className="font-medium text-blue-600 dark:text-blue-400">{obs.target}</span> • {obs.time}
                      </p>
                    </div>
                    <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                      <p>{obs.text}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
};
