'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useNotifications } from '@/context/NotificationContext';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Calendar,
  Users,
  UserCheck,
  FileText,
  FolderOpen,
  BarChart3,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Bell,
  Search,
  LogOut,
  User,
  Settings,
  AlertCircle,
  Info,
  CheckCircle,
  Loader2
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    toasts,
    removeToast
  } = useNotifications();

  const pathname = usePathname();
  const router = useRouter();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Close menus on click outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setNotifDropdownOpen(false);
      setProfileDropdownOpen(false);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('click', handleOutsideClick);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('click', handleOutsideClick);
      }
    };
  }, []);

  const isAuthPage = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated && !isAuthPage) {
        router.push('/login');
      } else if (isAuthenticated && isAuthPage) {
        router.push('/');
      }
    }
  }, [loading, isAuthenticated, isAuthPage, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0b0f19] text-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-sm text-gray-400 font-medium">Loading Workspace Core...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (isAuthPage) return <>{children}</>;
    return null;
  }

  if (isAuthPage) {
    return null;
  }

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/projects', label: 'Projects', icon: FolderKanban },
    { href: '/tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/clients', label: 'Clients', icon: UserCheck },
    { href: '/team', label: 'Team Directory', icon: Users },
    { href: '/notes', label: 'Notes', icon: FileText },
    { href: '/files', label: 'Files', icon: FolderOpen },
    { href: '/reports', label: 'Reports', icon: BarChart3 },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* -------------------------------------------------------------
          TOAST NOTIFICATIONS OVERLAY
          ------------------------------------------------------------- */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map(t => (
          <div
            key={t.id}
            onClick={() => removeToast(t.id)}
            className="flex items-center gap-3 p-4 bg-slate-900 border border-slate-700 text-white rounded-lg shadow-xl cursor-pointer hover:bg-slate-800 transition duration-200 animate-fade-in"
          >
            {t.type === 'error' ? (
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            ) : t.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
            ) : (
              <Info className="h-5 w-5 text-indigo-400 shrink-0" />
            )}
            <p className="text-xs font-medium leading-normal">{t.message}</p>
          </div>
        ))}
      </div>

      {/* -------------------------------------------------------------
          DESKTOP SIDEBAR
          ------------------------------------------------------------- */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } hidden md:flex flex-col bg-sidebar border-r border-slate-800 h-full transition-all duration-300 relative z-30 shrink-0`}
      >
        {/* Brand Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2 font-bold text-white text-lg overflow-hidden">
            {sidebarCollapsed ? (
              <img src="/favicon.png" alt="Logo" className="h-8 w-8 object-contain" />
            ) : (
              <img src="/logo.png" alt="Clickmecha" className="h-7 w-auto object-contain" />
            )}
          </Link>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-sidebar-text hover:text-white p-1 rounded hover:bg-slate-800 transition"
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 overflow-y-auto px-3 space-y-1">
          {navLinks.map(link => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition duration-150 ${
                  active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
                    : 'text-sidebar-text hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {!sidebarCollapsed && <span>{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Profile/Logout Card */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between gap-2">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 overflow-hidden">
                <img
                  src={user?.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
                  alt={user?.name}
                  className="h-8 w-8 rounded-full object-cover border border-slate-700"
                />
                <div className="text-left overflow-hidden">
                  <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium truncate">{user?.role}</p>
                </div>
              </div>
            )}
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition shrink-0"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* -------------------------------------------------------------
          MOBILE SIDEBAR OVERLAY
          ------------------------------------------------------------- */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <aside
            className="w-64 bg-sidebar border-r border-slate-800 h-full flex flex-col z-50 animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
              <span className="flex items-center gap-2 font-bold text-white text-lg">
                <img src="/logo.png" alt="Clickmecha" className="h-7 w-auto object-contain" />
              </span>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="text-sidebar-text hover:text-white p-1 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 py-4 overflow-y-auto px-3 space-y-1">
              {navLinks.map(link => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                      active
                        ? 'bg-indigo-600 text-white'
                        : 'text-sidebar-text hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <img
                    src={user?.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
                    alt={user?.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-white">{user?.name}</p>
                    <p className="text-[10px] text-slate-400">{user?.role}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-400 rounded-lg"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* -------------------------------------------------------------
          MAIN APP BODY AREA
          ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-card-border bg-card shrink-0 select-none">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1 text-foreground hover:bg-slate-200 dark:hover:bg-slate-800 rounded md:hidden transition"
            >
              <Menu size={20} />
            </button>

            {/* Global Search form */}
            <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center relative w-60 lg:w-80">
              <Search className="absolute left-3 h-4 w-4 text-slate-400" />
              <input
                type="search"
                placeholder="Global search projects, tasks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-foreground transition"
              />
            </form>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-foreground dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-2 text-slate-500 hover:text-foreground dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition relative"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 flex items-center justify-center text-[9px] font-bold text-white bg-red-500 rounded-full animate-pulse border border-card">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-card border border-card-border rounded-lg shadow-xl overflow-hidden z-40 animate-fade-in text-left">
                  <div className="flex items-center justify-between p-3 border-b border-card-border bg-slate-50 dark:bg-slate-900/30">
                    <h3 className="text-xs font-semibold text-foreground">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[10px] text-indigo-500 font-medium hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-card-border">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => markAsRead(n.id)}
                          className={`p-3 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${
                            !n.read ? 'bg-indigo-50/20 dark:bg-indigo-900/10 font-medium' : ''
                          }`}
                        >
                          <p className="text-foreground leading-snug">{n.message}</p>
                          <span className="text-[9px] text-slate-400 mt-1 block">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <img
                  src={user?.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
                  alt={user?.name}
                  className="h-8 w-8 rounded-full object-cover border border-slate-300 dark:border-slate-700"
                />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card border border-card-border rounded-lg shadow-xl overflow-hidden z-40 animate-fade-in text-left">
                  <div className="p-3 border-b border-card-border">
                    <p className="text-xs font-semibold text-foreground">{user?.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                    >
                      <User size={14} />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                    >
                      <Settings size={14} />
                      <span>Settings</span>
                    </Link>
                    <hr className="border-card-border" />
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content Pane */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
