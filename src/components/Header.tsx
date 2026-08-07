import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getLogsByUser } from '../services/localStore';
import { useExperiments } from '../contexts/ExperimentContext';
import { 
  LogOut, 
  User as UserIcon, 
  Settings, 
  Bell, 
  Search, 
  Moon, 
  Sun,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalSearchModal } from './GlobalSearchModal';
import { getEffectiveAvatar } from '../utils/avatarHelper';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const { profile, userRole, logout } = useAuth();
  const { experiments } = useExperiments();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const userId = profile?.id || '';
  const notifications = useMemo(() => {
    const items: Array<{ id: string; title: string; message: string; time: string; unread: boolean }> = [];
    const logs = getLogsByUser(userId);

    const todayStr = new Date().toDateString();
    const todayLogs = logs.filter(l => l.date && new Date(l.date).toDateString() === todayStr);
    if (todayLogs.length > 0) {
      items.push({
        id: 'header-log-today',
        title: 'Daily Research Log',
        message: `${todayLogs.length} session(s) logged today`,
        time: 'Today',
        unread: true,
      });
    }

    const activeExp = experiments.filter(e => e.status === 'InProgress' || e.outcomeStatus === 'Passed' || e.outcomeStatus === 'Pending');
    if (activeExp.length > 0) {
      items.push({
        id: `header-exp-${activeExp[0].id}`,
        title: `Experiment: ${activeExp[0].name || activeExp[0].productName}`,
        message: `Status: ${activeExp[0].outcomeStatus}`,
        time: 'Recent',
        unread: false,
      });
    }

    return items;
  }, [userId, profile, experiments]);

  const unreadCount = notifications.filter(n => n.unread).length;

  // Get current page title
  const getPageTitle = () => {
    const path = location.pathname;
    const titles: Record<string, string> = {
      '/': 'Dashboard',
      '/research-log': 'Daily Research Log',
      '/time-motion': 'Time Motion',
      '/team-activity': 'Team Activity',
      '/ai-insights': 'Gemini AI Assistant',
      '/products': 'Products Portfolio',
      '/product-pipeline': 'Stage-Gate Product Pipeline',
      '/projects': 'Projects',
      '/formulation-builder': 'Formulation Recipe Builder',
      '/stability-tracker': 'Shelf-Life & Stability Tracker',
      '/experiments': 'Experiments & Testing',
      '/field-trials': 'Field Trials',
      '/trial-sync': 'Trial Manager Sync',
      '/lab-tests': 'Lab Assays',
      '/observations': 'Observations',
      '/approvals': 'Approvals',
      '/employees': 'Scientist Team',
      '/documents': 'Documents',
      '/calendar': 'Calendar',
      '/analytics': 'Analytics & Efficacy Analysis',
      '/reports': 'Executive Reports & Audits',
      '/trial-progress': 'Trial Progress Report',
      '/notifications': 'Notifications',
      '/audit-logs': 'Audit Logs',
      '/settings': 'Settings',
      '/profile': 'My Profile',
    };

    if (path.startsWith('/employees/')) return 'Scientist Profile Audit';
    if (path.startsWith('/profile/')) return 'Scientist Profile Audit';

    return titles[path] || 'Dashboard';
  };

  return (
    <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-gray-200/60 bg-white/85 px-4 md:px-8 backdrop-blur-2xl dark:border-gray-800/60 dark:bg-gray-900/85 shadow-sm transition-all">
      {/* Left: Page Title & Date Badge */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="md:hidden">
          <button 
            onClick={onToggleMobileMenu}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-black tracking-wider uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              R&D CLOUD ONLINE
            </span>
            <span className="hidden sm:inline-block text-xs text-gray-400 dark:text-gray-500 font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight truncate mt-0.5">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right: Search, AI Quick Trigger, Theme Toggle, Notifications, User Profile */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Search Trigger */}
        <div className="hidden lg:flex items-center">
          <button
            onClick={() => setShowSearchModal(true)}
            className="flex items-center gap-2.5 w-56 lg:w-64 pl-3.5 pr-4 py-2 bg-gray-50/80 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 rounded-2xl text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-left transition-all cursor-pointer shadow-sm hover:shadow"
          >
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="flex-1 truncate">Search R&D DB...</span>
            <kbd className="hidden lg:inline-block px-2 py-0.5 text-[9px] font-mono font-bold bg-gray-200/80 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Gemini AI Assistant Quick Launch */}
        <Link
          to="/ai-insights"
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>Ask Gemini</span>
        </Link>

        {/* Dark mode toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Toggle Light / Dark Mode"
        >
          {isDarkMode ? (
            <Sun className="w-4.5 h-4.5 text-amber-400" />
          ) : (
            <Moon className="w-4.5 h-4.5 text-gray-600" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[9px] font-mono font-black rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-sm animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50"
              >
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-emerald-500" /> Notifications
                    </h3>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                      Real-time
                    </span>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400 font-medium">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${notif.unread ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''}`}
                      >
                        <div className="flex gap-3 items-start">
                          {notif.unread && (
                            <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                          )}
                          <div className={notif.unread ? '' : 'ml-5'}>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">{notif.title}</p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{notif.message}</p>
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">{notif.time}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20 text-center">
                  <button 
                    onClick={() => { navigate('/notifications'); setShowNotifications(false); }}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-extrabold"
                  >
                    View Notification Center
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile Pill Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2.5 p-1.5 pl-2 pr-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all max-w-[220px] md:max-w-[260px] cursor-pointer shadow-sm"
          >
            {getEffectiveAvatar(profile?.id, profile?.email, profile?.avatar) ? (
              <img
                src={getEffectiveAvatar(profile?.id, profile?.email, profile?.avatar)!}
                alt="Avatar"
                className="w-9 h-9 rounded-xl object-cover border-2 border-emerald-500 shadow-md shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-emerald-500/25 shrink-0">
                {profile?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="hidden md:block text-left min-w-0 flex-1">
              <p className="text-xs font-black text-gray-900 dark:text-white truncate">
                {profile?.name && profile.name !== 'User' ? profile.name : (profile?.email ? profile.email.split('@')[0] : 'Scientist')}
              </p>
              <p className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 truncate">
                {profile?.designation || userRole || 'Scientist'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden md:block shrink-0" />
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-[9999]"
              >
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-br from-emerald-50/60 to-teal-50/30 dark:from-gray-800 dark:to-gray-900">
                  <p className="font-extrabold text-gray-900 dark:text-white truncate text-sm">{profile?.name || 'Scientist'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{profile?.email}</p>
                  <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {userRole || 'Scientist'} Access
                  </span>
                </div>
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => { navigate('/profile'); setShowDropdown(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-emerald-500" />
                    My Profile & Dossier
                  </button>
                  <button
                    onClick={() => { navigate('/settings'); setShowDropdown(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-emerald-500" />
                    System Settings
                  </button>
                </div>
                <div className="p-2 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
    </header>
  );
};