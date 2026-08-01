import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ShieldCheck, Users, FlaskConical, UserCheck, KeyRound } from 'lucide-react';
import { auth, isFirebaseConfigured } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

const SCIENTIST_PROFILES = [
  {
    id: 'user-pavan',
    label: 'Pavan',
    email: 'pavan@miklensbio.com',
    role: 'Admin / Head of R&D',
    description: 'Full trial portfolio & executive oversight',
    icon: ShieldCheck,
    badgeColor: 'bg-purple-600 text-white',
  },
  {
    id: 'user-sandeep',
    label: 'Sandeep',
    email: 'sandeep.431441@gmail.com',
    role: 'Research Scientist',
    description: 'Field trials, plot spraying & DAT efficacy',
    icon: FlaskConical,
    badgeColor: 'bg-emerald-600 text-white',
  },
  {
    id: 'user-bindu',
    label: 'Bindu',
    email: 'bindushreebu01@gmail.com',
    role: 'Formulation Chemist',
    description: 'Lab microbiology & thermal stability',
    icon: UserCheck,
    badgeColor: 'bg-indigo-600 text-white',
  },
  {
    id: 'mgmt-1',
    label: 'Dr. Mik',
    email: 'dr.mik@miklensbio.com',
    role: 'Management',
    description: 'Executive Management',
    icon: Users,
    badgeColor: 'bg-blue-600 text-white',
  },
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

      {/* Scientist Profile Quick Selection */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-purple-500" /> Switch Scientist Profile Account:
          </span>
          <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">Isolated Data Access</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {SCIENTIST_PROFILES.map(({ id, label, email, role, description, icon: Icon, badgeColor }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleProfileSelect(id)}
              className="flex items-center gap-3 p-3 text-left rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/80 hover:border-purple-500 hover:shadow-md transition-all group"
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${badgeColor}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">{label}</span>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{role.split(' ')[0]}</span>
                </div>
                <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">{email}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
