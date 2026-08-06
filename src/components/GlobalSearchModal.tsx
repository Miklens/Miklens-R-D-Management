import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, Beaker, User, Clock, Package, Sparkles, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSyncedTrials } from '../services/trialManagerSync';
import { useUsers } from '../hooks/useUsers';
import { useDailyLogs } from '../hooks/useDailyLogs';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data: users } = useUsers();
  const { data: logs } = useDailyLogs();
  const syncedTrials = useMemo(() => getSyncedTrials(), []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Keyboard Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { trials: [], users: [], logs: [] };

    const matchingTrials = syncedTrials.filter(t => 
      (t.trialCode || '').toLowerCase().includes(q) ||
      (t.title || '').toLowerCase().includes(q) ||
      (t.productName || '').toLowerCase().includes(q) ||
      (t.cropName || '').toLowerCase().includes(q) ||
      (t.scientistName || '').toLowerCase().includes(q)
    ).slice(0, 5);

    const matchingUsers = (users || []).filter(u =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    ).slice(0, 4);

    const matchingLogs = (logs || []).filter(l =>
      (l.objective || '').toLowerCase().includes(q) ||
      (l.activities || '').toLowerCase().includes(q) ||
      (l.date || '').toLowerCase().includes(q)
    ).slice(0, 4);

    return { trials: matchingTrials, users: matchingUsers, logs: matchingLogs };
  }, [query, syncedTrials, users, logs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Search Bar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-emerald-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search field trials, scientists, products, daily work logs... (Ctrl+K)"
            className="flex-1 bg-transparent border-none text-sm font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block text-[10px] font-extrabold px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700 font-mono">
            ESC
          </span>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!query.trim() ? (
            <div className="py-8 text-center space-y-2">
              <Sparkles className="w-8 h-8 text-emerald-500 mx-auto animate-pulse" />
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                Type anything to search across field trials, scientist scorecards, products & timesheets
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {['BioCide Pro', 'Maize', 'Bindushree', 'Herbicide', 'CIPAC'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                  >
                    🔍 {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Field Trials */}
              {searchResults.trials.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
                    🌾 Field Trials ({searchResults.trials.length})
                  </span>
                  <div className="space-y-1.5">
                    {searchResults.trials.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          navigate('/trial-sync');
                          onClose();
                        }}
                        className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                              {t.trialCode}
                            </span>
                            <h5 className="text-xs font-black text-gray-900 dark:text-white">
                              {t.title || t.productName}
                            </h5>
                          </div>
                          <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                            Crop: {t.cropName} | Lead: {t.scientistName}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scientists */}
              {searchResults.users.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
                    👤 Scientists & Team ({searchResults.users.length})
                  </span>
                  <div className="space-y-1.5">
                    {searchResults.users.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => {
                          navigate(`/profile/${u.id}`);
                          onClose();
                        }}
                        className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center">
                            {u.name ? u.name.charAt(0) : 'U'}
                          </div>
                          <div>
                            <h5 className="text-xs font-black text-gray-900 dark:text-white">{u.name || u.email}</h5>
                            <p className="text-[11px] text-gray-500 font-medium">{u.role || u.email}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Logs */}
              {searchResults.logs.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
                    ⏱️ Daily Research Timesheets ({searchResults.logs.length})
                  </span>
                  <div className="space-y-1.5">
                    {searchResults.logs.map((l, lIdx) => (
                      <div
                        key={l.id || lIdx}
                        onClick={() => {
                          navigate('/research-log');
                          onClose();
                        }}
                        className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-gray-100 dark:border-gray-800 space-y-1 cursor-pointer transition-colors"
                      >
                        <div className="flex justify-between text-[10px] font-bold text-gray-400">
                          <span>{l.date?.split('T')[0]}</span>
                          <span>{((l.timeSpentMinutes || 60) / 60).toFixed(1)}h</span>
                        </div>
                        <p className="text-xs text-gray-800 dark:text-gray-200 font-medium">
                          {l.objective || l.activities}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.trials.length === 0 && searchResults.users.length === 0 && searchResults.logs.length === 0 && (
                <p className="py-8 text-center text-xs font-bold text-gray-400 italic">
                  No matching field trials, scientists, or research logs found for "{query}".
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
