import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Database, ShieldAlert, History } from 'lucide-react';

const mockLogs = [
  { id: 1, action: 'UPDATE_PRODUCT_STAGE', user: 'admin@miklensbio.com', target: 'BioShield Alpha', timestamp: '2023-10-26T14:32:00Z', details: 'Changed stage from Lab Testing to Field Trial' },
  { id: 2, action: 'DELETE_EXPERIMENT', user: 'm.chen@miklensbio.com', target: 'EXP-2023-011', timestamp: '2023-10-25T09:15:00Z', details: 'Soft deleted due to erroneous data entry' },
  { id: 3, action: 'ROLE_CHANGE', user: 'admin@miklensbio.com', target: 'Dr. Aliyah Patel', timestamp: '2023-10-20T11:00:00Z', details: 'Changed from Scientist to Field Agronomist' }
];

export const AuditLogs: React.FC = () => {
  const { userRole } = useAuth();

  if (userRole !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
        <ShieldAlert className="h-16 w-16 text-red-500" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
        <p className="text-gray-500 dark:text-gray-400">Only administrators can view the system audit logs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight flex items-center">
            <Database className="mr-3 h-8 w-8 text-gray-400" />
            System Audit Logs
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Immutable tracking of critical system changes.
          </p>
        </div>
      </div>

      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg dark:ring-white/10">
        <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Timestamp</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Action</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">User</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
            {mockLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 dark:text-gray-400 sm:pl-6 flex items-center">
                  <History className="mr-2 h-4 w-4 text-gray-400" />
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {log.action}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{log.user}</td>
                <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
