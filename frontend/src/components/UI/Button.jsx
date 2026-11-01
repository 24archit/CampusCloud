import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed';

const variants = {
  primary:  'bg-indigo-600 hover:bg-indigo-500 text-white focus:ring-indigo-500 shadow-lg shadow-indigo-500/20',
  secondary:'bg-slate-700 hover:bg-slate-600 text-white focus:ring-slate-500',
  danger:   'bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-500',
  ghost:    'hover:bg-slate-800 text-slate-300 hover:text-white focus:ring-slate-500',
  outline:  'border border-slate-700 hover:border-slate-600 bg-transparent text-slate-300 hover:text-white hover:bg-slate-800/50 focus:ring-slate-500',
};

const sizes = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-sm px-6 py-2.5',
};

export default function Button({ variant = 'primary', size = 'md', loading, children, className, ...props }) {
  return (
    <button
      className={twMerge(clsx(base, variants[variant], sizes[size], className))}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
