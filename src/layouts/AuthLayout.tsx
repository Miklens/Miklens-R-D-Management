import React from 'react';
import { Outlet } from 'react-router-dom';
import { TrendingUp, ShieldCheck } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 font-sans relative overflow-hidden">
      {/* Subtle Ambient Glowing Orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Centered Login Card Container */}
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-indigo-600 text-white shadow-xl shadow-emerald-500/20 mb-1">
            <TrendingUp className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent tracking-tight">
            Miklens Bio R&D
          </h1>
          <p className="text-xs font-semibold text-slate-400">
            Enterprise R&D Management & Intelligence Platform
          </p>
        </div>

        {/* Outlet Form Card */}
        <div className="p-8 rounded-3xl bg-slate-900/90 backdrop-blur-2xl border border-slate-800 shadow-2xl space-y-6">
          <Outlet />
        </div>

        {/* Footer Security Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium pt-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Protected by Miklens Enterprise Security</span>
        </div>
      </div>
    </div>
  );
};
