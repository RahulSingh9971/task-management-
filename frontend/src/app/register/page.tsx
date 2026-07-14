'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { Loader2 } from 'lucide-react';
import { api } from '@/utils/api';

export default function RegisterPage() {
  const { login } = useAuth();
  const { addToast } = useNotifications();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Employee');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      addToast('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const data = await api.auth.register({ name, email, password, role });
      localStorage.setItem('token', data.token);
      window.location.href = '/'; // Reload to boot AuthContext
      addToast('Registration Successful!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#070b13] relative overflow-hidden select-none px-4">
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-indigo-600/10 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-purple-600/10 blur-[120px]" />

      <div className="max-w-md w-full glass p-8 rounded-2xl shadow-2xl relative z-10 border border-slate-800 text-center animate-fade-in">
        <div className="mb-6 flex flex-col items-center">
          <img src="/logo.png" alt="Clickmecha Logo" className="h-11 w-auto object-contain mb-3" />
          <h2 className="text-lg font-bold text-white tracking-wide">Create Workspace Account</h2>
          <p className="text-xs text-slate-400 mt-1">Get started with Clickmecha</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Alex Rivera"
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. alex@dashboard.com"
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">Workspace Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-indigo-500 transition"
            >
              <option value="Employee" className="bg-slate-950">Employee</option>
              <option value="Manager" className="bg-slate-950">Manager</option>
              <option value="Admin" className="bg-slate-950">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs transition duration-150 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register Workspace Account'}
          </button>
        </form>

        <p className="text-[10px] text-slate-500 mt-6 font-medium">
          Already have an account?{' '}
          <a href="/login" className="text-indigo-400 hover:underline">
            Log in here
          </a>
        </p>
      </div>
    </div>
  );
}
