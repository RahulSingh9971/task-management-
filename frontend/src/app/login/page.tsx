'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/utils/api';

export default function LoginPage() {
  const { login } = useAuth();
  const { addToast } = useNotifications();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please fill in all fields', 'error');
      return;
    }
    
    setLoading(true);
    try {
      await login(email, password);
      addToast('Welcome back to your workspace!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setLoading(true);
    try {
      await login(presetEmail, presetPass);
      addToast('Logged in with preset credentials', 'success');
    } catch (err: any) {
      addToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Mock Google Authentication login
  const handleGoogleMockLogin = async () => {
    setLoading(true);
    try {
      const googleMock = {
        token: 'mock_google_jwt_token',
        email: 'google.dev@dashboard.com',
        name: 'Google Engineer',
        photo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150',
        googleId: 'google_123456789'
      };

      const data = await api.auth.googleLogin(googleMock);
      
      localStorage.setItem('token', data.token);
      window.location.href = '/'; // Reload to boot AuthContext
      addToast('Mock Google Login Successful!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Google Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#070b13] relative overflow-hidden select-none px-4">
      {/* Background aesthetic blobs */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-indigo-600/10 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-purple-600/10 blur-[120px]" />

      <div className="max-w-md w-full glass p-8 rounded-2xl shadow-2xl relative z-10 border border-slate-800 text-center animate-fade-in">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center">
          <img src="/logo.png" alt="Clickmecha Logo" className="h-11 w-auto object-contain mb-3" />
          <h2 className="text-lg font-bold text-white tracking-wide">Welcome to Clickmecha</h2>
          <p className="text-xs text-slate-400 mt-1">Enterprise Project & Task Management</p>
        </div>

        {/* Credentials presets for quick testing */}
        <div className="mb-6 bg-slate-900/50 border border-slate-800/80 p-3 rounded-lg text-left">
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">Demo User Profiles (Quick Login)</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleQuickLogin('admin@dashboard.com', 'admin123')}
              className="px-2 py-1 text-[10px] font-semibold bg-indigo-900/30 text-indigo-300 rounded border border-indigo-800/50 hover:bg-indigo-900/60 transition"
            >
              Admin Role
            </button>
            <button
              onClick={() => handleQuickLogin('emma@dashboard.com', 'manager123')}
              className="px-2 py-1 text-[10px] font-semibold bg-amber-900/30 text-amber-300 rounded border border-amber-800/50 hover:bg-amber-900/60 transition"
            >
              Scrum Manager
            </button>
            <button
              onClick={() => handleQuickLogin('alex@dashboard.com', 'alex123')}
              className="px-2 py-1 text-[10px] font-semibold bg-green-900/30 text-green-300 rounded border border-green-800/50 hover:bg-green-900/60 transition"
            >
              Alex (Dev)
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. admin@dashboard.com"
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Password</label>
            </div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-indigo-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log In to Workspace'}
          </button>
        </form>

        <div className="relative my-6">
          <hr className="border-slate-800" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 bg-[#070b13] text-[9px] font-bold text-slate-500 uppercase">Or Continue With</span>
        </div>

        {/* Google OAuth Login Button */}
        <button
          onClick={handleGoogleMockLogin}
          type="button"
          className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-white rounded-lg font-semibold text-xs transition duration-150 flex items-center justify-center gap-2"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 1.76 14.93 1 12 1 7.39 1 3.52 3.65 1.66 7.5l3.86 3C6.44 7.55 9 5.04 12 5.04z"
            />
            <path
              fill="#4285F4"
              d="M23.45 12.3c0-.82-.07-1.6-.2-2.3H12v4.4h6.43c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-2 3.7-4.95 3.7-8.55z"
            />
            <path
              fill="#FBBC05"
              d="M5.52 14.5c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18L1.66 7.14C.6 9.3.01 11.7.01 14.24s.6 4.93 1.65 7.1l3.86-2.84z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.7-2.87c-1.03.69-2.34 1.1-4.26 1.1-3 0-5.56-2.51-6.48-5.46L1.66 15.7C3.52 19.55 7.39 22.2 12 23z"
            />
          </svg>
          Google Login
        </button>

        <p className="text-[10px] text-slate-500 mt-6 font-medium">
          Don't have an account?{' '}
          <Link href="/register" className="text-indigo-400 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
