import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createDailyLog } from '../services/researchLogs';
import { addLog } from '../services/localStore';
import { isFirebaseConfigured } from '../config/firebase';
import { Button } from '../components/ui/Button';
import { PRODUCTS, getExperimentsForProduct } from '../constants';

const logSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  experimentId: z.string().min(1, 'Experiment is required'),
  objective: z.string().min(10, 'Objective must be at least 10 characters'),
  activities: z.string().min(10, 'Describe the activities performed'),
  problems: z.string().optional(),
  achievements: z.string().optional(),
  timeSpent: z.number().min(5, 'Minimum 5 minutes').max(600, 'Maximum 10 hours'),
  completionStatus: z.enum(['InProgress', 'Completed', 'Blocked']),
  confidenceLevel: z.number().min(1).max(100)
});

type LogFormValues = z.infer<typeof logSchema>;

export const ResearchLog: React.FC = () => {
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { currentUser, profile } = useAuth();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, reset } = useForm<LogFormValues>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      completionStatus: 'InProgress',
      confidenceLevel: 80,
      timeSpent: 60
    }
  });

  const selectedProductId = watch('productId');
  const availableExperiments = useMemo(
    () => (selectedProductId ? getExperimentsForProduct(selectedProductId) : []),
    [selectedProductId]
  );

  const onSubmit = async (data: LogFormValues) => {
    try {
      const userId = currentUser?.uid || profile?.id || 'unknown-user';

      if (!isFirebaseConfigured) {
        // Persist to the local demo data store so the log actually shows up
        // in Team Activity / Employee Profile without needing Firebase set up.
        addLog({
          userId,
          productId: data.productId,
          experimentId: data.experimentId,
          objective: data.objective,
          activities: data.activities,
          problems: data.problems,
          achievements: data.achievements,
          timeSpentMinutes: data.timeSpent,
          completionStatus: data.completionStatus,
          confidenceLevel: data.confidenceLevel,
        });
        await new Promise(resolve => setTimeout(resolve, 400));
      } else {
        // Real persistence to Firestore
        await createDailyLog(userId, {
          productId: data.productId,
          experimentId: data.experimentId,
          todaysObjective: data.objective,
          activitiesPerformed: data.activities,
          observations: '', // Would come from future fields
          problems: data.problems || '',
          achievements: data.achievements || '',
          nextSteps: '',
          timeSpentMinutes: data.timeSpent,
          completionStatus: data.completionStatus,
          estimatedProductStage: 'Lab Testing', // Default for now
          confidenceLevel: data.confidenceLevel
        });
      }

      setSubmitStatus('success');
      reset();
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } catch (err) {
      console.error("Failed to save log:", err);
      setSubmitStatus('error');
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
          Daily Research Log
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Complete this log in under 5 minutes. The AI engine will automatically generate reports and insights.
        </p>
      </div>

      {submitStatus === 'success' && (
        <div className="flex items-center space-x-2 rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/50 dark:text-green-200">
          <CheckCircle2 className="h-5 w-5" />
          <span>Log successfully saved. AI analysis has begun.</span>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="flex items-center space-x-2 rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/50 dark:text-red-200">
          <AlertCircle className="h-5 w-5" />
          <span>Failed to save log. Please try again.</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">

        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product</label>
            <div className="mt-1">
              <select {...register('productId')} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                <option value="">Select a product</option>
                {PRODUCTS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {errors.productId && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.productId.message}</p>}
            </div>
          </div>

          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Experiment</label>
            <div className="mt-1">
              <select {...register('experimentId')} disabled={!selectedProductId} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white disabled:opacity-50">
                <option value="">{selectedProductId ? 'Select an experiment' : 'Select a product first'}</option>
                {availableExperiments.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
              {errors.experimentId && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.experimentId.message}</p>}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Today's Objective</label>
            <div className="mt-1">
              <input type="text" {...register('objective')} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              {errors.objective && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.objective.message}</p>}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Activities Performed</label>
            <div className="mt-1">
              <textarea {...register('activities')} rows={3} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              {errors.activities && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.activities.message}</p>}
            </div>
          </div>

          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Problems Encountered (Optional)</label>
            <div className="mt-1">
              <textarea {...register('problems')} rows={2} placeholder="Scientific failures are valuable..." className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
            </div>
          </div>

          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Achievements (Optional)</label>
            <div className="mt-1">
              <textarea {...register('achievements')} rows={2} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
            </div>
          </div>

          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
            <div className="mt-1">
              <select {...register('completionStatus')} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                <option value="InProgress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>
          </div>

          <div className="sm:col-span-1 flex space-x-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time (mins)</label>
              <div className="mt-1">
                <input type="number" {...register('timeSpent', { valueAsNumber: true })} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                {errors.timeSpent && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.timeSpent.message}</p>}
              </div>
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confidence (%)</label>
              <div className="mt-1">
                <input type="number" {...register('confidenceLevel', { valueAsNumber: true })} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                {errors.confidenceLevel && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.confidenceLevel.message}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-5 flex justify-end space-x-3">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Saving...' : 'Save Log'}
          </Button>
        </div>
      </form>
    </div>
  );
};
