import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, MapPin } from 'lucide-react';

const mockEvents = [
  { id: 1, title: 'Field Trial Setup: BioShield', date: 'Tomorrow, 09:00 AM', location: 'Greenhouse B' },
  { id: 2, title: 'Monthly R&D Review', date: 'Nov 05, 14:00 PM', location: 'Conference Room 1' },
];

export const Calendar: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
            Calendar & Scheduling
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Upcoming trials, deadlines, and team meetings.
          </p>
        </div>
        <button className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
          Add Event
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        {/* Placeholder for an actual full calendar grid */}
        <div className="bg-gray-50 border-b border-gray-200 p-4 dark:bg-gray-800/50 dark:border-gray-800 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
           Weekly View Placeholder
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {mockEvents.map((event, index) => (
             <motion.li
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                key={event.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50"
             >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                   <div>
                     <h3 className="text-lg font-medium text-gray-900 dark:text-white">{event.title}</h3>
                     <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <CalendarDays className="mr-1.5 h-4 w-4" />
                        {event.date}
                     </div>
                   </div>
                   <div className="mt-2 sm:mt-0 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <MapPin className="mr-1.5 h-4 w-4" />
                      {event.location}
                   </div>
                </div>
             </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
};
