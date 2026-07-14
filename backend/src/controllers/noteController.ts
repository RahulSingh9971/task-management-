import { Response } from 'express';
import { Note, ActivityLog } from '../models';
import { AuthenticatedRequest } from '../middlewares/auth';

export const getNotes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { projectId } = req.query;
    const whereClause: any = {};
    if (projectId) whereClause.projectId = projectId;

    const notes = await Note.findAll({ where: whereClause, order: [['updatedAt', 'DESC']] });
    res.json(notes);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error fetching notes' });
  }
};

export const getNoteById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const note = await Note.findByPk(id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(note);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error fetching note' });
  }
};

export const createNote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, content, projectId } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Note title is required' });
    }

    const note = await Note.create({
      title,
      content,
      projectId: projectId || null
    });

    // Log Activity
    await ActivityLog.create({
      action: 'NOTE_CREATED',
      details: `Note "${title}" was created.`,
      projectId: projectId || null,
      userId: req.user?.id
    });

    res.status(201).json(note);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error creating note' });
  }
};

export const updateNote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, projectId } = req.body;

    const note = await Note.findByPk(id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (projectId !== undefined) note.projectId = projectId || null;

    await note.save();

    res.json(note);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error updating note' });
  }
};

export const deleteNote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const note = await Note.findByPk(id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const title = note.title;
    const projectId = note.projectId;
    await note.destroy();

    // Log Activity
    await ActivityLog.create({
      action: 'NOTE_DELETED',
      details: `Note "${title}" was deleted.`,
      projectId,
      userId: req.user?.id
    });

    res.json({ message: 'Note deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error deleting note' });
  }
};
