import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { User, Bell, Shield, Database, Upload, Trash2 } from 'lucide-react';
import { getUserCustomAvatar, setUserCustomAvatar, removeUserCustomAvatar } from '../utils/avatarHelper';

export const Settings: React.FC = () => {
  const { userRole, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    getUserCustomAvatar(profile?.email) || getUserCustomAvatar(profile?.id) || profile?.avatar || null
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setAvatarPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (avatarPreview && profile?.email) {
      setUserCustomAvatar(profile.email, avatarPreview);
    }
    if (avatarPreview && profile?.id) {
      setUserCustomAvatar(profile.id, avatarPreview);
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDeletePhoto = () => {
    if (profile?.email) removeUserCustomAvatar(profile.email);
    if (profile?.id) removeUserCustomAvatar(profile.id);
    setAvatarPreview(null);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

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
              <form className="mt-5 space-y-5" onSubmit={handleSaveProfile}>
                {/* Profile Photo Upload */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md" />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
                          {profile?.name?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-950 dark:file:text-emerald-300 cursor-pointer"
                        />
                        {(getUserCustomAvatar(profile?.email) || getUserCustomAvatar(profile?.id)) && (
                          <button
                            type="button"
                            onClick={handleDeletePhoto}
                            className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-950 dark:text-red-300 rounded-xl text-xs font-bold transition-all active:scale-95 whitespace-nowrap"
                          >
                            Delete Photo
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">PNG, JPG or WebP up to 5MB. Photo reflects globally across app.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                  <input type="text" className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white" defaultValue={profile?.name || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <input type="email" disabled className="mt-1 block w-full rounded-xl border-gray-300 bg-gray-50 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 opacity-70" defaultValue={profile?.email || ''} />
                </div>
                <div className="pt-4 flex items-center gap-3">
                  <button type="submit" className="inline-flex justify-center rounded-xl border border-transparent bg-emerald-600 py-2.5 px-5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition-all active:scale-95">
                    Save Profile & Photo
                  </button>
                  {saveSuccess && <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">✅ Saved successfully!</span>}
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
