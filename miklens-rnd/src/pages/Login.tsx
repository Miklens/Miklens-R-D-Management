import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ShieldCheck, Users, FlaskConical } from 'lucide-react';
import { auth, isFirebaseConfigured } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

const DEMO_ACCOUNTS = [
  { id: 'admin-1', label: 'Admin', description: 'Full system access', icon: ShieldCheck },
  { id: 'mgmt-1', label: 'Management', description: 'Team & product visibility', icon: Users },
  { id: 'sci-1', label: 'Scientist', description: 'Daily logs & assigned work', icon: FlaskConical },
];

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const { loginAsDemo } = useAuth();

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

  const handleDemoLogin = (userId: string) => {
     loginAsDemo(userId);
     navigate('/');
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/50 dark:text-red-200">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email address
        </label>
        <div className="mt-1">
          <input
            {...register('email')}
            type="email"
            className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:text-sm"
          />
          {errors.email && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Password
        </label>
        <div className="mt-1">
          <input
            {...register('password')}
            type="password"
            className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:text-sm"
          />
          {errors.password && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
          )}
        </div>
      </div>

      <div>
        <Button type="submit" disabled={isSubmitting} fullWidth>
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </div>

      {!isFirebaseConfigured && (
        <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-800">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Or continue with a demo account
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {DEMO_ACCOUNTS.map(({ id, label, description, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleDemoLogin(id)}
                className="flex flex-col items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-3 text-center transition-colors hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
              >
                <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{label}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{description}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
};
