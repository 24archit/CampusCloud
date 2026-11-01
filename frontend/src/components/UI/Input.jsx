import { twMerge } from 'tailwind-merge';

export default function Input({ label, error, helper, className, inputClassName, icon: Icon, ...props }) {
  return (
    <div className={twMerge('space-y-1', className)}>
      {label && <label className="block text-sm font-medium text-slate-300">{label}</label>}
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
        <input
          className={twMerge(
            'w-full bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg py-2.5 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all',
            'hover:border-slate-600',
            error && 'border-rose-500 focus:ring-rose-500',
            Icon ? 'pl-9 pr-4' : 'px-4',
            inputClassName
          )}
          {...props}
        />
      </div>
      {error  && <p className="text-xs text-rose-400">{error}</p>}
      {helper && <p className="text-xs text-slate-500">{helper}</p>}
    </div>
  );
}
