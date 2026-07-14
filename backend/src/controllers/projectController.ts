import { Response } from 'express';
import { Project, Task, Note, Attachment, ActivityLog, User, Client } from '../models';
import { AuthenticatedRequest } from '../middlewares/auth';
import { Op } from 'sequelize';

export const getProjects = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, priority, clientId, search } = req.query;
    const whereClause: any = {};

    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (clientId) whereClause.clientId = clientId;
    if (search) {
      whereClause.name = { [Op.like]: `%${search}%` };
    }

    const projects = await Project.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error fetching projects' });
  }
};

export const getProjectById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const project = await Project.findByPk(id, {
      include: [{ model: Client, as: 'client' }]
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Fetch related tasks, notes, attachments, activity log
    const tasks = await Task.findAll({ where: { projectId: project.id } });
    const notes = await Note.findAll({ where: { projectId: project.id } });
    const attachments = await Attachment.findAll({ where: { projectId: project.id } });
    const timeline = await ActivityLog.findAll({
      where: { projectId: project.id },
      order: [['createdAt', 'DESC']],
      limit: 15
    });

    // Resolve Team Members details
    let teamMembersDetails: User[] = [];
    if (project.teamMembers) {
      try {
        const memberIds: number[] = JSON.parse(project.teamMembers);
        if (Array.isArray(memberIds) && memberIds.length > 0) {
          teamMembersDetails = await User.findAll({
            where: { id: memberIds },
            attributes: ['id', 'name', 'email', 'photo', 'role']
          });
        }
      } catch (err) {
        console.error('Failed to parse project team members JSON', err);
      }
    }

    res.json({
      project,
      tasks,
      notes,
      attachments,
      timeline,
      teamMembers: teamMembersDetails
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error fetching project details' });
  }
};

export const createProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      clientName,
      clientId,
      description,
      startDate,
      endDate,
      priority,
      status,
      budget,
      category,
      technologiesUsed,
      teamMembers,
      colorLabel,
      tags
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project Name is required' });
    }

    // Convert objects to strings for database storage
    const techString = technologiesUsed ? JSON.stringify(technologiesUsed) : '[]';
    const teamString = teamMembers ? JSON.stringify(teamMembers) : '[]';
    const tagsString = tags ? JSON.stringify(tags) : '[]';

    const project = await Project.create({
      name,
      clientName,
      clientId: clientId || null,
      description,
      startDate,
      endDate,
      priority: priority || 'Medium',
      status: status || 'Planning',
      budget: budget || null,
      category,
      technologiesUsed: techString,
      teamMembers: teamString,
      colorLabel,
      tags: tagsString
    });

    // Log Activity
    await ActivityLog.create({
      action: 'PROJECT_CREATED',
      details: `Project "${name}" was created. Status: ${status || 'Planning'}.`,
      projectId: project.id,
      userId: req.user?.id
    });

    res.status(201).json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error creating project' });
  }
};

export const updateProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      clientName,
      clientId,
      description,
      startDate,
      endDate,
      priority,
      status,
      budget,
      category,
      technologiesUsed,
      teamMembers,
      colorLabel,
      tags
    } = req.body;

    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const previousStatus = project.status;

    if (name !== undefined) project.name = name;
    if (clientName !== undefined) project.clientName = clientName;
    if (clientId !== undefined) project.clientId = clientId || null;
    if (description !== undefined) project.description = description;
    if (startDate !== undefined) project.startDate = startDate;
    if (endDate !== undefined) project.endDate = endDate;
    if (priority !== undefined) project.priority = priority;
    if (status !== undefined) project.status = status;
    if (budget !== undefined) project.budget = budget;
    if (category !== undefined) project.category = category;
    if (colorLabel !== undefined) project.colorLabel = colorLabel;

    if (technologiesUsed !== undefined) {
      project.technologiesUsed = JSON.stringify(technologiesUsed);
    }
    if (teamMembers !== undefined) {
      project.teamMembers = JSON.stringify(teamMembers);
    }
    if (tags !== undefined) {
      project.tags = JSON.stringify(tags);
    }

    await project.save();

    // Trigger automation log if completed
    if (status && status !== previousStatus) {
      await ActivityLog.create({
        action: 'PROJECT_STATUS_UPDATED',
        details: `Project status changed from ${previousStatus} to ${status}.`,
        projectId: project.id,
        userId: req.user?.id
      });

      // Automation placeholder logic: Move progress if completed
      if (status === 'Completed') {
        await ActivityLog.create({
          action: 'PROJECT_ARCHIVED_AUTO',
          details: `System automatically archived files/history for project "${project.name}" on completion.`,
          projectId: project.id,
          userId: 0 // System user ID
        });
      }
    } else {
      await ActivityLog.create({
        action: 'PROJECT_UPDATED',
        details: `Project details updated.`,
        projectId: project.id,
        userId: req.user?.id
      });
    }

    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error updating project' });
  }
};

export const deleteProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await project.destroy();

    res.json({ message: 'Project and all associated tasks/notes deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error deleting project' });
  }
};
