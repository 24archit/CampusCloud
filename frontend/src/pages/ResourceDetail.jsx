import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, Share2, Trash2, Calendar, User, Tag, HardDrive, BarChart2, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { resourcesAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import FileTypeIcon, { fileExtLabel } from '../components/UI/FileTypeIcon';
import Badge, { badgeColor } from '../components/UI/Badge';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import Spinner from '../components/UI/Spinner';
import { format } from 'date-fns';

function formatBytes(b) {
  if (!b) return '0 B';
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${(b / Math.pow(1024, i)).toFixed(1)} ${['B','KB','MB','GB'][i]}`;
}

export default function ResourceDetail() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [resource, setResource]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing]         = useState(false);
  const [shareLink, setShareLink]     = useState('');
  const [shareOpen, setShareOpen]     = useState(false);
  const [copied, setCopied]           = useState(false);
  const [deleting, setDeleting]       = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await resourcesAPI.get(id);
        setResource(res?.data?.resource || res?.data || res);
      } catch { toast.error('Resource not found'); navigate('/resources'); }
      finally  { setLoading(false); }
    })();
  }, [id, navigate]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await resourcesAPI.getDownloadUrl(id);
      const url = res?.data?.downloadUrl || res?.downloadUrl;
      window.open(url, '_blank');
      toast.success('Download started!');
    } catch { toast.error('Failed to generate download link'); }
    finally  { setDownloading(false); }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const res = await resourcesAPI.createShareLink(id);
      const data = res?.data || res;
      const link = `${window.location.origin}/shared/${data?.shareId || data?.resourceId}`;
      setShareLink(link);
      setShareOpen(true);
    } catch { toast.error('Failed to create share link'); }
    finally  { setSharing(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied!');
  };

  const handleDelete = async () => {
    if (!confirm('Delete this resource? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await resourcesAPI.delete(id);
      toast.success('Resource deleted');
      navigate('/my-uploads');
    } catch { toast.error('Failed to delete resource'); }
    finally  { setDeleting(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-64"><Spinner size="lg" /></div>
  );
  if (!resource) return null;

  const isOwner = user?.userId === resource.uploaderId;
  const canDelete = isOwner || isAdmin;

  const meta = [
    { Icon: User,     label: 'Uploaded by',  value: resource.uploaderName },
    { Icon: Calendar, label: 'Upload date',   value: resource.createdAt ? format(new Date(resource.createdAt), 'dd MMM yyyy') : 'Unknown' },
    { Icon: Tag,      label: 'Category',      value: resource.category },
    { Icon: HardDrive,label: 'File size',     value: formatBytes(resource.fileSize) },
    { Icon: BarChart2,label: 'Downloads',     value: resource.downloadCount || 0 },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-start gap-5 mb-6">
              <FileTypeIcon fileName={resource.fileName} fileType={resource.fileType} size="lg" />
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-white leading-snug">{resource.title}</h1>
                <p className="text-slate-400 text-sm mt-1">{resource.subject}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge color={badgeColor(resource.fileType || resource.fileName)}>
                    {fileExtLabel(resource.fileName, resource.fileType)}
                  </Badge>
                  <Badge color="indigo">{resource.category}</Badge>
                </div>
              </div>
            </div>

            {resource.description && (
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Description</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{resource.description}</p>
              </div>
            )}

            {resource.tags?.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {resource.tags.map(tag => <Badge key={tag} color="slate">#{tag}</Badge>)}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleDownload} loading={downloading} size="md">
              <Download className="w-4 h-4" /> Download
            </Button>
            <Button onClick={handleShare} loading={sharing} variant="outline" size="md">
              <Share2 className="w-4 h-4" /> Share Link
            </Button>
            {canDelete && (
              <Button onClick={handleDelete} loading={deleting} variant="danger" size="md">
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            )}
          </div>
        </div>

        {/* Sidebar metadata */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Resource Details</h3>
            <div className="space-y-4">
              {meta.map(({ Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="text-sm text-slate-200 font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {resource.fileName && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">File Information</h3>
              <p className="text-xs text-slate-400 break-all">{resource.fileName}</p>
            </div>
          )}
        </div>
      </div>

      {/* Share modal */}
      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Share Resource">
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">Share this link with anyone. It expires in 72 hours.</p>
          <div className="flex gap-2">
            <input readOnly value={shareLink}
              className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2.5 focus:outline-none" />
            <button onClick={handleCopy}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-slate-500">⏱ This link will expire in 72 hours</p>
        </div>
      </Modal>
    </div>
  );
}
