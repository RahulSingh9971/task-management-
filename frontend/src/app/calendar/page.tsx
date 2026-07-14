'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/utils/api';
import { useNotifications } from '@/context/NotificationContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Briefcase,
  CheckSquare,
  X,
  Trash2,
  BellRing,
  RotateCcw,
  Loader2
} from 'lucide-react';

export default function CalendarPage() {
  const { addToast } = useNotifications();

  // Calendar events states
  const [events, setEvents] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Month navigation state
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 13)); // Set default around seeded data (July 2026)

  // Event modal state
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  // Form fields
  const [eventName, setEventName] = useState('');
  const [relatedProjectId, setRelatedProjectId] = useState('');
  const [relatedTaskId, setRelatedTaskId] = useState('');
  const [description, setDescription] = useState('');
  const [reminder, setReminder] = useState('None');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [repeatEvent, setRepeatEvent] = useState('None');

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventData, projData, taskData] = await Promise.all([
        api.calendar.getEvents(),
        api.projects.getAll(),
        api.tasks.getAll()
      ]);
      setEvents(eventData);
      setProjects(projData);
      setTasks(taskData);
    } catch (err) {
      console.error('Error loading calendar data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const nextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  // Open creation modal prefilled with clicked date
  const handleDayClick = (dayStr: string) => {
    setSelectedEvent(null);
    setEventName('');
    setRelatedProjectId('');
    setRelatedTaskId('');
    setDescription('');
    setReminder('None');
    setStartTime(`${dayStr}T10:00`);
    setEndTime(`${dayStr}T11:00`);
    setColor('#6366f1');
    setRepeatEvent('None');
    setEventModalOpen(true);
  };

  // Open edit modal for existing event
  const handleEventClick = (e: any, eventItem: any) => {
    e.stopPropagation();
    
    // Virtual task/project events cannot be edited like custom events, redirect to task/project or handle alerts
    if (eventItem.type !== 'custom') {
      addToast(`This is a virtual event representing a ${eventItem.type === 'task_due' ? 'Task due date' : 'Project deadline'}. Adjust it directly on the tasks/projects panel.`, 'info');
      return;
    }

    setSelectedEvent(eventItem);
    setEventName(eventItem.title);
    setRelatedProjectId(eventItem.relatedProjectId || '');
    setRelatedTaskId(eventItem.relatedTaskId || '');
    setDescription(eventItem.description || '');
    setReminder(eventItem.reminder || 'None');
    setRepeatEvent(eventItem.repeatEvent || 'None');
    setColor(eventItem.color || '#6366f1');
    
    // Format dates to YYYY-MM-DDTHH:MM
    const startStr = new Date(eventItem.start).toISOString().slice(0, 16);
    const endStr = new Date(eventItem.end).toISOString().slice(0, 16);
    setStartTime(startStr);
    setEndTime(endStr);
    
    setEventModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName || !startTime || !endTime) {
      addToast('Please fill in required fields', 'error');
      return;
    }

    const payload = {
      eventName,
      relatedProjectId: relatedProjectId ? parseInt(relatedProjectId) : null,
      relatedTaskId: relatedTaskId ? parseInt(relatedTaskId) : null,
      description,
      reminder,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      color,
      repeatEvent
    };

    try {
      if (selectedEvent) {
        // Edit custom event
        await api.calendar.updateEvent(selectedEvent.dbId, payload);
        addToast('Event updated successfully', 'success');
      } else {
        // Create custom event
        await api.calendar.createEvent(payload);
        addToast('Event created successfully', 'success');
      }
      setEventModalOpen(false);
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to save event', 'error');
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    if (confirm('Delete this event permanently?')) {
      try {
        await api.calendar.deleteEvent(selectedEvent.dbId);
        addToast('Event deleted successfully', 'success');
        setEventModalOpen(false);
        loadData();
      } catch (err) {
        addToast('Failed to delete event', 'error');
      }
    }
  };

  // Drag and drop event date move
  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    e.dataTransfer.setData('calendarEventId', eventId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('calendarEventId');
    if (!eventId) return;

    // Optimistically update date
    setEvents(prev =>
      prev.map(evt => {
        if (evt.id === eventId) {
          return {
            ...evt,
            start: `${targetDateStr}T10:00:00`,
            end: `${targetDateStr}T11:00:00`
          };
        }
        return evt;
      })
    );

    try {
      await api.calendar.dragEvent(eventId, `${targetDateStr}T10:00:00`, `${targetDateStr}T11:00:00`);
      addToast('Event rescheduled successfully', 'success');
      loadData(); // Sync with backend fully (triggers logs)
    } catch (err) {
      addToast('Failed to reschedule event', 'error');
      loadData(); // Revert
    }
  };

  // Generate monthly grid calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // First day of month (0 = Sunday, 6 = Saturday)
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Total days in month
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Create array of days representing monthly calendar grid
  const daysArray: Array<{ day: number | null; dateStr: string }> = [];

  // Pad previous month days
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push({ day: null, dateStr: '' });
  }

  // Populate current month days
  for (let i = 1; i <= totalDays; i++) {
    const dayPadded = i < 10 ? '0' + i : i.toString();
    const monthPadded = (month + 1) < 10 ? '0' + (month + 1) : (month + 1).toString();
    daysArray.push({
      day: i,
      dateStr: `${year}-${monthPadded}-${dayPadded}`
    });
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      
      {/* -------------------------------------------------------------
          HEADER & NAVIGATION
          ------------------------------------------------------------- */}
      <div className="flex items-center justify-between shrink-0 select-none">
        <div className="text-left">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-indigo-500" />
            <span>Interactive Calendar</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Overlay meetings, tasks, and project endpoints in a unified view.</p>
        </div>

        {/* Month navigations */}
        <div className="flex items-center gap-2 bg-card border border-card-border p-1.5 rounded-xl">
          <button onClick={prevMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-foreground">
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-bold text-foreground px-2 min-w-[100px] text-center">
            {monthNames[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-foreground">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          CALENDAR GRID
          ------------------------------------------------------------- */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col bg-card border border-card-border rounded-2xl overflow-hidden min-h-[500px]">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-900/30 border-b border-card-border text-center select-none py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Days Grid cells */}
          <div className="grid grid-cols-7 flex-1 divide-x divide-y divide-card-border">
            {daysArray.map((cell, idx) => {
              // Find events on this day
              const dayEvents = events.filter(e => {
                if (!cell.dateStr) return false;
                const eventStartDateStr = e.start.split('T')[0];
                return eventStartDateStr === cell.dateStr;
              });

              return (
                <div
                  key={idx}
                  onDragOver={handleDragOver}
                  onDrop={e => cell.dateStr && handleDrop(e, cell.dateStr)}
                  onClick={() => cell.dateStr && handleDayClick(cell.dateStr)}
                  className={`min-h-[80px] p-2 flex flex-col justify-between text-left transition select-none ${
                    cell.day ? 'bg-card cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/10' : 'bg-slate-50/40 dark:bg-slate-950/20'
                  }`}
                >
                  {/* Day number */}
                  <span className={`text-[10px] font-bold select-none ${cell.day ? 'text-foreground' : 'text-slate-600'}`}>
                    {cell.day}
                  </span>

                  {/* Day events overlay */}
                  <div className="flex-1 overflow-y-auto space-y-1 mt-1">
                    {dayEvents.map(evt => (
                      <div
                        key={evt.id}
                        draggable
                        onDragStart={e => handleDragStart(e, evt.id)}
                        onClick={e => handleEventClick(e, evt)}
                        style={{ backgroundColor: evt.color || '#6366f1' }}
                        className="px-1.5 py-0.5 rounded text-[8px] font-semibold text-white truncate shadow-sm transition hover:brightness-95 flex items-center gap-1 leading-normal"
                        title={evt.title}
                      >
                        {evt.type === 'project_deadline' ? '🏁' : evt.type === 'task_due' ? '📝' : '👥'}
                        <span>{evt.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: VIEW / CREATE / EDIT CALENDAR EVENT
          ------------------------------------------------------------- */}
      {eventModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-card-border rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-fade-in text-left">
            <button
              onClick={() => setEventModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-foreground p-1"
            >
              <X size={20} />
            </button>

            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-5 flex items-center gap-1.5 select-none">
              <CalendarIcon className="text-indigo-500" size={18} />
              <span>{selectedEvent ? 'Event Details' : 'Schedule Custom Event'}</span>
            </h2>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Event Name *</label>
                <input
                  type="text"
                  required
                  value={eventName}
                  onChange={e => setEventName(e.target.value)}
                  placeholder="e.g. Sprint Review Meeting"
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Start Datetime *</label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs text-foreground outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">End Datetime *</label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs text-foreground outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Link Project</label>
                  <select
                    value={relatedProjectId}
                    onChange={e => setRelatedProjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs text-foreground outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition"
                  >
                    <option value="">No Project Linked</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Link Task</label>
                  <select
                    value={relatedTaskId}
                    onChange={e => setRelatedTaskId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs text-foreground outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition"
                  >
                    <option value="">No Task Linked</option>
                    {tasks.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Event Color</label>
                  <input
                    type="color"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="h-8 w-full border-0 bg-transparent cursor-pointer rounded-lg overflow-hidden shrink-0"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Reminder</label>
                  <select
                    value={reminder}
                    onChange={e => setReminder(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs text-foreground outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition"
                  >
                    <option value="None">None</option>
                    <option value="Today">Today</option>
                    <option value="Tomorrow">Tomorrow</option>
                    <option value="Next Week">Next Week</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Repeat Event</label>
                  <select
                    value={repeatEvent}
                    onChange={e => setRepeatEvent(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs text-foreground outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition"
                  >
                    <option value="None">None</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Event Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Meeting agenda, details, video links..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition resize-none"
                />
              </div>

              <div className="flex justify-between items-center pt-4 select-none">
                {selectedEvent ? (
                  <button
                    type="button"
                    onClick={handleDeleteEvent}
                    className="flex items-center gap-1 text-red-500 hover:text-red-400 text-xs font-semibold"
                  >
                    <Trash2 size={13} />
                    <span>Delete Event</span>
                  </button>
                ) : <div />}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEventModalOpen(false)}
                    className="px-4 py-2 border border-card-border rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition"
                  >
                    Save Event
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
