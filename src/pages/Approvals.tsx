import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

const initialApprovals: { id: number; title: string; requester: string; date: string; status: ApprovalStatus; type: string }[] = [
  { id: 1, title: 'Move BioShield Alpha to Field Trial', requester: 'Dr. Sarah Jenkins', date: 'Oct 25, 2023', status: 'Pending', type: 'Stage-Gate' },
  { id: 2, title: 'Budget Increase: NemaKill Pro', requester: 'Marcus Chen', date: 'Oct 24, 2023', status: 'Approved', type: 'Financial' },
  { id: 3, title: 'New Experiment Protocol (EXP-092)', requester: 'Dr. Aliyah Patel', date: 'Oct 23, 2023', status: 'Rejected', type: 'Protocol' },
];

export const Approvals: React.FC = () => {
  const { userRole } = useAuth();
  const [approvals, setApprovals] = useState(initialApprovals);

  const canApprove = userRole === 'Admin' || userRole === 'Management';

  const decide = (id: number, status: ApprovalStatus) => {
    setApprovals(prev => prev.map(a => (a.id === id ? { ...a, status } : a)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
            Approvals
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Manage stage-gate transitions, protocol reviews, and budget requests.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {approvals.map((approval, index) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            key={approval.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-start space-x-4">
              <div className="mt-1 flex-shrink-0">
                {approval.status === 'Pending' && <Clock className="h-6 w-6 text-yellow-500" />}
                {approval.status === 'Approved' && <CheckCircle className="h-6 w-6 text-green-500" />}
                {approval.status === 'Rejected' && <XCircle className="h-6 w-6 text-red-500" />}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  {approval.title}
                  <span className="ml-3 inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 dark:bg-gray-800 dark:text-gray-400">
                    {approval.type}
                  </span>
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Requested by {approval.requester} • {approval.date}
                </p>
              </div>
            </div>

            {canApprove && approval.status === 'Pending' ? (
              <div className="mt-4 sm:mt-0 flex space-x-3">
                <button
                  onClick={() => decide(approval.id, 'Rejected')}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Reject
                </button>
                <button
                  onClick={() => decide(approval.id, 'Approved')}
                  className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                >
                  Approve
                </button>
              </div>
            ) : (
               <div className="mt-4 sm:mt-0 flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                 {approval.status === 'Pending' ? (
                   <span className="flex items-center"><ShieldAlert className="mr-1.5 h-4 w-4" /> Requires Management Approval</span>
                 ) : (
                   `Status: ${approval.status}`
                 )}
               </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
