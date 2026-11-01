import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Upload, BookOpen, FolderOpen, ArrowRight, TrendingUp, Clock, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { resourcesAPI } from '../lib/api';
import StatCard from '../components/UI/StatCard';
import FileTypeIcon, { fileExtLabel } from '../components/UI/FileTypeIcon';
import Badge, { badgeColor } from '../components/UI/Badge';
import Button from '../components/UI/Button';
import { formatDistanceToNow } from 'date-fns';

function formatBytes(b) {
  if (!b) return '0 B';
  const sizes = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${(b / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [myUploads, setMyUploads]   = useState([]);
  const [allResources, setAllResources] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [mine, all] = await Promise.allSettled([
          resourcesAPI.myUploads(),
          resourcesAPI.list({ page: 1, limit: 6, sortBy: 'downloads' }),
        ]);
        if (mine.status === 'fulfilled') {
          const list = mine.value?.data?.items || mine.value?.data?.resources || (Array.isArray(mine.value?.data) ? mine.value?.data : []);
          setMyUploads(Array.isArray(list) ? list : []);
        }
        if (all.status  === 'fulfilled') {
          const list = all.value?.data?.items || all.value?.data?.resources || (Array.isArray(all.value?.data) ? all.value?.data : []);
          setAllResources(Array.isArray(list) ? list : []);
        }
      } catch { /* handled by allSettled */ }
      finally  { setLoading(false); }
    })();
  }, []);

  const safeUploads = Array.isArray(myUploads) ? myUploads : [];
  const safeAllResources = Array.isArray(allResources) ? allResources : [];
  const totalStorage = safeUploads.reduce((s, r) => s + (r.fileSize || 0), 0);
  const recent = safeUploads.slice(0, 5);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <Link to="/upload">
          <Button size="md">
            <Upload className="w-4 h-4" />
            Upload Resource
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FolderOpen} label="My Uploads"    value={safeUploads.length}        iconBg="bg-indigo-500/10" iconColor="text-indigo-400" />
        <StatCard icon={Download}   label="Total Downloads" value={safeUploads.reduce((s,r)=>s+(r.downloadCount||0),0)} iconBg="bg-emerald-500/10" iconColor="text-emerald-400" />
        <StatCard icon={TrendingUp} label="Trending Resources" value={safeAllResources.length} iconBg="bg-violet-500/10"  iconColor="text-violet-400" />
        <StatCard icon={BookOpen}   label="Storage Used"  value={formatBytes(totalStorage)} iconBg="bg-amber-500/10"  iconColor="text-amber-400" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to:'/upload',     Icon:Upload,    title:'Upload Resource',  desc:'Share your notes and files', color:'indigo' },
          { to:'/resources',  Icon:BookOpen,  title:'Browse Resources', desc:'Discover what peers shared', color:'violet' },
          { to:'/my-uploads', Icon:FolderOpen,title:'My Uploads',       desc:'Manage your uploaded files', color:'emerald'},
        ].map(({ to, Icon, title, desc, color }) => (
          <Link key={to} to={to}
            className={`group bg-slate-900 border border-slate-800 hover:border-${color}-500/40 rounded-xl p-5 transition-all duration-200 flex items-start gap-4`}>
            <div className={`w-10 h-10 bg-${color}-500/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-${color}-500/20 transition-colors`}>
              <Icon className={`w-5 h-5 text-${color}-400`} />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">{title}</p>
              <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 ml-auto mt-1 transition-colors" />
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent uploads */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /> My Recent Uploads</h2>
            <Link to="/my-uploads" className="text-sm text-indigo-400 hover:text-indigo-300">View all →</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />)}
            </div>
          ) : recent.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
              <FolderOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No uploads yet</p>
              <Link to="/upload"><Button size="sm" className="mt-3">Upload your first resource</Button></Link>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              {recent.map((r, idx) => (
                <Link key={r.resourceId} to={`/resources/${r.resourceId}`}
                  className={`flex items-center gap-4 px-4 py-3.5 hover:bg-slate-800/50 transition-colors ${idx < recent.length - 1 ? 'border-b border-slate-800' : ''}`}>
                  <FileTypeIcon fileName={r.fileName} fileType={r.fileType} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{r.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{r.subject} · {formatBytes(r.fileSize)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={badgeColor(r.fileType || r.fileName)}>{fileExtLabel(r.fileName, r.fileType)}</Badge>
                    <span className="text-xs text-slate-500 hidden sm:block">
                      {r.createdAt ? formatDistanceToNow(new Date(r.createdAt), { addSuffix: true }) : ''}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Popular resources */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-slate-400" /> Trending</h2>
            <Link to="/resources" className="text-sm text-indigo-400 hover:text-indigo-300">Browse →</Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(i=><div key={i} className="h-14 bg-slate-800/50 rounded-xl animate-pulse"/>)}</div>
          ) : allResources.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
              <p className="text-slate-500 text-sm">No resources yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allResources.slice(0,5).map((r, i) => (
                <Link key={r.resourceId} to={`/resources/${r.resourceId}`}
                  className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 hover:border-indigo-500/40 transition-all">
                  <span className="text-slate-600 text-xs font-bold w-4">{i+1}</span>
                  <FileTypeIcon fileName={r.fileName} fileType={r.fileType} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{r.title}</p>
                    <p className="text-xs text-slate-500">{r.downloadCount || 0} downloads</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
