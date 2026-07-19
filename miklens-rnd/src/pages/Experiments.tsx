import React from 'react';
import { Beaker, Filter } from 'lucide-react';

const mockExperiments = [
  {
    id: 'exp1',
    number: 'EXP-2023-089',
    product: 'BioShield Alpha',
    objective: 'Test efficacy against Botrytis cinerea at 5% concentration',
    status: 'Success',
    leadScientist: 'Dr. Sarah Jenkins',
    date: 'Oct 12, 2023'
  },
  {
    id: 'exp2',
    number: 'EXP-2023-090',
    product: 'NemaKill Pro',
    objective: 'Evaluate soil dispersion rate in sandy loam',
    status: 'Failure',
    leadScientist: 'Marcus Chen',
    date: 'Oct 14, 2023'
  },
  {
    id: 'exp3',
    number: 'EXP-2023-091',
    product: 'RootBoost X',
    objective: 'Measure root mass increase in tomato seedlings',
    status: 'Partial Success',
    leadScientist: 'Dr. Aliyah Patel',
    date: 'Oct 15, 2023'
  }
];

export const Experiments: React.FC = () => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Success':
        return <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-900/50 dark:text-green-200">Success</span>;
      case 'Failure':
        return <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20 dark:bg-orange-900/50 dark:text-orange-200" title="Valuable learning outcome">Failure (Learning)</span>;
      case 'Partial Success':
        return <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-900/50 dark:text-blue-200">Partial Success</span>;
      default:
        return <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 dark:bg-gray-800 dark:text-gray-400">Unknown</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
            Experiments
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            A list of all scientific experiments, objectives, and outcomes. Remember, scientific failures are valuable.
          </p>
        </div>
        <div className="mt-4 flex sm:mt-0 sm:ml-4">
          <button className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:ring-gray-700 dark:hover:bg-gray-700 sm:mr-3">
            <Filter className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
            Filter
          </button>
          <button className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
            <Beaker className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            New Experiment
          </button>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg dark:ring-white/10">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Experiment</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Product</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Objective</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Lead</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
                  {mockExperiments.map((exp) => (
                    <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                        <div className="flex flex-col">
                          <span>{exp.number}</span>
                          <span className="text-xs font-normal text-gray-500 dark:text-gray-400">{exp.date}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">{exp.product}</td>
                      <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate" title={exp.objective}>{exp.objective}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{getStatusBadge(exp.status)}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">{exp.leadScientist}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
