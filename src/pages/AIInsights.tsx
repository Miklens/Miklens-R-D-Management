import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, AlertTriangle, TrendingUp, GitMerge, ArrowRight, Pipette, Thermometer, Workflow } from 'lucide-react';

const mockInsights = [
  { 
    id: 1, 
    type: 'Bottleneck', 
    title: 'Repeated Failures Detected in Soil Dispersion', 
    description: 'NemaKill Pro experiments have failed 3 times at the soil dispersion stage. Recommendation: Consult external soil science specialist or adjust surfactant concentration.', 
    impact: 'High', 
    date: 'Today',
    actionLink: '/experiments',
    actionLabel: 'Log New Experiment Trial',
    actionIcon: Pipette
  },
  { 
    id: 2, 
    type: 'Success Pattern', 
    title: 'High Correlation in Fungal Pathology', 
    description: 'Dr. Jenkins recent experiments show a 40% higher bio-efficacy success rate when temperature is held below 22°C. Recommendation: Update BioShield Alpha storage protocol.', 
    impact: 'Medium', 
    date: 'Yesterday',
    actionLink: '/experiments',
    actionLabel: 'Check Stability Testing Operations',
    actionIcon: Thermometer
  },
  { 
    id: 3, 
    type: 'Prediction', 
    title: 'Estimated Completion Delay at Testing Stage', 
    description: 'RootBoost X is tracking 2 weeks behind schedule based on greenhouse milestone completion rates.', 
    impact: 'Low', 
    date: 'Jul 24, 2026',
    actionLink: '/research-log',
    actionLabel: 'Check Scientist Daily Log',
    actionIcon: Workflow
  }
];

export const AIInsights: React.FC = () => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'Bottleneck': return <AlertTriangle className="h-6 w-6 text-red-500" />;
      case 'Success Pattern': return <TrendingUp className="h-6 w-6 text-emerald-500" />;
      case 'Prediction': return <GitMerge className="h-6 w-6 text-indigo-500" />;
      default: return <Sparkles className="h-6 w-6 text-purple-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            AI Insights & Pattern Engine
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Automated analysis of logs, detecting bottlenecks, success patterns, and predicting project timelines.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {mockInsights.map((insight, index) => {
          const ActionIcon = insight.actionIcon;
          return (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              key={insight.id}
              className="flex flex-col rounded-2xl border border-gray-100 dark:border-gray-800 bg-white p-6 shadow-lg dark:bg-gray-900 hover:shadow-xl transition-all"
            >
               <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-800 pb-4">
                  <div className="flex items-center space-x-3">
                     {getIcon(insight.type)}
                     <span className="font-bold text-gray-900 dark:text-white text-base">{insight.type}</span>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold ${
                    insight.impact === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' :
                    insight.impact === 'Medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' :
                    'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                  }`}>
                    {insight.impact} Impact
                  </span>
               </div>
               <div className="mt-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{insight.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {insight.description}
                  </p>
               </div>
               
               <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-800/60 flex flex-wrap items-center justify-between gap-4">
                 <span className="text-xs text-gray-400">
                   Generated {insight.date}
                 </span>
                 <Link
                   to={insight.actionLink}
                   className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold border border-gray-200/60 dark:border-gray-700/60 transition-all"
                 >
                   <ActionIcon className="w-4 h-4" />
                   {insight.actionLabel}
                   <ArrowRight className="w-3.5 h-3.5 ml-1" />
                 </Link>
               </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
