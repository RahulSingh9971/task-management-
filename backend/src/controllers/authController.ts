import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, WidgetConfig } from '../models';
import { AuthenticatedRequest } from '../middlewares/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_token_task_manager_2026';

// Helper to sign JWT
const signToken = (user: User) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role || 'Employee',
      availability: true
    });

    // Create default dashboard widgets for the new user
    const defaultWidgets = [
      { widgetName: 'StatsCard', positionX: 0, positionY: 0, sizeX: 4, sizeY: 1, visible: true },
      { widgetName: 'TaskCompletionChart', positionX: 0, positionY: 1, sizeX: 2, sizeY: 2, visible: true },
      { widgetName: 'MonthlyProductivityChart', positionX: 2, positionY: 1, sizeX: 2, sizeY: 2, visible: true },
      { widgetName: 'CalendarWidget', positionX: 0, positionY: 3, sizeX: 4, sizeY: 2, visible: true },
    ];
    
    for (const w of defaultWidgets) {
      await WidgetConfig.create({
        userId: user.id,
        ...w
      });
    }

    const token = signToken(user);
    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        photo: user.photo,
        skills: user.skills,
        experience: user.experience,
        availability: user.availability
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        photo: user.photo,
        skills: user.skills,
        experience: user.experience,
        availability: user.availability
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Server error during login' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      photo: user.photo,
      skills: user.skills,
      experience: user.experience,
      availability: user.availability
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Server error retrieving user data' });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, photo, skills, experience, availability } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name !== undefined) user.name = name;
    if (photo !== undefined) user.photo = photo;
    if (skills !== undefined) user.skills = skills;
    if (experience !== undefined) user.experience = experience;
    if (availability !== undefined) user.availability = availability;

    await user.save();

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      photo: user.photo,
      skills: user.skills,
      experience: user.experience,
      availability: user.availability
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Server error updating profile' });
  }
};

// Google Login Mock
export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { token: googleToken, email, name, photo, googleId } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ error: 'Google login payload missing email or googleId' });
    }

    let user = await User.findOne({ where: { email } });
    if (!user) {
      // Create user if not exists
      user = await User.create({
        name: name || 'Google User',
        email,
        passwordHash: null,
        role: 'Employee',
        photo: photo || null,
        googleId,
        availability: true
      });

      // Default widgets configuration
      const defaultWidgets = [
        { widgetName: 'StatsCard', positionX: 0, positionY: 0, sizeX: 4, sizeY: 1, visible: true },
        { widgetName: 'TaskCompletionChart', positionX: 0, positionY: 1, sizeX: 2, sizeY: 2, visible: true },
        { widgetName: 'MonthlyProductivityChart', positionX: 2, positionY: 1, sizeX: 2, sizeY: 2, visible: true },
        { widgetName: 'CalendarWidget', positionX: 0, positionY: 3, sizeX: 4, sizeY: 2, visible: true },
      ];
      for (const w of defaultWidgets) {
        await WidgetConfig.create({
          userId: user.id,
          ...w
        });
      }
    } else {
      // Update Google ID/Photo if needed
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
      if (photo && !user.photo) {
        user.photo = photo;
        await user.save();
      }
    }

    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        photo: user.photo,
        skills: user.skills,
        experience: user.experience,
        availability: user.availability
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Server error during Google login' });
  }
};
