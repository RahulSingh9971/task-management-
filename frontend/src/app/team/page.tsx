'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/utils/api';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  Plus,
  Mail,
  UserCheck,
  Award,
  Circle,
  Shield,
  Loader2,
  Trash2,
  X
} from 'lucide-react';

export default function TeamPage() {
  const { user: currentUser } = useAuth();
  const { addToast } = useNotifications();

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Invitation fields
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Employee');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');

  const loadTeam = async () => {
    try {
      setLoading(true);
      const data = await api.team.getAll();
      setMembers(data);
    } catch (err) {
      console.error('Failed to load team directory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      addToast('Name and Email are required', 'error');
      return;
    }

    try {
      const res = await api.team.create({ name, email, role, skills, experience });
      addToast(res.message || 'Team member added!', 'success');
      setModalOpen(false);
      setName('');
      setEmail('');
      setSkills('');
      setExperience('');
      loadTeam();
    } catch (err: any) {
      addToast(err.message || 'Invitation failed', 'error');
    }
  };

  const handleUpdateRole = async (memberId: number, nextRole: string) => {
    try {
      await api.team.updateRole(memberId, nextRole);
      addToast('User role updated successfully', 'success');
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: nextRole } : m));
    } catch (err: any) {
      addToast(err.message || 'Role change forbidden', 'error');
    }
  };

  const handleDeleteMember = async (memberId: number) => {
    if (memberId === currentUser?.id) {
      addToast('You cannot delete your own account', 'error');
      return;
    }
    if (confirm('Remove this team member from the workspace?')) {
      try {
        await api.team.delete(memberId);
        addToast('Member removed from database', 'success');
        setMembers(prev => prev.filter(m => m.id !== memberId));
      } catch (err: any) {
        addToast(err.message || 'Permission denied', 'error');
      }
    }
  };

  const isAdmin = currentUser?.role === 'Admin';
  const isManager = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-left">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-500" />
            <span>Team Directory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Manage employee permissions, availability, and skillset matches.</p>
        </div>

        {isManager && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow transition"
          >
            <Plus size={14} />
            <span>Invite Member</span>
          </button>
        )}
      </div>

      {/* Directory Grid list */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map(member => (
            <div
              key={member.id}
              className="bg-card border border-card-border rounded-2xl p-5 text-left flex flex-col justify-between h-56 relative hover:shadow-md transition"
            >
              {/* Delete employee button */}
              {isAdmin && member.id !== currentUser?.id && (
                <button
                  onClick={() => handleDeleteMember(member.id)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-1 rounded transition"
                  title="Remove Member"
                >
                  <Trash2 size={13} />
                </button>
              )}

              <div>
                {/* Header photo & online status */}
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0 select-none">
                    <img
                      src={member.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
                      alt={member.name}
                      className="h-10 w-10 rounded-full object-cover border border-slate-700"
                    />
                    <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-card ${
                      member.availability ? 'bg-green-500' : 'bg-slate-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground truncate">{member.name}</h3>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Mail size={11} className="text-slate-500" />
                      <span>{member.email}</span>
                    </p>
                  </div>
                </div>

                {/* Skills tags */}
                {member.skills && (
                  <div className="flex flex-wrap gap-1 mt-4 select-none">
                    {member.skills.split(',').slice(0, 3).map((skill: string) => (
                      <span key={skill} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[8px] font-semibold text-slate-400 rounded">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Roles editing & experience summary */}
              <div className="mt-4 pt-4 border-t border-card-border flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <Award size={13} className="text-indigo-500" />
                  <span>{member.experience || 'New Member'}</span>
                </span>

                {isAdmin && member.id !== currentUser?.id ? (
                  <select
                    value={member.role}
                    onChange={e => handleUpdateRole(member.id, e.target.value)}
                    className="px-2 py-1 bg-slate-100 dark:bg-slate-850 border border-transparent rounded text-[9px] font-bold text-indigo-400 outline-none uppercase tracking-wide transition"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                ) : (
                  <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-bold uppercase tracking-wider select-none">
                    {member.role}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: INVITE MEMBER
          ------------------------------------------------------------- */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-card-border rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-fade-in text-left">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-foreground p-1"
            >
              <X size={20} />
            </button>

            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-5 flex items-center gap-1.5 select-none">
              <UserCheck className="text-indigo-500" size={18} />
              <span>Invite Workspace Staff</span>
            </h2>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Staff Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Liam Neeson"
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. liam@dashboard.com"
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Permissions Role</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs text-foreground outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition"
                  >
                    <option value="Employee">Employee (Developer/Designer)</option>
                    <option value="Manager">Manager (Scrum Master)</option>
                    <option value="Admin">Admin (Director)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Experience</label>
                  <input
                    type="text"
                    value={experience}
                    onChange={e => setExperience(e.target.value)}
                    placeholder="e.g. 4 Years"
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Skills (Comma-separated)</label>
                <input
                  type="text"
                  value={skills}
                  onChange={e => setSkills(e.target.value)}
                  placeholder="React, CSS, Figma"
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 select-none">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-card-border rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition"
                >
                  Provision Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
