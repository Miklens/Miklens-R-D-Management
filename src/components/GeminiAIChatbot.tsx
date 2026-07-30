import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, RefreshCw, ChevronDown, Award, Beaker } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExperiments } from '../contexts/ExperimentContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const GeminiAIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { experiments, labTests, stabilityLogs, fieldTrials } = useExperiments();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: 'Hello! I am your Gemini AI Scientific & R&D Assistant. Ask me anything about BioShield Alpha formulation chemistry, pathogen inhibition assays, CIPAC heat stability, or scientist daily activity reports.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = (textToSend?: string) => {
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

    // AI Response Synthesizer
    setTimeout(() => {
      let responseText = '';
      const qLower = query.toLowerCase();

      if (qLower.includes('stability') || qLower.includes('cipac') || qLower.includes('heat')) {
        responseText = 'BioShield Alpha passed CIPAC MT 161 accelerated heat stability testing at 54°C for 14 days with 95.8% active metabolite retention, maintaining 6.5 pH and zero phase separation.';
      } else if (qLower.includes('bioshield') || qLower.includes('ph') || qLower.includes('titration') || qLower.includes('viscosity')) {
        responseText = 'BioShield Alpha Volume Makeup & pH Titration Assay (Day #3 completed): Target pH 6.2 achieved using 1M Citric Acid buffer at 1000mL volume makeup with 146 cPs viscosity. Scientific Verdict: PASSED / Approved for Commercial Scale-Up.';
      } else if (qLower.includes('field') || qLower.includes('rust') || qLower.includes('wheat') || qLower.includes('yield')) {
        responseText = 'BioShield Wheat Field Trial in Punjab (50-acre plot): Foliar spray at 3.0 mL/L reduced yellow rust disease incidence by 89.4% (disease index 4.8% vs 45.2% in control). SPAD leaf chlorophyll score reached 48.2 with zero phytotoxicity.';
      } else if (qLower.includes('sarah') || qLower.includes('jenkins') || qLower.includes('microbiologist')) {
        responseText = 'Dr. Sarah Jenkins logged 5.5 hours today across PDA agar plating assays for Botrytis cinerea (91.7% fungal inhibition) and CIPAC 54°C heat stability titration.';
      } else if (qLower.includes('mik') || qLower.includes('management') || qLower.includes('audit')) {
        responseText = 'Dr. Mik logged 4.0 hours today managing the Punjab Wheat Field Plot Trial and compiling the Executive R&D Registration Dossier for commercial launch.';
      } else {
        responseText = `Based on your R&D data for BioShield Alpha: 3 active experiments in progress, 2 passed scientific verdicts, 100% team active. Formulation pH 6.2 at 1000mL volume meets all target viscosity and stability specifications. How else can I assist your laboratory team?`;
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 800);
  };

  const QUICK_PROMPTS = [
    '🧪 BioShield Alpha Stability Status',
    '🧫 Pathogen Assay Inhibition Rate',
    '🌾 Field Wheat Rust Trial Results',
    '📊 Summary of Scientist Work Today',
  ];

  return (
    <>
      {/* Floating Toggle Launcher Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 text-white rounded-full shadow-2xl hover:shadow-purple-500/25 border border-white/20 font-bold text-xs"
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
            className="fixed bottom-22 right-6 z-50 w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col h-[560px]"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-gray-900 to-purple-950 text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-amber-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                    Gemini AI R&D Assistant
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                      LIVE
                    </span>
                  </h3>
                  <p className="text-[11px] text-gray-400">Scientific R&D Intelligence & Audit Assistant</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Prompts Bar */}
            <div className="p-2.5 bg-purple-50/50 dark:bg-purple-950/20 border-b border-purple-100 dark:border-purple-900/30 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt.replace(/^[^\s]+\s*/, ''))}
                  className="px-2.5 py-1 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-900 rounded-full text-[11px] font-semibold text-purple-700 dark:text-purple-300 whitespace-nowrap hover:bg-purple-100/50 transition-colors shrink-0"
                >
                  {prompt}
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
                    className={`max-w-[80%] p-3 rounded-2xl text-xs space-y-1 ${
                      msg.sender === 'user'
                        ? 'bg-emerald-500 text-white rounded-tr-none'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none shadow-sm'
                    }`}
                  >
                    <p className="leading-relaxed font-medium">{msg.text}</p>
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
                  Gemini AI is analyzing R&D data...
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
                placeholder="Ask Gemini AI about experiments, stability..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500/30 font-medium"
              />
              <button
                type="submit"
                disabled={!inputMsg.trim()}
                className="p-2 bg-gradient-to-r from-purple-600 to-emerald-600 text-white rounded-xl font-bold text-xs disabled:opacity-40 hover:opacity-90 transition-opacity"
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
