import React, { useState } from 'react';
import { FileText, Download, Clock, Plus, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Analytics } from './Analytics';
import { TeamActivity } from './TeamActivity';
import { AIInsights } from './AIInsights';
import { AuditLogs } from './AuditLogs';

const INITIAL_REPORTS = [
  {
    id: 'r1',
    title: 'Weekly Executive R&D Summary',
    type: 'Executive',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: 'Generated',
    size: '2.4 MB'
  },
  {
    id: 'r3',
    title: 'Q3 Research Department Stability Analysis',
    type: 'Department',
    date: 'Jul 01, 2026',
    status: 'Generated',
    size: '3.8 MB'
  }
];

export const Reports: React.FC = () => {
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'reports' | 'analytics' | 'team' | 'ai' | 'audit'>('reports');

  const handleGenerateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const newReport = {
        id: `r-${Date.now()}`,
        title: `Custom R&D Health Audit (${new Date().toLocaleDateString()})`,
        type: 'Custom AI',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'Generated',
        size: '1.8 MB'
      };
      setReports([newReport, ...reports]);
      setIsGenerating(false);
    }, 1800);
  };

  const handleDownload = (id: string, title: string) => {
    setDownloadingId(id);
    setTimeout(() => {
      // Simulate file download
      const element = document.createElement("a");
      const file = new Blob([`Miklens R&D Management Report: ${title}\nGenerated on ${new Date().toISOString()}\n\nContent: All parameters verified. Efficacy targets reached.`], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `${title.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      setDownloadingId(null);
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Executive Insights & Governance Suite</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Unified executive reporting, department analytics, team activity tracking, and compliance logs</p>
        </div>
        {activeTab === 'reports' && (
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                Generating Audit...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-200" />
                Generate Custom Report
              </>
            )}
          </button>
        )}
      </div>

      {/* Executive Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'reports'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          Reports & Audits
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'analytics'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          R&D Performance Analytics
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'team'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          Team Activity & Live Work
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'ai'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          AI Bottleneck Insights
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'audit'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          System Audit Logs
        </button>
      </div>

      {activeTab === 'analytics' ? (
        <Analytics />
      ) : activeTab === 'team' ? (
        <TeamActivity />
      ) : activeTab === 'ai' ? (
        <AIInsights />
      ) : activeTab === 'audit' ? (
        <AuditLogs />
      ) : (
        <>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report, index) => (
          <motion.div 
            key={report.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white p-6 shadow-lg dark:bg-gray-900 hover:shadow-xl transition-all"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                  <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  report.status === 'Generated'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                }`}>
                  {report.status}
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">{report.title}</h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{report.type} Report • {report.date}</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
              <span className="text-xs font-mono text-gray-400">{report.size}</span>
              <button
                onClick={() => handleDownload(report.id, report.title)}
                disabled={downloadingId === report.id}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
              >
                {downloadingId === report.id ? (
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                Download Report
              </button>
            </div>
          </motion.div>
        ))}
      </div>
        </>
      )}
    </div>
  );
};
