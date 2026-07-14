import { Response, Request } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Attachment, ActivityLog } from '../models';
import { AuthenticatedRequest } from '../middlewares/auth';

// Ensure uploads folder exists in /backend
const uploadDir = path.resolve(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Unique file name to prevent collision
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

export const uploadFile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file was uploaded' });
    }

    const { projectId, taskId } = req.body;

    const attachment = await Attachment.create({
      filename: req.file.originalname,
      filepath: `/uploads/${req.file.filename}`, // Web-accessible path
      mimetype: req.file.mimetype,
      size: req.file.size,
      projectId: projectId ? parseInt(projectId) : null,
      taskId: taskId ? parseInt(taskId) : null
    });

    // Log Activity
    await ActivityLog.create({
      action: 'FILE_UPLOADED',
      details: `File "${req.file.originalname}" was uploaded.`,
      projectId: projectId ? parseInt(projectId) : null,
      taskId: taskId ? parseInt(taskId) : null,
      userId: req.user?.id
    });

    res.status(201).json(attachment);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error uploading file' });
  }
};

export const getFiles = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { projectId, taskId } = req.query;
    const whereClause: any = {};

    if (projectId) whereClause.projectId = projectId;
    if (taskId) whereClause.taskId = taskId;

    const files = await Attachment.findAll({ where: whereClause, order: [['createdAt', 'DESC']] });
    res.json(files);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error fetching files list' });
  }
};

export const deleteFile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const attachment = await Attachment.findByPk(id);

    if (!attachment) {
      return res.status(404).json({ error: 'File not found in database' });
    }

    // Try deleting physical file
    const physicalPath = path.resolve(__dirname, '../../../', attachment.filepath.substring(1));
    if (fs.existsSync(physicalPath)) {
      fs.unlinkSync(physicalPath);
    }

    const filename = attachment.filename;
    const projectId = attachment.projectId;
    await attachment.destroy();

    // Log Activity
    await ActivityLog.create({
      action: 'FILE_DELETED',
      details: `File "${filename}" was deleted.`,
      projectId,
      userId: req.user?.id
    });

    res.json({ message: 'File deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error deleting file' });
  }
};
