import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { isFirebaseConfigured, loginDemoUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setError(null);
      if (isFirebaseConfigured && auth) {
        try {
          await signInWithEmailAndPassword(auth, data.email, data.password);
          navigate('/');
          return;
        } catch (fbErr: any) {
          const errMsg = String(fbErr?.message || fbErr?.code || '');
          if (errMsg.includes('api-key-not-valid') || errMsg.includes('invalid-api-key')) {
            console.warn('Firebase API key invalid. Falling back to demo mode session.');
            loginDemoUser(data.email);
            navigate('/');
            return;
          }
          throw fbErr;
        }
      } else {
        // Offline / Demo fallback authentication
        loginDemoUser(data.email);
        navigate('/');
      }
    } catch (err: any) {
      console.error(err);
      setError('Invalid email or password.');
    }
  };

  return (
    <div className="space-y-6">
      {!isFirebaseConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
          <p className="font-semibold">Demo / Offline Mode Active</p>
          <p className="mt-0.5 opacity-90">Firebase API key is unconfigured or using a placeholder. You can log in with any valid email format.</p>
        </div>
      )}

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
              placeholder="e.g. user@miklensbio.com"
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
          {isSubmitting ? 'Authenticating...' : 'Sign In'}
        </Button>
      </form>
    </div>
  );
};
