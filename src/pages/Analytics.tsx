import React from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const progressData = [
  { month: 'Jan', index: 6.5 },
  { month: 'Feb', index: 6.8 },
  { month: 'Mar', index: 7.2 },
  { month: 'Apr', index: 7.1 },
  { month: 'May', index: 7.9 },
  { month: 'Jun', index: 8.4 },
];

const departmentData = [
  { name: 'Research', tasks: 120, completed: 110 },
  { name: 'Formulation', tasks: 85, completed: 70 },
  { name: 'Field Trials', tasks: 40, completed: 35 },
  { name: 'Lab Testing', tasks: 90, completed: 85 },
];

const experimentStatusData = [
  { name: 'Success', value: 45 },
  { name: 'Partial Success', value: 30 },
  { name: 'Failure (Learning)', value: 25 },
];

const COLORS = ['#22c55e', '#3b82f6', '#f97316'];

export const Analytics: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
          Analytics & Insights
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Deep dive into R&D performance metrics and innovation tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Innovation Index Trend */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-6 text-lg font-medium text-gray-900 dark:text-white">Innovation Index Trend</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIndex" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} domain={[5, 10]} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Area type="monotone" dataKey="index" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorIndex)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Experiment Outcomes */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-6 text-lg font-medium text-gray-900 dark:text-white">Experiment Outcomes (YTD)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={experimentStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {experimentStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Performance */}
        <div className="col-span-1 rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-6 text-lg font-medium text-gray-900 dark:text-white">Department Research Activity</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Legend />
                <Bar dataKey="tasks" name="Active Experiments" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed Logs" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
