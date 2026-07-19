import React from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useUsers } from '../hooks/useUsers';
import { useDailyLogs } from '../hooks/useDailyLogs';

export const Employees: React.FC = () => {
  const { data: users, isLoading } = useUsers();
  const { data: logs } = useDailyLogs();

  const employees = users.filter(u => u.isActive);

  if (isLoading) {
     return <div className="p-8 text-center text-gray-500">Loading employees...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
          Employees
        </h2>
        <button className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
          Add Employee
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {employees.map((employee) => {
          const logCount = logs.filter(l => l.userId === employee.id).length;
          return (
            <div key={employee.id} className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white shadow-sm dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
              <Link to={`/profile/${employee.id}`} className="flex w-full items-center justify-between space-x-6 p-6">
                <div className="flex-1 truncate">
                  <div className="flex items-center space-x-3">
                    <h3 className="truncate text-sm font-medium text-gray-900 dark:text-white">{employee.name}</h3>
                    <span className="inline-flex flex-shrink-0 items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-900/50 dark:text-blue-200">
                      {employee.department}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">{employee.designation}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {employee.skills.map(skill => (
                      <span key={skill} className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <img className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-300" src={employee.avatar} alt="" />
              </Link>
              <div>
                <div className="-mt-px flex divide-x divide-gray-200 dark:divide-gray-800">
                  <div className="flex w-0 flex-1">
                    <a href={`mailto:${employee.email}`} className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
                      <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      Email
                    </a>
                  </div>
                  <div className="-ml-px flex w-0 flex-1">
                    <div className="relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-gray-900 dark:text-gray-300">
                       <span className="text-gray-500 dark:text-gray-400">Logs:</span> {logCount}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
