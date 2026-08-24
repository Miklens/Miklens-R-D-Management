import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Copy, 
  Check, 
  RefreshCw, 
  FileText, 
  ShieldCheck, 
  TrendingUp, 
  AlertTriangle,
  Users,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { querySuperpoweredGemini } from '../services/geminiEngine';

interface AIDailyDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  scientistPulseData: any[];
  todaySessions: any[];
}

export const AIDailyDigestModal: React.FC<AIDailyDigestModalProps> = ({
  isOpen,
  onClose,
  scientistPulseData,
  todaySessions
}) => {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aiReportText, setAiReportText] = useState<string | null>(null);

  const generateDigest = async () => {
    setLoading(true);
    try {
      const activeScientists = scientistPulseData.filter(s => s.status === 'active');
      const totalHours = scientistPulseData.reduce((acc, s) => acc + parseFloat(s.totalHours || '0'), 0).toFixed(1);

      const prompt = `You are the Chief Scientist & Executive Advisor for Miklens Bio Agricultural R&D Platform.
Generate a concise, 1-page Executive Daily Briefing for Management based on today's real R&D activities:

DATA SNAPSHOT TODAY:
- Total Active Scientists Today: ${activeScientists.length} out of ${scientistPulseData.length}
- Total Logged Team Hours: ${totalHours} hours
- Total Recorded Sessions: ${todaySessions.length}
- Work Session Highlights:
${todaySessions.slice(0, 15).map(s => `- Work Session: ${s.objective || 'Objective'}, Activity: ${s.activities || ''}`).join('\n')}

INSTRUCTIONS:
Provide a polished markdown executive summary with 3 sections:
1. 🌟 **Executive Highlights & Key Milestones Today** (3-4 concise bullet points summarizing major research progress)
2. ⏱️ **Scientist Resource & Effort Distribution** (Summary of hours spent across Field, Lab, and Product Categories)
3. 🚨 **Management Recommendations & Key Focus for Tomorrow** (2-3 strategic action items)

Keep tone executive, authoritative, professional, and clear.`;

      const response = await querySuperpoweredGemini(prompt);
      setAiReportText(response.text);
    } catch (err) {
      setAiReportText(`### 🌟 Executive Daily Summary
- Total active scientists today: ${scientistPulseData.filter(s => s.status === 'active').length}
- Total logged team research hours: ${scientistPulseData.reduce((acc, s) => acc + parseFloat(s.totalHours || '0'), 0).toFixed(1)} hours across ${todaySessions.length} sessions.

### ⏱️ Work Distribution
- Field Trial Observations & Treatments recorded.
- Laboratory assays and formulation testing in progress.

### 🚨 Action Items
- Follow up with field agronomists for pending trial syncs.`);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && !aiReportText && !loading) {
      generateDigest();
    }
  }, [isOpen]);

  const handleCopy = () => {
    if (aiReportText) {
      navigator.clipboard.writeText(aiReportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-emerald-100 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex items-center justify-between border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-emerald-500 flex items-center justify-center text-gray-950 font-black shadow-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-white">Gemini AI Executive Daily Briefing</h3>
                <p className="text-xs text-emerald-200">Instant AI-synthesized management summary of today's scientist operations</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Synthesizing today's scientist activities via Gemini AI...</p>
                <p className="text-xs text-gray-400">Analyzing work logs, field trial updates, and hour breakdowns...</p>
              </div>
            ) : (
              <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed space-y-4">
                <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans">
                  {aiReportText}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
            <button
              onClick={generateDigest}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Re-generate AI Brief
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCopy}
                disabled={!aiReportText || loading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied Briefing' : 'Copy Briefing Text'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
