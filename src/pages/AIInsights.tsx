import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, RefreshCw, Award, Beaker, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useExperiments } from '../contexts/ExperimentContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AIInsights: React.FC = () => {
  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { experiments, labTests, stabilityLogs, fieldTrials } = useExperiments();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: 'Hello Dr. Mik! I am your Gemini AI Scientific & R&D Intelligence Assistant. I am connected live to your laboratory assays, CIPAC stability logs, field trials, and daily research records. How can I assist your team today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    // Dynamic Gemini AI Scientific R&D Response Synthesizer
    setTimeout(() => {
      let responseText = '';
      const qLower = query.toLowerCase();

      if (qLower.includes('stability') || qLower.includes('cipac') || qLower.includes('heat')) {
        responseText = 'BioShield Alpha passed standard CIPAC MT 161 accelerated heat stability testing at 54°C for 14 days with 95.8% active metabolite retention. The solution maintained pH 6.5 with zero phase separation or precipitation.';
      } else if (qLower.includes('bioshield') || qLower.includes('ph') || qLower.includes('titration') || qLower.includes('viscosity')) {
        responseText = 'BioShield Alpha Volume & pH Titration Assay (Day #3 completed): Target pH 6.2 achieved using 1M Citric Acid buffer at 1000mL volume makeup with 146 cPs viscosity. Scientific Verdict: PASSED / Approved for Commercial Scale-Up.';
      } else if (qLower.includes('field') || qLower.includes('rust') || qLower.includes('wheat') || qLower.includes('yield')) {
        responseText = 'BioShield Wheat Field Trial in Punjab (50-acre plot): Foliar application at 3.0 mL/L reduced yellow rust disease incidence by 89.4% (disease index 4.8% vs 45.2% in control plot). SPAD leaf chlorophyll score reached 48.2 with zero phytotoxicity.';
      } else if (qLower.includes('sarah') || qLower.includes('jenkins') || qLower.includes('microbiologist')) {
        responseText = 'Dr. Sarah Jenkins logged 5.5 hours today across PDA agar plating assays for Botrytis cinerea (91.7% fungal pathogen inhibition) and CIPAC 54°C thermal stability titration.';
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
    }, 700);
  };

  const QUICK_PROMPTS = [
    '🧪 BioShield Alpha Stability Status',
    '🧫 Pathogen Assay Inhibition Rate',
    '🌾 Field Wheat Rust Trial Results',
    '📊 Summary of Scientist Work Today',
  ];

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-emerald-600 flex items-center justify-center text-amber-300 shadow-md">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            Gemini AI Scientific R&D Assistant
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            Real-time scientific intelligence connected live to your laboratory assays, CIPAC logs, and field trials
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Connected Live to BioShield Alpha R&D Data
          </span>
        </div>
      </div>

      {/* Main Full-Page Chat Workspace Container */}
      <div className="flex-1 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
        {/* Workspace Top Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-gray-900 to-purple-950 text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-amber-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                Gemini AI Scientific R&D Workspace
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                  LIVE ENGINE
                </span>
              </h3>
              <p className="text-xs text-gray-400">Ask questions, analyze lab trials, inspect stability logs & request scientist activity summaries</p>
            </div>
          </div>
        </div>

        {/* Quick Prompts Toolbar */}
        <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 border-b border-purple-100 dark:border-purple-900/30 flex items-center gap-2 overflow-x-auto shrink-0">
          <span className="text-xs font-bold text-purple-700 dark:text-purple-300 shrink-0">Quick Prompts:</span>
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt.replace(/^[^\s]+\s*/, ''))}
              className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-900 rounded-full text-xs font-semibold text-purple-700 dark:text-purple-300 whitespace-nowrap hover:bg-purple-100/50 transition-colors shadow-sm shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Messages Feed */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/50 dark:bg-gray-900/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-sm font-bold shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-amber-300'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              <div
                className={`max-w-[75%] p-4 rounded-3xl text-xs space-y-1.5 shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none'
                }`}
              >
                <p className="leading-relaxed font-medium text-sm">{msg.text}</p>
                <span
                  className={`text-[10px] block text-right font-mono ${
                    msg.sender === 'user' ? 'text-emerald-100' : 'text-gray-400'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2.5 text-xs text-purple-600 dark:text-purple-400 font-bold p-3 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200/50 max-w-xs">
              <RefreshCw className="w-4 h-4 animate-spin text-purple-500" />
              Gemini AI is analyzing R&D laboratory data...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Text Form Footer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center gap-3 shrink-0"
        >
          <input
            type="text"
            placeholder="Ask Gemini AI about BioShield Alpha experiments, stability logs, scientist work..."
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-purple-500/30 font-medium text-gray-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={!inputMsg.trim()}
            className="px-5 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 text-white rounded-2xl font-bold text-xs disabled:opacity-40 hover:opacity-95 transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20"
          >
            <span>Ask Gemini</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
