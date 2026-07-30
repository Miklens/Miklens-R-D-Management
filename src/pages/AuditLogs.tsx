import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Database, ShieldAlert, History, Search } from 'lucide-react';

const mockLogs = [
  { id: 1, action: 'UPDATE_PRODUCT_STAGE', user: 'admin@miklensbio.com', target: 'BioShield Alpha', timestamp: new Date(Date.now() - 3600000).toISOString(), details: 'Changed stage from Lab Testing to Field Trial' },
  { id: 2, action: 'DELETE_EXPERIMENT', user: 'm.chen@miklensbio.com', target: 'EXP-2026-011', timestamp: new Date(Date.now() - 86400000).toISOString(), details: 'Soft deleted due to erroneous data entry' },
  { id: 3, action: 'ROLE_CHANGE', user: 'admin@miklensbio.com', target: 'Dr. Aliyah Patel', timestamp: new Date(Date.now() - 172800000).toISOString(), details: 'Changed from Scientist to Field Agronomist' },
  { id: 4, action: 'FORMULATION_UPDATE', user: 'a.roy@miklensbio.com', target: 'Pseudomonas SC', timestamp: new Date(Date.now() - 259200000).toISOString(), details: 'Adjusted Xanthan Gum concentration to 0.28%' }
];

export const AuditLogs: React.FC = () => {
  const { userRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = mockLogs.filter(log =>
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (userRole !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center text-red-500">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm">Only administrators can view system audit logs and compliance records.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-lg shadow-gray-900/20 text-white">
              <Database className="h-5 w-5" />
            </div>
            System Audit Logs
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Immutable security tracking of critical system changes and user actions.
          </p>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white shadow-lg dark:bg-gray-900">
        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
          <thead className="bg-gray-50/50 dark:bg-gray-950/40">
            <tr>
              <th scope="col" className="py-3.5 pl-6 pr-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Timestamp</th>
              <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
              <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
              <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                <td className="whitespace-nowrap py-4 pl-6 pr-3 text-xs text-gray-500 dark:text-gray-400 flex items-center font-mono">
                  <History className="mr-2 h-3.5 w-3.5 text-gray-400" />
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-xs">
                  <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {log.action}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-xs font-medium text-gray-700 dark:text-gray-300">{log.user}</td>
                <td className="px-3 py-4 text-xs text-gray-500 dark:text-gray-400">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
