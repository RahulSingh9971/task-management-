import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth';
import {
  register,
  login,
  getMe,
  updateProfile,
  googleLogin
} from '../controllers/authController';
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
} from '../controllers/clientController';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
} from '../controllers/projectController';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addComment,
  startTimer,
  stopTimer
} from '../controllers/taskController';
import {
  getEvents,
  createEvent,
  updateEvent,
  updateEventFields,
  deleteEvent
} from '../controllers/calendarController';
import {
  getTeamMembers,
  createTeamMember,
  updateTeamMemberRole,
  deleteTeamMember
} from '../controllers/teamController';
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote
} from '../controllers/noteController';
import {
  getFiles,
  uploadFile,
  deleteFile,
  upload
} from '../controllers/fileController';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../controllers/notificationController';
import {
  getProductivityData,
  exportReport
} from '../controllers/reportController';
import {
  getWidgets,
  updateWidgets
} from '../controllers/widgetController';

const router = Router();

// AUTH ROUTES
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/google', googleLogin);
router.get('/auth/me', authenticateJWT, getMe);
router.put('/auth/profile', authenticateJWT, updateProfile);

// CLIENT ROUTES
router.get('/clients', authenticateJWT, getClients);
router.get('/clients/:id', authenticateJWT, getClientById);
router.post('/clients', authenticateJWT, createClient);
router.put('/clients/:id', authenticateJWT, updateClient);
router.delete('/clients/:id', authenticateJWT, deleteClient);

// PROJECT ROUTES
router.get('/projects', authenticateJWT, getProjects);
router.get('/projects/:id', authenticateJWT, getProjectById);
router.post('/projects', authenticateJWT, createProject);
router.put('/projects/:id', authenticateJWT, updateProject);
router.delete('/projects/:id', authenticateJWT, deleteProject);

// TASK ROUTES
router.get('/tasks', authenticateJWT, getTasks);
router.get('/tasks/:id', authenticateJWT, getTaskById);
router.post('/tasks', authenticateJWT, createTask);
router.put('/tasks/:id', authenticateJWT, updateTask);
router.delete('/tasks/:id', authenticateJWT, deleteTask);
router.post('/tasks/:id/comments', authenticateJWT, addComment);
router.post('/tasks/:id/timer/start', authenticateJWT, startTimer);
router.post('/tasks/:id/timer/stop', authenticateJWT, stopTimer);

// CALENDAR ROUTES
router.get('/calendar', authenticateJWT, getEvents);
router.post('/calendar', authenticateJWT, createEvent);
router.put('/calendar/:id/drag', authenticateJWT, updateEvent);
router.put('/calendar/:id', authenticateJWT, updateEventFields);
router.delete('/calendar/:id', authenticateJWT, deleteEvent);

// TEAM ROUTES
router.get('/team', authenticateJWT, getTeamMembers);
router.post('/team', authenticateJWT, createTeamMember);
router.put('/team/:id/role', authenticateJWT, updateTeamMemberRole);
router.delete('/team/:id', authenticateJWT, deleteTeamMember);

// NOTES ROUTES
router.get('/notes', authenticateJWT, getNotes);
router.get('/notes/:id', authenticateJWT, getNoteById);
router.post('/notes', authenticateJWT, createNote);
router.put('/notes/:id', authenticateJWT, updateNote);
router.delete('/notes/:id', authenticateJWT, deleteNote);

// FILES ROUTES
router.get('/files', authenticateJWT, getFiles);
router.post('/files/upload', authenticateJWT, upload.single('file'), uploadFile);
router.delete('/files/:id', authenticateJWT, deleteFile);

// NOTIFICATION ROUTES
router.get('/notifications', authenticateJWT, getNotifications);
router.put('/notifications/read-all', authenticateJWT, markAllAsRead);
router.put('/notifications/:id/read', authenticateJWT, markAsRead);
router.delete('/notifications/:id', authenticateJWT, deleteNotification);

// REPORTS ROUTES
router.get('/reports/productivity', authenticateJWT, getProductivityData);
router.get('/reports/export', authenticateJWT, exportReport);

// WIDGETS ROUTES
router.get('/widgets', authenticateJWT, getWidgets);
router.put('/widgets', authenticateJWT, updateWidgets);

export default router;
