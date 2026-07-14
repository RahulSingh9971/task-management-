'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/utils/api';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  List,
  Columns,
  Table as TableIcon,
  Calendar as CalendarIcon,
  User,
  Clock,
  Play,
  Pause,
  Square,
  Paperclip,
  CheckCircle,
  MessageSquare,
  Send,
  Loader2,
  X,
  PlusCircle,
  Trash2,
  DollarSign
} from 'lucide-react';

export default function TasksPage() {
  const { user } = useAuth();
  const { addToast } = useNotifications();

  // Tasks and filters states
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeView, setActiveView] = useState<'list' | 'kanban' | 'table' | 'calendar'>('kanban');

  // Search & Filter
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');

  // Selected/Details Task Drawer State
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [timeLogs, setTimeLogs] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);

  // Task field edit states inside drawer
  const [taskStatus, setTaskStatus] = useState('');
  const [taskPriority, setTaskPriority] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskEstHours, setTaskEstHours] = useState(0);

  // New Comment input
  const [commentText, setCommentText] = useState('');

  // New Checklist item input
  const [newChecklistItem, setNewChecklistItem] = useState('');

  // Time Tracker State
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [activeLogId, setActiveLogId] = useState<number | null>(null);

  // Quick Task Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newProjectId, setNewProjectId] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newEstHours, setNewEstHours] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [taskData, projData, teamData] = await Promise.all([
        api.tasks.getAll(),
        api.projects.getAll(),
        api.team.getAll()
      ]);
      setTasks(taskData);
      setProjects(projData);
      setTeam(teamData);
    } catch (err) {
      console.error('Error loading task workspace', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Timer interval ticker
  useEffect(() => {
    let interval: any;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  // Open Task Detail Drawer
  const handleOpenDrawer = async (task: any) => {
    setSelectedTask(task);
    setTaskStatus(task.status);
    setTaskPriority(task.priority);
    setTaskAssignee(task.assignedUserId || '');
    setTaskEstHours(task.estimatedHours || 0);
    setCommentText('');
    setNewChecklistItem('');
    
    // Stop any local timer ticker state
    setTimerRunning(false);
    setTimerSeconds(0);
    setActiveLogId(null);

    try {
      const details = await api.tasks.getById(task.id);
      setComments(details.comments || []);
      setAttachments(details.attachments || []);
      setTimeLogs(details.timeLogs || []);

      // Check if this task has a running timer for current user
      const runningLog = details.timeLogs.find((l: any) => l.isRunning && l.userId === user?.id);
      if (runningLog) {
        setActiveLogId(runningLog.id);
        const startTime = new Date(runningLog.startTime).getTime();
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        setTimerSeconds(elapsed);
        setTimerRunning(true);
      }
    } catch (err) {
      console.error('Failed to load task details', err);
    }
  };

  const handleCloseDrawer = () => {
    setSelectedTask(null);
    setTimerRunning(false);
    setTimerSeconds(0);
    loadData(); // Sync parent list
  };

  // Quick Fields updates
  const handleUpdateField = async (field: string, value: any) => {
    if (!selectedTask) return;
    try {
      const payload: any = {};
      payload[field] = value;
      
      const updated = await api.tasks.update(selectedTask.id, payload);
      setSelectedTask(updated);
      
      // Update local task in list
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, ...payload } : t));
      addToast('Task updated', 'success');
    } catch (err) {
      addToast('Update failed', 'error');
    }
  };

  // Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText || !selectedTask) return;
    try {
      const newComment = await api.tasks.addComment(selectedTask.id, commentText);
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      addToast('Comment added', 'success');
    } catch (err) {
      addToast('Failed to add comment', 'error');
    }
  };

  // Checklist updates
  const handleToggleChecklist = async (index: number) => {
    if (!selectedTask) return;
    try {
      const checklist = JSON.parse(selectedTask.checklist || '[]');
      checklist[index].completed = !checklist[index].completed;
      
      const checklistString = JSON.stringify(checklist);
      await api.tasks.update(selectedTask.id, { checklist });
      
      setSelectedTask({ ...selectedTask, checklist: checklistString });
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, checklist: checklistString } : t));
    } catch (err) {
      addToast('Failed to update checklist', 'error');
    }
  };

  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistItem || !selectedTask) return;
    try {
      const checklist = JSON.parse(selectedTask.checklist || '[]');
      checklist.push({ text: newChecklistItem, completed: false });

      const checklistString = JSON.stringify(checklist);
      await api.tasks.update(selectedTask.id, { checklist });

      setSelectedTask({ ...selectedTask, checklist: checklistString });
      setNewChecklistItem('');
      addToast('Item added to checklist', 'success');
    } catch (err) {
      addToast('Failed to add item', 'error');
    }
  };

  const handleDeleteChecklistItem = async (index: number) => {
    if (!selectedTask) return;
    try {
      const checklist = JSON.parse(selectedTask.checklist || '[]');
      checklist.splice(index, 1);

      const checklistString = JSON.stringify(checklist);
      await api.tasks.update(selectedTask.id, { checklist });

      setSelectedTask({ ...selectedTask, checklist: checklistString });
      addToast('Item removed', 'success');
    } catch (err) {
      addToast('Failed to delete item', 'error');
    }
  };

  // Timer play/stop actions
  const handleStartTimer = async () => {
    if (!selectedTask) return;
    try {
      const log = await api.tasks.startTimer(selectedTask.id);
      setActiveLogId(log.id);
      setTimerSeconds(0);
      setTimerRunning(true);
      addToast('Time tracking started', 'success');
    } catch (err) {
      addToast('Failed to start timer', 'error');
    }
  };

  const handleStopTimer = async () => {
    if (!selectedTask) return;
    try {
      const res = await api.tasks.stopTimer(selectedTask.id);
      setTimerRunning(false);
      setTimerSeconds(0);
      setActiveLogId(null);
      setSelectedTask({ ...selectedTask, actualHours: res.actualHours });
      
      // Reload logs
      const details = await api.tasks.getById(selectedTask.id);
      setTimeLogs(details.timeLogs || []);
      
      addToast('Time tracking logged successfully', 'success');
    } catch (err) {
      addToast('Failed to stop timer', 'error');
    }
  };

  // Task creation
  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newProjectId) {
      addToast('Title and Project are required', 'error');
      return;
    }

    try {
      const payload = {
        title: newTitle,
        projectId: parseInt(newProjectId),
        priority: newPriority,
        dueDate: newDueDate || null,
        estimatedHours: newEstHours ? parseFloat(newEstHours) : 0,
        status: 'Todo'
      };

      const newTask = await api.tasks.create(payload);
      setTasks(prev => [...prev, newTask]);
      setNewTitle('');
      setNewProjectId('');
      setNewDueDate('');
      setNewEstHours('');
      setCreateModalOpen(false);
      addToast('Task created successfully', 'success');
    } catch (err) {
      addToast('Failed to create task', 'error');
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (confirm('Delete this task?')) {
      try {
        await api.tasks.delete(id);
        addToast('Task successfully deleted', 'success');
        setTasks(prev => prev.filter(t => t.id !== id));
        if (selectedTask?.id === id) {
          handleCloseDrawer();
        }
      } catch (err) {
        addToast('Failed to delete task', 'error');
      }
    }
  };

  // -------------------------------------------------------------
  // DRAG & DROP KANBAN ACTIONS
  // -------------------------------------------------------------
  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData('taskId', taskId.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData('taskId');
    if (!taskIdStr) return;

    const taskId = parseInt(taskIdStr);
    
    // Optimistic update
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );

    try {
      await api.tasks.update(taskId, { status: targetStatus });
      addToast(`Task status changed to ${targetStatus}`, 'success');
    } catch (err) {
      addToast('Failed to save task status drop', 'error');
      loadData(); // Revert on failure
    }
  };

  // Filter tasks list
  const filteredTasks = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterProject && t.projectId !== parseInt(filterProject)) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterAssignee && t.assignedUserId !== parseInt(filterAssignee)) return false;
    return true;
  });

  const columns = ['Todo', 'In Progress', 'Review', 'Completed'];

  // Render Timer display
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [h, m, s].map(v => v < 10 ? '0' + v : v).join(':');
  };

  return (
    <div className="space-y-6 relative h-full flex flex-col">
      
      {/* -------------------------------------------------------------
          PAGE HEADER
          ------------------------------------------------------------- */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-indigo-500" />
            <span>Tasks Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Organize team actions via Kanban, tables, or list sheets.</p>
        </div>

        <div className="flex items-center gap-2 select-none">
          {/* Views Toggles */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl gap-0.5">
            <button
              onClick={() => setActiveView('kanban')}
              className={`p-1.5 rounded-lg transition ${activeView === 'kanban' ? 'bg-card text-foreground shadow' : 'text-slate-400'}`}
              title="Kanban Board"
            >
              <Columns size={14} />
            </button>
            <button
              onClick={() => setActiveView('list')}
              className={`p-1.5 rounded-lg transition ${activeView === 'list' ? 'bg-card text-foreground shadow' : 'text-slate-400'}`}
              title="List View"
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setActiveView('table')}
              className={`p-1.5 rounded-lg transition ${activeView === 'table' ? 'bg-card text-foreground shadow' : 'text-slate-400'}`}
              title="Table Grid"
            >
              <TableIcon size={14} />
            </button>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition"
          >
            <Plus size={14} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          FILTER CONTROLS
          ------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-card border border-card-border rounded-xl shrink-0 select-none">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks..."
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
          <option value="">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
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

        <select
          value={filterAssignee}
          onChange={e => setFilterAssignee(e.target.value)}
          className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs text-foreground outline-none focus:border-indigo-500 transition"
        >
          <option value="">All Members</option>
          {team.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* -------------------------------------------------------------
          VIEW: KANBAN
          ------------------------------------------------------------- */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : activeView === 'kanban' ? (
        <div className="flex-1 min-h-0 overflow-x-auto flex gap-4 select-none pb-4">
          {columns.map(status => {
            const laneTasks = filteredTasks.filter(t => t.status === status);
            return (
              <div
                key={status}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, status)}
                className="w-80 flex-col bg-slate-100 dark:bg-slate-900/40 border border-card-border p-4 rounded-2xl flex h-full shrink-0 select-none"
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">{status}</span>
                  <span className="h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-400">
                    {laneTasks.length}
                  </span>
                </div>

                {/* Column cards container */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {laneTasks.map(task => {
                    const checklistArr = JSON.parse(task.checklist || '[]');
                    const completedItems = checklistArr.filter((i: any) => i.completed).length;

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={e => handleDragStart(e, task.id)}
                        onClick={() => handleOpenDrawer(task)}
                        className="bg-card border border-card-border hover:border-slate-400 p-4 rounded-xl shadow-sm cursor-pointer text-left transition select-none"
                      >
                        <span className="text-[8px] font-bold text-indigo-400 tracking-wider uppercase block truncate mb-1">
                          {task.project?.name}
                        </span>

                        <h4 className="text-xs font-bold text-foreground leading-snug line-clamp-2">{task.title}</h4>

                        {/* Checklist progress */}
                        {checklistArr.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-3 select-none">
                            <CheckCircle size={11} className="text-emerald-500" />
                            <span>{completedItems}/{checklistArr.length} Checklist</span>
                          </div>
                        )}

                        <div className="mt-4 pt-3 border-t border-card-border flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                            task.priority === 'Critical' || task.priority === 'High'
                              ? 'bg-red-950 text-red-300'
                              : 'bg-slate-900 text-slate-400'
                          }`}>
                            {task.priority}
                          </span>

                          {task.assignedUser && (
                            <img
                              src={task.assignedUser.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
                              alt={task.assignedUser.name}
                              className="h-5 w-5 rounded-full object-cover border border-slate-700"
                              title={task.assignedUser.name}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : activeView === 'list' ? (
        /* -------------------------------------------------------------
            VIEW: LIST
            ------------------------------------------------------------- */
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No tasks logged.</div>
          ) : (
            filteredTasks.map(t => (
              <div
                key={t.id}
                onClick={() => handleOpenDrawer(t)}
                className="p-3.5 bg-card border border-card-border hover:border-slate-500 rounded-xl flex items-center justify-between gap-4 cursor-pointer text-left transition select-none"
              >
                <div className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                    t.status === 'Completed' ? 'bg-emerald-500' : t.status === 'In Progress' ? 'bg-indigo-500' : 'bg-slate-400'
                  }`} />
                  <div>
                    <h4 className="text-xs font-bold text-foreground leading-snug">{t.title}</h4>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Project: {t.project?.name} | Due: {t.dueDate || 'No date'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 select-none">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                    t.priority === 'Critical' || t.priority === 'High' ? 'bg-red-950 text-red-300' : 'bg-slate-900 text-slate-400'
                  }`}>
                    {t.priority}
                  </span>
                  {t.assignedUser && (
                    <img
                      src={t.assignedUser.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
                      alt={t.assignedUser.name}
                      className="h-5 w-5 rounded-full object-cover"
                      title={t.assignedUser.name}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* -------------------------------------------------------------
            VIEW: TABLE GRID
            ------------------------------------------------------------- */
        <div className="flex-1 overflow-auto border border-card-border rounded-xl bg-card">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/30 text-slate-400 border-b border-card-border uppercase font-bold text-[9px] tracking-wider select-none">
                <th className="p-3">Title</th>
                <th className="p-3">Project</th>
                <th className="p-3">Status</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Assignee</th>
                <th className="p-3">Due Date</th>
                <th className="p-3">Est/Act Hours</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-slate-400">No tasks logged.</td>
                </tr>
              ) : (
                filteredTasks.map(t => (
                  <tr
                    key={t.id}
                    onClick={() => handleOpenDrawer(t)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/20 cursor-pointer transition select-none"
                  >
                    <td className="p-3 font-semibold text-foreground truncate max-w-[200px]">{t.title}</td>
                    <td className="p-3 text-slate-400 truncate max-w-[120px]">{t.project?.name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        t.status === 'Completed' ? 'bg-emerald-950 text-emerald-400' : 'bg-indigo-950 text-indigo-400'
                      }`}>{t.status}</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                        t.priority === 'Critical' || t.priority === 'High' ? 'bg-red-950 text-red-300' : 'bg-slate-900 text-slate-400'
                      }`}>{t.priority}</span>
                    </td>
                    <td className="p-3">
                      {t.assignedUser ? (
                        <span className="flex items-center gap-1">
                          <img src={t.assignedUser.photo} className="h-4.5 w-4.5 rounded-full" />
                          <span>{t.assignedUser.name}</span>
                        </span>
                      ) : <span className="text-slate-500">Unassigned</span>}
                    </td>
                    <td className="p-3 text-slate-400">{t.dueDate || 'N/A'}</td>
                    <td className="p-3 text-slate-400 font-semibold">{t.estimatedHours || 0} / {t.actualHours || 0} hrs</td>
                    <td className="p-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(t.id);
                        }}
                        className="p-1 hover:text-red-500 rounded"
                        title="Delete Task"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* -------------------------------------------------------------
          TASK EDIT DETAILS DRAWER (SLIDE-OUT FROM RIGHT)
          ------------------------------------------------------------- */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 z-40 flex justify-end transition-opacity">
          <aside className="w-full max-w-xl bg-card border-l border-card-border h-full flex flex-col shadow-2xl relative z-50 animate-fade-in text-left">
            {/* Drawer Header */}
            <div className="p-4 border-b border-card-border flex items-center justify-between shrink-0 select-none">
              <span className="text-[10px] uppercase font-bold text-slate-400">Task Detailed Sheet</span>
              <button onClick={handleCloseDrawer} className="text-slate-400 hover:text-foreground p-1">
                <X size={18} />
              </button>
            </div>

            {/* Scrollable details body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Task Title */}
              <div>
                <span className="text-[8px] uppercase font-bold text-indigo-400 select-none">{selectedTask.project?.name}</span>
                <h2 className="text-base font-bold text-foreground mt-1 leading-snug">{selectedTask.title}</h2>
                <p className="text-xs text-slate-400 mt-2">{selectedTask.description || 'No detailed task outline provided.'}</p>
              </div>

              {/* Status & Priority selects */}
              <div className="grid grid-cols-2 gap-4 select-none">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Status</label>
                  <select
                    value={taskStatus}
                    onChange={e => {
                      setTaskStatus(e.target.value);
                      handleUpdateField('status', e.target.value);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs text-foreground outline-none focus:border-indigo-500 transition"
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={e => {
                      setTaskPriority(e.target.value);
                      handleUpdateField('priority', e.target.value);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs text-foreground outline-none focus:border-indigo-500 transition"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Assignee & Est hours */}
              <div className="grid grid-cols-2 gap-4 select-none">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Assigned User</label>
                  <select
                    value={taskAssignee}
                    onChange={e => {
                      setTaskAssignee(e.target.value);
                      handleUpdateField('assignedUserId', e.target.value ? parseInt(e.target.value) : null);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs text-foreground outline-none focus:border-indigo-500 transition"
                  >
                    <option value="">Unassigned</option>
                    {team.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Est. Hours</label>
                  <input
                    type="number"
                    value={taskEstHours}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      setTaskEstHours(val);
                      handleUpdateField('estimatedHours', val);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs text-foreground outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* -------------------------------------------------------------
                  TIME TRACKING PANEL
                  ------------------------------------------------------------- */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-card-border rounded-xl">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5 select-none">
                  <Clock size={14} className="text-indigo-500" />
                  <span>Time Tracker Session</span>
                </h3>

                <div className="flex items-center justify-between gap-4 select-none">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Live Timer</span>
                    <p className="text-lg font-bold font-mono text-foreground mt-0.5">{formatTime(timerSeconds)}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Logged</span>
                    <p className="text-sm font-bold text-foreground mt-0.5">{selectedTask.actualHours || 0} / {selectedTask.estimatedHours || 0} hrs</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!timerRunning ? (
                      <button
                        onClick={handleStartTimer}
                        className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
                        title="Start Tracking"
                      >
                        <Play size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={handleStopTimer}
                        className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition"
                        title="Stop Timer & Log"
                      >
                        <Square size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* -------------------------------------------------------------
                  CHECKLIST PANEL
                  ------------------------------------------------------------- */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider select-none">Subtasks Checklist</h3>
                
                {/* List items */}
                <div className="space-y-1.5">
                  {JSON.parse(selectedTask.checklist || '[]').map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-900/30 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 transition">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleToggleChecklist(idx)}
                          className="h-4 w-4 text-indigo-600 rounded border-slate-700"
                        />
                        <span className={`text-xs text-foreground ${item.completed ? 'line-through text-slate-450' : ''}`}>
                          {item.text}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteChecklistItem(idx)}
                        className="text-slate-400 hover:text-red-500 p-1 transition"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddChecklistItem} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add checklist subtask..."
                    value={newChecklistItem}
                    onChange={e => setNewChecklistItem(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white rounded-lg text-slate-400 transition"
                  >
                    <PlusCircle size={14} />
                  </button>
                </form>
              </div>

              {/* -------------------------------------------------------------
                  COMMENTS FEED
                  ------------------------------------------------------------- */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider select-none">Comments Thread</h3>

                <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                  {comments.length === 0 ? (
                    <p className="text-[10px] text-slate-550 italic text-center select-none py-2">No comments added yet. Support @mentions.</p>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className="flex gap-2.5 text-xs text-left bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-lg border border-card-border">
                        <img
                          src={c.user?.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
                          alt={c.user?.name}
                          className="h-6 w-6 rounded-full object-cover shrink-0 mt-0.5 border border-slate-700"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-foreground">{c.user?.name}</span>
                            <span className="text-[8px] text-slate-400">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-slate-300 mt-1 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a comment... use @name to mention"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow transition"
                  >
                    <Send size={13} />
                  </button>
                </form>
              </div>

            </div>
          </aside>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: ADD NEW TASK
          ------------------------------------------------------------- */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-card-border rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-fade-in text-left">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-foreground p-1"
            >
              <X size={20} />
            </button>

            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-5 flex items-center gap-1.5 select-none">
              <CheckSquare className="text-indigo-500" size={18} />
              <span>Create Workspace Task</span>
            </h2>

            <form onSubmit={handleCreateTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Code responsive grid components"
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Link Project *</label>
                  <select
                    required
                    value={newProjectId}
                    onChange={e => setNewProjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs text-foreground outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition"
                  >
                    <option value="">Select Project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Priority</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs text-foreground outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Estimated Hours</label>
                  <input
                    type="number"
                    value={newEstHours}
                    onChange={e => setNewEstHours(e.target.value)}
                    placeholder="e.g. 12"
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 select-none">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border border-card-border rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
