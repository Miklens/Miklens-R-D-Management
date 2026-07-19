import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Sun, CloudRain, Wind } from 'lucide-react';

const mockTrials = [
  { id: 1, title: 'BioShield Alpha Efficacy', location: 'Greenhouse B, California', status: 'In Progress', crop: 'Tomatoes', weather: 'Sunny', conditions: '22°C, 65% Humidity', dateStarted: 'Oct 10, 2023' },
  { id: 2, title: 'NemaKill Soil Penetration', location: 'Field 4, Midwest', status: 'Delayed', crop: 'Soybeans', weather: 'Rainy', conditions: '15°C, Soil saturated', dateStarted: 'Oct 20, 2023' },
];

export const FieldTrials: React.FC = () => {
  const getWeatherIcon = (weather: string) => {
    switch(weather) {
      case 'Sunny': return <Sun className="h-5 w-5 text-yellow-500" />;
      case 'Rainy': return <CloudRain className="h-5 w-5 text-blue-500" />;
      default: return <Wind className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
          Field Trials
        </h2>
        <button className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
          New Field Trial
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {mockTrials.map((trial, index) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            key={trial.id}
            className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{trial.title}</h3>
              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${trial.status === 'In Progress' ? 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/50 dark:text-blue-200' : 'bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-900/50 dark:text-yellow-200'}`}>
                {trial.status}
              </span>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
              <MapPin className="mr-1.5 h-4 w-4" /> {trial.location}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 dark:border-gray-800">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Crop Focus</p>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{trial.crop}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Started</p>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{trial.dateStarted}</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50 flex items-center space-x-3">
               {getWeatherIcon(trial.weather)}
               <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Current Conditions</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{trial.conditions}</p>
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
