import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { SlidersHorizontal, Download, Eye, X } from 'lucide-react';
import { resourcesAPI } from '../lib/api';
import SearchBar from '../components/UI/SearchBar';
import FileTypeIcon, { fileExtLabel } from '../components/UI/FileTypeIcon';
import Badge, { badgeColor } from '../components/UI/Badge';
import EmptyState from '../components/UI/EmptyState';
import { BookOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const CATEGORIES = ['All','Notes','Assignments','Projects','Research Papers','Presentations','Lab Manuals','Previous Year Papers','Books','Other'];
const FILE_TYPES  = ['All','PDF','DOCX','PPTX','XLSX','TXT','ZIP'];
const SORTS = [
  { value:'latest',    label:'Latest First' },
  { value:'downloads', label:'Most Downloaded' },
  { value:'alphabetical',label:'A → Z' },
];

function formatBytes(b) {
  if (!b) return '0 B';
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${(b / Math.pow(1024, i)).toFixed(1)} ${['B','KB','MB','GB'][i]}`;
}

function ResourceCard({ resource }) {
  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-5 transition-all duration-200 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <FileTypeIcon fileName={resource.fileName} fileType={resource.fileType} />
        <div className="flex-1 min-w-0">
          <Link to={`/resources/${resource.resourceId}`} className="font-semibold text-white hover:text-indigo-300 transition-colors line-clamp-2 text-sm leading-snug">
            {resource.title}
          </Link>
          <p className="text-slate-500 text-xs mt-1">{resource.subject}</p>
        </div>
        <Badge color={badgeColor(resource.fileType || resource.fileName)}>
          {fileExtLabel(resource.fileName, resource.fileType)}
        </Badge>
      </div>
      {resource.description && (
        <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{resource.description}</p>
      )}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {resource.uploaderName?.[0]?.toUpperCase() || '?'}
          </div>
          <span className="text-xs text-slate-400 truncate max-w-[100px]">{resource.uploaderName}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Download className="w-3 h-3" />{resource.downloadCount || 0}</span>
          <span>{formatBytes(resource.fileSize)}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Link to={`/resources/${resource.resourceId}`} className="flex-1">
          <button className="w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium py-2 rounded-lg transition-colors">
            <Eye className="w-3.5 h-3.5" /> View Details
          </button>
        </Link>
      </div>
    </div>
  );
}

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('All');
  const [fileType, setFileType]   = useState('All');
  const [sortBy, setSortBy]       = useState('latest');
  const [showFilters, setShowFilters] = useState(false);
  const LIMIT = 12;

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT, sortBy };
      if (search)                params.search   = search;
      if (category !== 'All')    params.category = category;
      if (fileType !== 'All')    params.fileType = fileType.toLowerCase();
      const res = await resourcesAPI.list(params);
      setResources(res?.data?.items || res?.data || []);
      setTotal(res?.data?.total || 0);
    } catch { setResources([]); }
    finally  { setLoading(false); }
  }, [page, search, category, fileType, sortBy]);

  useEffect(() => { fetchResources(); }, [fetchResources]);
  useEffect(() => { setPage(1); }, [search, category, fileType, sortBy]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Browse Resources</h1>
        <p className="text-slate-400 text-sm mt-1">{total} resources available</p>
      </div>

      {/* Search + controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by title, subject, keywords…" className="flex-1" />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 text-sm rounded-lg px-3 py-2 transition-colors">
          <SlidersHorizontal className="w-4 h-4" /> Filters
          {(category !== 'All' || fileType !== 'All') && <span className="w-2 h-2 bg-indigo-500 rounded-full" />}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap gap-6">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${category === c ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">File Type</p>
            <div className="flex flex-wrap gap-2">
              {FILE_TYPES.map(t => (
                <button key={t} onClick={() => setFileType(t)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${fileType === t ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          {(category !== 'All' || fileType !== 'All') && (
            <div className="flex items-end">
              <button onClick={() => { setCategory('All'); setFileType('All'); }}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300">
                <X className="w-3 h-3" /> Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => <div key={i} className="h-52 bg-slate-800/50 rounded-xl animate-pulse" />)}
        </div>
      ) : resources.length === 0 ? (
        <EmptyState icon={BookOpen} title="No resources found" description="Try adjusting your search or filters." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {resources.map(r => <ResourceCard key={r.resourceId} resource={r} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 text-sm bg-slate-800 border border-slate-700 text-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-700 transition-colors">
            Previous
          </button>
          <span className="text-sm text-slate-400">Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 text-sm bg-slate-800 border border-slate-700 text-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-700 transition-colors">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
