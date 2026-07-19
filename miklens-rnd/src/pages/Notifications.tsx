import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Info, AlertCircle, CheckCircle } from 'lucide-react';

const mockNotifications = [
  { id: 1, type: 'Alert', title: 'Experiment Failed', message: 'EXP-2023-090 has been marked as a failure. Review AI analysis.', time: '2 hours ago', read: false },
  { id: 2, type: 'Info', title: 'New Document Uploaded', message: 'Dr. Jenkins uploaded Toxicity Report v2.pdf', time: '1 day ago', read: true },
  { id: 3, type: 'Success', title: 'Approval Granted', message: 'Budget Increase for NemaKill Pro was approved by Management.', time: '2 days ago', read: true },
];

export const Notifications: React.FC = () => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'Alert': return <AlertCircle className="h-6 w-6 text-red-500" />;
      case 'Success': return <CheckCircle className="h-6 w-6 text-green-500" />;
      default: return <Info className="h-6 w-6 text-blue-500" />;
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-5 dark:border-gray-800">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white flex items-center">
          <Bell className="mr-3 h-6 w-6 text-gray-400" />
          Notifications
        </h2>
        <button className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
          Mark all as read
        </button>
      </div>

      <div className="space-y-4">
        {mockNotifications.map((notif, index) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            key={notif.id}
            className={`flex items-start space-x-4 rounded-lg p-4 transition-colors ${
              notif.read ? 'bg-white dark:bg-gray-900' : 'bg-blue-50 dark:bg-blue-900/20'
            } border ${notif.read ? 'border-gray-200 dark:border-gray-800' : 'border-blue-100 dark:border-blue-800/50'}`}
          >
            <div className="flex-shrink-0 mt-1">
              {getIcon(notif.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${notif.read ? 'text-gray-900 dark:text-white' : 'text-blue-900 dark:text-blue-100'}`}>
                {notif.title}
              </p>
              <p className={`mt-1 text-sm ${notif.read ? 'text-gray-500 dark:text-gray-400' : 'text-blue-800 dark:text-blue-200'}`}>
                {notif.message}
              </p>
              <p className="mt-2 text-xs text-gray-400">
                {notif.time}
              </p>
            </div>
            {!notif.read && (
              <div className="flex-shrink-0">
                 <span className="inline-block h-2 w-2 rounded-full bg-blue-600"></span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
