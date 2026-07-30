import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { User, Bell, Shield, Database } from 'lucide-react';

export const Settings: React.FC = () => {
  const { userRole, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
          Settings
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Manage your account preferences and system configurations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <nav className="space-y-1">
            <a href="#" className="bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white flex items-center px-3 py-2 text-sm font-medium rounded-md">
              <User className="mr-3 h-5 w-5 text-gray-500" />
              Profile
            </a>
            <a href="#" className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white flex items-center px-3 py-2 text-sm font-medium rounded-md">
              <Bell className="mr-3 h-5 w-5 text-gray-400" />
              Notifications
            </a>
            {userRole === 'Admin' && (
              <>
                <a href="#" className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white flex items-center px-3 py-2 text-sm font-medium rounded-md">
                  <Shield className="mr-3 h-5 w-5 text-gray-400" />
                  Security
                </a>
                <a href="#" className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white flex items-center px-3 py-2 text-sm font-medium rounded-md">
                  <Database className="mr-3 h-5 w-5 text-gray-400" />
                  System logs
                </a>
              </>
            )}
          </nav>
        </div>

        <div className="md:col-span-3 space-y-6">
          <div className="bg-white shadow-sm sm:rounded-xl border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Profile Settings</h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
                <p>Update your personal information and contact details.</p>
              </div>
              <form className="mt-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                  <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white" defaultValue={profile?.name || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <input type="email" disabled className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 opacity-70" defaultValue={profile?.email || ''} />
                </div>
                <div className="pt-4">
                  <button type="button" className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="bg-white shadow-sm sm:rounded-xl border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
             <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Appearance</h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
                <p>Toggle system theme. (This will be linked to a global theme context later).</p>
              </div>
              <div className="mt-5">
                 <button onClick={toggleTheme} className="inline-flex justify-center items-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700">
                    Current Theme: {theme === 'dark' ? 'Dark' : 'Light'} (Click to Toggle)
                 </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
