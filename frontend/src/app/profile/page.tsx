'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api, BACKEND_URL } from '../../utils/api';
import {
  User,
  Shield,
  Award,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  Camera,
  Upload
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { addToast } = useNotifications();

  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [availability, setAvailability] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhoto(user.photo || '');
      setSkills(user.skills || '');
      setExperience(user.experience || '');
      setAvailability(user.availability);
    }
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Please upload an image file (PNG/JPG/etc.)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('Image size must be less than 5MB', 'error');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await api.files.upload(formData);
      const fullUrl = `${BACKEND_URL}${result.filepath}`;
      
      setPhoto(fullUrl);
      addToast('Image uploaded successfully! Click save to apply changes.', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to upload image', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      addToast('Name is required', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateUser({
        name,
        photo: photo || null,
        skills: skills || null,
        experience: experience || null,
        availability
      });
      addToast('Profile updated successfully!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <User className="h-6 w-6 text-indigo-500" />
          <span>User Profile & Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Configure your personal billing details, bio tags, and dashboard presence.</p>
      </div>

      <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Preview */}
          <div className="flex items-center gap-4 border-b border-card-border pb-5">
            <div className="relative group h-16 w-16 rounded-full overflow-hidden border border-slate-350 dark:border-slate-700 cursor-pointer shrink-0">
              <img
                src={photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
                alt={name}
                className="h-full w-full object-cover"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition duration-200"
              >
                {uploading ? (
                  <Loader2 size={16} className="animate-spin text-white" />
                ) : (
                  <>
                    <Camera size={14} />
                    <span className="text-[8px] font-bold mt-1 uppercase tracking-wider">Change</span>
                  </>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                disabled={uploading}
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">{name || 'Workspace Account'}</h3>
              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 uppercase font-semibold tracking-wider">
                <Shield size={12} className="text-indigo-500" />
                <span>{user?.role} Permissions level</span>
              </p>
              <div className="flex gap-3 mt-2 select-none">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[10px] font-bold text-indigo-500 hover:text-indigo-400 transition"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </button>
                {photo && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-[10px] font-bold text-red-500 hover:text-red-400 transition"
                    disabled={uploading}
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Avatar Photo URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={photo}
                  onChange={e => setPhoto(e.target.value)}
                  placeholder="https://images.unsplash.com/photo..."
                  className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition whitespace-nowrap flex items-center gap-1.5 shadow-sm"
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Upload size={12} />
                  )}
                  <span>{uploading ? 'Uploading...' : 'Upload'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Skills Tags (Comma-separated)</label>
              <input
                type="text"
                value={skills}
                onChange={e => setSkills(e.target.value)}
                placeholder="e.g. Next.js, Figma, SQL"
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Experience / Title</label>
              <input
                type="text"
                value={experience}
                onChange={e => setExperience(e.target.value)}
                placeholder="e.g. Senior Frontend Dev (4 yrs)"
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
              />
            </div>
          </div>

          {/* Availability switch */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/30 border border-card-border rounded-xl">
            <div>
              <h4 className="text-xs font-bold text-foreground">Availability Status</h4>
              <p className="text-[10px] text-slate-400 mt-1">Show other employees that you are currently open for new task assignments.</p>
            </div>
            
            <button
              type="button"
              onClick={() => setAvailability(!availability)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition ${
                availability
                  ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-400'
                  : 'bg-slate-950/60 border-slate-800 text-slate-500'
              }`}
            >
              {availability ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              <span>{availability ? 'Available' : 'Busy'}</span>
            </button>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow transition"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>Save Workspace Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
