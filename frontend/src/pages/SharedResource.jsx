import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, Cloud, Lock, AlertTriangle, CheckCircle } from 'lucide-react';
import { sharedAPI } from '../lib/api';
import FileTypeIcon, { fileExtLabel } from '../components/UI/FileTypeIcon';
import Badge, { badgeColor } from '../components/UI/Badge';
import Button from '../components/UI/Button';
import Spinner from '../components/UI/Spinner';
import { format } from 'date-fns';

function formatBytes(b) {
  if (!b) return '0 B';
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${(b / Math.pow(1024, i)).toFixed(1)} ${['B','KB','MB','GB'][i]}`;
}

export default function SharedResource() {
  const { linkId } = useParams();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await sharedAPI.get(linkId);
        setData(res?.data || res);
      } catch (err) {
        const status = err.response?.status;
        if (status === 410) setError('This share link has expired.');
        else if (status === 404) setError('Share link not found or invalid.');
        else setError('Failed to load shared resource.');
      } finally { setLoading(false); }
    })();
  }, [linkId]);

  const handleDownload = () => {
    if (!data?.downloadUrl) return;
    setDownloading(true);
    window.open(data.downloadUrl, '_blank');
    setTimeout(() => setDownloading(false), 1000);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Spinner size="lg" /></div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-rose-400" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Link Unavailable</h1>
        <p className="text-slate-400 text-sm mb-6">{error}</p>
        <Link to="/register"><Button>Get Access — Sign Up Free</Button></Link>
      </div>
    </div>
  );

  const resource = data?.resource || data;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md h-14 flex items-center px-6 justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center"><Cloud className="w-4 h-4 text-white" /></div>
          <span className="font-bold text-white">CampusCloud</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-slate-400 hover:text-white">Sign In</Link>
          <Link to="/register"><Button size="sm">Get Started</Button></Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        {/* Shared badge */}
        <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 w-fit">
          <CheckCircle className="w-4 h-4" /> Shared resource — no account required to download
        </div>

        {/* Resource card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-start gap-4">
            <FileTypeIcon fileName={resource?.fileName} fileType={resource?.fileType} size="lg" />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white">{resource?.title}</h1>
              <p className="text-slate-400 text-sm mt-1">{resource?.subject}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge color={badgeColor(resource?.fileType || resource?.fileName)}>
                  {fileExtLabel(resource?.fileName, resource?.fileType)}
                </Badge>
                {resource?.category && <Badge color="indigo">{resource.category}</Badge>}
              </div>
            </div>
          </div>

          {resource?.description && (
            <p className="text-slate-400 text-sm leading-relaxed">{resource.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-800/50 rounded-xl p-3">
              <p className="text-slate-500 text-xs">Uploaded by</p>
              <p className="text-white font-medium mt-0.5">{resource?.uploaderName || 'Anonymous'}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3">
              <p className="text-slate-500 text-xs">File size</p>
              <p className="text-white font-medium mt-0.5">{formatBytes(resource?.fileSize)}</p>
            </div>
          </div>

          <Button onClick={handleDownload} loading={downloading} className="w-full" size="lg">
            <Download className="w-5 h-5" /> Download Resource
          </Button>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-indigo-600/10 to-violet-600/10 border border-indigo-500/20 rounded-2xl p-6 text-center">
          <Lock className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
          <h3 className="font-semibold text-white mb-2">Access thousands more resources</h3>
          <p className="text-slate-400 text-sm mb-4">Join CampusCloud to upload, share, and discover academic resources.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/register"><Button>Create Free Account</Button></Link>
            <Link to="/login"><Button variant="outline">Sign In</Button></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
