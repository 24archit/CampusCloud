import { clsx } from 'clsx';

const colors = {
  indigo:  'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  violet:  'bg-violet-500/10 text-violet-400 border-violet-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rose:    'bg-rose-500/10 text-rose-400 border-rose-500/20',
  amber:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  sky:     'bg-sky-500/10 text-sky-400 border-sky-500/20',
  slate:   'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

// Auto color by file type or category string
export function badgeColor(str = '') {
  const s = str.toLowerCase();
  if (s.includes('pdf'))        return 'rose';
  if (s.includes('ppt'))        return 'amber';
  if (s.includes('doc'))        return 'sky';
  if (s.includes('xls'))        return 'emerald';
  if (s.includes('zip'))        return 'violet';
  if (s.includes('notes'))      return 'indigo';
  if (s.includes('assignment'))  return 'amber';
  if (s.includes('project'))    return 'violet';
  if (s.includes('research'))   return 'sky';
  if (s.includes('lab'))        return 'emerald';
  return 'slate';
}

export default function Badge({ children, color = 'slate', className }) {
  return (
    <span className={clsx(
      'inline-flex items-center border text-xs font-medium px-2 py-0.5 rounded-full',
      colors[color] || colors.slate,
      className
    )}>
      {children}
    </span>
  );
}
