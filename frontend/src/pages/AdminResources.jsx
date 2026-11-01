import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Eye } from 'lucide-react';
import { BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../lib/api';
import FileTypeIcon, { fileExtLabel } from '../components/UI/FileTypeIcon';
import Badge, { badgeColor } from '../components/UI/Badge';
import EmptyState from '../components/UI/EmptyState';
import SearchBar from '../components/UI/SearchBar';
import { format } from 'date-fns';

function formatBytes(b) {
  if (!b) return '0 B';
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${(b / Math.pow(1024, i)).toFixed(1)} ${['B','KB','MB','GB'][i]}`;
}

export default function AdminResources() {
  const [resources, setResources] = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getResources();
      const list = res?.data?.resources || res?.data || [];
      setResources(list);
      setFiltered(list);
    } catch { toast.error('Failed to load resources'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(resources.filter(r =>
      r.title?.toLowerCase().includes(q) ||
      r.subject?.toLowerCase().includes(q) ||
      r.uploaderName?.toLowerCase().includes(q)
    ));
  }, [search, resources]);

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this resource?')) return;
    try {
      await adminAPI.deleteResource(id);
      setResources(r => r.filter(x => x.resourceId !== id));
      toast.success('Resource deleted');
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Manage Resources</h1>
        <p className="text-slate-400 text-sm mt-1">{resources.length} total resources</p>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by title, subject, uploader…" className="max-w-sm" />

      {loading ? (
        <div className="space-y-3">{Array(6).fill(0).map((_,i)=><div key={i} className="h-14 bg-slate-800/50 rounded-xl animate-pulse"/>)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="No resources found" />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Resource','Uploader','Category','Size','Downloads','Date','Actions'].map(h=>(
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.resourceId} className={`hover:bg-slate-800/30 transition-colors ${i<filtered.length-1?'border-b border-slate-800/50':''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileTypeIcon fileName={r.fileName} fileType={r.fileType} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate max-w-[180px]">{r.title}</p>
                          <p className="text-xs text-slate-500">{r.subject}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{r.uploaderName}</td>
                    <td className="px-4 py-3"><Badge color={badgeColor(r.category)}>{r.category}</Badge></td>
                    <td className="px-4 py-3 text-sm text-slate-400 whitespace-nowrap">{formatBytes(r.fileSize)}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{r.downloadCount || 0}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {r.createdAt ? format(new Date(r.createdAt), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Link to={`/resources/${r.resourceId}`}>
                          <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"><Eye className="w-4 h-4"/></button>
                        </Link>
                        <button onClick={() => handleDelete(r.resourceId)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
