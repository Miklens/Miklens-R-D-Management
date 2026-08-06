import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, RefreshCw, ChevronDown, Download, FileSpreadsheet, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExperiments } from '../contexts/ExperimentContext';
import { useUsers } from '../hooks/useUsers';
import { useDailyLogs } from '../hooks/useDailyLogs';
import { querySuperpoweredGemini } from '../services/geminiEngine';
import { exportMasterExecutiveReportPDF, exportMasterExcelWorkbook } from '../services/executiveReportGenerator';
import { getSyncedTrials } from '../services/trialManagerSync';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  actionButton?: {
    label: string;
    type: 'pdf' | 'excel';
  };
}

export const GeminiAIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [keyStatusInfo, setKeyStatusInfo] = useState<string>('Live Connected');

  const { experiments, labTests, stabilityLogs } = useExperiments();
  const { data: users } = useUsers();
  const { data: logs } = useDailyLogs();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: 'Hello! I am your Superpowered Gemini AI R&D Officer. Connected live to your field trials, daily scientist timesheets, and lab assays. Ask me anything or click a quick action below!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputMsg;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMsg('');
    setIsTyping(true);

    // App Automation Trigger Intercepts
    const qLower = query.toLowerCase();

    if (qLower.includes('export pdf') || qLower.includes('pdf report') || qLower.includes('generate pdf')) {
      const syncedTrials = getSyncedTrials();
      exportMasterExecutiveReportPDF(syncedTrials, (users || []).length, (logs || []).length, logs || []);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: '⚡ **App Automation Triggered**: Master Executive PDF Report has been generated and downloaded to your computer!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionButton: { label: 'Download PDF Report Again', type: 'pdf' },
        },
      ]);
      setIsTyping(false);
      return;
    }

    if (qLower.includes('export excel') || qLower.includes('excel report') || qLower.includes('excel workbook')) {
      const syncedTrials = getSyncedTrials();
      exportMasterExcelWorkbook(syncedTrials, users || [], logs || []);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: '⚡ **App Automation Triggered**: Master 5-Sheet Excel Audit Workbook has been generated and downloaded!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionButton: { label: 'Download Excel Workbook Again', type: 'excel' },
        },
      ]);
      setIsTyping(false);
      return;
    }

    // Call Superpowered Gemini Engine
    const result = await querySuperpoweredGemini(query, {
      users: users || [],
      logs: logs || [],
      experiments: experiments || [],
      labTests: labTests || [],
      stabilityLogs: stabilityLogs || [],
    });

    if (result.keyIndexUsed > 0) {
      setKeyStatusInfo(`Key #${result.keyIndexUsed} (${result.modelUsed})`);
    } else {
      setKeyStatusInfo('Offline Rule Engine');
    }

    const aiMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: result.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, aiMsg]);
    setIsTyping(false);
  };

  const handleActionClick = (type: 'pdf' | 'excel') => {
    const syncedTrials = getSyncedTrials();
    if (type === 'pdf') {
      exportMasterExecutiveReportPDF(syncedTrials, (users || []).length, (logs || []).length, logs || []);
    } else {
      exportMasterExcelWorkbook(syncedTrials, logs || [], users || []);
    }
  };

  const SUPER_ACTION_PROMPTS = [
    { label: '📊 Today Scientist Timesheets', query: 'What did scientists log today?' },
    { label: '📄 Auto-Export PDF Report', query: 'export pdf report' },
    { label: '📈 Auto-Export Excel Audit', query: 'export excel report' },
    { label: '🌿 Active Herbicide Trials', query: 'Give me active herbicide trial progress' },
    { label: '🚀 Product Readiness Audit', query: 'Which products have high efficacy delayed trials ready for launch?' },
  ];

  return (
    <>
      {/* Floating Toggle Launcher Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 text-white rounded-full shadow-2xl hover:shadow-purple-500/25 border border-white/20 font-bold text-xs cursor-pointer"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
          </div>
          <span>Gemini AI Assistant</span>
          {isOpen ? <ChevronDown className="w-4 h-4 ml-1" /> : null}
        </motion.button>
      </div>

      {/* Floating Chatbot Modal Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-22 right-6 z-50 w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col h-[580px]"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-gray-900 to-purple-950 text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-amber-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                    Gemini AI R&D Officer
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                      SUPERPOWERED
                    </span>
                  </h3>
                  <p className="text-[10px] text-gray-300">{keyStatusInfo}</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Shortcuts Bar */}
            <div className="p-2.5 bg-purple-50/50 dark:bg-purple-950/20 border-b border-purple-100 dark:border-purple-900/30 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {SUPER_ACTION_PROMPTS.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleSend(item.query)}
                  className="px-2.5 py-1 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-900 rounded-full text-[11px] font-bold text-purple-700 dark:text-purple-300 whitespace-nowrap hover:bg-purple-100/50 transition-colors shrink-0 cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-gray-50/40 dark:bg-gray-900/40">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      msg.sender === 'user'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-amber-300'
                    }`}
                  >
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs space-y-2 ${
                      msg.sender === 'user'
                        ? 'bg-emerald-500 text-white rounded-tr-none'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none shadow-sm'
                    }`}
                  >
                    <p className="leading-relaxed font-medium whitespace-pre-line">{msg.text}</p>

                    {msg.actionButton && (
                      <button
                        onClick={() => handleActionClick(msg.actionButton!.type)}
                        className="w-full mt-2 py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
                      >
                        {msg.actionButton.type === 'pdf' ? <Download className="w-3.5 h-3.5" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                        {msg.actionButton.label}
                      </button>
                    )}

                    <span
                      className={`text-[9px] block text-right font-mono ${
                        msg.sender === 'user' ? 'text-emerald-100' : 'text-gray-400'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 font-semibold p-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Gemini AI is querying real live database...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask Gemini AI or type 'export pdf'..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500/30 font-medium"
              />
              <button
                type="submit"
                disabled={!inputMsg.trim()}
                className="p-2 bg-gradient-to-r from-purple-600 to-emerald-600 text-white rounded-xl font-bold text-xs disabled:opacity-40 hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
