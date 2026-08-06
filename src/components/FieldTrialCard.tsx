import React, { useState } from 'react';
import { ExternalFieldTrial, ExternalTrialPhoto, TrialCategory } from '../types/trialIntegrationTypes';
import {
  MapPin, Calendar, User, ShieldCheck, Activity, Award, Image as ImageIcon,
  Maximize2, Leaf, Shield, Bug, Beaker, Sprout, ChevronRight, CheckCircle2,
  Clock, Flame, Layers
} from 'lucide-react';
import { motion } from 'framer-motion';

// Result Badge styling matching Trial Manager
const RESULT_STYLES: Record<string, string> = {
  'Excellent': 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  'Good': 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  'Fair': 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  'Poor': 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
  'Control': 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
};

// Category metadata
const CATEGORY_META: Record<TrialCategory, {
  icon: React.ElementType;
  color: string;
  badgeBg: string;
  badgeText: string;
  label: string;
}> = {
  herbicide: { icon: Leaf, color: '#059669', badgeBg: 'bg-emerald-100 dark:bg-emerald-950', badgeText: 'text-emerald-700 dark:text-emerald-300', label: 'Herbicide' },
  fungicide: { icon: Shield, color: '#4f46e5', badgeBg: 'bg-indigo-100 dark:bg-indigo-950', badgeText: 'text-indigo-700 dark:text-indigo-300', label: 'Fungicide' },
  pesticide: { icon: Bug, color: '#dc2626', badgeBg: 'bg-red-100 dark:bg-red-950', badgeText: 'text-red-700 dark:text-red-300', label: 'Pesticide' },
  nutrition: { icon: Beaker, color: '#d97706', badgeBg: 'bg-amber-100 dark:bg-amber-950', badgeText: 'text-amber-700 dark:text-amber-300', label: 'Nutrition' },
  biostimulant: { icon: Sprout, color: '#0d9488', badgeBg: 'bg-teal-100 dark:bg-teal-950', badgeText: 'text-teal-700 dark:text-teal-300', label: 'Biostimulant' },
};

interface Props {
  trial: ExternalFieldTrial;
  onOpenPhoto?: (photo: ExternalTrialPhoto) => void;
}

