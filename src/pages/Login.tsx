import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ShieldCheck, Users, FlaskConical, UserCheck, KeyRound, Database, RefreshCw } from 'lucide-react';
import { auth, isFirebaseConfigured } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { getUsers } from '../services/localStore';
import { AppUser } from '../types';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [syncedUsers, setSyncedUsers] = useState<AppUser[]>([]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const { loginAsDemo } = useAuth();

  useEffect(() => {
    // Load dynamically registered users from localStore (populated live from Firestore)
    const loaded = getUsers();
    setSyncedUsers(loaded);
  }, []);

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, data.email, data.password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError('Invalid email or password.');
    }
  };

  const handleProfileSelect = (userId: string) => {
    loginAsDemo(userId);
    navigate('/');
  };

  return (
    <div className="space-y-6">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-xs font-bold text-red-700 dark:bg-red-900/50 dark:text-red-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
            Email address
          </label>
          <div className="mt-1">
            <input
              {...register('email')}
              type="email"
              placeholder="e.g. pavan@miklensbio.com"
              className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-xs shadow-sm focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
            Password
          </label>
          <div className="mt-1">
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-xs shadow-sm focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password.message}</p>
            )}
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting} fullWidth className="bg-gradient-to-r from-purple-600 to-indigo-600 font-black">
          {isSubmitting ? 'Authenticating...' : 'Sign In with Account'}
        </Button>
      </form>

      {/* Dynamic Registered Users from Trial Manager Firestore */}
      {syncedUsers.length > 0 && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-500" /> Active Users (Live Synced from Trial Manager):
            </span>
            <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">Isolated Data Access</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {syncedUsers.map(user => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleProfileSelect(user.id)}
                className="flex items-center gap-3 p-3 text-left rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/80 hover:border-purple-500 hover:shadow-md transition-all group"
              >
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-purple-200 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">{user.name}</span>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">{user.role}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">{user.email}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
