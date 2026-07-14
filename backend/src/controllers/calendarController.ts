import { Response } from 'express';
import { Event, Project, Task, ActivityLog } from '../models';
import { AuthenticatedRequest } from '../middlewares/auth';

export const getEvents = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 1. Fetch custom events
    const dbEvents = await Event.findAll();

    // 2. Fetch projects with deadlines
    const projects = await Project.findAll({
      attributes: ['id', 'name', 'startDate', 'endDate', 'description', 'colorLabel']
    });

    // 3. Fetch tasks with due dates
    const tasks = await Task.findAll({
      attributes: ['id', 'title', 'dueDate', 'startDate', 'description', 'priority', 'status', 'projectId']
    });

    const calendarEvents: any[] = [];

    // Add custom events
    dbEvents.forEach(e => {
      calendarEvents.push({
        id: `event-${e.id}`,
        dbId: e.id,
        title: e.eventName,
        start: e.startTime,
        end: e.endTime,
        color: e.color || '#6366f1', // Indigo default
        type: 'custom',
        reminder: e.reminder,
        repeatEvent: e.repeatEvent,
        description: e.description,
        relatedProjectId: e.relatedProjectId,
        relatedTaskId: e.relatedTaskId
      });
    });

    // Add projects deadlines
    projects.forEach(p => {
      if (p.endDate) {
        calendarEvents.push({
          id: `project-${p.id}`,
          dbId: p.id,
          title: `🏁 Deadline: ${p.name}`,
          start: `${p.endDate}T09:00:00`,
          end: `${p.endDate}T17:00:00`,
          color: p.colorLabel || '#ef4444', // Red default
          type: 'project_deadline',
          description: p.description || '',
          relatedProjectId: p.id
        });
      }
    });

    // Add tasks due dates
    tasks.forEach(t => {
      if (t.dueDate) {
        let taskColor = '#3b82f6'; // Blue default
        if (t.priority === 'Critical') taskColor = '#b91c1c';
        else if (t.priority === 'High') taskColor = '#ea580c';
        else if (t.status === 'Completed') taskColor = '#10b981';

        calendarEvents.push({
          id: `task-${t.id}`,
          dbId: t.id,
          title: `📝 Task: ${t.title}`,
          start: `${t.dueDate}T09:00:00`,
          end: `${t.dueDate}T10:00:00`,
          color: taskColor,
          type: 'task_due',
          description: t.description || '',
          relatedProjectId: t.projectId,
          relatedTaskId: t.id
        });
      }
    });

    res.json(calendarEvents);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error fetching calendar events' });
  }
};

export const createEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { eventName, relatedProjectId, relatedTaskId, description, reminder, startTime, endTime, color, repeatEvent } = req.body;

    if (!eventName || !startTime || !endTime) {
      return res.status(400).json({ error: 'Event Name, Start Time, and End Time are required' });
    }

    const event = await Event.create({
      eventName,
      relatedProjectId: relatedProjectId || null,
      relatedTaskId: relatedTaskId || null,
      description,
      reminder: reminder || 'None',
      startTime,
      endTime,
      color,
      repeatEvent: repeatEvent || 'None'
    });

    res.status(201).json(event);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error creating event' });
  }
};

export const updateEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params; // Format: 'event-1', 'task-1', 'project-1'
    const { start, end } = req.body; // New dates from drag-and-drop

    if (!id) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    const parts = id.split('-');
    const type = parts[0];
    const dbId = parseInt(parts[1]);

    if (type === 'event') {
      const event = await Event.findByPk(dbId);
      if (!event) return res.status(404).json({ error: 'Event not found' });
      
      if (start) event.startTime = new Date(start);
      if (end) event.endTime = new Date(end);
      await event.save();
      return res.json(event);

    } else if (type === 'task') {
      const task = await Task.findByPk(dbId);
      if (!task) return res.status(404).json({ error: 'Task not found' });
      
      if (start) {
        // YYYY-MM-DD format from ISO string
        task.dueDate = start.split('T')[0];
        await task.save();
        
        await ActivityLog.create({
          action: 'TASK_DUE_DATE_DRAGGED',
          details: `Task "${task.title}" due date dragged to ${task.dueDate} on Calendar.`,
          projectId: task.projectId,
          taskId: task.id,
          userId: req.user?.id
        });
      }
      return res.json(task);

    } else if (type === 'project') {
      const project = await Project.findByPk(dbId);
      if (!project) return res.status(404).json({ error: 'Project not found' });

      if (start) {
        project.endDate = start.split('T')[0];
        await project.save();

        await ActivityLog.create({
          action: 'PROJECT_END_DATE_DRAGGED',
          details: `Project "${project.name}" end date dragged to ${project.endDate} on Calendar.`,
          projectId: project.id,
          userId: req.user?.id
        });
      }
      return res.json(project);
    }

    res.status(400).json({ error: 'Invalid event type prefix' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error moving event' });
  }
};

export const updateEventFields = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { eventName, relatedProjectId, relatedTaskId, description, reminder, startTime, endTime, color, repeatEvent } = req.body;

    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (eventName !== undefined) event.eventName = eventName;
    if (relatedProjectId !== undefined) event.relatedProjectId = relatedProjectId || null;
    if (relatedTaskId !== undefined) event.relatedTaskId = relatedTaskId || null;
    if (description !== undefined) event.description = description;
    if (reminder !== undefined) event.reminder = reminder;
    if (startTime !== undefined) event.startTime = startTime;
    if (endTime !== undefined) event.endTime = endTime;
    if (color !== undefined) event.color = color;
    if (repeatEvent !== undefined) event.repeatEvent = repeatEvent;

    await event.save();
    res.json(event);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error updating event fields' });
  }
};

export const deleteEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await event.destroy();
    res.json({ message: 'Event deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error deleting event' });
  }
};
