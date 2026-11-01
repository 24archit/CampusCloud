import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Cloud, Mail, Lock, Eye, EyeOff, User, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/UI/Button';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
  terms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

function PasswordStrength({ password = '' }) {
  const checks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['bg-rose-500', 'bg-amber-500', 'bg-emerald-500'];
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0,1,2].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? colors[score-1] : 'bg-slate-700'}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {checks.map(({ label, ok }) => (
          <span key={label} className={`text-xs flex items-center gap-1 ${ok ? 'text-emerald-400' : 'text-slate-500'}`}>
            <CheckCircle className="w-3 h-3" /> {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Register() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [apiError, setApiError] = useState('');

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const pw = watch('password', '');

  const onSubmit = async (data) => {
    setApiError('');
    try {
      await authRegister(data.name, data.email, data.password);
      toast.success('Account created! Welcome to CampusCloud 🎉');
      navigate('/dashboard');
    } catch (err) {
      setApiError(err.response?.data?.error || err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left branded panel */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 bg-gradient-to-br from-violet-900 via-indigo-900 to-indigo-800 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-950/20" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Cloud className="w-6 h-6 text-white" /></div>
          <span className="text-white font-bold text-xl">CampusCloud</span>
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-4">Join thousands of students sharing knowledge</h2>
          <p className="text-indigo-200 text-base">Upload your notes, discover resources from peers, and collaborate effectively.</p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { label: 'Resources', value: '10K+' },
              { label: 'Students', value: '500+' },
              { label: 'Categories', value: '9' },
              { label: 'Uptime', value: '99.9%' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-indigo-200 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-indigo-300 text-sm">© 2024 CampusCloud</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"><Cloud className="w-5 h-5 text-white" /></div>
            <span className="font-bold text-white text-lg">CampusCloud</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
            <p className="text-slate-400">Start sharing and discovering campus resources</p>
          </div>

          {apiError && (
            <div className="mb-5 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-lg text-sm">{apiError}</div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input {...register('name')} placeholder="Your full name"
                  className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>
              {errors.name && <p className="text-xs text-rose-400">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input {...register('email')} type="email" placeholder="you@college.edu"
                  className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>
              {errors.email && <p className="text-xs text-rose-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="••••••••"
                  className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-rose-400">{errors.password.message}</p>}
              {pw && <PasswordStrength password={pw} />}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input {...register('confirmPassword')} type="password" placeholder="••••••••"
                  className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>
              {errors.confirmPassword && <p className="text-xs text-rose-400">{errors.confirmPassword.message}</p>}
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input {...register('terms')} type="checkbox" id="terms"
                className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500" />
              <label htmlFor="terms" className="text-sm text-slate-400">
                I agree to the <span className="text-indigo-400 cursor-pointer hover:underline">Terms of Service</span> and <span className="text-indigo-400 cursor-pointer hover:underline">Privacy Policy</span>
              </label>
            </div>
            {errors.terms && <p className="text-xs text-rose-400">{errors.terms.message}</p>}

            <Button type="submit" className="w-full mt-2" size="lg" loading={isSubmitting}>
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
