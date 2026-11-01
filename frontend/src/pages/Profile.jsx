import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Edit3, Lock, Shield, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../lib/api';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  bio:  z.string().max(300, 'Bio must be under 300 characters').optional(),
});

const pwSchema = z.object({
  currentPassword: z.string().min(6, 'Required'),
  newPassword:     z.string().min(8, 'New password must be at least 8 characters').regex(/[A-Z]/,'Must contain uppercase').regex(/[0-9]/,'Must contain number'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, { message:"Passwords don't match", path:['confirmPassword'] });

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [pwOpen, setPwOpen] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', bio: user?.bio || '' },
  });

  useEffect(() => { reset({ name: user?.name || '', bio: user?.bio || '' }); }, [user, reset]);

  const { register: regPw, handleSubmit: handlePw, formState: { errors: pwErrors, isSubmitting: pwSubmitting }, reset: resetPw } = useForm({
    resolver: zodResolver(pwSchema),
  });

  const onSaveProfile = async (data) => {
    try {
      await authAPI.updateProfile(data);
      await refreshUser();
      toast.success('Profile updated!');
    } catch { toast.error('Update failed'); }
  };

  const onChangePassword = async (data) => {
    try {
      await authAPI.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed successfully!');
      setPwOpen(false);
      resetPw();
    } catch (err) { toast.error(err.response?.data?.error || 'Password change failed'); }
  };

  const inputCls = 'w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile & Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account information</p>
      </div>

      {/* Profile card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{user?.name}</h2>
            <p className="text-slate-400 text-sm">{user?.email}</p>
            <Badge color={user?.role === 'admin' ? 'violet' : 'indigo'} className="mt-1">
              {user?.role === 'admin' ? '👑 Admin' : '🎓 Student'}
            </Badge>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2"><Edit3 className="w-4 h-4"/>Edit Profile</h3>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input {...register('name')} className={`${inputCls} pl-9`} />
            </div>
            {errors.name && <p className="text-xs text-rose-400">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Email <span className="text-slate-500 font-normal">(cannot be changed)</span></label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={user?.email || ''} disabled className={`${inputCls} pl-9 opacity-50 cursor-not-allowed`} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Bio <span className="text-slate-500 font-normal">(optional)</span></label>
            <textarea {...register('bio')} rows={3} placeholder="A short bio about yourself…"
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            {errors.bio && <p className="text-xs text-rose-400">{errors.bio.message}</p>}
          </div>

          <Button type="submit" loading={isSubmitting} size="md">
            <Save className="w-4 h-4" /> Save Changes
          </Button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2"><Lock className="w-4 h-4"/>Change Password</h3>
          <button onClick={() => setPwOpen(!pwOpen)} className="text-xs text-indigo-400 hover:text-indigo-300">
            {pwOpen ? 'Cancel' : 'Change'}
          </button>
        </div>
        {!pwOpen ? (
          <p className="text-slate-500 text-sm">•••••••• (hidden for security)</p>
        ) : (
          <form onSubmit={handlePw(onChangePassword)} className="space-y-4">
            {[
              { name:'currentPassword', label:'Current Password' },
              { name:'newPassword',     label:'New Password' },
              { name:'confirmPassword', label:'Confirm New Password' },
            ].map(({ name, label }) => (
              <div key={name} className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">{label}</label>
                <input {...regPw(name)} type="password" className={inputCls} />
                {pwErrors[name] && <p className="text-xs text-rose-400">{pwErrors[name].message}</p>}
              </div>
            ))}
            <Button type="submit" loading={pwSubmitting} size="md">Update Password</Button>
          </form>
        )}
      </div>

      {/* Account info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-4"><Shield className="w-4 h-4"/>Account Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Role</span>
            <span className="text-slate-200 capitalize">{user?.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">User ID</span>
            <span className="text-slate-500 text-xs font-mono">{user?.userId?.slice(0,12)}…</span>
          </div>
        </div>
      </div>
    </div>
  );
}
