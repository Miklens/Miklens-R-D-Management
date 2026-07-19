import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FlaskConical, Beaker, FileText, BarChart3, Edit3, Settings, FolderGit2, CheckSquare, FileStack, CalendarDays, CheckCircle, Sparkles, Database, Bell, TestTube2, MapPin, Eye, Activity, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Role } from '../types';
import { motion } from 'framer-motion';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  roles?: Role[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Daily Log', href: '/research-log', icon: Edit3 },
  { name: 'Time Motion', href: '/time-motion', icon: Clock },
  { name: 'Team Activity', href: '/team-activity', icon: Activity, roles: ['Admin', 'Management'] },
  { name: 'AI Insights', href: '/ai-insights', icon: Sparkles },
  { name: 'Products', href: '/products', icon: FlaskConical },
  { name: 'Projects', href: '/projects', icon: FolderGit2 },
  { name: 'Experiments', href: '/experiments', icon: Beaker },
  { name: 'Field Trials', href: '/field-trials', icon: MapPin },
  { name: 'Lab Tests', href: '/lab-tests', icon: TestTube2 },
  { name: 'Observations', href: '/observations', icon: Eye },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Approvals', href: '/approvals', icon: CheckCircle, badge: 3 },
  { name: 'Employees', href: '/employees', icon: Users, roles: ['Admin', 'Management'] },
  { name: 'Documents', href: '/documents', icon: FileStack },
  { name: 'Calendar', href: '/calendar', icon: CalendarDays },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['Admin', 'Management'] },
  { name: 'Reports', href: '/reports', icon: FileText, roles: ['Admin', 'Management'] },
  { name: 'Notifications', href: '/notifications', icon: Bell, badge: 5 },
  { name: 'Audit Logs', href: '/audit-logs', icon: Database, roles: ['Admin'] },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { userRole, profile } = useAuth();
  const location = useLocation();

  const visibleItems = navItems.filter(item => !item.roles || (userRole && item.roles.includes(userRole)));

  const getPageTitle = () => {
    const current = navItems.find(item => item.href === location.pathname);
    return current?.name || 'Dashboard';
  };

  return (
    <div className="flex h-full w-72 flex-col bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-900/80 border-r border-gray-200/50 dark:border-gray-800/50 backdrop-blur-xl">
      {/* Logo Section */}
      <div className="flex h-20 items-center px-6 border-b border-gray-100/50 dark:border-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
              Miklens R&D
            </h1>
            <p className="text-[10px] text-gray-400 font-medium tracking-wide">RESEARCH MANAGEMENT</p>
          </div>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="mx-4 mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-100/50 dark:border-emerald-800/30">
        <p className="text-xs text-gray-500 dark:text-gray-400">Welcome back,</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{profile?.name || 'Scientist'}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {visibleItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className="relative"
              >
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-5 h-5 flex-shrink-0 relative z-10 ${isActive ? 'text-white' : ''}`} />
                  <span className="relative z-10 flex-1">{item.name}</span>
                  {item.badge && (
                    <span className={`relative z-10 px-2 py-0.5 text-xs font-bold rounded-full ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </motion.div>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100/50 dark:border-gray-800/50">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/30">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
            {profile?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{profile?.name || 'User'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{profile?.designation || 'Scientist'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
