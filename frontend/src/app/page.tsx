'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/utils/api';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import {
  Briefcase,
  Layers,
  CheckCircle2,
  Clock,
  CalendarDays,
  Users2,
  BellRing,
  Cpu,
  Sparkles,
  RotateCcw,
  EyeOff,
  Eye,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  Bookmark
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { addToast } = useNotifications();

  // Data states
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [widgets, setWidgets] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);

  // Filtering states
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [loading, setLoading] = useState(true);
  const [customizing, setCustomizing] = useState(false);

  // AI Generator mock states
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [projData, taskData, eventData, teamData, widgetData, repData] = await Promise.all([
        api.projects.getAll(),
        api.tasks.getAll(),
        api.calendar.getEvents(),
        api.team.getAll(),
        api.widgets.getAll(),
        api.reports.getProductivity()
      ]);

      setProjects(projData);
      setTasks(taskData);
      setEvents(eventData);
      setMembers(teamData);
      setWidgets(widgetData);
      setReportData(repData);

      // Extract general timeline of activities from projects
      const activityRes = await fetch('http://localhost:5000/api/projects/1'); // Fetch project 1 detailed timeline
      if (activityRes.ok) {
        const details = await activityRes.json();
        setTimeline(details.timeline || []);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleToggleWidget = async (widgetId: number, visible: boolean) => {
    try {
      const updatedWidgets = widgets.map(w => w.id === widgetId ? { ...w, visible } : w);
      setWidgets(updatedWidgets);
      await api.widgets.update(updatedWidgets);
      addToast(`Widget state updated`, 'success');
    } catch (err) {
      addToast('Failed to save widget layout', 'error');
    }
  };

  const handleResetWidgets = async () => {
    try {
      const reset = widgets.map(w => ({ ...w, visible: true }));
      setWidgets(reset);
      await api.widgets.update(reset);
      addToast('All dashboard widgets enabled', 'success');
    } catch (err) {
      addToast('Reset failed', 'error');
    }
  };

  // Mock AI Task Generator
  const generateAiTasks = () => {
    if (!aiPrompt) {
      addToast('Please enter an AI prompt description', 'error');
      return;
    }
    setAiGenerating(true);
    setAiResponse('');
    setTimeout(() => {
      setAiGenerating(false);
      setAiResponse(
        `✨ AI Generated Task List for "${aiPrompt}":\n\n` +
        `1. Setup Project Architecture & Directory Templates (Priority: Critical | Est: 4h)\n` +
        `2. Draft Schema Migrations for relational bindings (Priority: High | Est: 8h)\n` +
        `3. Implement Responsive Grid layout UI with Light/Dark transitions (Priority: Medium | Est: 12h)\n` +
        `4. Run Integration Tests and export PDF/CSV audit logs (Priority: Low | Est: 6h)`
      );
      addToast('AI Task recommendations generated!', 'success');
    }, 1500);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-card border border-card-border rounded-lg w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-card border border-card-border rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-card border border-card-border rounded-xl lg:col-span-2" />
          <div className="h-64 bg-card border border-card-border rounded-xl" />
        </div>
      </div>
    );
  }

  // Apply Priority & Status filters dynamically to lists counts
  const filteredTasks = tasks.filter(t => {
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    return true;
  });

  // Calculate statistics metrics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'In Progress' || p.status === 'Planning').length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const pendingTasks = tasks.filter(t => t.status !== 'Completed').length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  
  // Today's tasks (due today)
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysTasks = tasks.filter(t => t.dueDate === todayStr);

  // Deadlines calendar quick count
  const deadlineCount = events.filter(e => e.type === 'project_deadline').length;
  const upcomingEvents = events.filter(e => e.type === 'custom');

  // Chart Formatting Helpers
  const taskCompletionData = [
    { name: 'Completed', value: completedTasks },
    { name: 'Pending', value: pendingTasks }
  ];
  const COLORS = ['#10b981', '#6366f1'];

  // Project status summary graph
  const projectStatusData = [
    { status: 'Planning', count: projects.filter(p => p.status === 'Planning').length },
    { status: 'In Progress', count: projects.filter(p => p.status === 'In Progress').length },
    { status: 'Testing', count: projects.filter(p => p.status === 'Testing').length },
    { status: 'On Hold', count: projects.filter(p => p.status === 'On Hold').length },
    { status: 'Completed', count: projects.filter(p => p.status === 'Completed').length },
  ];

  // Helper function to render a widget if configured visible
  const isWidgetVisible = (name: string) => {
    const w = widgets.find(item => item.widgetName === name);
    return w ? w.visible : true;
  };

  return (
    <div className="space-y-6">
      {/* -------------------------------------------------------------
          DASHBOARD HEADER & WIDGET TOGGLES
          ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Workspace Overview</span>
            <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-400 mt-1">Hello, {user?.name}. Here is what is happening in your projects today.</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => setCustomizing(!customizing)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              customizing
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-card border-card-border text-foreground hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal size={14} />
            <span>{customizing ? 'Save Layout' : 'Customize Widgets'}</span>
          </button>
          {customizing && (
            <button
              onClick={handleResetWidgets}
              className="p-1.5 bg-card border border-card-border hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-lg transition"
              title="Reset All Widgets"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Customize Panel dropdown overlay */}
      {customizing && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl animate-fade-in text-left">
          <h4 className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">Dashboard Widget Toggles</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {widgets.map(w => (
              <button
                key={w.id}
                onClick={() => handleToggleWidget(w.id, !w.visible)}
                className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-medium transition ${
                  w.visible
                    ? 'bg-indigo-950/40 border-indigo-600/50 text-indigo-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-500'
                }`}
              >
                <span>{w.widgetName.replace(/([A-Z])/g, ' $1').trim()}</span>
                {w.visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          FILTER BAR
          ------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-card border border-card-border rounded-xl">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Quick Filters:</span>
        
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none text-foreground focus:border-indigo-500 transition"
        >
          <option value="">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none text-foreground focus:border-indigo-500 transition"
        >
          <option value="">All Statuses</option>
          <option value="Todo">Todo</option>
          <option value="In Progress">In Progress</option>
          <option value="Review">Review</option>
          <option value="Completed">Completed</option>
        </select>

        {(filterPriority || filterStatus) && (
          <button
            onClick={() => {
              setFilterPriority('');
              setFilterStatus('');
            }}
            className="text-[10px] text-indigo-500 font-bold hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* -------------------------------------------------------------
          WIDGET 1: STATS CARDS
          ------------------------------------------------------------- */}
      {isWidgetVisible('StatsCard') && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-card border border-card-border rounded-xl shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Total Projects</span>
              <Briefcase size={18} className="text-indigo-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{totalProjects}</p>
            <span className="text-[10px] text-slate-400 mt-1 block">{activeProjects} active, {completedProjects} completed</span>
          </div>

          <div className="p-4 bg-card border border-card-border rounded-xl shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Pending Tasks</span>
              <Clock size={18} className="text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {filterPriority || filterStatus ? filteredTasks.filter(t => t.status !== 'Completed').length : pendingTasks}
            </p>
            <span className="text-[10px] text-slate-400 mt-1 block">Out of {filterPriority || filterStatus ? filteredTasks.length : tasks.length} total tasks</span>
          </div>

          <div className="p-4 bg-card border border-card-border rounded-xl shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Today's Deadlines</span>
              <CalendarDays size={18} className="text-red-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{todaysTasks.length + deadlineCount}</p>
            <span className="text-[10px] text-slate-400 mt-1 block">{todaysTasks.length} tasks, {deadlineCount} project endings</span>
          </div>

          <div className="p-4 bg-card border border-card-border rounded-xl shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Team Members</span>
              <Users2 size={18} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{members.length}</p>
            <span className="text-[10px] text-slate-400 mt-1 block">{members.filter(m => m.availability).length} active right now</span>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          CHARTS SECTION (WIDGET 2 & 3)
          ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Task Completion Pie Chart */}
        {isWidgetVisible('TaskCompletionChart') && (
          <div className="p-5 bg-card border border-card-border rounded-xl shadow-sm flex flex-col h-80">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1">
              <CheckCircle2 size={14} className="text-indigo-500" />
              <span>Task Completion Ratio</span>
            </h3>
            <div className="flex-1 min-h-0 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskCompletionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {taskCompletionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#fff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Legend overlay */}
              <div className="absolute text-center flex flex-col">
                <span className="text-2xl font-extrabold">{tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0}%</span>
                <span className="text-[9px] text-slate-400 uppercase font-semibold">Success</span>
              </div>
            </div>

            <div className="flex justify-center gap-6 text-[10px] mt-2 font-medium">
              <div className="flex items-center gap-1.5 text-emerald-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Completed ({completedTasks})</span>
              </div>
              <div className="flex items-center gap-1.5 text-indigo-500">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                <span>Pending ({pendingTasks})</span>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Productivity Chart */}
        {isWidgetVisible('MonthlyProductivityChart') && (
          <div className="p-5 bg-card border border-card-border rounded-xl shadow-sm flex flex-col h-80 lg:col-span-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1">
              <TrendingUp size={14} className="text-indigo-500" />
              <span>Workspace Productivity Trends</span>
            </h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportData?.monthlyProductivity || []}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#fff'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Area name="Tasks Completed" type="monotone" dataKey="completed" stroke="#6366f1" fillOpacity={1} fill="url(#colorCompleted)" strokeWidth={2} />
                  <Line name="Actual Billable Hours" type="monotone" dataKey="hours" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------
          CALENDAR & TIMELINE (WIDGET 4 & MOCK AI INTEGRATION)
          ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calendar Quick Events widget */}
        {isWidgetVisible('CalendarWidget') && (
          <div className="p-5 bg-card border border-card-border rounded-xl shadow-sm flex flex-col h-96 lg:col-span-2 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarDays size={14} className="text-indigo-500" />
                <span>Upcoming Events</span>
              </h3>
              <a href="/calendar" className="text-[10px] text-indigo-500 font-bold hover:underline flex items-center gap-0.5">
                <span>Go to Calendar</span>
                <ArrowRight size={10} />
              </a>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {upcomingEvents.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs">
                  <Bookmark size={24} className="mb-2 text-slate-600" />
                  <span>No scheduled meetings or reviews</span>
                </div>
              ) : (
                upcomingEvents.map(e => (
                  <div key={e.id} className="p-3 bg-slate-50 dark:bg-slate-900/30 border-l-4 border-indigo-500 rounded-r-lg flex items-center justify-between gap-3 hover:bg-slate-100 dark:hover:bg-slate-900/55 transition select-none">
                    <div className="text-left">
                      <p className="text-xs font-bold text-foreground">{e.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{e.description || 'No description provided'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-indigo-400 block">
                        {new Date(e.start).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        {new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Project Status Bar graph */}
        <div className="p-5 bg-card border border-card-border rounded-xl shadow-sm flex flex-col h-96">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1">
            <Layers size={14} className="text-indigo-500" />
            <span>Projects by Phase</span>
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectStatusData}>
                <XAxis dataKey="status" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]}>
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.status === 'In Progress' ? '#6366f1' : entry.status === 'Completed' ? '#10b981' : '#475569'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          AI GENERATOR & ACTIVITY TIMELINE
          ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* AI Task generator workspace */}
        <div className="p-5 bg-card border border-card-border rounded-xl shadow-sm flex flex-col h-96 lg:col-span-2 overflow-hidden text-left">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Cpu size={14} className="text-indigo-500" />
            <span>AI Predictive Task Generator</span>
          </h3>
          <p className="text-[10px] text-slate-400 mb-4">Input project outline to receive automatic tasks recommendations and deadline estimates.</p>
          
          <div className="flex gap-2 mb-4 shrink-0">
            <input
              type="text"
              placeholder="e.g. Design client billing checkout portal"
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
            />
            <button
              onClick={generateAiTasks}
              disabled={aiGenerating}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-1.5 shrink-0"
            >
              {aiGenerating ? 'Analysing...' : 'Generate Tasks'}
            </button>
          </div>

          <div className="flex-1 bg-slate-50 dark:bg-slate-950/60 border border-card-border rounded-lg p-3 overflow-y-auto font-mono text-[10px] text-slate-300 select-text leading-relaxed">
            {aiResponse ? (
              <pre className="whitespace-pre-wrap">{aiResponse}</pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 font-sans">
                <Sparkles size={20} className="mb-1 text-slate-600" />
                <span>AI recommendation outline will display here.</span>
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed Timeline */}
        <div className="p-5 bg-card border border-card-border rounded-xl shadow-sm flex flex-col h-96 text-left">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-4">
            <BellRing size={14} className="text-indigo-500" />
            <span>Workspace Activity Timeline</span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {timeline.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No recent workspace logs
              </div>
            ) : (
              timeline.map(log => (
                <div key={log.id} className="flex gap-3 relative pb-1">
                  <div className="flex flex-col items-center relative z-10 shrink-0">
                    <span className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5" />
                    <span className="w-0.5 bg-slate-800 flex-1 min-h-[30px]" />
                  </div>
                  <div>
                    <p className="text-xs text-foreground font-medium leading-relaxed">{log.details}</p>
                    <span className="text-[9px] text-slate-400 mt-0.5 block">
                      {new Date(log.createdAt).toLocaleDateString()} at {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
