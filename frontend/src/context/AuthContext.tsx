'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Employee';
  photo: string | null;
  skills: string | null;
  experience: string | null;
  availability: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  updateUser: (profile: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchProfile = async () => {
    try {
      const data = await api.auth.me();
      setUser(data);
    } catch (err) {
      console.error('Failed to load user profile, logging out', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
      // Redirect to login if on protected page
      if (pathname !== '/login' && pathname !== '/register') {
        router.push('/login');
      }
    }
  }, [pathname]);

  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const res = await api.auth.login({ email, password });
      localStorage.setItem('token', res.token);
      setUser(res.user);
      router.push('/');
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  const updateUser = async (profileData: Partial<User>) => {
    try {
      const updated = await api.auth.updateProfile(profileData);
      setUser(updated);
    } catch (err) {
      console.error('Error updating profile in AuthContext', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
