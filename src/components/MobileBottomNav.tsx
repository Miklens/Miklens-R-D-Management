import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Edit3, Beaker, Sparkles, BarChart3 } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Daily Log', href: '/research-log', icon: Edit3 },
    { name: 'Experiments', href: '/experiments', icon: Beaker },
    { name: 'Gemini AI', href: '/ai-insights', icon: Sparkles, highlight: true },
    { name: 'Reports', href: '/team-activity', icon: BarChart3 },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 border-t border-gray-200 dark:border-gray-800 backdrop-blur-xl px-2 py-2">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 ${
                isActive
                  ? item.highlight
                    ? 'bg-gradient-to-r from-purple-600 to-emerald-600 text-white font-bold shadow-md scale-105'
                    : 'bg-emerald-500 text-white font-bold shadow-md scale-105'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${item.highlight && !isActive ? 'text-amber-400 animate-pulse' : ''}`} />
              <span className="text-[10px] font-bold mt-0.5">{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
