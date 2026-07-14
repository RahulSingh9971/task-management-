import bcrypt from 'bcryptjs';
import sequelize, { User, Client, Project, Task, Comment, Event, WidgetConfig, ActivityLog } from '../models';

const seedDatabase = async () => {
  try {
    console.log('🔄 Re-syncing database for seeding...');
    // Force sync deletes all existing tables and recreates them
    await sequelize.sync({ force: true });
    console.log('✅ Database cleared and recreated.');

    // 1. CREATE USERS
    console.log('👤 Seeding Users...');
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const hashedManagerPassword = await bcrypt.hash('manager123', 10);
    const hashedDevPassword = await bcrypt.hash('alex123', 10);
    const hashedDesignPassword = await bcrypt.hash('sarah123', 10);

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@dashboard.com',
      passwordHash: hashedAdminPassword,
      role: 'Admin',
      skills: 'System Admin, PostgreSQL, Docker, AWS',
      experience: '8+ Years',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      availability: true
    });

    const manager = await User.create({
      name: 'Emma Watson',
      email: 'emma@dashboard.com',
      passwordHash: hashedManagerPassword,
      role: 'Manager',
      skills: 'Agile Project Management, Product Strategy, Scrum',
      experience: '5 Years',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
      availability: true
    });

    const dev = await User.create({
      name: 'Alex Rivera',
      email: 'alex@dashboard.com',
      passwordHash: hashedDevPassword,
      role: 'Employee',
      skills: 'React.js, Next.js, Node.js, Express, TypeScript, SQL',
      experience: '3 Years',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      availability: true
    });

    const designer = await User.create({
      name: 'Sarah Chen',
      email: 'sarah@dashboard.com',
      passwordHash: hashedDesignPassword,
      role: 'Employee',
      skills: 'Figma, UI/UX Design, CSS, Framer Motion, Branding',
      experience: '4 Years',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      availability: false
    });

    console.log('✅ Users seeded.');

    // 2. SEED DEFAULT WIDGETS
    console.log('⚙️ Seeding Widget Configurations...');
    const users = [admin, manager, dev, designer];
    for (const u of users) {
      const widgets = [
        { widgetName: 'StatsCard', positionX: 0, positionY: 0, sizeX: 4, sizeY: 1, visible: true },
        { widgetName: 'TaskCompletionChart', positionX: 0, positionY: 1, sizeX: 2, sizeY: 2, visible: true },
        { widgetName: 'MonthlyProductivityChart', positionX: 2, positionY: 1, sizeX: 2, sizeY: 2, visible: true },
        { widgetName: 'CalendarWidget', positionX: 0, positionY: 3, sizeX: 4, sizeY: 2, visible: true },
      ];
      for (const w of widgets) {
        await WidgetConfig.create({
          userId: u.id,
          ...w
        });
      }
    }
    console.log('✅ Widgets seeded.');

    // 3. SEED CLIENTS
    console.log('💼 Seeding Clients...');
    const client1 = await Client.create({
      name: 'John Miller',
      company: 'Acme Corporation',
      email: 'john.miller@acme.com',
      phone: '+1 (555) 123-4567',
      gst: '22AAAAA0000A1Z1',
      address: '123 Enterprise Way, Tech City, CA 94016',
      notes: 'Acme is our primary account for web development projects.'
    });

    const client2 = await Client.create({
      name: 'Patricia Harris',
      company: 'Globex Industries',
      email: 'patricia@globex.com',
      phone: '+1 (555) 987-6543',
      gst: '33BBBBB1111B2Z2',
      address: '456 Innovation Blvd, Future Town, NY 10001',
      notes: 'Mobile app and cloud migration contract.'
    });
    console.log('✅ Clients seeded.');

    // 4. SEED PROJECTS
    console.log('📁 Seeding Projects...');
    const project1 = await Project.create({
      name: 'SaaS Dashboard Redesign',
      clientName: 'Acme Corporation',
      clientId: client1.id,
      description: 'Revamping the core administrative SaaS portal with modern components, charts, real-time collaboration, and custom widgets.',
      startDate: '2026-07-01',
      endDate: '2026-08-30',
      priority: 'High',
      status: 'In Progress',
      budget: 25000.00,
      category: 'Web Application',
      technologiesUsed: JSON.stringify(['Next.js', 'React', 'Tailwind CSS', 'TypeScript', 'Sequelize']),
      teamMembers: JSON.stringify([dev.id, designer.id, manager.id]),
      colorLabel: '#6366f1',
      tags: JSON.stringify(['Design', 'Frontend', 'Refactor'])
    });

    const project2 = await Project.create({
      name: 'Mobile E-commerce App',
      clientName: 'Globex Industries',
      clientId: client2.id,
      description: 'Building a cross-platform iOS & Android mobile shopping application with full checkout, local search, and offline support.',
      startDate: '2026-07-15',
      endDate: '2026-11-20',
      priority: 'Medium',
      status: 'Planning',
      budget: 45000.00,
      category: 'Mobile Development',
      technologiesUsed: JSON.stringify(['Flutter', 'Dart', 'Node.js', 'Express', 'MySQL']),
      teamMembers: JSON.stringify([dev.id, manager.id]),
      colorLabel: '#f59e0b',
      tags: JSON.stringify(['Mobile', 'Backend'])
    });

    const project3 = await Project.create({
      name: 'Marketing Landing Page Q3',
      clientName: 'Acme Corporation',
      clientId: client1.id,
      description: 'Single-page SEO optimized product checkout landing page.',
      startDate: '2026-06-01',
      endDate: '2026-06-25',
      priority: 'Low',
      status: 'Completed',
      budget: 5000.00,
      category: 'Design & Marketing',
      technologiesUsed: JSON.stringify(['HTML', 'CSS', 'JavaScript']),
      teamMembers: JSON.stringify([designer.id]),
      colorLabel: '#10b981',
      tags: JSON.stringify(['Static', 'A/B Testing'])
    });
    console.log('✅ Projects seeded.');

    // 5. SEED TASKS
    console.log('📋 Seeding Tasks...');
    
    // SaaS Dashboard Redesign Tasks
    const task1 = await Task.create({
      title: 'Figma UI/UX Mockups & Wireframes',
      description: 'Design dark and light variations of the dashboard widgets, sidebar menus, and mobile views. Build design system style guides.',
      assignedUserId: designer.id,
      startDate: '2026-07-02',
      dueDate: '2026-07-12',
      estimatedHours: 20.00,
      actualHours: 22.50,
      priority: 'High',
      status: 'Completed',
      labels: JSON.stringify(['Design', 'Figma']),
      checklist: JSON.stringify([
        { text: 'Verify typography accessibility in dark mode', completed: true },
        { text: 'Design grid component layouts', completed: true },
        { text: 'Create components style guide export', completed: true }
      ]),
      projectId: project1.id
    });

    const task2 = await Task.create({
      title: 'Setup Sequelize DB & Express Endpoints',
      description: 'Configure models, setup dual dialect connectivity (SQLite local, MySQL prod). Code registration and login endpoints.',
      assignedUserId: dev.id,
      startDate: '2026-07-05',
      dueDate: '2026-07-15',
      estimatedHours: 12.00,
      actualHours: 11.00,
      priority: 'High',
      status: 'Completed',
      labels: JSON.stringify(['Backend', 'Database']),
      checklist: JSON.stringify([
        { text: 'Define schemas for Users, Projects, Tasks, and Clients', completed: true },
        { text: 'Implement JWT signing and validation filters', completed: true },
        { text: 'Configure CORS and Multer storage directories', completed: true }
      ]),
      projectId: project1.id
    });

    const task3 = await Task.create({
      title: 'Build Kanban & Table Views with Drag/Drop',
      description: 'Implement frontend dashboard layout. Create List, Kanban board, and responsive spreadsheet table task views.',
      assignedUserId: dev.id,
      startDate: '2026-07-12',
      dueDate: '2026-07-22',
      estimatedHours: 25.00,
      actualHours: 4.50,
      priority: 'Critical',
      status: 'In Progress',
      labels: JSON.stringify(['Development', 'Frontend']),
      checklist: JSON.stringify([
        { text: 'Integrate Tailwind styles & responsive navigation framework', completed: true },
        { text: 'Add React Beautiful DnD or simple HTML Drag-Drop support', completed: false },
        { text: 'Create sidebar task detail editing cards', completed: false }
      ]),
      projectId: project1.id
    });

    const task4 = await Task.create({
      title: 'Integrate Recharts Analytics Graphs',
      description: 'Connect reports endpoint with frontend UI cards. Display Monthly Productivity and Task Completion ratios.',
      assignedUserId: dev.id,
      startDate: '2026-07-18',
      dueDate: '2026-07-28',
      estimatedHours: 10.00,
      actualHours: 0,
      priority: 'Medium',
      status: 'Todo',
      labels: JSON.stringify(['Development', 'Frontend']),
      checklist: JSON.stringify([
        { text: 'Fetch backend performance data', completed: false },
        { text: 'Render responsive bar/line graphs', completed: false }
      ]),
      projectId: project1.id
    });

    const task5 = await Task.create({
      title: 'Audit Accessibility and Colors Contrast',
      description: 'Ensure contrast conforms to WCAG standards across Dark/Light themes.',
      assignedUserId: designer.id,
      startDate: '2026-07-20',
      dueDate: '2026-07-25',
      estimatedHours: 5.00,
      actualHours: 0,
      priority: 'Low',
      status: 'Todo',
      labels: JSON.stringify(['Audit', 'Design']),
      checklist: JSON.stringify([]),
      projectId: project1.id
    });

    // Mobile E-commerce tasks
    const task6 = await Task.create({
      title: 'Draft System Architecture & DB Diagram',
      description: 'Detail client API structure, offline state caching policies, and stripe payment flow routing.',
      assignedUserId: dev.id,
      startDate: '2026-07-16',
      dueDate: '2026-07-20',
      estimatedHours: 8.00,
      actualHours: 0,
      priority: 'Medium',
      status: 'Todo',
      labels: JSON.stringify(['Architecture', 'Backend']),
      checklist: JSON.stringify([]),
      projectId: project2.id
    });
    console.log('✅ Tasks seeded.');

    // 6. SEED COMMENTS
    console.log('💬 Seeding Comments...');
    await Comment.create({
      content: "UI wireframes have been updated in Figma. Check the 'Mobile' pages folder for responsiveness.",
      taskId: task3.id,
      userId: designer.id,
      parentId: null
    });

    await Comment.create({
      content: "Looks great, Sarah! I will start hooking up the layout grid according to these components.",
      taskId: task3.id,
      userId: dev.id,
      parentId: null
    });
    console.log('✅ Comments seeded.');

    // 7. SEED CALENDAR EVENTS
    console.log('📅 Seeding Calendar Events...');
    await Event.create({
      eventName: 'Sprint Planning Meeting',
      relatedProjectId: project1.id,
      relatedTaskId: task3.id,
      description: 'Aligning goals for Kanban implementations and charts mappings.',
      reminder: 'Tomorrow',
      startTime: new Date('2026-07-14T10:00:00'),
      endTime: new Date('2026-07-14T11:30:00'),
      color: '#6366f1',
      repeatEvent: 'None'
    });

    await Event.create({
      eventName: 'Client Project Alignment Call',
      relatedProjectId: project1.id,
      description: 'Review wireframes with John Miller from Acme Corp.',
      reminder: 'Today',
      startTime: new Date('2026-07-16T15:00:00'),
      endTime: new Date('2026-07-16T16:00:00'),
      color: '#10b981',
      repeatEvent: 'None'
    });
    console.log('✅ Calendar Events seeded.');

    // 8. SEED ACTIVITY FEED LOGS
    console.log('📈 Seeding Activity Logs...');
    await ActivityLog.create({
      action: 'PROJECT_CREATED',
      details: 'Emma Watson initialized Project "SaaS Dashboard Redesign".',
      projectId: project1.id,
      userId: manager.id
    });

    await ActivityLog.create({
      action: 'TASK_CREATED',
      details: 'Emma Watson assigned "Figma UI/UX Mockups & Wireframes" to Sarah Chen.',
      projectId: project1.id,
      taskId: task1.id,
      userId: manager.id
    });

    await ActivityLog.create({
      action: 'TASK_STATUS_UPDATED',
      details: 'Sarah Chen updated task "Figma UI/UX Mockups & Wireframes" status to Completed.',
      projectId: project1.id,
      taskId: task1.id,
      userId: designer.id
    });

    await ActivityLog.create({
      action: 'COMMENT_ADDED',
      details: 'Alex Rivera commented on task "Build Kanban & Table Views with Drag/Drop".',
      projectId: project1.id,
      taskId: task3.id,
      userId: dev.id
    });
    console.log('✅ Activity logs seeded.');

    console.log('🎉 SEEDING COMPLETED SUCCESSFULY!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error Seeding Database:', error);
    process.exit(1);
  }
};

seedDatabase();
