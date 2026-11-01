import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({ value, onChange, placeholder = 'Search…', className = '' }) {
  const [local, setLocal] = useState(value || '');
  const timer = useRef(null);

  useEffect(() => { setLocal(value || ''); }, [value]);

  const handle = (v) => {
    setLocal(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(v), 350);
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={local}
        onChange={(e) => handle(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      {local && (
        <button onClick={() => handle('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
