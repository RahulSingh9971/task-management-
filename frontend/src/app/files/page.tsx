'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/utils/api';
import { useNotifications } from '@/context/NotificationContext';
import {
  FolderOpen,
  Trash2,
  Download,
  Search,
  Filter,
  FileIcon,
  Layers,
  Loader2,
  HardDrive
} from 'lucide-react';

export default function FilesPage() {
  const { addToast } = useNotifications();

  // Data states
  const [files, setFiles] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [filesData, projData] = await Promise.all([
        api.files.getAll(),
        api.projects.getAll()
      ]);
      setFiles(filesData);
      setProjects(projData);
    } catch (err) {
      console.error('Failed to load files directory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: number) => {
    if (confirm('Delete this file permanently from disk?')) {
      try {
        await api.files.delete(id);
        addToast('File deleted successfully', 'success');
        setFiles(prev => prev.filter(f => f.id !== id));
      } catch (err) {
        addToast('Failed to delete file', 'error');
      }
    }
  };

  const filteredFiles = files.filter(f => {
    if (search && !f.filename.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterProject && f.projectId !== parseInt(filterProject)) return false;
    return true;
  });

  // Calculate total space used
  const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  const percentUsed = Math.min(Math.round((totalSize / (50 * 1024 * 1024)) * 100), 100); // Out of 50MB mock limit

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-left">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-indigo-500" />
            <span>Workspace File Manager</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Upload and organize task screenshots, design PDF vectors, and client excel spreadsheets.</p>
        </div>
      </div>

      {/* Storage Indicator */}
      <div className="p-4 bg-card border border-card-border rounded-xl flex items-center justify-between gap-4 text-left select-none max-w-lg">
        <div className="h-9 w-9 rounded-lg bg-indigo-950 flex items-center justify-center text-indigo-400 shrink-0">
          <HardDrive size={18} />
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
            <span>Disk Space Used</span>
            <span>{sizeMB} MB / 50 MB</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${percentUsed}%` }} />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 p-3 bg-card border border-card-border rounded-xl">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search files by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none text-foreground focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition"
          />
        </div>

        <select
          value={filterProject}
          onChange={e => setFilterProject(e.target.value)}
          className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs text-foreground outline-none focus:border-indigo-500 transition"
        >
          <option value="">All Project Folders</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Grid of files */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs border border-card-border rounded-xl">
          No files matching criteria. Upload files inside a specific task details drawer or project folders.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFiles.map(file => {
            const projectAssociated = projects.find(p => p.id === file.projectId);
            return (
              <div
                key={file.id}
                className="bg-card border border-card-border rounded-2xl p-4 text-left flex flex-col justify-between h-40 hover:shadow shadow-sm transition"
              >
                <div>
                  {/* File Type icon & project */}
                  <div className="flex items-center justify-between gap-2 mb-2.5 select-none">
                    <FileIcon size={18} className="text-indigo-400 shrink-0" />
                    <span className="text-[8px] font-bold text-slate-400 uppercase truncate max-w-[120px]" title={projectAssociated?.name}>
                      {projectAssociated?.name || 'Global Shared'}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-foreground truncate" title={file.filename}>
                    {file.filename}
                  </h4>
                  <span className="text-[9px] text-slate-400 mt-1 block">{(file.size / 1024).toFixed(1)} KB</span>
                </div>

                {/* File Download / Trash Footer */}
                <div className="mt-4 pt-3 border-t border-card-border flex justify-end gap-1.5 select-none">
                  <a
                    href={`http://localhost:5000${file.filepath}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-450 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                    title="Download File"
                  >
                    <Download size={13} />
                  </a>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="p-1.5 text-slate-450 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                    title="Delete File"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
