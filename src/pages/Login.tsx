import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck, User } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { isFirebaseConfigured, loginDemoUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'pavan@miklensbio.com',
      password: 'password123',
    }
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
        loginDemoUser(data.email);
        navigate('/');
      }
    } catch (err: any) {
      console.error(err);
      setError('Invalid authentication credentials. Please try again or use Quick Demo Sign In.');
    }
  };

  const setQuickDemoUser = (email: string) => {
    setValue('email', email);
    setValue('password', 'password123');
    loginDemoUser(email);
    navigate('/');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-black text-gray-900 dark:text-white">
          Sign In to R&D Workbench
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          Enter your Miklens credentials to access live field plot data and AI tools.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className="rounded-2xl bg-red-50 dark:bg-red-950/60 p-4 text-xs font-bold text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            🚨 {error}
          </div>
        )}

        {/* Email Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 tracking-wider">
            User Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              {...register('email')}
              type="email"
              placeholder="e.g. pavan@miklensbio.com"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
            />
          </div>
          {errors.email && (
            <p className="text-[11px] font-bold text-red-600 dark:text-red-400">{errors.email.message}</p>
          )}
        </div>

        {/* Password Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 tracking-wider">
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] font-bold text-red-600 dark:text-red-400">{errors.password.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-2xl text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <span>Authenticating Session...</span>
          ) : (
            <>
              <span>Sign In to R&D Workbench</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* 1-Click Quick Demo Login Suite */}
      <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">
            ⚡ Instant Quick Sign-In Accounts:
          </span>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">1-Click Login</span>
        </div>

        <div className="grid grid-cols-1 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setQuickDemoUser('pavan@miklensbio.com')}
            className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-gray-200 dark:border-gray-700 flex items-center justify-between transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black text-xs flex items-center justify-center">
                P
              </div>
              <div>
                <p className="font-extrabold text-gray-900 dark:text-white leading-tight">Pavan Dev (Admin / Executive)</p>
                <p className="text-[10px] text-gray-400">Full organisation control tower access</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
          </button>

          <button
            type="button"
            onClick={() => setQuickDemoUser('bindushreebu01@gmail.com')}
            className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-gray-200 dark:border-gray-700 flex items-center justify-between transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-black text-xs flex items-center justify-center">
                B
              </div>
              <div>
                <p className="font-extrabold text-gray-900 dark:text-white leading-tight">Bindushree B U (Trial Manager)</p>
                <p className="text-[10px] text-gray-400">Scoped scientist trials & AI briefing access</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
          </button>

          <button
            type="button"
            onClick={() => setQuickDemoUser('sandeep.431441@gmail.com')}
            className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-gray-200 dark:border-gray-700 flex items-center justify-between transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-black text-xs flex items-center justify-center">
                S
              </div>
              <div>
                <p className="font-extrabold text-gray-900 dark:text-white leading-tight">Sandeep (Field Scientist)</p>
                <p className="text-[10px] text-gray-400">Scoped field plot & trial manager access</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>
    </div>
  );
};
