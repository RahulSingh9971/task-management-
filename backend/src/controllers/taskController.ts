import { Response } from 'express';
import { Task, User, Comment, Attachment, ActivityLog, Notification, TimeLog, Project } from '../models';
import { AuthenticatedRequest } from '../middlewares/auth';
import { Op } from 'sequelize';

export const getTasks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { projectId, assignedUserId, status, priority, search } = req.query;
    const whereClause: any = {};

    if (projectId) whereClause.projectId = projectId;
    if (assignedUserId) whereClause.assignedUserId = assignedUserId;
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (search) {
      whereClause.title = { [Op.like]: `%${search}%` };
    }

    const tasks = await Task.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'assignedUser', attributes: ['id', 'name', 'email', 'photo'] },
        { model: Project, as: 'project', attributes: ['id', 'name', 'colorLabel'] }
      ],
      order: [['dueDate', 'ASC']]
    });

    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error fetching tasks' });
  }
};

export const getTaskById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const task = await Task.findByPk(id, {
      include: [
        { model: User, as: 'assignedUser', attributes: ['id', 'name', 'email', 'photo'] },
        { model: Project, as: 'project', attributes: ['id', 'name', 'colorLabel'] }
      ]
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const comments = await Comment.findAll({
      where: { taskId: task.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'photo'] }],
      order: [['createdAt', 'ASC']]
    });

    const attachments = await Attachment.findAll({ where: { taskId: task.id } });
    const timeLogs = await TimeLog.findAll({
      where: { taskId: task.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      task,
      comments,
      attachments,
      timeLogs
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error fetching task details' });
  }
};

export const createTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      description,
      assignedUserId,
      dueDate,
      startDate,
      estimatedHours,
      priority,
      status,
      labels,
      checklist,
      projectId
    } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ error: 'Title and projectId are required' });
    }

    const labelsString = labels ? JSON.stringify(labels) : '[]';
    const checklistString = checklist ? JSON.stringify(checklist) : '[]';

    const task = await Task.create({
      title,
      description,
      assignedUserId: assignedUserId || null,
      dueDate: dueDate || null,
      startDate: startDate || null,
      estimatedHours: estimatedHours || 0,
      actualHours: 0,
      priority: priority || 'Medium',
      status: status || 'Todo',
      labels: labelsString,
      checklist: checklistString,
      projectId
    });

    // Log Activity
    await ActivityLog.create({
      action: 'TASK_CREATED',
      details: `Task "${title}" created under Project #${projectId}.`,
      projectId,
      taskId: task.id,
      userId: req.user?.id
    });

    // Send Notification to assigned user
    if (assignedUserId) {
      await Notification.create({
        type: 'TASK_ASSIGNED',
        message: `New task assigned: "${title}"`,
        userId: assignedUserId
      });
    }

    res.status(201).json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error creating task' });
  }
};

export const updateTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      assignedUserId,
      dueDate,
      startDate,
      estimatedHours,
      actualHours,
      priority,
      status,
      labels,
      checklist
    } = req.body;

    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const previousStatus = task.status;
    const previousAssignee = task.assignedUserId;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedUserId !== undefined) task.assignedUserId = assignedUserId || null;
    if (dueDate !== undefined) task.dueDate = dueDate || null;
    if (startDate !== undefined) task.startDate = startDate || null;
    if (estimatedHours !== undefined) task.estimatedHours = estimatedHours;
    if (actualHours !== undefined) task.actualHours = actualHours;
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = status;
    
    if (labels !== undefined) {
      task.labels = JSON.stringify(labels);
    }
    if (checklist !== undefined) {
      task.checklist = JSON.stringify(checklist);
    }

    await task.save();

    // Log Activity
    await ActivityLog.create({
      action: 'TASK_UPDATED',
      details: `Task "${task.title}" updated. Status: ${task.status}.`,
      projectId: task.projectId,
      taskId: task.id,
      userId: req.user?.id
    });

    // Handle Status Change Automation
    if (status && status !== previousStatus) {
      if (status === 'Completed') {
        // Automation trigger: move progress/notify
        await Notification.create({
          type: 'TASK_COMPLETED',
          message: `Task completed: "${task.title}"`,
          userId: req.user?.id || 1
        });
      }
    }

    // Handle Assignee Change notification
    if (assignedUserId && assignedUserId !== previousAssignee) {
      await Notification.create({
        type: 'TASK_ASSIGNED',
        message: `Task assigned to you: "${task.title}"`,
        userId: assignedUserId
      });
    }

    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error updating task' });
  }
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const projectId = task.projectId;
    const title = task.title;

    await task.destroy();

    // Log Activity
    await ActivityLog.create({
      action: 'TASK_DELETED',
      details: `Task "${title}" deleted.`,
      projectId,
      userId: req.user?.id
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error deleting task' });
  }
};

// Comments
export const addComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: taskId } = req.params;
    const { content, parentId } = req.body;
    const userId = req.user?.id;

    if (!content || !userId) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const comment = await Comment.create({
      content,
      taskId: parseInt(taskId),
      userId,
      parentId: parentId || null
    });

    // Activity log
    await ActivityLog.create({
      action: 'COMMENT_ADDED',
      details: `Comment added to task "${task.title}": "${content.substring(0, 30)}..."`,
      projectId: task.projectId,
      taskId: task.id,
      userId
    });

    // Check for @mentions in comments (simple regex matching @username or @email)
    const mentionRegex = /@(\w+)/g;
    let match;
    const mentions: string[] = [];
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    if (mentions.length > 0) {
      // Find users matching names
      const mentionedUsers = await User.findAll({
        where: { name: { [Op.in]: mentions } }
      });

      for (const u of mentionedUsers) {
        await Notification.create({
          type: 'MENTION',
          message: `${req.user?.email || 'Someone'} mentioned you in a comment on: "${task.title}"`,
          userId: u.id
        });
      }
    }

    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'photo'] }]
    });

    res.status(201).json(commentWithUser);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error adding comment' });
  }
};

// Time Tracking
export const startTimer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: taskId } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const task = await Task.findByPk(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Pause any active timers for this user first
    await TimeLog.update(
      { isRunning: false, endTime: new Date() },
      { where: { userId, isRunning: true } }
    );

    // Create a new running time log
    const log = await TimeLog.create({
      taskId: parseInt(taskId),
      userId,
      startTime: new Date(),
      isRunning: true,
      durationSeconds: 0
    });

    res.json(log);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error starting timer' });
  }
};

export const stopTimer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: taskId } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Find the running time log
    const log = await TimeLog.findOne({
      where: { taskId, userId, isRunning: true }
    });

    if (!log) {
      return res.status(400).json({ error: 'No active timer found for this task' });
    }

    const endTime = new Date();
    const startTime = new Date(log.startTime!);
    const elapsedSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

    log.endTime = endTime;
    log.isRunning = false;
    log.durationSeconds = elapsedSeconds;
    await log.save();

    // Re-calculate task's actualHours
    const allLogs = await TimeLog.findAll({ where: { taskId } });
    const totalDurationSeconds = allLogs.reduce((acc, l) => acc + l.durationSeconds, 0);
    const totalHours = parseFloat((totalDurationSeconds / 3600).toFixed(2));

    const task = await Task.findByPk(taskId);
    if (task) {
      task.actualHours = totalHours;
      await task.save();
    }

    res.json({ log, actualHours: totalHours });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error stopping timer' });
  }
};
