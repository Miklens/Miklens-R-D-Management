import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sparkles, Send, Bot, User, RefreshCw, Award, Beaker, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useExperiments } from '../contexts/ExperimentContext';
import { getSyncedTrials } from '../services/trialManagerSync';
import { useUsers } from '../hooks/useUsers';
import { useDailyLogs } from '../hooks/useDailyLogs';
import { querySuperpoweredGemini } from '../services/geminiEngine';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AIInsights: React.FC = () => {
  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { experiments, labTests, stabilityLogs } = useExperiments();
  const { data: users } = useUsers();
  const { data: logs } = useDailyLogs();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const formatName = (name: string) => {
    if (!name) return 'Scientist';
    return name.includes('@') ? name.split('@')[0] : name;
  };

  const syncedTrials = useMemo(() => getSyncedTrials(), []);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: 'Hello! I am your Gemini AI R&D Management Assistant. I am connected live to your synced trial manager database, active laboratory formulations, and daily notes. Ask me anything about scientists, categories, completed projects, or delayed trials!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const [apiKeysList, setApiKeysList] = useState<string[]>(() => {
    const saved = localStorage.getItem('gemini_api_keys_pool');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    const single = localStorage.getItem('gemini_api_key');
    return single ? [single] : [];
  });
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('gemini_selected_model') || 'gemini-2.5-flash');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keysInputText, setKeysInputText] = useState('');
  const [activeKeyInfo, setActiveKeyInfo] = useState<string | null>(null);

  const FREE_GEMINI_MODELS = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Best All-Round & Stable)', desc: 'Recommended default' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite (Ultra Fast & Lightweight)', desc: 'Fastest response' },
    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash-Lite (Frontier Lightweight)', desc: 'Next-Gen Fast' },
    { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Frontier Intelligence)', desc: 'High intelligence' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Deep Scientific Reasoning)', desc: 'Complex reasoning' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Next-Gen Speed)', desc: 'High speed' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Legacy Stable)', desc: 'Standard fallback' },
  ];

  const handleSend = async (textToSend?: string) => {
    const queryStr = textToSend || inputMsg;
    if (!queryStr.trim()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: queryStr.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMsg('');
    setIsTyping(true);

    // Call Superpowered Gemini Engine with full DB Context & selected model
    const result = await querySuperpoweredGemini(
      queryStr,
      {
        users: users || [],
        logs: logs || [],
        experiments: experiments || [],
        labTests: labTests || [],
        stabilityLogs: stabilityLogs || [],
      },
      selectedModel
    );

    if (result.keyIndexUsed > 0) {
      setActiveKeyInfo(`Key #${result.keyIndexUsed} (${result.modelUsed})`);
    } else {
      setActiveKeyInfo('Offline Intelligent Engine');
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: result.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setIsTyping(false);
  };

  const QUICK_PROMPTS = [
    '⏱️ Today\'s Scientist Logged Hours',
    '👩‍🔬 Audit Bindushree\'s Work Logs',
    '🧪 Active Herbicides & Weed Control',
    '📊 Scientist Performance Rankings',
    '🚨 High Efficacy Delayed Trials',
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
          <button
            type="button"
            onClick={() => {
              setKeysInputText(apiKeysList.join('\n'));
              setShowKeyModal(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>🔑 {apiKeysList.length > 0 ? `${apiKeysList.length} API Key(s) Pool Active` : 'Configure Gemini API Key Pool'}</span>
          </button>
        </div>
      </div>

      {/* API Key Pool & Model Selector Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="font-extrabold text-gray-900 dark:text-white text-base flex items-center gap-2">
                <span>🔑</span> Google Gemini Multi-Key Pool & Model Engine
              </h3>
              <button onClick={() => setShowKeyModal(false)} className="text-gray-400 hover:text-gray-600 text-sm font-bold">✕</button>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 rounded-2xl text-xs space-y-1">
              <p className="font-bold text-purple-900 dark:text-purple-200">
                🔄 Automatic Key Rollover & Token Budget Control:
              </p>
              <p className="text-purple-700 dark:text-purple-300">
                Paste up to **10 Gemini API Keys** (one per line). When one key reaches its free daily quota or rate limits (429/403), the engine automatically rolls over to the next key without crashing! Prompts are optimized to minimize token consumption.
              </p>
            </div>

            {/* Select Free Model */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Select Google Gemini Model</label>
              <select
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  localStorage.setItem('gemini_selected_model', e.target.value);
                }}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-500/30"
              >
                {FREE_GEMINI_MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Keys Pool Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Gemini API Keys Pool (Up to 10 Keys — 1 per line)
                </label>
                <span className="text-[10px] text-gray-400 font-mono">
                  {keysInputText.split('\n').filter(k => k.trim()).length} Key(s) Entered
                </span>
              </div>
              <textarea
                rows={5}
                placeholder="AIzaSyKey1...&#10;AIzaSyKey2...&#10;AIzaSyKey3..."
                value={keysInputText}
                onChange={(e) => setKeysInputText(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                ⚡ Token Saver Enabled (Max 450 Output Tokens)
              </span>
              <div className="flex items-center gap-2">
                {apiKeysList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('gemini_api_keys_pool');
                      localStorage.removeItem('gemini_api_key');
                      setApiKeysList([]);
                      setKeysInputText('');
                      setShowKeyModal(false);
                    }}
                    className="px-3.5 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100"
                  >
                    Clear All Keys
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const keys = keysInputText.split('\n').map(k => k.trim()).filter(Boolean);
                    localStorage.setItem('gemini_api_keys_pool', JSON.stringify(keys));
                    if (keys.length > 0) localStorage.setItem('gemini_api_key', keys[0]);
                    setApiKeysList(keys);
                    setShowKeyModal(false);
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:opacity-95 shadow-md"
                >
                  Save API Key Pool ({keysInputText.split('\n').filter(k => k.trim()).length} Keys)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  {apiKeysList.length > 0 ? `REAL GEMINI API (${apiKeysList.length} KEYS POOL)` : 'LOCAL R&D ENGINE'}
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                {activeKeyInfo ? `Active Engine: ${activeKeyInfo}` : 'Ask questions, analyze lab trials, inspect stability logs & request scientist activity summaries'}
              </p>
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
                <p className="leading-relaxed font-medium text-sm whitespace-pre-line">{msg.text}</p>
                <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-700/50">
                  {msg.sender === 'ai' ? (
                    <div className="flex items-center gap-2 text-[10px]">
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(msg.text)}
                        className="text-purple-600 dark:text-purple-400 font-bold hover:underline"
                      >
                        📋 Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const utterance = new SpeechSynthesisUtterance(msg.text.replace(/[*#]/g, ''));
                          window.speechSynthesis.speak(utterance);
                        }}
                        className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                      >
                        🔊 Listen
                      </button>
                    </div>
                  ) : <div />}
                  <span
                    className={`text-[10px] font-mono ${
                      msg.sender === 'user' ? 'text-emerald-100' : 'text-gray-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
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
            placeholder="Ask Gemini AI about active field trials, stability logs, scientist work..."
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
