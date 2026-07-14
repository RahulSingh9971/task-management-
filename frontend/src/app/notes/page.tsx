'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/utils/api';
import { useNotifications } from '@/context/NotificationContext';
import {
  FileText,
  Plus,
  Trash2,
  Save,
  Link as LinkIcon,
  Code,
  FolderOpen,
  Sparkles,
  Loader2
} from 'lucide-react';

export default function NotesPage() {
  const { addToast } = useNotifications();

  // Notes and project selections states
  const [notes, setNotes] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected note details
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  
  // Editor fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [projectId, setProjectId] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [notesData, projData] = await Promise.all([
        api.notes.getAll(),
        api.projects.getAll()
      ]);
      setNotes(notesData);
      setProjects(projData);

      if (notesData.length > 0) {
        handleSelectNote(notesData[0]);
      }
    } catch (err) {
      console.error('Error loading notes workspace', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectNote = (n: any) => {
    setSelectedNote(n);
    setTitle(n.title);
    setContent(n.content || '');
    setProjectId(n.projectId || '');
  };

  const handleCreateNote = async () => {
    try {
      const newNote = await api.notes.create({
        title: 'Untitled Note',
        content: '',
        projectId: null
      });
      setNotes(prev => [newNote, ...prev]);
      handleSelectNote(newNote);
      addToast('New note created', 'success');
    } catch (err) {
      addToast('Failed to create note', 'error');
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;
    try {
      const updated = await api.notes.update(selectedNote.id, {
        title,
        content,
        projectId: projectId ? parseInt(projectId) : null
      });

      // Update in local state list
      setNotes(prev =>
        prev.map(n => (n.id === selectedNote.id ? { ...n, title, content, projectId } : n))
      );
      setSelectedNote(updated);
      addToast('Note saved successfully', 'success');
    } catch (err) {
      addToast('Failed to save note', 'error');
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (confirm('Delete this note permanently?')) {
      try {
        await api.notes.delete(id);
        addToast('Note deleted successfully', 'success');
        
        const nextList = notes.filter(n => n.id !== id);
        setNotes(nextList);
        
        if (nextList.length > 0) {
          handleSelectNote(nextList[0]);
        } else {
          setSelectedNote(null);
          setTitle('');
          setContent('');
          setProjectId('');
        }
      } catch (err) {
        addToast('Failed to delete note', 'error');
      }
    }
  };

  // Editor helper: insert markdown/code snippet templates
  const handleInsertTemplate = (type: 'code' | 'todo' | 'header') => {
    let snippet = '';
    if (type === 'code') {
      snippet = '\n```typescript\n// Paste code here\nconst workspace = "Clickmecha";\nconsole.log(workspace);\n```\n';
    } else if (type === 'todo') {
      snippet = '\n- [ ] Task checkbox item\n- [ ] Another item\n';
    } else if (type === 'header') {
      snippet = '\n### Document Heading Section\n';
    }
    setContent(prev => prev + snippet);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 select-none">
        <div className="text-left">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-500" />
            <span>Workspace Notepad</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Maintain structured project documentation, version files, and quick links.</p>
        </div>

        <button
          onClick={handleCreateNote}
          className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow transition"
        >
          <Plus size={14} />
          <span>New Note</span>
        </button>
      </div>

      {/* Main split view */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : notes.length === 0 ? (
        <div className="flex-1 flex items-center justify-center border border-dashed border-card-border rounded-2xl bg-card p-12 text-slate-400 text-xs">
          Click "New Note" to initialize documentation.
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[500px] overflow-hidden">
          
          {/* Notes list left panel */}
          <div className="lg:col-span-1 bg-card border border-card-border rounded-2xl p-4 flex flex-col gap-2 overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-left mb-2 select-none">Documentation</h3>
            {notes.map(n => (
              <div
                key={n.id}
                onClick={() => handleSelectNote(n)}
                className={`p-3 rounded-xl border cursor-pointer text-left hover:border-slate-500 transition flex justify-between items-center gap-2 ${
                  selectedNote?.id === n.id ? 'bg-indigo-950/20 border-indigo-500/50' : 'bg-slate-950/20 border-card-border'
                }`}
              >
                <div className="overflow-hidden">
                  <h4 className="text-xs font-bold text-foreground truncate">{n.title}</h4>
                  <span className="text-[8px] text-slate-400 block mt-1">
                    {new Date(n.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNote(n.id);
                  }}
                  className="text-slate-400 hover:text-red-500 shrink-0"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Right Editor panel */}
          <div className="lg:col-span-3 bg-card border border-card-border rounded-2xl p-5 flex flex-col justify-between overflow-hidden text-left h-full">
            <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
              
              {/* Title & Project select */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 select-none">
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Note Title..."
                  className="sm:col-span-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs font-bold outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                />
                
                <select
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs text-foreground outline-none focus:border-indigo-500 transition"
                >
                  <option value="">Global Note</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Editor controls button bar */}
              <div className="flex gap-2 select-none">
                <button
                  onClick={() => handleInsertTemplate('header')}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-[10px] font-semibold text-foreground transition flex items-center gap-1 border border-card-border"
                >
                  <Sparkles size={11} className="text-indigo-500" />
                  <span>Heading</span>
                </button>

                <button
                  onClick={() => handleInsertTemplate('code')}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-[10px] font-semibold text-foreground transition flex items-center gap-1 border border-card-border"
                >
                  <Code size={11} className="text-indigo-500" />
                  <span>Code Block</span>
                </button>

                <button
                  onClick={() => handleInsertTemplate('todo')}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-[10px] font-semibold text-foreground transition flex items-center gap-1 border border-card-border"
                >
                  <Save size={11} className="text-indigo-500" />
                  <span>Subtasks</span>
                </button>
              </div>

              {/* Textarea editor */}
              <div className="flex-1 overflow-hidden min-h-[300px]">
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Type note body here (supports HTML/MD tags)..."
                  className="w-full h-full p-4 bg-slate-50 dark:bg-slate-950/40 border border-card-border rounded-xl text-xs outline-none focus:bg-white dark:focus:bg-slate-950 text-foreground transition resize-none font-mono leading-relaxed"
                />
              </div>
            </div>

            {/* Footer action bar */}
            <div className="mt-4 pt-3 border-t border-card-border flex justify-end gap-2 shrink-0 select-none">
              <button
                onClick={handleSaveNote}
                className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow transition"
              >
                <Save size={13} />
                <span>Save Note</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
