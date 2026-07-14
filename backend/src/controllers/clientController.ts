import { Response } from 'express';
import { Client, Project, ActivityLog } from '../models';
import { AuthenticatedRequest } from '../middlewares/auth';

export const getClients = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clients = await Client.findAll();
    res.json(clients);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error fetching clients' });
  }
};

export const getClientById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const client = await Client.findByPk(id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Fetch related projects
    const projects = await Project.findAll({ where: { clientId: client.id } });

    // Fetch timeline activities for projects owned by the client
    const projectIds = projects.map(p => p.id);
    let timeline: any[] = [];
    if (projectIds.length > 0) {
      timeline = await ActivityLog.findAll({
        where: { projectId: projectIds },
        order: [['createdAt', 'DESC']],
        limit: 10
      });
    }

    // Mock Payments for clients
    const payments = [
      { id: 1, amount: 2500.00, status: 'Paid', date: '2026-06-15', invoiceNo: 'INV-2026-001' },
      { id: 2, amount: 1500.00, status: 'Pending', date: '2026-07-20', invoiceNo: 'INV-2026-002' },
    ];

    res.json({
      client,
      projects,
      payments,
      timeline
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error fetching client profile' });
  }
};

export const createClient = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, company, email, phone, gst, address, notes } = req.body;
    if (!name || !company || !email) {
      return res.status(400).json({ error: 'Name, company, and email are required' });
    }

    const client = await Client.create({
      name,
      company,
      email,
      phone,
      gst,
      address,
      notes
    });

    // Log Activity
    await ActivityLog.create({
      action: 'CLIENT_CREATED',
      details: `Client ${name} from ${company} was registered.`,
      userId: req.user?.id
    });

    res.status(201).json(client);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error creating client' });
  }
};

export const updateClient = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, company, email, phone, gst, address, notes } = req.body;

    const client = await Client.findByPk(id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    if (name !== undefined) client.name = name;
    if (company !== undefined) client.company = company;
    if (email !== undefined) client.email = email;
    if (phone !== undefined) client.phone = phone;
    if (gst !== undefined) client.gst = gst;
    if (address !== undefined) client.address = address;
    if (notes !== undefined) client.notes = notes;

    await client.save();

    res.json(client);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error updating client' });
  }
};

export const deleteClient = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const client = await Client.findByPk(id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    await client.destroy();
    res.json({ message: 'Client deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error deleting client' });
  }
};
