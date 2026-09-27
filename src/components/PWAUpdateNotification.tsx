import React, { useState, useEffect } from 'react';
import { RefreshCw, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PWAUpdateNotification: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Listen for custom dispatch or registration update events
    const handleUpdateFound = (registration: ServiceWorkerRegistration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version installed in background and ready to activate!
            setWaitingWorker(newWorker);
            setUpdateAvailable(true);
          }
        });
      });
    };

    // Check existing registration
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;

      if (reg.waiting) {
        setWaitingWorker(reg.waiting);
        setUpdateAvailable(true);
        return;
      }

      handleUpdateFound(reg);

      // Periodically check for new version in background (every 60 seconds)
      const interval = setInterval(() => {
        reg.update().catch(() => {});
      }, 60 * 1000);

      return () => clearInterval(interval);
    });

    // Also listen to window custom event dispatched by HTML registration
    const handleCustomUpdateEvent = (e: any) => {
      if (e.detail?.worker) {
        setWaitingWorker(e.detail.worker);
        setUpdateAvailable(true);
      }
    };
    window.addEventListener('pwa-new-version-available', handleCustomUpdateEvent);

    // Also reload whenever the controlling service worker changes
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    return () => {
      window.removeEventListener('pwa-new-version-available', handleCustomUpdateEvent);
    };
  }, []);

  const handleApplyUpdate = () => {
    setIsUpdating(true);
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else {
          window.location.reload();
        }
      });
    }
  };

  if (!updateAvailable) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -40, scale: 0.95 }}
        className="fixed top-[max(1rem,env(safe-area-inset-top,1rem))] left-3 right-3 sm:left-auto sm:right-6 sm:w-[420px] z-[9999] p-4 rounded-3xl bg-slate-900/95 dark:bg-gray-900/95 backdrop-blur-2xl border-2 border-emerald-400/40 text-white shadow-2xl ring-4 ring-emerald-500/20"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 shrink-0 shadow-lg shadow-emerald-500/30">
            <RefreshCw className={`w-5 h-5 font-black ${isUpdating ? 'animate-spin' : ''}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                <Sparkles className="w-3 h-3 text-amber-300" /> New Version Ready
              </span>
            </div>
            <h4 className="mt-1 text-sm font-extrabold text-white tracking-tight">
              Miklens R&D Platform Update
            </h4>
            <p className="mt-0.5 text-xs text-slate-300 leading-snug">
              A high-performance system update is ready. Reload now to load the latest speeds, features, and database sync.
            </p>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleApplyUpdate}
                disabled={isUpdating}
                className="flex-1 py-2 px-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Reload & Update Now
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setUpdateAvailable(false)}
                className="py-2 px-3 bg-white/10 hover:bg-white/20 active:scale-[0.98] text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
