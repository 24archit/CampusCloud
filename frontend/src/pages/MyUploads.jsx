import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Eye, Share2, Copy, Check, LayoutGrid, List, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { resourcesAPI } from '../lib/api';
import FileTypeIcon, { fileExtLabel } from '../components/UI/FileTypeIcon';
import Badge, { badgeColor } from '../components/UI/Badge';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import EmptyState from '../components/UI/EmptyState';
import { formatDistanceToNow } from 'date-fns';

function formatBytes(b) {
  if (!b) return '0 B';
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${(b / Math.pow(1024, i)).toFixed(1)} ${['B','KB','MB','GB'][i]}`;
}

export default function MyUploads() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [view, setView]           = useState('list');
  const [shareData, setShareData] = useState(null);
  const [copied, setCopied]       = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await resourcesAPI.myUploads();
      const list = res?.data?.items || res?.data?.resources || (Array.isArray(res?.data) ? res?.data : []);
      setResources(Array.isArray(list) ? list : []);
    } catch { toast.error('Failed to load uploads'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this resource? This cannot be undone.')) return;
    try {
      await resourcesAPI.delete(id);
      setResources(r => r.filter(x => x.resourceId !== id));
      toast.success('Resource deleted');
    } catch { toast.error('Delete failed'); }
  };

  const handleShare = async (id) => {
    try {
      const res = await resourcesAPI.createShareLink(id);
      const data = res?.data || res;
      const link = data?.shareLink || `${window.location.origin}/shared/${data?.shareId}`;
      setShareData({ link });
    } catch { toast.error('Failed to create share link'); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareData?.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied!');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Uploads</h1>
          <p className="text-slate-400 text-sm mt-1">{resources.length} resource{resources.length !== 1 ? 's' : ''} uploaded</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('list')} className={`p-2 rounded-lg border transition-colors ${view==='list'?'bg-indigo-600 border-indigo-600':'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}><List className="w-4 h-4" /></button>
          <button onClick={() => setView('grid')} className={`p-2 rounded-lg border transition-colors ${view==='grid'?'bg-indigo-600 border-indigo-600':'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}><LayoutGrid className="w-4 h-4" /></button>
          <Link to="/upload"><Button size="sm">+ Upload</Button></Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array(4).fill(0).map((_,i) => <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />)}</div>
      ) : resources.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No uploads yet" description="Upload your first academic resource to get started."
          action={<Link to="/upload"><Button>Upload Resource</Button></Link>} />
      ) : view === 'list' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Resource</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Category</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Size</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Downloads</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Uploaded</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {resources.map((r, idx) => (
                  <tr key={r.resourceId} className={`hover:bg-slate-800/30 transition-colors ${idx < resources.length-1 ? 'border-b border-slate-800/50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileTypeIcon fileName={r.fileName} fileType={r.fileType} size="sm" />
                        <div className="min-w-0">
                          <Link to={`/resources/${r.resourceId}`} className="text-sm font-medium text-white hover:text-indigo-300 truncate block max-w-xs">{r.title}</Link>
                          <p className="text-xs text-slate-500">{r.subject}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge color={badgeColor(r.category)}>{r.category}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400 hidden md:table-cell">{formatBytes(r.fileSize)}</td>
                    <td className="px-4 py-3 text-sm text-slate-400 hidden md:table-cell">{r.downloadCount || 0}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell">
                      {r.createdAt ? formatDistanceToNow(new Date(r.createdAt), { addSuffix: true }) : ''}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Link to={`/resources/${r.resourceId}`}>
                          <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                        </Link>
                        <button onClick={() => handleShare(r.resourceId)} className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(r.resourceId)} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map(r => (
            <div key={r.resourceId} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-start gap-3">
                <FileTypeIcon fileName={r.fileName} fileType={r.fileType} size="sm" />
                <div className="flex-1 min-w-0">
                  <Link to={`/resources/${r.resourceId}`} className="text-sm font-semibold text-white hover:text-indigo-300 line-clamp-2">{r.title}</Link>
                  <Badge color={badgeColor(r.category)} className="mt-1.5">{r.category}</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{formatBytes(r.fileSize)}</span>
                <span>{r.downloadCount || 0} downloads</span>
              </div>
              <div className="flex gap-2 pt-1 border-t border-slate-800">
                <Link to={`/resources/${r.resourceId}`} className="flex-1">
                  <button className="w-full py-1.5 text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 hover:bg-slate-800 rounded-lg transition-colors"><Eye className="w-3.5 h-3.5"/>View</button>
                </Link>
                <button onClick={() => handleShare(r.resourceId)} className="flex-1 py-1.5 text-xs text-slate-400 hover:text-indigo-400 flex items-center justify-center gap-1.5 hover:bg-indigo-500/10 rounded-lg transition-colors"><Share2 className="w-3.5 h-3.5"/>Share</button>
                <button onClick={() => handleDelete(r.resourceId)} className="flex-1 py-1.5 text-xs text-slate-400 hover:text-rose-400 flex items-center justify-center gap-1.5 hover:bg-rose-500/10 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5"/>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share Modal */}
      <Modal open={!!shareData} onClose={() => { setShareData(null); setCopied(false); }} title="Share Resource">
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">Share this link — it expires in 72 hours.</p>
          <div className="flex gap-2">
            <input readOnly value={shareData?.link || ''}
              className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2.5 focus:outline-none" />
            <button onClick={handleCopy}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
