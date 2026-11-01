import { FileText, Presentation, Sheet, Archive, File } from 'lucide-react';

const icons = {
  pdf:  { Icon: FileText,     color: 'text-rose-400',   bg: 'bg-rose-500/10' },
  docx: { Icon: FileText,     color: 'text-sky-400',    bg: 'bg-sky-500/10'  },
  doc:  { Icon: FileText,     color: 'text-sky-400',    bg: 'bg-sky-500/10'  },
  pptx: { Icon: Presentation, color: 'text-amber-400',  bg: 'bg-amber-500/10'},
  ppt:  { Icon: Presentation, color: 'text-amber-400',  bg: 'bg-amber-500/10'},
  xlsx: { Icon: Sheet,        color: 'text-emerald-400',bg: 'bg-emerald-500/10'},
  xls:  { Icon: Sheet,        color: 'text-emerald-400',bg: 'bg-emerald-500/10'},
  zip:  { Icon: Archive,      color: 'text-violet-400', bg: 'bg-violet-500/10'},
  txt:  { Icon: FileText,     color: 'text-slate-400',  bg: 'bg-slate-500/10' },
};

export function getFileExt(name = '', type = '') {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext && icons[ext]) return ext;
  if (type.includes('pdf'))   return 'pdf';
  if (type.includes('word'))  return 'docx';
  if (type.includes('presentation')) return 'pptx';
  if (type.includes('sheet'))  return 'xlsx';
  if (type.includes('zip'))    return 'zip';
  return 'txt';
}

export default function FileTypeIcon({ fileName, fileType, size = 'md' }) {
  const ext  = getFileExt(fileName, fileType);
  const conf = icons[ext] || { Icon: File, color: 'text-slate-400', bg: 'bg-slate-500/10' };
  const { Icon, color, bg } = conf;
  const sz = size === 'lg' ? 'w-14 h-14' : size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const ic = size === 'lg' ? 'w-7 h-7' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className={`${sz} ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
      <Icon className={`${ic} ${color}`} />
    </div>
  );
}

export function fileExtLabel(fileName, fileType) {
  return getFileExt(fileName, fileType).toUpperCase();
}