export const FieldTrialCard: React.FC<Props> = ({ trial, onOpenPhoto }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<ExternalTrialPhoto | null>(null);
  const [showGallery, setShowGallery] = useState(false);

  const latestEval = trial.evaluations[trial.evaluations.length - 1];
  const catMeta = CATEGORY_META[trial.category] || CATEGORY_META.herbicide;
  const CatIcon = catMeta.icon;

  const resultStyle = RESULT_STYLES[trial.resultRating || ''] || 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';

  // Format date for display matching Trial Manager (e.g. 30 07 2026 11:03 AM or 2026-07-30)
  const displayDateStr = trial.rawDateStr || trial.startDate || '';

  // Coordinates text
  const locationText = trial.lat && trial.lon
    ? `${trial.lat}, ${trial.lon}`
    : trial.location;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-lg transition-all flex flex-col justify-between space-y-3 relative group"
    >
      {/* Top Header Row */}
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          {/* Main Title / Formulation Name */}
          <h4 className="text-sm font-black text-gray-900 dark:text-white leading-tight">
            {trial.title || trial.productName || 'Untitled Trial'}
            {trial.productName && trial.title && trial.productName.trim().toLowerCase() !== trial.title.trim().toLowerCase() && trial.productName !== 'Treatment Formulation' && (
              <span className="block text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                Product: {trial.productName}
              </span>
            )}
          </h4>

          {/* Live Status Indicator */}
          {trial.isLive !== false && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          )}
        </div>

        {/* Status & Type Badges Row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {trial.isCompleted && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Finalized
            </span>
          )}
          {trial.isBaseline && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              Baseline
            </span>
          )}
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
            {trial.projectId ? 'Project-Grouped' : 'Standard'}
          </span>
          <span 
            className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-100 dark:border-purple-900 cursor-help"
            title={trial.designType === 'RCBD' ? 'Randomized Complete Block Design (Highly standard layout that isolates field variability)' : 'Completely Randomized Design (Uniform control layout)'}
          >
            Layout: {trial.designType}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${catMeta.badgeBg} ${catMeta.badgeText} flex items-center gap-1`}>
            <CatIcon className="w-2.5 h-2.5" />
            {catMeta.label}
          </span>

        </div>
      </div>

      {/* Primary Attributes (Timestamp, Location, Dosage, Target) */}
      <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300 pt-1 border-t border-gray-100 dark:border-gray-800">
        {/* Date & Time */}
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
          <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>{displayDateStr}</span>
        </div>

        {/* Location / Lat-Lon */}
        {locationText && (
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate">
            <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span className="truncate">{locationText}</span>
          </div>
        )}

        {/* Dosage */}
        {trial.dosage && (
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700 dark:text-gray-200">
            <Beaker className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>{trial.dosage}</span>
          </div>
        )}

        {/* Target Species / Disease / Pest */}
        {trial.targetWeedOrPathogen && (
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 line-clamp-2 leading-tight pt-0.5">
            {trial.targetWeedOrPathogen}
          </p>
        )}

        {/* Control Efficacy Duration / Status */}
        {latestEval && (
          <div 
            className="flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400 pt-0.5 cursor-help"
            title={`DAT: Days After Treatment. Efficacy: ${latestEval.efficacyPercent}% reduction of weed/disease. Crop safety score is calculated from phytotoxicity index (higher safety is better).`}
          >
            <Activity className="w-3.5 h-3.5 shrink-0" />
            <span>{latestEval.daysAfterTreatment} Days Post-spray: {latestEval.efficacyPercent}% Control (Safety: {Math.max(0, 10 - (latestEval.phytotoxicityScore || 0)) * 10}/100)</span>
          </div>
        )}

      </div>

      {/* Result Rating & Observation Count Bar */}
      <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {/* Result Badge */}
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${resultStyle}`}>
            {trial.resultRating || 'Unrated'}
          </span>

          {/* Evaluations / Observations Count Badge */}
          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
            {trial.evaluations.length} obs
          </span>
        </div>

        <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 truncate max-w-[100px]">
          👤 {trial.scientistName.split(' ')[0]}
        </span>
      </div>

      {/* Action Footer Buttons */}
      <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-1 text-xs">
        <button
          onClick={() => trial.photos.length > 0 && (onOpenPhoto ? onOpenPhoto(trial.photos[0]) : setSelectedPhoto(trial.photos[0]))}
          disabled={!trial.photos || trial.photos.length === 0}
          className="flex items-center gap-1 text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:text-emerald-600 disabled:opacity-40 disabled:hover:text-gray-600 transition-colors"
        >
          <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
          Photo ({trial.photos.length})
        </button>

        {trial.photos.length > 0 && (
          <button
            onClick={() => setShowGallery(prev => !prev)}
            className="flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-700 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            Gallery
          </button>
        )}
      </div>

      {/* Gallery Expand Grid */}
      {showGallery && trial.photos.length > 0 && (
        <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 space-y-1.5 pt-2">
          <div className="grid grid-cols-3 gap-1.5">
            {trial.photos.map(p => (
              <img
                key={p.id}
                src={p.url}
                alt={p.caption || 'Field Photo'}
                onClick={() => onOpenPhoto ? onOpenPhoto(p) : setSelectedPhoto(p)}
                className="w-full aspect-square object-cover rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:scale-105 transition-transform"
              />
            ))}
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="max-w-2xl w-full bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 p-4 space-y-3" onClick={e => e.stopPropagation()}>
            <img src={selectedPhoto.url} alt={selectedPhoto.caption} className="w-full max-h-[70vh] object-contain rounded-2xl" />
            <div className="flex items-center justify-between text-white text-xs">
              <div>
                <p className="font-bold text-emerald-400">{selectedPhoto.treatmentName}</p>
                <p className="text-gray-300">{selectedPhoto.caption}</p>
              </div>
              <button onClick={() => setSelectedPhoto(null)} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
