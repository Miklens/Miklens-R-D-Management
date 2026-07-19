import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, AlertTriangle, TrendingUp, GitMerge } from 'lucide-react';

const mockInsights = [
  { id: 1, type: 'Bottleneck', title: 'Repeated Failures Detected', description: 'NemaKill Pro experiments have failed 3 times at the soil dispersion stage. Recommendation: Consult external soil science specialist or pivot raw material supplier.', impact: 'High', date: 'Today' },
  { id: 2, type: 'Success Pattern', title: 'High Correlation in Fungal Pathology', description: 'Dr. Jenkins recent experiments show a 40% higher success rate when temperature is held below 22°C. Recommendation: Update BioShield Alpha protocol.', impact: 'Medium', date: 'Yesterday' },
  { id: 3, type: 'Prediction', title: 'Estimated Completion Delay', description: 'RootBoost X is tracking 2 weeks behind schedule based on milestone completion rates.', impact: 'Low', date: 'Oct 24, 2023' }
];

export const AIInsights: React.FC = () => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'Bottleneck': return <AlertTriangle className="h-6 w-6 text-red-500" />;
      case 'Success Pattern': return <TrendingUp className="h-6 w-6 text-green-500" />;
      case 'Prediction': return <GitMerge className="h-6 w-6 text-blue-500" />;
      default: return <Sparkles className="h-6 w-6 text-purple-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight flex items-center">
            <Sparkles className="mr-3 h-8 w-8 text-purple-600 dark:text-purple-400" />
            AI Insights Engine
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Automated analysis of logs, detecting bottlenecks, success patterns, and predicting timelines.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {mockInsights.map((insight, index) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            key={insight.id}
            className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
             <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
                <div className="flex items-center space-x-3">
                   {getIcon(insight.type)}
                   <span className="font-semibold text-gray-900 dark:text-white">{insight.type}</span>
                </div>
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                  insight.impact === 'High' ? 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/50 dark:text-red-200' :
                  insight.impact === 'Medium' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-900/50 dark:text-yellow-200' :
                  'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/50 dark:text-blue-200'
                }`}>
                  {insight.impact} Impact
                </span>
             </div>
             <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{insight.title}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {insight.description}
                </p>
             </div>
             <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
               Generated {insight.date}
             </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
