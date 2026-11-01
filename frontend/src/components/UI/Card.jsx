import { twMerge } from 'tailwind-merge';

export default function Card({ children, className, ...props }) {
  return (
    <div
      className={twMerge('bg-slate-900 border border-slate-800 rounded-xl', className)}
      {...props}
    >
      {children}
    </div>
  );
}
