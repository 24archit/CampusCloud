import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, CloudUpload, File, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { resourcesAPI } from '../lib/api';
import Button from '../components/UI/Button';
import { v4 as uuidv4 } from 'uuid';

const CATEGORIES = ['Notes','Assignments','Projects','Research Papers','Presentations','Lab Manuals','Previous Year Papers','Books','Other'];
const ALLOWED = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain','application/zip'];
const MAX_SIZE = 50 * 1024 * 1024;

const schema = z.object({
  title:       z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().max(500).optional(),
  subject:     z.string().min(2, 'Subject is required').max(80),
  category:    z.string().min(1, 'Category is required'),
  tags:        z.string().optional(),
});

function formatBytes(b) {
  if (!b) return '0 B';
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${(b / Math.pow(1024, i)).toFixed(1)} ${['B','KB','MB','GB'][i]}`;
}

const STEPS = ['Select File', 'Fill Details', 'Upload'];

export default function UploadPage() {
  const navigate = useNavigate();
  const [step, setStep]           = useState(0);
  const [file, setFile]           = useState(null);
  const [fileError, setFileError] = useState('');
  const [progress, setProgress]   = useState(0);
  const [uploading, setUploading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { category: 'Notes' },
  });

  const onDrop = useCallback((accepted, rejected) => {
    setFileError('');
    if (rejected.length > 0) {
      const r = rejected[0];
      if (r.errors[0]?.code === 'file-too-large') setFileError('File exceeds 50 MB limit.');
      else if (r.errors[0]?.code === 'file-invalid-type') setFileError('File type not supported. Use PDF, DOCX, PPTX, XLSX, TXT, or ZIP.');
      else setFileError('Invalid file.');
      return;
    }
    if (accepted.length > 0) { setFile(accepted[0]); setStep(1); }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: ALLOWED.reduce((a,t) => ({ ...a, [t]: [] }), {}),
    maxSize: MAX_SIZE, multiple: false,
  });

  const onSubmit = async (data) => {
    if (!file) { toast.error('Please select a file'); setStep(0); return; }
    setUploading(true);
    setStep(2);
    try {
      const resourceId = uuidv4();
      const tags = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

      // Step 1: Get presigned upload URL
      setProgress(10);
      const urlRes = await resourcesAPI.getUploadUrl({
        resourceId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        title: data.title,
        subject: data.subject,
        category: data.category,
      });
      const { uploadUrl, s3Key } = urlRes?.data || urlRes;

      // Step 2: Upload directly to S3
      setProgress(30);
      await axios.put(uploadUrl, file, {
        headers: { 'Content-Type': file.type },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded / e.total) * 60) + 30;
          setProgress(pct);
        },
      });

      // Step 3: Save metadata to backend
      setProgress(95);
      await resourcesAPI.create({
        resourceId, s3Key,
        title: data.title,
        description: data.description || '',
        subject: data.subject,
        category: data.category,
        tags,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });

      setProgress(100);
      toast.success('Resource uploaded successfully! 🎉');
      setTimeout(() => navigate(`/resources/${resourceId}`), 800);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed. Please try again.');
      setStep(1);
      setProgress(0);
    } finally { setUploading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Upload Resource</h1>
        <p className="text-slate-400 text-sm mt-1">Share your study materials with the community</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 ${i <= step ? 'text-indigo-400' : 'text-slate-600'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                i < step  ? 'bg-indigo-600 border-indigo-600 text-white' :
                i === step ? 'border-indigo-500 text-indigo-400' :
                'border-slate-700 text-slate-600'}`}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className="text-sm font-medium hidden sm:block">{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-px w-8 ${i < step ? 'bg-indigo-600' : 'bg-slate-700'}`} />}
          </div>
        ))}
      </div>

      {/* Step 0: File select */}
      {step === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              isDragActive ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/30'}`}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CloudUpload className="w-8 h-8 text-indigo-400" />
            </div>
            <p className="text-white font-semibold mb-1">{isDragActive ? 'Drop your file here' : 'Drag & drop your file'}</p>
            <p className="text-slate-400 text-sm mb-4">or click to browse</p>
            <p className="text-xs text-slate-500">PDF, DOCX, PPTX, XLSX, TXT, ZIP · Max 50 MB</p>
          </div>
          {fileError && (
            <div className="flex items-start gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {fileError}
            </div>
          )}
        </div>
      )}

      {/* Step 1: Form */}
      {step === 1 && file && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          {/* File preview */}
          <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
            <File className="w-5 h-5 text-indigo-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{file.name}</p>
              <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
            </div>
            <button type="button" onClick={() => { setFile(null); setStep(0); }}
              className="text-xs text-slate-400 hover:text-rose-400 transition-colors">Change</button>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Title <span className="text-rose-400">*</span></label>
            <input {...register('title')} placeholder="e.g. Data Structures Complete Notes"
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            {errors.title && <p className="text-xs text-rose-400">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Description</label>
            <textarea {...register('description')} placeholder="Brief description of this resource…" rows={3}
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Subject <span className="text-rose-400">*</span></label>
              <input {...register('subject')} placeholder="e.g. Computer Science"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              {errors.subject && <p className="text-xs text-rose-400">{errors.subject.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Category <span className="text-rose-400">*</span></label>
              <select {...register('category')}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Tags <span className="text-slate-500 font-normal">(comma-separated)</span></label>
            <input {...register('tags')} placeholder="e.g. algorithms, sorting, trees"
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setStep(0)}
              className="px-5 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg hover:bg-slate-700 transition-colors">
              Back
            </button>
            <Button type="submit" className="flex-1" size="md">
              <Upload className="w-4 h-4" /> Upload Resource
            </Button>
          </div>
        </form>
      )}

      {/* Step 2: Progress */}
      {step === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6">
          {progress < 100 ? (
            <>
              <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto">
                <CloudUpload className="w-8 h-8 text-indigo-400 animate-bounce" />
              </div>
              <div>
                <p className="font-semibold text-white mb-1">Uploading to AWS S3…</p>
                <p className="text-slate-400 text-sm">{progress}% complete</p>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="font-semibold text-white">Upload complete!</p>
              <p className="text-slate-400 text-sm">Redirecting to your resource…</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
