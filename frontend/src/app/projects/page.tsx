'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/utils/api';
import { useNotifications } from '@/context/NotificationContext';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Loader2,
  Trash2,
  Edit,
  Activity,
  X
} from 'lucide-react';
import Link from 'next/link';

export default function ProjectsPage() {
  const { addToast } = useNotifications();

  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Planning');
  const [budget, setBudget] = useState('');
  const [category, setCategory] = useState('');
  const [colorLabel, setColorLabel] = useState('#6366f1');
  const [techInput, setTechInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [projData, clientData, teamData] = await Promise.all([
        api.projects.getAll(),
        api.clients.getAll(),
        api.team.getAll()
      ]);
      setProjects(projData);
      setClients(clientData);
      setTeam(teamData);
    } catch (err) {
      console.error('Error loading projects list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingProject(null);
    setName('');
    setClientId('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setPriority('Medium');
    setStatus('Planning');
    setBudget('');
    setCategory('');
    setColorLabel('#6366f1');
    setTechInput('');
    setTagsInput('');
    setSelectedMembers([]);
    setModalOpen(true);
  };

  const handleOpenEditModal = (proj: any) => {
    setEditingProject(proj);
    setName(proj.name);
    setClientId(proj.clientId || '');
    setDescription(proj.description || '');
    setStartDate(proj.startDate || '');
    setEndDate(proj.endDate || '');
    setPriority(proj.priority);
    setStatus(proj.status);
    setBudget(proj.budget || '');
    setCategory(proj.category || '');
    setColorLabel(proj.colorLabel || '#6366f1');
    
    // Parse technologies and tags
    try {
      const techList = JSON.parse(proj.technologiesUsed || '[]');
      setTechInput(techList.join(', '));
    } catch {
      setTechInput('');
    }

    try {
      const tagsList = JSON.parse(proj.tags || '[]');
      setTagsInput(tagsList.join(', '));
    } catch {
      setTagsInput('');
    }

    // Parse team member IDs
    try {
      const memberList = JSON.parse(proj.teamMembers || '[]');
      setSelectedMembers(memberList);
    } catch {
      setSelectedMembers([]);
    }

    setModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      addToast('Project Name is required', 'error');
      return;
    }

    const techArray = techInput.split(',').map(t => t.trim()).filter(t => t !== '');
    const tagsArray = tagsInput.split(',').map(t => t.trim()).filter(t => t !== '');
    const clientName = clients.find(c => c.id === parseInt(clientId))?.company || '';

    const payload = {
      name,
      clientId: clientId ? parseInt(clientId) : null,
      clientName,
      description,
      startDate: startDate || null,
      endDate: endDate || null,
      priority,
      status,
      budget: budget ? parseFloat(budget) : null,
      category,
      technologiesUsed: techArray,
      teamMembers: selectedMembers,
      colorLabel,
      tags: tagsArray
    };

    try {
      if (editingProject) {
        await api.projects.update(editingProject.id, payload);
        addToast(`Project "${name}" updated successfully`, 'success');
      } else {
        await api.projects.create(payload);
        addToast(`Project "${name}" created successfully`, 'success');
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Error saving project', 'error');
    }
  };

  const handleDeleteProject = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm('Are you sure you want to delete this project and all its tasks?')) {
      try {
        await api.projects.delete(id);
        addToast('Project successfully deleted', 'success');
        loadData();
      } catch (err: any) {
        addToast(err.message || 'Error deleting project', 'error');
      }
    }
  };

  const handleToggleMember = (memberId: number) => {
    setSelectedMembers(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  // Filter projects list
  const filteredProjects = projects.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterPriority && p.priority !== filterPriority) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FolderKanban className="h-6 w-6 text-indigo-500" />
            <span>Projects Board</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Manage freelancer and client development contracts.</p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow transition"
        >
          <Plus size={14} />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter / Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 p-3 bg-card border border-card-border rounded-xl">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none text-foreground focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs text-foreground outline-none focus:border-indigo-500 transition"
          >
            <option value="">All Phases</option>
            <option value="Planning">Planning</option>
            <option value="In Progress">In Progress</option>
            <option value="Testing">Testing</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs text-foreground outline-none focus:border-indigo-500 transition"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs border border-card-border rounded-xl">
          No projects found matching the criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(proj => {
            const techList = JSON.parse(proj.technologiesUsed || '[]');
            const tagsList = JSON.parse(proj.tags || '[]');
            const membersList = JSON.parse(proj.teamMembers || '[]');

            // Determine status label color
            let statusColor = 'bg-indigo-950 text-indigo-300';
            if (proj.status === 'Completed') statusColor = 'bg-emerald-950 text-emerald-300';
            else if (proj.status === 'In Progress') statusColor = 'bg-blue-950 text-blue-300';
            else if (proj.status === 'On Hold') statusColor = 'bg-amber-950 text-amber-300';
            else if (proj.status === 'Cancelled') statusColor = 'bg-red-950 text-red-300';

            return (
              <Link
                key={proj.id}
                href={`/projects/${proj.id}`}
                className="bg-card border border-card-border hover:border-indigo-500 rounded-2xl shadow-sm hover:shadow-md p-5 flex flex-col justify-between text-left group transition duration-200"
              >
                <div>
                  {/* Top line project badges */}
                  <div className="flex items-center justify-between mb-3 select-none">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${statusColor}`}>
                      {proj.status}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      {proj.category || 'General'}
                    </span>
                  </div>

                  {/* Title & color accent */}
                  <h3 className="text-sm font-bold text-foreground group-hover:text-indigo-400 transition flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: proj.colorLabel || '#6366f1' }} />
                    <span className="truncate">{proj.name}</span>
                  </h3>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {proj.description || 'No description added yet for this workspace contract.'}
                  </p>

                  {/* Budget & timeline icons */}
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 mt-4 select-none">
                    {proj.budget !== null && (
                      <span className="flex items-center gap-0.5 text-emerald-500">
                        <DollarSign size={13} />
                        <span>{proj.budget.toLocaleString()}</span>
                      </span>
                    )}
                    {proj.endDate && (
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        <span>{proj.endDate}</span>
                      </span>
                    )}
                  </div>

                  {/* Tech chips */}
                  {techList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4 select-none">
                      {techList.slice(0, 3).map((tech: string) => (
                        <span key={tech} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-medium text-slate-400 border border-slate-200 dark:border-slate-800">
                          {tech}
                        </span>
                      ))}
                      {techList.length > 3 && (
                        <span className="text-[9px] text-slate-400 self-center font-bold">+{techList.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer action bar */}
                <div className="mt-6 pt-4 border-t border-card-border flex items-center justify-between">
                  <div className="flex -space-x-1.5 overflow-hidden select-none">
                    {membersList.slice(0, 3).map((mId: number) => {
                      const staff = team.find(member => member.id === mId);
                      return (
                        <img
                          key={mId}
                          src={staff?.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
                          alt={staff?.name}
                          className="h-6 w-6 rounded-full ring-2 ring-card object-cover border border-slate-700"
                          title={staff?.name}
                        />
                      );
                    })}
                    {membersList.length > 3 && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[9px] text-white font-bold ring-2 ring-card">
                        +{membersList.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleOpenEditModal(proj)}
                      className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                      title="Edit Project"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteProject(proj.id, e)}
                      className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                      title="Delete Project"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: CREATE / EDIT PROJECT
          ------------------------------------------------------------- */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-card-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative animate-fade-in text-left">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-foreground p-1"
            >
              <X size={20} />
            </button>

            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-6 flex items-center gap-1.5">
              <FolderKanban className="text-indigo-500" size={18} />
              <span>{editingProject ? 'Edit Workspace Project' : 'Create Workspace Project'}</span>
            </h2>

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Acme Billing Dashboard"
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Client Associate</label>
                  <select
                    value={clientId}
                    onChange={e => setClientId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                  >
                    <option value="">No Client Linked</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.company} ({c.name})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe project terms, goals, and contracts context..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Budget ($)</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={e => setBudget(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="e.g. Web App, Marketing"
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Color Label</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colorLabel}
                      onChange={e => setColorLabel(e.target.value)}
                      className="h-8 w-12 border-0 bg-transparent cursor-pointer rounded-lg overflow-hidden shrink-0"
                    />
                    <input
                      type="text"
                      value={colorLabel}
                      onChange={e => setColorLabel(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none text-foreground transition uppercase font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Technologies Used (Comma-separated)</label>
                  <input
                    type="text"
                    value={techInput}
                    onChange={e => setTechInput(e.target.value)}
                    placeholder="React, Node.js, SQLite"
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={e => setTagsInput(e.target.value)}
                    placeholder="Design, Frontend, Refactor"
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2">Team Members Assigned</label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-950 border border-card-border rounded-xl">
                  {team.map(member => {
                    const selected = selectedMembers.includes(member.id);
                    return (
                      <button
                        type="button"
                        key={member.id}
                        onClick={() => handleToggleMember(member.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium transition ${
                          selected
                            ? 'bg-indigo-950/40 border-indigo-600/50 text-indigo-300'
                            : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                      >
                        <img
                          src={member.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
                          alt={member.name}
                          className="h-5 w-5 rounded-full object-cover shrink-0"
                        />
                        <span>{member.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
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
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
