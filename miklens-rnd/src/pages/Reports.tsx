import React from 'react';
import { FileText, Download, Clock } from 'lucide-react';

const mockReports = [
  {
    id: 'r1',
    title: 'Weekly Executive Summary',
    type: 'Executive',
    date: 'Oct 20, 2023',
    status: 'Generated',
    size: '2.4 MB'
  },
  {
    id: 'r2',
    title: 'BioShield Alpha Monthly Progress',
    type: 'Product',
    date: 'Oct 01, 2023',
    status: 'Generated',
    size: '5.1 MB'
  },
  {
    id: 'r3',
    title: 'Q3 Research Department Analysis',
    type: 'Department',
    date: 'Oct 01, 2023',
    status: 'Generating...',
    size: '--'
  }
];

export const Reports: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
            AI Generated Reports
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Automated insights and summaries generated from daily logs and experiment data.
          </p>
        </div>
        <button className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
          Generate Custom Report
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {mockReports.map((report) => (
          <div key={report.id} className="relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/50">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                report.status === 'Generated'
                  ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/50 dark:text-green-200'
                  : 'bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-900/50 dark:text-yellow-200'
              }`}>
                {report.status === 'Generating...' && <Clock className="mr-1 h-3 w-3 animate-spin" />}
                {report.status}
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{report.title}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{report.type} Report • {report.date}</p>
            </div>
            <div className="mt-6 flex flex-1 items-end justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">{report.size}</span>
              <button
                disabled={report.status !== 'Generated'}
                className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Download className="mr-1.5 h-4 w-4" />
                Download PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
