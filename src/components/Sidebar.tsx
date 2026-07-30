import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FlaskConical, Beaker, BarChart3, Edit3, 
  Settings, CheckSquare, FileStack, Bell, TrendingUp, Layers, Workflow, Thermometer
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTasks } from '../contexts/TaskContext';
import type { Role } from '../types';
import { motion } from 'framer-motion';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Role[];
  badgeKey?: 'tasks';
}

interface NavGroup {
  category: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    category: 'Overview',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Notifications', href: '/notifications', icon: Bell },
    ],
  },
  {
    category: 'Research & Development',
    items: [
      { name: 'Daily Research Log', href: '/research-log', icon: Edit3 },
      { name: 'Experiments & Testing', href: '/experiments', icon: Beaker },
      { name: 'Formulation & Stability', href: '/formulation-builder', icon: Thermometer },
    ],
  },
  {
    category: 'Products & Pipeline',
    items: [
      { name: 'Product Portfolio', href: '/products', icon: FlaskConical },
      { name: 'Pipeline Stages', href: '/product-pipeline', icon: Workflow },
      { name: 'Projects & Milestones', href: '/projects', icon: Layers },
      { name: 'Documents Library', href: '/documents', icon: FileStack },
    ],
  },
  {
    category: 'Global Tasks',
    items: [
      { name: 'Task Center', href: '/tasks', icon: CheckSquare, badgeKey: 'tasks' },
    ],
  },
  {
    category: 'Management & Config',
    items: [
      { name: 'Scientist Directory', href: '/employees', icon: Users, roles: ['Admin', 'Management'] },
      { name: 'Reports & Audits', href: '/reports', icon: BarChart3, roles: ['Admin', 'Management'] },
      { name: 'System Settings', href: '/settings', icon: Settings },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const { userRole, profile } = useAuth();
  const { pendingCount } = useTasks();
  const location = useLocation();

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
      <div className="mx-4 mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-100/50 dark:border-emerald-800/30">
        <p className="text-xs text-gray-500 dark:text-gray-400">Signed in as</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{profile?.name || 'Scientist'}</p>
        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{profile?.designation || userRole || 'Team Member'}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navGroups.map((group) => {
          const visibleGroupItems = group.items.filter(
            item => !item.roles || (userRole && item.roles.includes(userRole))
          );

          if (visibleGroupItems.length === 0) return null;

          return (
            <div key={group.category} className="space-y-1">
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                {group.category}
              </h3>
              {visibleGroupItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                const badgeCount = item.badgeKey === 'tasks' ? pendingCount : 0;
                
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className="relative block"
                  >
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 font-semibold'
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
                      <Icon className={`w-4 h-4 flex-shrink-0 relative z-10 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                      <span className="relative z-10 flex-1 truncate">{item.name}</span>
                      {badgeCount > 0 && (
                        <span className={`relative z-10 px-2 py-0.5 text-xs font-bold rounded-full ${
                          isActive 
                            ? 'bg-white/25 text-white' 
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                        }`}>
                          {badgeCount}
                        </span>
                      )}
                    </motion.div>
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100/50 dark:border-gray-800/50">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/30">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
            {profile?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{profile?.name || 'User'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{profile?.email || 'scientist@miklensbio.com'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
