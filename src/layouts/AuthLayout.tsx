import React from 'react';
import { Outlet } from 'react-router-dom';
import { 
  TrendingUp, 
  FlaskConical, 
  Sparkles, 
  MapPin, 
  CheckCircle2, 
  ShieldCheck, 
  Dna, 
  Beaker,
  Leaf
} from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-sans">
      {/* Left Panel: Form Container */}
      <div className="flex flex-1 flex-col justify-center py-12 px-6 sm:px-12 lg:flex-none lg:px-20 xl:px-24 bg-white dark:bg-gray-900 border-r border-slate-200/80 dark:border-gray-800/80 shadow-2xl z-10">
        <div className="mx-auto w-full max-w-sm lg:w-96 space-y-6">
          {/* Logo & Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent tracking-tight">
                  Miklens R&D
                </h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  RESEARCH & DEVELOPMENT PLATFORM
                </p>
              </div>
            </div>

            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Cloud Sync Connected
              </span>
            </div>
          </div>

          {/* Form Outlet */}
          <div className="pt-2">
            <Outlet />
          </div>

          {/* Footer Security Badge */}
          <div className="pt-6 border-t border-slate-100 dark:border-gray-800/80 flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> 256-Bit Encrypted Session
            </span>
            <span>v3.5.0</span>
          </div>
        </div>
      </div>

      {/* Right Panel: Agricultural R&D Intelligence Showcase */}
      <div className="relative hidden w-0 flex-1 lg:block overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-indigo-950">
        {/* Ambient Decorative Light Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />

        <div className="relative z-10 flex h-full flex-col justify-between p-16 text-white">
          {/* Top Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-black">
              <Leaf className="w-4 h-4 text-emerald-400" />
              <span>Miklens Bio Agricultural Research System</span>
            </div>
            <span className="text-xs font-mono text-emerald-300/80 font-bold">
              Trial Manager 7 Cloud Ready
            </span>
          </div>

          {/* Center Showcase Content */}
          <div className="space-y-8 max-w-xl">
            <div className="space-y-3">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Superpowered R&D Management
              </span>
              <h2 className="text-4xl font-black text-white leading-tight">
                Accelerating Next-Gen Botanical & Biological Agricultural Formulations
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed font-medium">
                Unified live tracking of 558+ field trial plots, scientist daily research logs, weed control efficacy (WCE %), and real-time AI ledger grounding.
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-xs">
                  <MapPin className="w-4 h-4" /> 558 Active Plot Trials
                </div>
                <p className="text-[11px] text-slate-300 font-medium">Synced in real-time with Herbicide Trial Manager 7</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1">
                <div className="flex items-center gap-2 text-amber-300 font-black text-xs">
                  <Sparkles className="w-4 h-4" /> Gemini AI Engine
                </div>
                <p className="text-[11px] text-slate-300 font-medium">Zero-hallucination real-time database query ledger</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1">
                <div className="flex items-center gap-2 text-teal-300 font-black text-xs">
                  <Beaker className="w-4 h-4" /> Formulation R&D
                </div>
                <p className="text-[11px] text-slate-300 font-medium">Active recipe builder & batch scale-up simulation</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1">
                <div className="flex items-center gap-2 text-indigo-300 font-black text-xs">
                  <ShieldCheck className="w-4 h-4" /> Scientist Daily Pulse
                </div>
                <p className="text-[11px] text-slate-300 font-medium">Effortless timesheet tracking & bottleneck radar</p>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-4 font-semibold">
            <span>© {new Date().getFullYear()} Miklens Biotech R&D Operations. All rights reserved.</span>
            <span>ISO 9001:2015 Certified R&D Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
};
