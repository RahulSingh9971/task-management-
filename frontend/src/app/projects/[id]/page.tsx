'use client';

import React, { useEffect, useState, use } from 'react';
import { api, BACKEND_URL } from '@/utils/api';
import { useNotifications } from '@/context/NotificationContext';
import {
  FolderKanban,
  CheckSquare,
  FileText,
  Calendar,
  Activity,
  Paperclip,
  TrendingUp,
  Tag,
  DollarSign,
  CalendarDays,
  User,
  Plus,
  Trash2,
  Download,
  Upload,
  Loader2,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface ProjectDetailProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: ProjectDetailProps) {
  // Unwrap params using React.use()
  const { id: paramId } = use(params);
  const projectId = parseInt(paramId);

  const { addToast } = useNotifications();

  // Data state
  const [project, setProject] = useState<any | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs state: Overview, Tasks, Documents, Calendar, Activity, Notes, Attachments
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'documents' | 'activity' | 'attachments'>('overview');

  // File Upload State
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Task creation quick state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskStatus, setTaskStatus] = useState('Todo');
  const [taskDueDate, setTaskDueDate] = useState('');

  // Note creation quick state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  const loadProjectDetails = async () => {
    try {
      setLoading(true);
      const res = await api.projects.getById(projectId);
      setProject(res.project);
      setTasks(res.tasks || []);
      setNotes(res.notes || []);
      setAttachments(res.attachments || []);
      setTimeline(res.timeline || []);
      setTeamMembers(res.teamMembers || []);
    } catch (err: any) {
      addToast(err.message || 'Error loading project details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectDetails();
  }, [projectId]);

  // File Upload handler
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      addToast('Please select a file to upload', 'error');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('projectId', projectId.toString());

      await api.files.upload(formData);
      addToast('File uploaded successfully', 'success');
      setSelectedFile(null);
      
      // Reload attachments list
      const updatedFiles = await api.files.getAll({ projectId });
      setAttachments(updatedFiles);
    } catch (err: any) {
      addToast(err.message || 'File upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (confirm('Delete this attachment?')) {
      try {
        await api.files.delete(fileId);
        addToast('File deleted successfully', 'success');
        setAttachments(prev => prev.filter(f => f.id !== fileId));
      } catch (err: any) {
        addToast(err.message || 'Failed to delete file', 'error');
      }
    }
  };

  // Task creation handler
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) {
      addToast('Task Title is required', 'error');
      return;
    }

    try {
      const payload = {
        title: taskTitle,
        priority: taskPriority,
        status: taskStatus,
        dueDate: taskDueDate || null,
        projectId
      };

      const newTask = await api.tasks.create(payload);
      addToast('Task created successfully', 'success');
      setTasks(prev => [...prev, newTask]);
      setTaskTitle('');
      setTaskDueDate('');
    } catch (err: any) {
      addToast(err.message || 'Failed to create task', 'error');
    }
  };

  // Note creation handler
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle) {
      addToast('Note Title is required', 'error');
      return;
    }

    try {
      const payload = {
        title: noteTitle,
        content: noteContent,
        projectId
      };

      const newNote = await api.notes.create(payload);
      addToast('Document created successfully', 'success');
      setNotes(prev => [newNote, ...prev]);
      setNoteTitle('');
      setNoteContent('');
    } catch (err: any) {
      addToast(err.message || 'Failed to create document', 'error');
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        await api.notes.delete(noteId);
        addToast('Document deleted successfully', 'success');
        setNotes(prev => prev.filter(n => n.id !== noteId));
      } catch (err: any) {
        addToast(err.message || 'Failed to delete document', 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center text-slate-400">
        Project not found. Go back to <Link href="/projects" className="text-indigo-400 hover:underline">Projects Board</Link>.
      </div>
    );
  }

  const techList = JSON.parse(project.technologiesUsed || '[]');
  const tagsList = JSON.parse(project.tags || '[]');
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.status === 'Completed').length;
  const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* -------------------------------------------------------------
          BREADCRUMBS & PROJECT HEADER
          ------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-card-border pb-5">
        <div className="text-left">
          <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400 select-none">
            <Link href="/projects" className="hover:text-indigo-500 transition">Projects</Link>
            <ChevronRight size={10} />
            <span className="text-foreground truncate">{project.name}</span>
          </div>
          
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5 mt-2">
            <span className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: project.colorLabel || '#6366f1' }} />
            <span>{project.name}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 select-none">Client: {project.clientName || 'Self-Scoped Contract'}</p>
        </div>

        {/* Tab selector menu */}
        <div className="flex items-center gap-1 overflow-x-auto bg-slate-100 dark:bg-slate-900 p-1 rounded-xl select-none max-w-full">
          {[
            { id: 'overview', label: 'Overview', icon: FolderKanban },
            { id: 'tasks', label: 'Tasks', icon: CheckSquare },
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'activity', label: 'Activity Logs', icon: Activity },
            { id: 'attachments', label: 'Files', icon: Paperclip },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-foreground'
                }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* -------------------------------------------------------------
          TAB CONTENT: OVERVIEW
          ------------------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left animate-fade-in">
          <div className="lg:col-span-2 space-y-6">
            {/* Description card */}
            <div className="p-5 bg-card border border-card-border rounded-2xl">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Project Description</h3>
              <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">
                {project.description || 'No detailed description written yet.'}
              </p>
            </div>

            {/* Metrics cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-card border border-card-border rounded-2xl flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-950 flex items-center justify-center text-emerald-400 shrink-0">
                  <DollarSign size={18} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Budget</span>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {project.budget ? `$${project.budget.toLocaleString()}` : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-card border border-card-border rounded-2xl flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-indigo-950 flex items-center justify-center text-indigo-400 shrink-0">
                  <CalendarDays size={18} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Deadline</span>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {project.endDate || 'No deadline'}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-card border border-card-border rounded-2xl flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-purple-950 flex items-center justify-center text-purple-400 shrink-0">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Progress</span>
                  <p className="text-sm font-bold text-foreground mt-0.5">{progressPercent}%</p>
                </div>
              </div>
            </div>

            {/* Technologies and Tags */}
            <div className="p-5 bg-card border border-card-border rounded-2xl space-y-4">
              <div>
                <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-2">Technologies Stack</h4>
                {techList.length === 0 ? (
                  <p className="text-xs text-slate-400">None specified</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {techList.map((tech: string) => (
                      <span key={tech} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] text-foreground font-semibold rounded-lg">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-2">Classification Labels</h4>
                {tagsList.length === 0 ? (
                  <p className="text-xs text-slate-400">None specified</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {tagsList.map((tag: string) => (
                      <span key={tag} className="px-2.5 py-1 bg-indigo-950/20 text-indigo-300 text-[10px] font-semibold rounded-lg border border-indigo-850/30">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar: details & team */}
          <div className="space-y-6">
            <div className="p-5 bg-card border border-card-border rounded-2xl text-left">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Metadata Summary</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Start Date</span>
                  <span className="font-semibold text-foreground">{project.startDate || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className="font-semibold text-foreground">{project.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Priority</span>
                  <span className="font-semibold text-foreground">{project.priority}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Category</span>
                  <span className="font-semibold text-foreground">{project.category || 'General'}</span>
                </div>
              </div>
            </div>

            <div className="p-5 bg-card border border-card-border rounded-2xl text-left">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Project Staff</h3>
              <div className="space-y-3">
                {teamMembers.length === 0 ? (
                  <p className="text-xs text-slate-400">No staff assigned</p>
                ) : (
                  teamMembers.map(m => (
                    <div key={m.id} className="flex items-center gap-2.5">
                      <img
                        src={m.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
                        alt={m.name}
                        className="h-7 w-7 rounded-full object-cover border border-slate-700"
                      />
                      <div className="text-left">
                        <p className="text-xs font-bold text-foreground">{m.name}</p>
                        <p className="text-[10px] text-slate-400">{m.role}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB CONTENT: TASKS (List & creation form)
          ------------------------------------------------------------- */}
      {activeTab === 'tasks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left animate-fade-in">
          {/* Tasks list */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Tasks</h3>
            {tasks.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs border border-card-border rounded-xl">
                No tasks logged for this project.
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map(t => (
                  <div key={t.id} className="p-3.5 bg-card border border-card-border hover:border-slate-500 rounded-xl flex items-center justify-between gap-4 transition duration-150">
                    <div className="flex items-center gap-3 text-left">
                      <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                        t.status === 'Completed' ? 'bg-emerald-500' : t.status === 'In Progress' ? 'bg-indigo-500' : 'bg-slate-400'
                      }`} />
                      <div>
                        <h4 className={`text-xs font-bold text-foreground ${t.status === 'Completed' ? 'line-through text-slate-400' : ''}`}>
                          {t.title}
                        </h4>
                        <span className="text-[9px] text-slate-400 mt-1 block">Due: {t.dueDate || 'No date'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                        t.priority === 'Critical' || t.priority === 'High' ? 'bg-red-950 text-red-300' : 'bg-slate-900 text-slate-400'
                      }`}>
                        {t.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Task Form */}
          <div className="p-5 bg-card border border-card-border rounded-2xl h-fit">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Quick Add Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  placeholder="Task description..."
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs text-foreground outline-none focus:border-indigo-500 transition"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Status</label>
                  <select
                    value={taskStatus}
                    onChange={e => setTaskStatus(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs text-foreground outline-none focus:border-indigo-500 transition"
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Due Date</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={e => setTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition"
              >
                Create Task
              </button>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB CONTENT: DOCUMENTS
          ------------------------------------------------------------- */}
      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left animate-fade-in">
          {/* Docs list */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Documents</h3>
            {notes.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs border border-card-border rounded-xl">
                No documents logged for this project.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {notes.map(n => (
                  <div key={n.id} className="p-4 bg-card border border-card-border hover:border-slate-500 rounded-xl relative flex flex-col justify-between h-40">
                    <button
                      onClick={() => handleDeleteNote(n.id)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-red-500 p-1 transition"
                      title="Delete Doc"
                    >
                      <Trash2 size={13} />
                    </button>
                    <div>
                      <h4 className="text-xs font-bold text-foreground pr-6 truncate">{n.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-2 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                        {n.content || 'Empty note content...'}
                      </p>
                    </div>
                    <span className="text-[9px] text-slate-400 select-none">
                      Updated: {new Date(n.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Doc Form */}
          <div className="p-5 bg-card border border-card-border rounded-2xl h-fit">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">New Document</h3>
            <form onSubmit={handleCreateNote} className="space-y-3">
              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={noteTitle}
                  onChange={e => setNoteTitle(e.target.value)}
                  placeholder="Doc title..."
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Rich Content (HTML/Markdown)</label>
                <textarea
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  placeholder="Document body contents..."
                  rows={6}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition resize-none font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition"
              >
                Save Document
              </button>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB CONTENT: ACTIVITY LOGS
          ------------------------------------------------------------- */}
      {activeTab === 'activity' && (
        <div className="p-5 bg-card border border-card-border rounded-2xl max-w-3xl text-left animate-fade-in">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Timeline of Changes</h3>
          {timeline.length === 0 ? (
            <p className="text-xs text-slate-400">No project activity has been recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {timeline.map(log => (
                <div key={log.id} className="flex gap-3 relative pb-1">
                  <div className="flex flex-col items-center relative z-10 shrink-0">
                    <span className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5" />
                    <span className="w-0.5 bg-slate-800 flex-1 min-h-[30px]" />
                  </div>
                  <div>
                    <p className="text-xs text-foreground font-semibold leading-relaxed">{log.details}</p>
                    <span className="text-[9px] text-slate-400 mt-0.5 block">
                      {new Date(log.createdAt).toLocaleDateString()} at {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB CONTENT: ATTACHMENTS (FILES)
          ------------------------------------------------------------- */}
      {activeTab === 'attachments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left animate-fade-in">
          {/* File grid */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Files</h3>
            {attachments.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs border border-card-border rounded-xl">
                No files uploaded to this project folder.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {attachments.map(f => (
                  <div key={f.id} className="p-3 bg-card border border-card-border rounded-xl flex items-center justify-between gap-3">
                    <div className="overflow-hidden text-left">
                      <h4 className="text-xs font-bold text-foreground truncate" title={f.filename}>{f.filename}</h4>
                      <span className="text-[9px] text-slate-400 block mt-1">Size: {(f.size / 1024).toFixed(1)} KB</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={`${BACKEND_URL}${f.filepath}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                        title="Download/View File"
                      >
                        <Download size={13} />
                      </a>
                      <button
                        onClick={() => handleDeleteFile(f.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                        title="Delete File"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload panel */}
          <div className="p-5 bg-card border border-card-border rounded-2xl h-fit">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Upload size={14} className="text-indigo-500" />
              <span>Upload Attachment</span>
            </h3>
            
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="border-2 border-dashed border-card-border rounded-xl p-6 text-center hover:border-indigo-500/50 transition relative">
                <input
                  type="file"
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">
                  {selectedFile ? `Selected: ${selectedFile.name}` : 'Click or Drag file to select'}
                </p>
                <span className="text-[9px] text-slate-500 mt-1 block">PDF, ZIP, DOCX, Images, Excel</span>
              </div>

              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow transition flex items-center justify-center gap-1.5"
              >
                {uploading ? <Loader2 size={13} className="animate-spin" /> : 'Upload File'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
