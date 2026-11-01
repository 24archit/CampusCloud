import { useState, useEffect } from 'react';
import { Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../lib/api';
import Badge from '../components/UI/Badge';
import EmptyState from '../components/UI/EmptyState';
import { Users } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminUsers() {
  const [users, setUsers]   = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers();
      const list = res?.data?.users || res?.data || [];
      setUsers(list);
      setFiltered(list);
    } catch { toast.error('Failed to load users'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(users.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)));
  }, [search, users]);

  const handleDelete = async (userId) => {
    if (!confirm('Delete this user? All their data will be removed.')) return;
    try {
      await adminAPI.deleteUser(userId);
      setUsers(u => u.filter(x => x.userId !== userId));
      toast.success('User deleted');
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Manage Users</h1>
        <p className="text-slate-400 text-sm mt-1">{users.length} registered users</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
          className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-sm" />
      </div>

      {loading ? (
        <div className="space-y-3">{Array(5).fill(0).map((_,i)=><div key={i} className="h-14 bg-slate-800/50 rounded-xl animate-pulse"/>)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="No users match your search." />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  {['User','Role','Uploads','Joined','Actions'].map(h=>(
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.userId} className={`hover:bg-slate-800/30 transition-colors ${i<filtered.length-1?'border-b border-slate-800/50':''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {u.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={u.role==='admin'?'violet':'slate'}>{u.role}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{u.uploadCount || 0}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {u.createdAt ? format(new Date(u.createdAt), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {u.role !== 'admin' && (
                        <button onClick={() => handleDelete(u.userId)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
