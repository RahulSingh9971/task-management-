import { Response } from 'express';
import { User, ActivityLog } from '../models';
import { AuthenticatedRequest } from '../middlewares/auth';
import bcrypt from 'bcryptjs';

export const getTeamMembers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const members = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'photo', 'skills', 'experience', 'availability']
    });
    res.json(members);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error fetching team directory' });
  }
};

export const createTeamMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Only Admin or Manager can invite/create team members
    if (req.user?.role !== 'Admin' && req.user?.role !== 'Manager') {
      return res.status(403).json({ error: 'Only admins or managers can invite team members' });
    }

    const { name, email, role, phone, skills, experience } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Check if user already exists
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash a default password
    const defaultPassword = 'Password123!';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role || 'Employee',
      skills,
      experience,
      availability: true
    });

    await ActivityLog.create({
      action: 'TEAM_MEMBER_INVITED',
      details: `New team member "${name}" was created with role "${role || 'Employee'}". Default password: "${defaultPassword}"`,
      userId: req.user.id
    });

    res.status(201).json({
      message: 'Team member added successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        skills: user.skills,
        experience: user.experience,
        availability: user.availability
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error creating team member' });
  }
};

export const updateTeamMemberRole = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Only Admin can modify roles
    if (req.user?.role !== 'Admin') {
      return res.status(403).json({ error: 'Only administrators can modify roles' });
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['Admin', 'Manager', 'Employee'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required (Admin, Manager, Employee)' });
    }

    const member = await User.findByPk(id);
    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    const oldRole = member.role;
    member.role = role;
    await member.save();

    await ActivityLog.create({
      action: 'TEAM_MEMBER_ROLE_UPDATED',
      details: `Role of "${member.name}" changed from "${oldRole}" to "${role}".`,
      userId: req.user.id
    });

    res.json({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error updating member role' });
  }
};

export const deleteTeamMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== 'Admin') {
      return res.status(403).json({ error: 'Only administrators can remove team members' });
    }

    const { id } = req.params;
    const member = await User.findByPk(id);
    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    const name = member.name;
    await member.destroy();

    await ActivityLog.create({
      action: 'TEAM_MEMBER_DELETED',
      details: `Team member "${name}" was removed.`,
      userId: req.user.id
    });

    res.json({ message: `Team member "${name}" successfully deleted` });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error deleting team member' });
  }
};
