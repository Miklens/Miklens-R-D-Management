import React, { useState } from 'react';
import { ExternalFieldTrial, ExternalTrialPhoto } from '../types/trialIntegrationTypes';
import { MapPin, Calendar, User, ShieldCheck, Activity, Award, Image as ImageIcon, ChevronRight, Download, Maximize2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  trial: ExternalFieldTrial;
  onOpenPhoto?: (photo: ExternalTrialPhoto) => void;
}

export const FieldTrialCard: React.FC<Props> = ({ trial, onOpenPhoto }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<ExternalTrialPhoto | null>(null);

  const latestEval = trial.evaluations[trial.evaluations.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xl space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-xl text-xs font-black bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-mono">
              {trial.trialCode}
            </span>
            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              {trial.designType} Design
            </span>
            <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              ⚡ Synced from Trial Manager
            </span>
          </div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white mt-2">{trial.title}</h3>
        </div>

        <div className="text-right flex sm:flex-col items-center sm:items-end justify-between gap-2">
          <span className={`px-3 py-1 rounded-xl text-xs font-black ${
            trial.status === 'Completed'
              ? 'bg-emerald-500 text-white'
              : 'bg-amber-500 text-white'
          }`}>
            {trial.status}
          </span>
          <span className="text-[11px] text-gray-400 font-medium">Synced: {trial.syncedAt ? trial.syncedAt.split('T')[0] : 'Just now'}</span>
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
        <div>
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Crop & Plot</span>
          <p className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">{trial.cropName}</p>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Target Disease / Weed</span>
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{trial.targetWeedOrPathogen}</p>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Location</span>
          <p className="text-xs font-bold text-gray-900 dark:text-white mt-0.5 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-red-500 shrink-0" /> {trial.location}
          </p>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Lead Agronomist</span>
          <p className="text-xs font-bold text-gray-900 dark:text-white mt-0.5 flex items-center gap-1">
            <User className="w-3 h-3 text-purple-500 shrink-0" /> {trial.scientistName}
          </p>
        </div>
      </div>

      {/* Latest Evaluation & Metrics */}
      {latestEval && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-100 dark:border-emerald-900/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-black text-emerald-800 dark:text-emerald-200">
                Latest Evaluation ({latestEval.daysAfterTreatment} Days After Treatment - {latestEval.evalDate})
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
              "{latestEval.notes}"
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-center px-4 py-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-emerald-200 dark:border-emerald-800">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Control Efficacy</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{latestEval.efficacyPercent}%</span>
            </div>
            <div className="text-center px-4 py-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-emerald-200 dark:border-emerald-800">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Phytotoxicity</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{latestEval.phytotoxicityScore} / 10</span>
            </div>
          </div>
        </div>
      )}

      {/* Summary Conclusion */}
      {trial.summaryConclusion && (
        <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 space-y-1">
          <span className="text-[11px] font-black text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" /> Scientific Trial Verdict
          </span>
          <p className="text-xs text-gray-800 dark:text-gray-200 font-medium leading-relaxed">
            {trial.summaryConclusion}
          </p>
        </div>
      )}

      {/* Google Drive Photos Section */}
      {trial.photos && trial.photos.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-emerald-500" />
              Google Drive Field Photos ({trial.photos.length})
            </span>
            <span className="text-[10px] text-gray-400 font-medium">Click thumbnail to view full resolution</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {trial.photos.map(photo => (
              <div
                key={photo.id}
                onClick={() => onOpenPhoto ? onOpenPhoto(photo) : setSelectedPhoto(photo)}
                className="group relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 aspect-video cursor-pointer shadow-sm hover:shadow-md transition-all"
              >
                <img
                  src={photo.url}
                  alt={photo.caption || 'Trial Photo'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90 p-2.5 flex flex-col justify-between">
                  <div className="flex justify-end">
                    <span className="p-1 rounded-lg bg-black/40 text-white backdrop-blur-sm group-hover:bg-emerald-500 transition-colors">
                      <Maximize2 className="w-3 h-3" />
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded font-mono block w-max mb-0.5">
                      {photo.treatmentName || 'Field Evidence'}
                    </span>
                    <p className="text-[10px] text-white font-medium line-clamp-1">{photo.caption}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Internal Modal Preview if clicked inline */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="max-w-3xl w-full bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 p-4 space-y-3" onClick={e => e.stopPropagation()}>
            <img src={selectedPhoto.url} alt={selectedPhoto.caption} className="w-full max-h-[70vh] object-contain rounded-2xl" />
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-xs font-bold text-emerald-400">{selectedPhoto.treatmentName}</p>
                <p className="text-sm font-semibold">{selectedPhoto.caption}</p>
              </div>
              <button onClick={() => setSelectedPhoto(null)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
