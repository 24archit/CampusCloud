import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, HardDrive, Share2, TrendingUp, ArrowRight } from 'lucide-react';
import { adminAPI } from '../lib/api';
import StatCard from '../components/UI/StatCard';
import Badge, { badgeColor } from '../components/UI/Badge';
import FileTypeIcon from '../components/UI/FileTypeIcon';
import { formatDistanceToNow } from 'date-fns';

function formatBytes(b) {
  if (!b) return '0 B';
  if (b > 1e9)  return `${(b/1e9).toFixed(2)} GB`;
  if (b > 1e6)  return `${(b/1e6).toFixed(1)} MB`;
  if (b > 1e3)  return `${(b/1e3).toFixed(1)} KB`;
  return `${b} B`;
}

export default function AdminDashboard() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminAPI.getStats();
        setStats(res?.data || res);
      } catch { /* stats not critical */ }
      finally  { setLoading(false); }
    })();
  }, []);

  const statCards = [
    { icon: Users,     label: 'Total Users',       value: loading ? '…' : stats?.totalUsers || 0,             iconBg:'bg-indigo-500/10', iconColor:'text-indigo-400' },
    { icon: BookOpen,  label: 'Total Resources',    value: loading ? '…' : stats?.totalResources || 0,         iconBg:'bg-violet-500/10',  iconColor:'text-violet-400' },
    { icon: HardDrive, label: 'Storage Used',       value: loading ? '…' : formatBytes(stats?.totalStorageBytes||0), iconBg:'bg-amber-500/10',  iconColor:'text-amber-400' },
    { icon: TrendingUp,label: 'Uploads This Month', value: loading ? '…' : stats?.uploadsThisMonth || 0,       iconBg:'bg-emerald-500/10', iconColor:'text-emerald-400' },
  ];

  const categories = stats?.resourcesByCategory || {};
  const totalForPct = Object.values(categories).reduce((a,b)=>a+b,0) || 1;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Platform overview and management</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">Resources by Category</h2>
          {Object.keys(categories).length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No data yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(categories).sort(([,a],[,b])=>b-a).map(([cat, cnt]) => (
                <div key={cat}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-300">{cat}</span>
                    <span className="text-slate-500">{cnt}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${(cnt/totalForPct)*100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { to:'/admin/users',     Icon:Users,    label:'Manage Users',    desc:'View and delete users',   color:'indigo' },
              { to:'/admin/resources', Icon:BookOpen, label:'Manage Resources',desc:'Review all uploads',      color:'violet' },
            ].map(({ to, Icon, label, desc, color }) => (
              <Link key={to} to={to}
                className={`group bg-slate-800/50 border border-slate-700 hover:border-${color}-500/40 rounded-xl p-4 flex items-start gap-3 transition-all`}>
                <div className={`w-9 h-9 bg-${color}-500/10 rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 text-${color}-400`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 ml-auto mt-1" />
              </Link>
            ))}
          </div>

          {stats?.recentResources?.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Recent Uploads</h3>
              <div className="space-y-2">
                {(stats.recentResources || []).slice(0,4).map(r => (
                  <div key={r.resourceId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50">
                    <FileTypeIcon fileName={r.fileName} fileType={r.fileType} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{r.title}</p>
                      <p className="text-xs text-slate-500">{r.uploaderName}</p>
                    </div>
                    <span className="text-xs text-slate-500 hidden sm:block">
                      {r.createdAt ? formatDistanceToNow(new Date(r.createdAt), { addSuffix: true }) : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
